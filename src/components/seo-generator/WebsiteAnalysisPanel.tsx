import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  Globe,
  Target,
  Package,
  Sparkles,
  Users,
  Award,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WebsiteAnalysis {
  companyName?: string;
  industry?: string;
  targetAudience?: string;
  mainProducts?: string[];
  usps?: string[];
  brandVoice?: string;
  claims?: string[];
  summary?: string;
  rawAnalysis?: string;
}

export interface WebsiteAnalysisResult {
  success: boolean;
  title?: string;
  description?: string;
  content?: string;
  analysis?: WebsiteAnalysis;
  // Multi-page specific
  pagesFound?: number;
  pages?: Array<{ url: string; title: string; content: string }>;
  combinedContent?: string;
}

interface WebsiteAnalysisPanelProps {
  onAnalysisComplete?: (result: WebsiteAnalysisResult) => void;
  onAddKeywords?: (keywords: string[]) => void;
  onSetManufacturerName?: (name: string) => void;
  onSetManufacturerInfo?: (info: string) => void;
  currentKeywords?: string[];
  initialUrl?: string;
}

export const WebsiteAnalysisPanel = ({
  onAnalysisComplete,
  onAddKeywords,
  onSetManufacturerName,
  onSetManufacturerInfo,
  currentKeywords = [],
  initialUrl = "",
}: WebsiteAnalysisPanelProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [scrapeMode, setScrapeMode] = useState<"single" | "multi">("single");
  const [result, setResult] = useState<WebsiteAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast({
        title: "URL fehlt",
        description: "Bitte gib eine Website-URL ein",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("scrape-website", {
        body: { url: url.trim(), mode: scrapeMode },
      });

      if (invokeError) throw invokeError;

      if (!data.success && !data.analysis) {
        throw new Error("Analyse fehlgeschlagen");
      }

      setResult(data);
      setIsExpanded(true);

      // Auto-fill manufacturer name if available
      if (data.analysis?.companyName && onSetManufacturerName) {
        onSetManufacturerName(data.analysis.companyName);
      }

      // Build info text for the form
      if (onSetManufacturerInfo) {
        let infoText = "";
        if (data.analysis?.summary) {
          infoText = data.analysis.summary;
        } else if (data.content) {
          infoText = data.content.substring(0, 2000);
        }
        onSetManufacturerInfo(infoText);
      }

      // Callback with full result
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }

      toast({
        title: "Website analysiert",
        description: data.analysis?.companyName
          ? `${data.analysis.companyName} erkannt`
          : "Analyse abgeschlossen",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(errorMessage);
      toast({
        title: "Analyse fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeyword = (keyword: string) => {
    if (onAddKeywords && !currentKeywords.includes(keyword)) {
      onAddKeywords([keyword]);
      toast({ title: "Keyword hinzugefügt", description: keyword });
    }
  };

  const handleAddAllKeywords = () => {
    if (!result?.analysis || !onAddKeywords) return;

    const allKeywords: string[] = [];

    // Add products as keywords
    if (result.analysis.mainProducts) {
      allKeywords.push(...result.analysis.mainProducts);
    }

    // Add industry
    if (result.analysis.industry) {
      allKeywords.push(result.analysis.industry);
    }

    const newKeywords = allKeywords.filter(k => !currentKeywords.includes(k));
    if (newKeywords.length > 0) {
      onAddKeywords(newKeywords);
      toast({
        title: `${newKeywords.length} Keywords hinzugefügt`,
        description: "Aus Website-Analyse übernommen",
      });
    }
  };

  const analysis = result?.analysis;

  // No result yet - show input form
  if (!result) {
    return (
      <Card className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-sm font-medium">Website analysieren</p>
              <p className="text-xs text-muted-foreground">
                Lerne Unternehmen, Produkte & Keywords automatisch
              </p>
            </div>
          </div>

          <RadioGroup
            value={scrapeMode}
            onValueChange={(value: "single" | "multi") => setScrapeMode(value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="wa-single" />
              <Label htmlFor="wa-single" className="text-xs cursor-pointer">
                Einzelseite (1 Credit)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="multi" id="wa-multi" />
              <Label htmlFor="wa-multi" className="text-xs cursor-pointer">
                Multi-Page (bis 10 Credits)
              </Label>
            </div>
          </RadioGroup>

          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAnalyze}
              disabled={isLoading || !url.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analysiere...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analysieren
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Has result - show analysis
  return (
    <Card className="border-emerald-500/30 overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 cursor-pointer hover:bg-emerald-500/15 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">
                  {analysis?.companyName || "Website-Analyse"}
                  {analysis?.industry && <span className="text-muted-foreground ml-1">• {analysis.industry}</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setResult(null);
                    setIsExpanded(false);
                  }}
                >
                  Neu laden
                </Button>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Quick Actions */}
            {onAddKeywords && (
              <Button
                type="button"
                onClick={handleAddAllKeywords}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Alle Keywords übernehmen
              </Button>
            )}

            {/* Company Info */}
            {(analysis?.companyName || analysis?.industry) && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Building2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  {analysis.companyName && (
                    <p className="font-medium">{analysis.companyName}</p>
                  )}
                  {analysis.industry && (
                    <p className="text-sm text-muted-foreground">{analysis.industry}</p>
                  )}
                </div>
              </div>
            )}

            {/* Target Audience */}
            {analysis?.targetAudience && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Zielgruppe</p>
                  <p className="text-sm text-muted-foreground">{analysis.targetAudience}</p>
                </div>
              </div>
            )}

            {/* Products/Services */}
            {analysis?.mainProducts && analysis.mainProducts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Produkte / Services</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.mainProducts.map((product, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="cursor-pointer hover:bg-purple-500/20 transition-colors"
                      onClick={() => handleAddKeyword(product)}
                    >
                      {currentKeywords.includes(product) ? (
                        <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <Plus className="mr-1 h-3 w-3" />
                      )}
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* USPs */}
            {analysis?.usps && analysis.usps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Alleinstellungsmerkmale (USPs)</span>
                </div>
                <ul className="space-y-1">
                  {analysis.usps.map((usp, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-3 w-3 text-yellow-500 mt-1 flex-shrink-0" />
                      <span className="text-muted-foreground">{usp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Brand Voice */}
            {analysis?.brandVoice && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Target className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tonalität / Stil</p>
                  <p className="text-sm text-muted-foreground">{analysis.brandVoice}</p>
                </div>
              </div>
            )}

            {/* Summary */}
            {analysis?.summary && (
              <div className="p-3 rounded-lg bg-muted/30 border border-muted">
                <p className="text-sm font-medium mb-1">Zusammenfassung</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            )}

            {/* Multi-page info */}
            {result.pagesFound && result.pagesFound > 1 && (
              <div className="pt-2 border-t text-xs text-muted-foreground">
                {result.pagesFound} Seiten analysiert
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
