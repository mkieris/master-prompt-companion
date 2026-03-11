import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  Target,
  FileText,
  Hash,
  Type,
  MessageSquare,
  TrendingUp,
  Zap
} from "lucide-react";
import type { ContentConfig } from "@/pages/ContentCreator";

interface ContentScorePanelProps {
  score: number;
  content: string;
  title: string;
  metaDescription: string;
  config: ContentConfig;
  serpResult?: any;
}

interface CheckItem {
  label: string;
  status: 'pass' | 'warn' | 'fail';
  value: string;
  target?: string;
}

export const ContentScorePanel = ({
  score,
  content,
  title,
  metaDescription,
  config,
  serpResult,
}: ContentScorePanelProps) => {
  // Calculate metrics
  const metrics = useMemo(() => {
    const text = content.toLowerCase();
    const plainText = content.replace(/<[^>]*>/g, '');
    const words = plainText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Keyword analysis
    const focusKeyword = config.focusKeyword.toLowerCase();
    const keywordMatches = focusKeyword ? (text.match(new RegExp(focusKeyword, 'gi')) || []).length : 0;
    const keywordDensity = wordCount > 0 ? ((keywordMatches / wordCount) * 100).toFixed(2) : '0';

    // Heading analysis
    const h1Matches = content.match(/<h1[^>]*>/gi) || [];
    const h2Matches = content.match(/<h2[^>]*>/gi) || [];
    const h3Matches = content.match(/<h3[^>]*>/gi) || [];

    // Check if keyword in H1
    const h1Content = content.match(/<h1[^>]*>(.*?)<\/h1>/gi)?.[0] || '';
    const keywordInH1 = focusKeyword && h1Content.toLowerCase().includes(focusKeyword);

    // SERP terms tracking
    let serpTermsFound: { term: string; count: number; type: 'must' | 'should' | 'nice' }[] = [];
    if (serpResult?.serpTerms) {
      const { mustHave, shouldHave, niceToHave } = serpResult.serpTerms;

      mustHave.forEach((term: string) => {
        const count = (text.match(new RegExp(term.toLowerCase(), 'g')) || []).length;
        serpTermsFound.push({ term, count, type: 'must' });
      });

      shouldHave.slice(0, 5).forEach((term: string) => {
        const count = (text.match(new RegExp(term.toLowerCase(), 'g')) || []).length;
        serpTermsFound.push({ term, count, type: 'should' });
      });

      niceToHave.slice(0, 3).forEach((term: string) => {
        const count = (text.match(new RegExp(term.toLowerCase(), 'g')) || []).length;
        serpTermsFound.push({ term, count, type: 'nice' });
      });
    }

    return {
      wordCount,
      targetWords: parseInt(config.wordCount) || 1500,
      keywordCount: keywordMatches,
      keywordDensity,
      h1Count: h1Matches.length,
      h2Count: h2Matches.length,
      h3Count: h3Matches.length,
      keywordInH1,
      titleLength: title.length,
      metaLength: metaDescription.length,
      serpTermsFound,
      serpMustHaveTotal: serpResult?.serpTerms?.mustHave?.length || 0,
      serpShouldHaveTotal: serpResult?.serpTerms?.shouldHave?.length || 0,
    };
  }, [content, title, metaDescription, config, serpResult]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-yellow-500';
    if (s >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    if (s >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const StatusIcon = ({ status }: { status: 'pass' | 'warn' | 'fail' }) => {
    if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  // Build check items
  const checks: CheckItem[] = [
    {
      label: 'Wortanzahl',
      status: metrics.wordCount >= metrics.targetWords * 0.8 ? 'pass' :
              metrics.wordCount >= metrics.targetWords * 0.5 ? 'warn' : 'fail',
      value: `${metrics.wordCount}`,
      target: `${metrics.targetWords}`,
    },
    {
      label: 'Fokus-Keyword',
      status: metrics.keywordCount >= 5 ? 'pass' :
              metrics.keywordCount >= 2 ? 'warn' : 'fail',
      value: `${metrics.keywordCount}x`,
      target: '5-15x',
    },
    {
      label: 'Keyword-Dichte',
      status: parseFloat(metrics.keywordDensity) >= 0.5 && parseFloat(metrics.keywordDensity) <= 2.5 ? 'pass' :
              parseFloat(metrics.keywordDensity) > 0 ? 'warn' : 'fail',
      value: `${metrics.keywordDensity}%`,
      target: '0.5-2.5%',
    },
    {
      label: 'H1 Überschrift',
      status: metrics.h1Count === 1 ? 'pass' :
              metrics.h1Count > 1 ? 'warn' : 'fail',
      value: `${metrics.h1Count}`,
      target: '1',
    },
    {
      label: 'H2 Überschriften',
      status: metrics.h2Count >= 3 ? 'pass' :
              metrics.h2Count >= 1 ? 'warn' : 'fail',
      value: `${metrics.h2Count}`,
      target: '3-8',
    },
    {
      label: 'Keyword in H1',
      status: metrics.keywordInH1 ? 'pass' : 'fail',
      value: metrics.keywordInH1 ? 'Ja' : 'Nein',
      target: 'Ja',
    },
    {
      label: 'Title Tag',
      status: metrics.titleLength >= 30 && metrics.titleLength <= 60 ? 'pass' :
              metrics.titleLength > 0 ? 'warn' : 'fail',
      value: `${metrics.titleLength} Zeichen`,
      target: '30-60',
    },
    {
      label: 'Meta Description',
      status: metrics.metaLength >= 120 && metrics.metaLength <= 155 ? 'pass' :
              metrics.metaLength > 0 ? 'warn' : 'fail',
      value: `${metrics.metaLength} Zeichen`,
      target: '120-155',
    },
  ];

  const passCount = checks.filter(c => c.status === 'pass').length;

  return (
    <Card className="w-72 flex-shrink-0 flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Content Score
          </span>
          <span className="text-xs text-muted-foreground">
            {passCount}/{checks.length} Checks
          </span>
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-4 space-y-6">
          {/* Score Circle */}
          <div className="flex justify-center">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className={getScoreColor(score)}
                  strokeLinecap="round"
                  strokeDasharray={`${score * 2.83} 283`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold">{metrics.wordCount}</div>
              <div className="text-xs text-muted-foreground">Wörter</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold">{metrics.keywordCount}x</div>
              <div className="text-xs text-muted-foreground">Keyword</div>
            </div>
          </div>

          {/* Checks List */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              SEO Checks
            </h4>
            {checks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <StatusIcon status={check.status} />
                  <span className="text-sm">{check.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{check.value}</span>
                  {check.target && (
                    <span className="text-xs text-muted-foreground ml-1">/ {check.target}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* SERP Terms Tracking */}
          {metrics.serpTermsFound.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                SERP Begriffe
              </h4>
              <div className="space-y-1">
                {metrics.serpTermsFound.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      {item.count > 0 ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-400" />
                      )}
                      <span className={item.count > 0 ? '' : 'text-muted-foreground'}>
                        {item.term}
                      </span>
                    </div>
                    <Badge
                      variant={item.count > 0 ? 'default' : 'secondary'}
                      className="text-xs px-1.5 py-0"
                    >
                      {item.count}x
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground text-center pt-1">
                {metrics.serpTermsFound.filter(t => t.count > 0).length} / {metrics.serpTermsFound.length} Begriffe verwendet
              </div>
            </div>
          )}

          {/* Word Count Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Wortanzahl</span>
              <span className="font-medium">
                {metrics.wordCount} / {metrics.targetWords}
              </span>
            </div>
            <Progress
              value={Math.min((metrics.wordCount / metrics.targetWords) * 100, 100)}
              className="h-2"
            />
          </div>

          {/* Tips */}
          {score < 80 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                Verbesserungsvorschläge
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {metrics.wordCount < metrics.targetWords * 0.8 && (
                  <li>+ {metrics.targetWords - metrics.wordCount} Wörter hinzufügen</li>
                )}
                {metrics.keywordCount < 5 && (
                  <li>Fokus-Keyword öfter verwenden</li>
                )}
                {!metrics.keywordInH1 && (
                  <li>Keyword in H1 einbauen</li>
                )}
                {metrics.h2Count < 3 && (
                  <li>Mehr H2-Überschriften hinzufügen</li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};
