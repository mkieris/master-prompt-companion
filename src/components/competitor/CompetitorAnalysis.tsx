import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, Trash2, Search, Loader2, CheckCircle2, XCircle, 
  ExternalLink, Target, Lightbulb, AlertTriangle, TrendingUp,
  FileText, MessageSquare, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface CompetitorAnalysisProps {
  session: Session | null;
  organizationId: string;
  onInsightsReady?: (insights: CompetitorInsights) => void;
}

interface CompetitorData {
  id: string;
  url: string;
  domain: string;
  crawl_status: string;
  crawled_at: string | null;
  page_title: string | null;
  meta_description: string | null;
  main_keywords: string[] | null;
  secondary_keywords: string[] | null;
  heading_structure: any;
  word_count: number | null;
  tonality_analysis: string | null;
  content_strategy: string | null;
  usp_patterns: string[] | null;
  faq_patterns: any[] | null;
  call_to_actions: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  best_practices: any;
}

export interface CompetitorInsights {
  topKeywords: string[];
  contentStrategies: string[];
  uspPatterns: string[];
  recommendedTonality: string;
  avgWordCount: number;
  bestPractices: string[];
}

const MAX_COMPETITORS = 5;

const CompetitorAnalysis = ({ session, organizationId, onInsightsReady }: CompetitorAnalysisProps) => {
  const { toast } = useToast();
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorData | null>(null);

  useEffect(() => {
    if (organizationId) {
      loadCompetitors();
    }
  }, [organizationId]);

  useEffect(() => {
    // Generate insights when competitors change
    if (competitors.length > 0 && onInsightsReady) {
      const completedCompetitors = competitors.filter(c => c.crawl_status === 'completed');
      if (completedCompetitors.length > 0) {
        const insights = generateInsights(completedCompetitors);
        onInsightsReady(insights);
      }
    }
  }, [competitors, onInsightsReady]);

  const loadCompetitors = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('competitor_analyses')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading competitors:', error);
      toast({
        title: "Fehler",
        description: "Wettbewerber konnten nicht geladen werden.",
        variant: "destructive",
      });
    } else {
      setCompetitors((data || []) as CompetitorData[]);
    }
    setIsLoading(false);
  };

  const generateInsights = (data: CompetitorData[]): CompetitorInsights => {
    const allKeywords: string[] = [];
    const strategies: string[] = [];
    const usps: string[] = [];
    const practices: string[] = [];
    let totalWords = 0;
    let tonalities: string[] = [];

    data.forEach(c => {
      if (c.main_keywords) allKeywords.push(...c.main_keywords);
      if (c.secondary_keywords) allKeywords.push(...c.secondary_keywords);
      if (c.content_strategy) strategies.push(c.content_strategy);
      if (c.usp_patterns) usps.push(...c.usp_patterns);
      if (c.tonality_analysis) tonalities.push(c.tonality_analysis);
      if (c.word_count) totalWords += c.word_count;
      if (c.best_practices?.recommendations) {
        practices.push(...c.best_practices.recommendations);
      }
    });

    // Get most common keywords
    const keywordCounts = allKeywords.reduce((acc, k) => {
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([k]) => k);

    // Get unique USPs
    const uniqueUsps = [...new Set(usps)].slice(0, 10);
    
    // Get unique practices
    const uniquePractices = [...new Set(practices)].slice(0, 10);

    return {
      topKeywords,
      contentStrategies: [...new Set(strategies)],
      uspPatterns: uniqueUsps,
      recommendedTonality: tonalities[0] || '',
      avgWordCount: data.length > 0 ? Math.round(totalWords / data.length) : 0,
      bestPractices: uniquePractices,
    };
  };

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  const addCompetitor = async () => {
    if (!newUrl.trim()) return;
    if (competitors.length >= MAX_COMPETITORS) {
      toast({
        title: "Limit erreicht",
        description: `Maximal ${MAX_COMPETITORS} Wettbewerber können analysiert werden.`,
        variant: "destructive",
      });
      return;
    }

    // Validate URL
    let validUrl = newUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    try {
      new URL(validUrl);
    } catch {
      toast({
        title: "Ungültige URL",
        description: "Bitte gib eine gültige URL ein.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      // Create entry in database
      const domain = extractDomain(validUrl);
      const { data: insertData, error: insertError } = await supabase
        .from('competitor_analyses')
        .insert({
          organization_id: organizationId,
          url: validUrl,
          domain: domain,
          crawl_status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Start analysis
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-competitor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            url: validUrl,
            organizationId,
            analysisId: insertData.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analyse fehlgeschlagen');
      }

      setNewUrl("");
      toast({
        title: "Analyse gestartet",
        description: `${domain} wird analysiert...`,
      });

      // Reload to show new entry
      await loadCompetitors();

    } catch (error) {
      console.error('Error adding competitor:', error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Wettbewerber konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const deleteCompetitor = async (id: string) => {
    const { error } = await supabase
      .from('competitor_analyses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Fehler",
        description: "Wettbewerber konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } else {
      setCompetitors(prev => prev.filter(c => c.id !== id));
      if (selectedCompetitor?.id === id) {
        setSelectedCompetitor(null);
      }
      toast({
        title: "Gelöscht",
        description: "Wettbewerber wurde entfernt.",
      });
    }
  };

  const retryAnalysis = async (competitor: CompetitorData) => {
    try {
      await supabase
        .from('competitor_analyses')
        .update({ crawl_status: 'pending' })
        .eq('id', competitor.id);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-competitor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            url: competitor.url,
            organizationId,
            analysisId: competitor.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Retry failed');
      }

      toast({
        title: "Analyse neu gestartet",
        description: `${competitor.domain} wird erneut analysiert...`,
      });

      await loadCompetitors();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Erneute Analyse fehlgeschlagen.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Abgeschlossen</Badge>;
      case 'crawling':
      case 'analyzing':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> {status === 'crawling' ? 'Crawling...' : 'Analysiere...'}</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Fehlgeschlagen</Badge>;
      default:
        return <Badge variant="outline">Ausstehend</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Lade Wettbewerber-Analysen...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Add Form */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Wettbewerber-Analyse
            </h3>
            <p className="text-sm text-muted-foreground">
              Analysiere bis zu {MAX_COMPETITORS} Wettbewerber-URLs und extrahiere Best Practices
            </p>
          </div>
          <Badge variant="outline">{competitors.length}/{MAX_COMPETITORS}</Badge>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="https://wettbewerber.de/seite"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
            disabled={isAdding || competitors.length >= MAX_COMPETITORS}
          />
          <Button 
            onClick={addCompetitor} 
            disabled={isAdding || !newUrl.trim() || competitors.length >= MAX_COMPETITORS}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Competitors List */}
      {competitors.length > 0 && (
        <Card className="p-4">
          <div className="space-y-3">
            {competitors.map((competitor) => (
              <div 
                key={competitor.id} 
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedCompetitor?.id === competitor.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => competitor.crawl_status === 'completed' && setSelectedCompetitor(competitor)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{competitor.domain}</span>
                    <a 
                      href={competitor.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {competitor.page_title && (
                    <p className="text-sm text-muted-foreground truncate">{competitor.page_title}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(competitor.crawl_status)}
                  {competitor.crawl_status === 'failed' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); retryAnalysis(competitor); }}
                    >
                      Retry
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Wettbewerber entfernen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Die Analyse für {competitor.domain} wird unwiderruflich gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCompetitor(competitor.id)}>
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Selected Competitor Details */}
      {selectedCompetitor && selectedCompetitor.crawl_status === 'completed' && (
        <Card className="p-4">
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="strategy">Strategie</TabsTrigger>
              <TabsTrigger value="insights">Learnings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{selectedCompetitor.word_count || 0}</div>
                  <div className="text-xs text-muted-foreground">Wörter</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{selectedCompetitor.main_keywords?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Haupt-Keywords</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{selectedCompetitor.heading_structure?.h2?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">H2-Überschriften</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{selectedCompetitor.usp_patterns?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">USPs</div>
                </div>
              </div>

              {selectedCompetitor.meta_description && (
                <div>
                  <h4 className="font-medium mb-2">Meta-Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedCompetitor.meta_description}
                  </p>
                </div>
              )}

              {selectedCompetitor.heading_structure?.h2?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Überschriften-Struktur</h4>
                  <div className="space-y-1">
                    {selectedCompetitor.heading_structure.h2.slice(0, 8).map((h: string, i: number) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">H2</Badge>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              {selectedCompetitor.main_keywords?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Haupt-Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompetitor.main_keywords.map((kw, i) => (
                      <Badge key={i} variant="default">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedCompetitor.secondary_keywords?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Sekundäre Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompetitor.secondary_keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="strategy" className="space-y-4">
              {selectedCompetitor.tonality_analysis && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Tonalität
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedCompetitor.tonality_analysis}
                  </p>
                </div>
              )}

              {selectedCompetitor.content_strategy && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content-Strategie
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedCompetitor.content_strategy}
                  </p>
                </div>
              )}

              {selectedCompetitor.usp_patterns?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    USP-Muster
                  </h4>
                  <ul className="space-y-1">
                    {selectedCompetitor.usp_patterns.map((usp, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{usp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCompetitor.call_to_actions?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Call-to-Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompetitor.call_to_actions.map((cta, i) => (
                      <Badge key={i} variant="outline">{cta}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {selectedCompetitor.strengths?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    Stärken
                  </h4>
                  <ul className="space-y-1">
                    {selectedCompetitor.strengths.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCompetitor.weaknesses?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    Schwächen
                  </h4>
                  <ul className="space-y-1">
                    {selectedCompetitor.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCompetitor.best_practices?.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-primary">
                    <Lightbulb className="h-4 w-4" />
                    Empfehlungen für dich
                  </h4>
                  <ul className="space-y-1">
                    {selectedCompetitor.best_practices.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Aggregated Insights */}
      {competitors.filter(c => c.crawl_status === 'completed').length >= 2 && (
        <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Aggregierte Insights aus {competitors.filter(c => c.crawl_status === 'completed').length} Wettbewerbern
          </h3>
          
          {(() => {
            const insights = generateInsights(competitors.filter(c => c.crawl_status === 'completed'));
            return (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Top Keywords zum Targetieren</h4>
                  <div className="flex flex-wrap gap-1">
                    {insights.topKeywords.slice(0, 10).map((kw, i) => (
                      <Badge key={i} variant="default" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Ø Textlänge</h4>
                    <p className="text-2xl font-bold">{insights.avgWordCount} Wörter</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Häufige USPs</h4>
                    <p className="text-sm text-muted-foreground">
                      {insights.uspPatterns.slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>

                {insights.bestPractices.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Wichtigste Best Practices</h4>
                    <ul className="space-y-1">
                      {insights.bestPractices.slice(0, 3).map((bp, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </Card>
      )}
    </div>
  );
};

export default CompetitorAnalysis;