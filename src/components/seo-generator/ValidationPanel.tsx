import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import {
  validateFormData,
  formatValidationResult,
  getValidationSummaryForUI,
  type ValidationResult,
  type FormData
} from "@/utils/formValidation";
import { useToast } from "@/hooks/use-toast";

interface ValidationPanelProps {
  formData: Partial<FormData>;
  onValidationComplete?: (result: ValidationResult) => void;
  autoValidate?: boolean;
}

export function ValidationPanel({ formData, onValidationComplete, autoValidate = true }: ValidationPanelProps) {
  const { toast } = useToast();
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    errors: true,
    warnings: true,
    mappings: false
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoValidate && formData) {
      const validationResult = validateFormData(formData);
      setResult(validationResult);
      onValidationComplete?.(validationResult);
    }
  }, [formData, autoValidate, onValidationComplete]);

  const handleManualValidation = () => {
    const validationResult = validateFormData(formData);
    setResult(validationResult);
    onValidationComplete?.(validationResult);
    
    const summary = getValidationSummaryForUI(validationResult);
    toast({
      title: summary.title,
      description: summary.description,
      variant: summary.status === 'error' ? 'destructive' : 'default'
    });
  };

  const handleCopyReport = () => {
    if (result) {
      navigator.clipboard.writeText(formatValidationResult(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Kopiert",
        description: "Validierungsbericht in Zwischenablage kopiert"
      });
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!result) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 text-center">
          <Button onClick={handleManualValidation} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Validierung starten
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summary = getValidationSummaryForUI(result);
  const statusIcon = summary.status === 'success' ? CheckCircle2 :
                     summary.status === 'warning' ? AlertTriangle : XCircle;
  const StatusIcon = statusIcon;

  return (
    <Card className={`border-2 ${
      summary.status === 'success' ? 'border-green-500/30 bg-green-500/5' :
      summary.status === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
      'border-red-500/30 bg-red-500/5'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${
              summary.status === 'success' ? 'text-green-500' :
              summary.status === 'warning' ? 'text-yellow-500' :
              'text-red-500'
            }`} />
            {summary.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={handleCopyReport} variant="ghost" size="sm" className="h-7 px-2">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Button onClick={handleManualValidation} variant="ghost" size="sm" className="h-7 px-2">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{summary.description}</p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Summary Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs">
            {result.summary.validFields + result.summary.mappedFields}/{result.summary.totalFields} Felder OK
          </Badge>
          {result.summary.errorCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {result.summary.errorCount} Fehler
            </Badge>
          )}
          {result.summary.warningCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-700">
              {result.summary.warningCount} Warnungen
            </Badge>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {/* Errors Section */}
          {result.errors.length > 0 && (
            <Collapsible open={expandedSections.errors} onOpenChange={() => toggleSection('errors')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-medium text-red-600 hover:text-red-700">
                {expandedSections.errors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <XCircle className="h-4 w-4" />
                Fehler ({result.errors.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pl-6 pb-2">
                {result.errors.map((error, idx) => (
                  <div key={idx} className="text-xs p-2 rounded bg-red-500/10 border border-red-500/20">
                    <span className="font-medium">{error.field}:</span> {error.message}
                    <Badge variant="outline" className="ml-2 text-[10px] h-4">
                      {error.severity}
                    </Badge>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Warnings Section */}
          {result.warnings.length > 0 && (
            <Collapsible open={expandedSections.warnings} onOpenChange={() => toggleSection('warnings')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-medium text-yellow-600 hover:text-yellow-700">
                {expandedSections.warnings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <AlertTriangle className="h-4 w-4" />
                Warnungen ({result.warnings.length})
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pl-6 pb-2">
                {result.warnings.map((warning, idx) => (
                  <div key={idx} className="text-xs p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <div><span className="font-medium">{warning.field}:</span> {warning.message}</div>
                    {warning.suggestion && (
                      <div className="mt-1 text-muted-foreground">→ {warning.suggestion}</div>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Mappings Section */}
          <Collapsible open={expandedSections.mappings} onOpenChange={() => toggleSection('mappings')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              {expandedSections.mappings ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <ArrowRight className="h-4 w-4" />
              Feld-Mappings ({result.mappings.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-6 pb-2">
              {result.mappings.map((mapping, idx) => {
                const statusColor = mapping.status === 'ok' || mapping.status === 'mapped' 
                  ? 'text-green-600' 
                  : mapping.status === 'missing' 
                    ? 'text-muted-foreground' 
                    : 'text-red-600';
                const statusIcon = mapping.status === 'ok' || mapping.status === 'mapped' 
                  ? '✓' 
                  : mapping.status === 'missing' 
                    ? '○' 
                    : '✗';

                return (
                  <div key={idx} className="text-xs p-2 rounded bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2">
                      <span className={statusColor}>{statusIcon}</span>
                      <span className="font-mono text-[10px]">{mapping.frontendField}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-[10px]">{mapping.backendField}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] h-4">
                        {mapping.status}
                      </Badge>
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-muted-foreground">
                      <div className="truncate" title={JSON.stringify(mapping.frontendValue)}>
                        FE: {typeof mapping.frontendValue === 'object' 
                          ? JSON.stringify(mapping.frontendValue).substring(0, 30) + '...'
                          : String(mapping.frontendValue).substring(0, 30)}
                      </div>
                      <div className="truncate" title={String(mapping.backendValue)}>
                        BE: {String(mapping.backendValue).substring(0, 30)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
