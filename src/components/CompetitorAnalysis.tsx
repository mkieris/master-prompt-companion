import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, TrendingUp, FileText, Link as LinkIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Competitor {
  position: number;
  url: string;
  title: string;
  metaDescription: string;
  wordCount: number;
  h2Count: number;
  h3Count: number;
  keywordDensity: number;
  mainTopics: string[];
  contentType: string;
  domainAuthority: number;
}

interface CompetitorAnalysisResult {
  keyword: string;
  competitors: Competitor[];
  insights: {
    avgWordCount: number;
    avgH2Count: number;
    avgH3Count: number;
    avgKeywordDensity: number;
    recommendedWordCount: { min: number; max: number };
    topContentTypes: string[];
    topTopics: string[];
  };
}

export const CompetitorAnalysis = () => {
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompetitorAnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie ein Keyword ein",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("competitor-analysis", {
        body: { keyword: keyword.trim() },
      });

      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Erfolgreich",
        description: "Wettbewerbsanalyse abgeschlossen",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Fehler bei der Analyse",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Wettbewerbsanalyse</h2>
            <p className="text-sm text-muted-foreground">
              Analysiere die Top 10 Google-Rankings für dein Keyword
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyword">Keyword</Label>
            <div className="flex gap-2">
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="z.B. Massageöl"
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleAnalyze()}
              />
              <Button onClick={handleAnalyze} disabled={isLoading || !keyword.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analysiere...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analysieren
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {result && (
          <div className="space-y-6">
            {/* Insights Overview */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Wichtigste Erkenntnisse
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ø Textlänge</p>
                  <p className="text-2xl font-bold text-foreground">{result.insights.avgWordCount}</p>
                  <p className="text-xs text-muted-foreground">
                    Empfohlen: {result.insights.recommendedWordCount.min}-{result.insights.recommendedWordCount.max} Wörter
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ø H2-Überschriften</p>
                  <p className="text-2xl font-bold text-foreground">{result.insights.avgH2Count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ø H3-Überschriften</p>
                  <p className="text-2xl font-bold text-foreground">{result.insights.avgH3Count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ø Keyword-Dichte</p>
                  <p className="text-2xl font-bold text-foreground">{result.insights.avgKeywordDensity}%</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Top Content-Typen:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.insights.topContentTypes.map((type) => (
                      <Badge key={type} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Häufigste Themen:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.insights.topTopics.map((topic) => (
                      <Badge key={topic} variant="outline">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Competitor List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Top 10 Wettbewerber
              </h3>
              {result.competitors.map((competitor) => (
                <Card key={competitor.position} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="text-lg px-3 py-1">
                        #{competitor.position}
                      </Badge>
                      <div>
                        <h4 className="font-medium text-foreground">{competitor.title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <LinkIcon className="h-3 w-3" />
                          {competitor.url}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">DA: {competitor.domainAuthority}</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{competitor.metaDescription}</p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Wörter</p>
                      <p className="font-semibold text-foreground">{competitor.wordCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">H2</p>
                      <p className="font-semibold text-foreground">{competitor.h2Count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">H3</p>
                      <p className="font-semibold text-foreground">{competitor.h3Count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">KW-Dichte</p>
                      <p className="font-semibold text-foreground">{competitor.keywordDensity}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Typ</p>
                      <p className="font-semibold text-foreground">{competitor.contentType}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Hauptthemen:</p>
                    <div className="flex flex-wrap gap-1">
                      {competitor.mainTopics.map((topic, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!result && !isLoading && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Gib ein Keyword ein und starte die Analyse, um deine Wettbewerber zu verstehen
            </p>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};
