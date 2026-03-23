import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import type { ComplianceInfo } from "@/pages/ContentCreator";

interface ComplianceBannerProps {
  compliance: ComplianceInfo;
}

const statusConfig = {
  passed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    label: 'Bestanden',
    badgeVariant: 'default' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    label: 'Warnungen',
    badgeVariant: 'secondary' as const,
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    label: 'Kritisch',
    badgeVariant: 'destructive' as const,
  },
};

export function ComplianceBanner({ compliance }: ComplianceBannerProps) {
  const [isOpen, setIsOpen] = useState(compliance.status === 'failed');

  const config = statusConfig[compliance.status];
  const StatusIcon = config.icon;

  return (
    <div className={`border rounded-lg ${config.bgColor} mb-3`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between px-3 py-2 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${config.color}`} />
              <StatusIcon className={`h-4 w-4 ${config.color}`} />
              <span className={`font-medium text-sm ${config.color}`}>
                Compliance: {config.label}
              </span>
              <Badge variant={config.badgeVariant} className="text-xs">
                Score: {compliance.score}/100
              </Badge>
              {compliance.critical_count > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {compliance.critical_count} kritisch
                </Badge>
              )}
              {compliance.warning_count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {compliance.warning_count} Warnungen
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs">
                  HWG: {compliance.hwg_status === 'passed' ? 'OK' : compliance.hwg_status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  MDR: {compliance.mdr_status === 'passed' ? 'OK' : compliance.mdr_status}
                </Badge>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="px-3 pb-3">
          {compliance.findings.length > 0 && (
            <div className="space-y-2 mt-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Befunde</p>
              {compliance.findings.map((finding, i) => (
                <div key={i} className="rounded-md bg-background p-2 border text-sm">
                  <div className="flex items-start gap-2">
                    {finding.severity === 'critical' ? (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    ) : finding.severity === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {finding.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{finding.severity}</span>
                      </div>
                      <p className="text-sm font-medium">&ldquo;{finding.text}&rdquo;</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{finding.explanation}</p>
                      {finding.suggestion && (
                        <p className="text-xs text-green-700 mt-0.5">Vorschlag: {finding.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {compliance.medical_claims && compliance.medical_claims.length > 0 && (
            <div className="space-y-2 mt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Medizinische Behauptungen</p>
              {compliance.medical_claims.map((claim, i) => (
                <div key={i} className="rounded-md bg-background p-2 border text-sm">
                  <p className="text-sm">&ldquo;{claim.claim_text}&rdquo;</p>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{claim.claim_type}</Badge>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{claim.severity}</Badge>
                  </div>
                  {claim.suggestion && (
                    <p className="text-xs text-green-700 mt-0.5">Vorschlag: {claim.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {compliance.findings.length === 0 && (!compliance.medical_claims || compliance.medical_claims.length === 0) && (
            <p className="text-sm text-green-700 mt-1">Keine Compliance-Probleme gefunden.</p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
