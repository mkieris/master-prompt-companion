import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AIDetectionScoreProps {
  score: number;
  status: 'green' | 'yellow' | 'red';
  findings: Array<{
    pattern: string;
    matches: number;
    severity: string;
    description: string;
    examples: string[];
  }>;
  stats: {
    totalSentences: number;
    avgSentenceLength: string;
    sentenceLengthVariance: string;
    transitionWordRatio: string;
  };
}

export const AIDetectionScore = ({ score, status, findings, stats }: AIDetectionScoreProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'green':
        return <CheckCircle className="h-6 w-6 text-success" />;
      case 'yellow':
        return <AlertTriangle className="h-6 w-6 text-warning" />;
      case 'red':
        return <AlertCircle className="h-6 w-6 text-destructive" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'green':
        return 'Text klingt natürlich';
      case 'yellow':
        return 'Einige KI-Muster erkannt';
      case 'red':
        return 'Stark KI-typisch';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      high: "destructive",
      medium: "warning",
      low: "secondary",
    };
    return <Badge variant={variants[severity]}>{
      severity === "high" ? "Hoch" : severity === "medium" ? "Mittel" : "Niedrig"
    }</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            KI-Erkennungs-Score
          </CardTitle>
          <div className="text-2xl font-bold">{score}/100</div>
        </div>
        <p className="text-sm text-muted-foreground">{getStatusText()}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Progress value={score} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Sätze</p>
            <p className="font-medium">{stats.totalSentences}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ø Satzlänge</p>
            <p className="font-medium">{stats.avgSentenceLength} Wörter</p>
          </div>
          <div>
            <p className="text-muted-foreground">Varianz</p>
            <p className="font-medium">{stats.sentenceLengthVariance}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Übergänge</p>
            <p className="font-medium">{stats.transitionWordRatio}%</p>
          </div>
        </div>

        {findings.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="font-semibold text-sm">Erkannte KI-Muster:</h4>
            {findings.map((finding, index) => (
              <div key={index} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{finding.description}</p>
                  {getSeverityBadge(finding.severity)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {finding.matches} Vorkommen gefunden
                </p>
                {finding.examples.length > 0 && (
                  <div className="bg-muted/50 p-2 rounded text-xs space-y-1">
                    {finding.examples.map((example, i) => (
                      <p key={i} className="text-muted-foreground">"{example}"</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {score >= 80 && (
          <div className="bg-success/10 p-3 rounded-lg">
            <p className="text-sm text-success">
              ✓ Text hat gute Chancen, KI-Detektoren zu umgehen
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
