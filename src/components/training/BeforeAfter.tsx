import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface BeforeAfterProps {
  title: string;
  before: {
    content: string;
    issues: string[];
  };
  after: {
    content: string;
    improvements: string[];
  };
  explanation?: string;
}

export const BeforeAfter = ({ title, before, after, explanation }: BeforeAfterProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-red-500/10 via-transparent to-green-500/10">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-background">Vorher / Nachher</Badge>
          <span className="text-sm font-medium">{title}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Before */}
          <div className="p-4 bg-red-500/5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-red-700">Vorher (Schlecht)</span>
            </div>
            <div className="bg-background/80 rounded-lg p-4 border border-red-200 mb-3">
              <p className="text-sm whitespace-pre-line">{before.content}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-red-600">Probleme:</span>
              {before.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                  <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div className="p-4 bg-green-500/5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-700">Nachher (Gut)</span>
            </div>
            <div className="bg-background/80 rounded-lg p-4 border border-green-200 mb-3">
              <p className="text-sm whitespace-pre-line">{before.content}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-green-600">Verbesserungen:</span>
              {after.improvements.map((improvement, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>{improvement}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {explanation && (
          <div className="p-4 bg-muted/50 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Erklärung:</strong> {explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
