import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  Zap,
  TrendingUp,
  HelpCircle,
  ExternalLink,
  Copy
} from "lucide-react";
import { useSerpAnalysis, SerpAnalysisResult, extractWQuestionsFromSerp } from "@/hooks/useSerpAnalysis";
import { useToast } from "@/hooks/use-toast";

interface SerpAnalysisPanelProps {
  keyword: string;
  onAddKeywords?: (keywords: string[]) => void;
  onAddWQuestions?: (questions: string[]) => void;
  onSerpContextReady?: (context: string) => void;
  currentKeywords?: string[];
  currentQuestions?: string[];
}

export const SerpAnalysisPanel = ({
  keyword,
  onAddKeywords,
  onAddWQuestions,
  onSerpContextReady,
  currentKeywords = [],
  currentQuestions = [],
}: SerpAnalysisPanelProps) => {
  const { toast } = useToast();
  const { analyze, isLoading, result, error } = useSerpAnalysis();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAnalyze = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Fokus-Keyword fehlt",
        description: "Bitte erst ein Fokus-Keyword eingeben",
        variant: "destructive",
      });
      return;
    }

    const serpResult = await analyze(keyword);
    if (serpResult) {
      setIsExpanded(true);
      // Automatisch den SERP-Kontext bereitstellen
      if (onSerpContextReady) {
        onSerpContextReady(serpResult.promptContext);
      }
    }
  };

  const handleAddAllSuggested = () => {
    if (!result) return;

    // Keywords hinzufügen die noch nicht vorhanden sind
    const newKeywords = [
      ...result.serpTerms.mustHave,
      ...result.serpTerms.shouldHave.slice(0, 5),
    ].filter(k => !currentKeywords.includes(k));

    if (newKeywords.length > 0 && onAddKeywords) {
      onAddKeywords(newKeywords);
      toast({
        title: `${newKeywords.length} Keywords hinzugefügt`,
        description: "SERP-Begriffe wurden übernommen",
      });
    }

    // W-Fragen hinzufügen
    const serpQuestions = extractWQuestionsFromSerp(result);
    const newQuestions = serpQuestions.filter(q => !currentQuestions.includes(q));

    if (newQuestions.length > 0 && onAddWQuestions) {
      onAddWQuestions(newQuestions.slice(0, 5));
    }
  };

  const handleAddKeyword = (keyword: string) => {
    if (onAddKeywords && !currentKeywords.includes(keyword)) {
      onAddKeywords([keyword]);
    }
  };

  const handleAddQuestion = (question: string) => {
    if (onAddWQuestions && !currentQuestions.includes(question)) {
      onAddWQuestions([question]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Kopiert", description: "In Zwischenablage kopiert" });
  };

  // Kein Ergebnis - nur Button anzeigen
  if (!result) {
    return (
      <Card className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">SERP-Analyse</p>
              <p className="text-xs text-muted-foreground">
                Google Top-10 analysieren (kostenlos)
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading || !keyword.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analysiere...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Analysieren
              </>
            )}
          </Button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </Card>
    );
  }

  // Ergebnis anzeigen
  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  SERP-Analyse: {result.serpTerms.all.length} Begriffe gefunden
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnalyze();
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Neu laden"}
                </Button>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddAllSuggested}
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Alle empfohlenen übernehmen
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.promptContext)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>SERP-Kontext kopieren</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Must-Have Terms */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Pflicht-Begriffe</span>
                <span className="text-xs text-muted-foreground">(in >50% der Top-10)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.serpTerms.mustHave.length > 0 ? (
                  result.serpTerms.mustHave.map((term) => (
                    <Badge
                      key={term}
                      variant="destructive"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleAddKeyword(term)}
                    >
                      {currentKeywords.includes(term) ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <Plus className="mr-1 h-3 w-3" />
                      )}
                      {term}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Keine gefunden</span>
                )}
              </div>
            </div>

            {/* Should-Have Terms */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Empfohlene Begriffe</span>
                <span className="text-xs text-muted-foreground">(in >30%)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.serpTerms.shouldHave.length > 0 ? (
                  result.serpTerms.shouldHave.map((term) => (
                    <Badge
                      key={term}
                      variant="secondary"
                      className="cursor-pointer hover:opacity-80 transition-opacity bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                      onClick={() => handleAddKeyword(term)}
                    >
                      {currentKeywords.includes(term) ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <Plus className="mr-1 h-3 w-3" />
                      )}
                      {term}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Keine gefunden</span>
                )}
              </div>
            </div>

            {/* Nice-to-Have Terms */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Optionale Begriffe</span>
                <span className="text-xs text-muted-foreground">(zur Differenzierung)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.serpTerms.niceToHave.slice(0, 8).map((term) => (
                  <Badge
                    key={term}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleAddKeyword(term)}
                  >
                    {currentKeywords.includes(term) ? (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    ) : (
                      <Plus className="mr-1 h-3 w-3" />
                    )}
                    {term}
                  </Badge>
                ))}
              </div>
            </div>

            {/* People Also Ask */}
            {result.questions.peopleAlsoAsk.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Häufige Fragen (PAA)</span>
                </div>
                <div className="space-y-1">
                  {result.questions.peopleAlsoAsk.slice(0, 5).map((question, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                      onClick={() => handleAddQuestion(question)}
                    >
                      <span className="text-sm">{question}</span>
                      {currentQuestions.includes(question) ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitor Preview */}
            {result.competitors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Top-5 Wettbewerber</span>
                </div>
                <div className="space-y-1 text-xs">
                  {result.competitors.slice(0, 5).map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-mono w-4">{comp.position}.</span>
                      <span className="truncate flex-1">{comp.title}</span>
                      <span className="text-xs opacity-60">{comp.domain}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <span>Analysiert: {result.stats.totalResultsAnalyzed} Ergebnisse</span>
              <span className="mx-2">|</span>
              <span>Durchschn. Snippet: {result.stats.averageSnippetLength} Wörter</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
