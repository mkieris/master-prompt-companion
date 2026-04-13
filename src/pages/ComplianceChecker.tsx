import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Copy,
  ArrowLeft,
  FileText,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

interface ComplianceFinding {
  text: string;
  severity: "critical" | "warning" | "info";
  category: string;
  explanation: string;
  suggestion: string;
}

interface ComplianceCheckerProps {
  session: Session | null;
}

const ComplianceChecker = ({ session }: ComplianceCheckerProps) => {
  const [inputText, setInputText] = useState("");
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const { toast } = useToast();

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const infoCount = findings.filter((f) => f.severity === "info").length;

  const complianceScore =
    findings.length === 0 && hasChecked
      ? 100
      : Math.max(0, 100 - criticalCount * 25 - warningCount * 10 - infoCount * 2);

  const statusColor =
    complianceScore >= 80
      ? "text-green-500"
      : complianceScore >= 50
        ? "text-yellow-500"
        : "text-red-500";

  const statusLabel =
    complianceScore >= 80
      ? "Konform"
      : complianceScore >= 50
        ? "Prüfung empfohlen"
        : "Kritische Verstöße";

  const handleCheck = async () => {
    if (!inputText.trim()) {
      toast({ title: "Kein Text", description: "Bitte füge einen Text ein.", variant: "destructive" });
      return;
    }

    setIsChecking(true);
    setFindings([]);
    setHasChecked(false);

    try {
      const { data, error } = await supabase.functions.invoke("check-compliance", {
        body: { text: inputText },
      });

      if (error) throw error;

      if (data?.success && Array.isArray(data.findings)) {
        setFindings(data.findings);
      } else if (data?.error) {
        throw new Error(data.error);
      }

      setHasChecked(true);
    } catch (err: any) {
      console.error("Compliance check error:", err);
      toast({
        title: "Fehler bei der Prüfung",
        description: err.message || "Bitte erneut versuchen.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copySuggestions = () => {
    const text = findings
      .map(
        (f, i) =>
          `${i + 1}. [${f.severity.toUpperCase()}] ${f.category}\n   Problem: "${f.text}"\n   Erklärung: ${f.explanation}\n   Vorschlag: ${f.suggestion}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Kopiert", description: "Alle Findings wurden in die Zwischenablage kopiert." });
  };

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  const severityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Kritisch</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Warnung</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/content">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Healthcare Compliance Check</h1>
            </div>
            <Badge variant="outline" className="text-xs">MDR · HWG · Studien</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/content">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Content Creator
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text zur Prüfung
                </CardTitle>
                <CardDescription>
                  Füge deinen SEO-Text, Produktbeschreibung oder Werbecopy ein. Der Check prüft auf MDR-, HWG- und Studienverstöße.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Text hier einfügen oder aus dem Content Creator kopieren..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {wordCount} Wörter · {inputText.length} Zeichen
                  </span>
                  <Button onClick={handleCheck} disabled={isChecking || !inputText.trim()} className="gap-2">
                    {isChecking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Prüfe...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Compliance prüfen
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Findings List */}
            {hasChecked && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Findings ({findings.length})
                    </CardTitle>
                    {findings.length > 0 && (
                      <Button variant="outline" size="sm" onClick={copySuggestions} className="gap-1.5">
                        <Copy className="h-3.5 w-3.5" />
                        Alle kopieren
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {findings.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="font-medium text-green-700">Keine Compliance-Verstöße gefunden</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Der Text entspricht den MDR/HWG-Anforderungen.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[500px]">
                      <div className="space-y-3">
                        {findings.map((finding, idx) => (
                          <div
                            key={idx}
                            className={`rounded-lg border p-4 space-y-2 ${
                              finding.severity === "critical"
                                ? "border-red-500/30 bg-red-500/5"
                                : finding.severity === "warning"
                                  ? "border-yellow-500/30 bg-yellow-500/5"
                                  : "border-blue-500/30 bg-blue-500/5"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {severityIcon(finding.severity)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  {severityBadge(finding.severity)}
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {finding.category}
                                  </span>
                                </div>
                                <p className="text-sm font-mono bg-background/50 rounded px-2 py-1 border">
                                  „{finding.text}"
                                </p>
                                <p className="text-sm text-muted-foreground mt-1.5">{finding.explanation}</p>
                                {finding.suggestion && (
                                  <div className="mt-2 flex items-start gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                    <p className="text-sm text-primary">{finding.suggestion}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Score & Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasChecked ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Noch kein Check durchgeführt</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <div className={`text-5xl font-bold ${statusColor}`}>{complianceScore}</div>
                      <p className={`text-sm font-medium mt-1 ${statusColor}`}>{statusLabel}</p>
                    </div>
                    <Progress
                      value={complianceScore}
                      className="h-2"
                    />
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                          Kritisch
                        </span>
                        <span className="font-medium">{criticalCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                          Warnungen
                        </span>
                        <span className="font-medium">{warningCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-blue-500" />
                          Hinweise
                        </span>
                        <span className="font-medium">{infoCount}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Geprüfte Bereiche</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "HWG", desc: "Heilmittelwerbegesetz – irreführende Werbung, verbotene Werbemittel, Heilungsversprechen" },
                  { label: "MDR/MPDG", desc: "Medizinprodukteverordnung – CE-Kennzeichnung, Zweckbestimmung, Risikoklassen" },
                  { label: "Studien", desc: "Wissenschaftliche Claims – unbelegte Behauptungen, fehlende Quellenangaben" },
                  { label: "Heilaussagen", desc: "Diagnose-Versprechen, Therapie-Ersatz, Symptom-Beseitigungs-Garantien" },
                ].map((item) => (
                  <div key={item.label} className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-primary" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-[18px]">{item.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceChecker;
