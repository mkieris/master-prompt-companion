import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, TrendingUp, MessageSquare, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface KeywordResearchResult {
  seedKeyword: string;
  mainKeywords: Array<{
    keyword: string;
    searchVolume: string;
    difficulty: "low" | "medium" | "high";
    intent: string;
  }>;
  longtailKeywords: Array<{
    keyword: string;
    searchVolume: string;
    intent: string;
  }>;
  relatedKeywords: string[];
  questions: string[];
  competitorInsights: string;
  recommendations: string;
}

export const KeywordResearch = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [seedKeyword, setSeedKeyword] = useState("");
  const [industry, setIndustry] = useState("medical");
  const [result, setResult] = useState<KeywordResearchResult | null>(null);

  const handleResearch = async () => {
    if (!seedKeyword.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie ein Seed-Keyword ein",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("keyword-research", {
        body: { 
          seedKeyword: seedKeyword.trim(),
          industry 
        },
      });

      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Erfolgreich",
        description: "Keyword-Analyse abgeschlossen",
      });
    } catch (error) {
      console.error("Error in keyword research:", error);
      toast({
        title: "Fehler",
        description: "Fehler bei der Keyword-Analyse",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: "low" | "medium" | "high") => {
    switch (difficulty) {
      case "low":
        return "bg-success/10 text-success border-success/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Keyword Research</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Vollautomatisierte Keyword-Analyse mit KI-gestützter Suchintention und Wettbewerbsanalyse
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="seedKeyword">Seed-Keyword *</Label>
            <Input
              id="seedKeyword"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              placeholder="z.B. Elektrotherapie, Massagegerät, Physiotherapie"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleResearch();
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="industry">Branche</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger id="industry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medizintechnik & Therapie</SelectItem>
                <SelectItem value="fitness">Fitness & Sport</SelectItem>
                <SelectItem value="wellness">Wellness & Gesundheit</SelectItem>
                <SelectItem value="general">Allgemein</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleResearch} 
            disabled={isLoading || !seedKeyword.trim()} 
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analysiere...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Keyword-Analyse starten
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!result ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto opacity-50" />
              <p className="text-lg font-medium">Keine Analyse durchgeführt</p>
              <p className="text-sm">Geben Sie ein Keyword ein und starten Sie die Analyse</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Keywords */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Haupt-Keywords</h3>
              </div>
              <div className="space-y-3">
                {result.mainKeywords.map((kw, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{kw.keyword}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Suchintention: {kw.intent}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="whitespace-nowrap">
                        {kw.searchVolume}
                      </Badge>
                      <Badge className={getDifficultyColor(kw.difficulty)}>
                        {kw.difficulty === "low" ? "Leicht" : kw.difficulty === "medium" ? "Mittel" : "Schwer"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Long-tail Keywords */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Long-tail Keywords</h3>
              </div>
              <div className="space-y-2">
                {result.longtailKeywords.map((kw, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{kw.keyword}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Intent: {kw.intent}
                      </p>
                    </div>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {kw.searchVolume}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* W-Questions */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Häufige Fragen (W-Fragen)</h3>
              </div>
              <div className="space-y-2">
                {result.questions.map((question, index) => (
                  <div key={index} className="p-3 bg-accent/50 rounded-lg">
                    <p className="text-sm text-foreground">{question}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Related Keywords */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Verwandte Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {result.relatedKeywords.map((keyword, index) => (
                  <Badge key={index} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Competitor Insights */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Wettbewerber-Insights</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="whitespace-pre-wrap">{result.competitorInsights}</p>
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Empfehlungen</h3>
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="whitespace-pre-wrap">{result.recommendations}</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
