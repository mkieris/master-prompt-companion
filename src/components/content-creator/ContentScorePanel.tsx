import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
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
  Zap,
  ChevronDown,
  ChevronUp,
  Search,
  Award,
  ListChecks,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus
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
  const [serpTermsExpanded, setSerpTermsExpanded] = useState(true);

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

    // SERP terms tracking - use word boundaries for accurate matching
    let serpTermsFound: { term: string; count: number; type: 'must' | 'should' | 'nice' }[] = [];
    if (serpResult?.serpTerms) {
      const { mustHave, shouldHave, niceToHave } = serpResult.serpTerms;

      // Helper function for word-boundary matching (works with German umlauts)
      const countTermOccurrences = (searchTerm: string) => {
        const escaped = searchTerm.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Use word boundary or start/end of string for more accurate matching
        const regex = new RegExp(`(?:^|\\s|[.,;:!?"'()-])${escaped}(?:$|\\s|[.,;:!?"'()-])`, 'gi');
        return (text.match(regex) || []).length;
      };

      mustHave.forEach((term: string) => {
        const count = countTermOccurrences(term);
        serpTermsFound.push({ term, count, type: 'must' });
      });

      shouldHave.slice(0, 5).forEach((term: string) => {
        const count = countTermOccurrences(term);
        serpTermsFound.push({ term, count, type: 'should' });
      });

      niceToHave.slice(0, 3).forEach((term: string) => {
        const count = countTermOccurrences(term);
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
  const warnCount = checks.filter(c => c.status === 'warn').length;

  // Score quality label
  const getScoreLabel = (s: number) => {
    if (s >= 90) return { label: 'Exzellent', emoji: '🏆' };
    if (s >= 80) return { label: 'Sehr gut', emoji: '🌟' };
    if (s >= 70) return { label: 'Gut', emoji: '👍' };
    if (s >= 60) return { label: 'Akzeptabel', emoji: '📈' };
    if (s >= 40) return { label: 'Verbesserungswurdig', emoji: '⚠️' };
    return { label: 'Uberarbeiten', emoji: '🔧' };
  };

  const scoreInfo = getScoreLabel(score);

  return (
    <Card className="w-72 flex-shrink-0 flex flex-col h-full overflow-hidden border-l-0 rounded-l-none">
      {/* Header - Enhanced */}
      <CardHeader className="pb-2 border-b bg-muted/30">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            Content Score
          </span>
          <Badge
            variant={passCount >= 6 ? "default" : passCount >= 4 ? "secondary" : "outline"}
            className="text-[10px]"
          >
            {passCount}/{checks.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-4 space-y-4">
          {/* Score Circle - Surfer SEO Style */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              {/* Background glow */}
              <div className={`absolute inset-0 rounded-full blur-xl opacity-30 ${getScoreBg(score)}`} />

              {/* SVG Circle */}
              <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                {/* Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-muted/50"
                />
                {/* Progress */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className={getScoreColor(score)}
                  strokeLinecap="round"
                  strokeDasharray={`${score * 2.64} 264`}
                  style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
                />
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{scoreInfo.emoji} {scoreInfo.label}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats - Enhanced Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <div className="text-base font-bold">{metrics.wordCount}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Worter</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <div className="text-base font-bold">{metrics.h2Count}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">H2</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <div className="text-base font-bold">{metrics.keywordDensity}%</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Dichte</div>
            </div>
          </div>

          {/* Word Count Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Wortanzahl</span>
              <span className={`font-medium ${
                metrics.wordCount >= metrics.targetWords * 0.8 ? 'text-green-500' :
                metrics.wordCount >= metrics.targetWords * 0.5 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {metrics.wordCount} / {metrics.targetWords}
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  metrics.wordCount >= metrics.targetWords * 0.8 ? 'bg-green-500' :
                  metrics.wordCount >= metrics.targetWords * 0.5 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((metrics.wordCount / metrics.targetWords) * 100, 100)}%` }}
              />
              {/* Target marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
                style={{ left: '80%' }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>0</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>

          <Separator />

          {/* SEO Checks - Compact List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                SEO Checks
              </h4>
              <div className="flex gap-1">
                <Badge variant="default" className="text-[9px] h-4 px-1.5 bg-green-500">
                  {passCount}
                </Badge>
                {warnCount > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-amber-500 text-white">
                    {warnCount}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-0.5">
              {checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-colors ${
                    check.status === 'pass' ? 'bg-green-500/5' :
                    check.status === 'warn' ? 'bg-amber-500/5' : 'bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon status={check.status} />
                    <span className="text-xs">{check.label}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono ${
                      check.status === 'pass' ? 'text-green-600 dark:text-green-400' :
                      check.status === 'warn' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                    }`}>{check.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SERP Terms Tracking - Surfer Style */}
          {metrics.serpTermsFound.length > 0 && (
            <>
              <Separator />

              <Collapsible open={serpTermsExpanded} onOpenChange={setSerpTermsExpanded}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-1 hover:text-primary transition-colors">
                  <h4 className="text-xs font-semibold flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    SERP Begriffe
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[9px] h-4 px-1.5 ${
                        metrics.serpTermsFound.filter(t => t.count > 0).length === metrics.serpTermsFound.length
                          ? 'border-green-500 text-green-500'
                          : 'border-amber-500 text-amber-500'
                      }`}
                    >
                      {metrics.serpTermsFound.filter(t => t.count > 0).length}/{metrics.serpTermsFound.length}
                    </Badge>
                    {serpTermsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-2 space-y-1">
                  {/* Must Have */}
                  {metrics.serpTermsFound.filter(t => t.type === 'must').length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Pflicht
                      </span>
                      {metrics.serpTermsFound.filter(t => t.type === 'must').map((item, idx) => (
                        <TermItem key={idx} term={item.term} count={item.count} />
                      ))}
                    </div>
                  )}

                  {/* Should Have */}
                  {metrics.serpTermsFound.filter(t => t.type === 'should').length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Empfohlen
                      </span>
                      {metrics.serpTermsFound.filter(t => t.type === 'should').map((item, idx) => (
                        <TermItem key={idx} term={item.term} count={item.count} />
                      ))}
                    </div>
                  )}

                  {/* Nice to Have */}
                  {metrics.serpTermsFound.filter(t => t.type === 'nice').length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Optional
                      </span>
                      {metrics.serpTermsFound.filter(t => t.type === 'nice').map((item, idx) => (
                        <TermItem key={idx} term={item.term} count={item.count} />
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {/* Tips - Enhanced */}
          {score < 80 && content && (
            <>
              <Separator />
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Optimierungstipps
                </h4>
                <ul className="text-[11px] text-muted-foreground space-y-1.5">
                  {metrics.wordCount < metrics.targetWords * 0.8 && (
                    <li className="flex items-start gap-1.5">
                      <ArrowUp className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>+{Math.round(metrics.targetWords * 0.8 - metrics.wordCount)} Worter fur optimale Lange</span>
                    </li>
                  )}
                  {metrics.keywordCount < 5 && (
                    <li className="flex items-start gap-1.5">
                      <Target className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Fokus-Keyword haufiger einbauen (min. 5x)</span>
                    </li>
                  )}
                  {!metrics.keywordInH1 && (
                    <li className="flex items-start gap-1.5">
                      <Type className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Keyword in H1-Uberschrift integrieren</span>
                    </li>
                  )}
                  {metrics.h2Count < 3 && (
                    <li className="flex items-start gap-1.5">
                      <Hash className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>Mehr H2-Uberschriften fur bessere Struktur</span>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}

          {/* Success State */}
          {score >= 80 && content && (
            <>
              <Separator />
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🎉</div>
                <h4 className="text-xs font-semibold text-green-700 dark:text-green-400">
                  Hervorragend optimiert!
                </h4>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Dein Content erfullt die wichtigsten SEO-Kriterien.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

// Term Item Component
const TermItem = ({ term, count }: { term: string; count: number }) => (
  <div className={`flex items-center justify-between py-1 px-2 rounded text-[11px] ${
    count > 0 ? 'bg-green-500/5' : 'bg-muted/30'
  }`}>
    <div className="flex items-center gap-1.5">
      {count > 0 ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <XCircle className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={count > 0 ? '' : 'text-muted-foreground'}>{term}</span>
    </div>
    <span className={`font-mono text-[10px] ${
      count > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
    }`}>{count}x</span>
  </div>
);
