import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Star,
  Users,
  Lightbulb,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Insight {
  id: string;
  prompt_version: string;
  insight_type: string;
  insight_summary: string;
  detailed_analysis: any;
  based_on_ratings_count: number;
  average_rating: number;
  suggestion_priority: string;
  status: string;
  created_at: string;
}

const promptVersionNames: Record<string, string> = {
  'v1-kompakt-seo': '🎯 Kompakt-SEO',
  'v2-marketing-first': '🚀 Marketing-First',
  'v3-hybrid-intelligent': '🧠 Hybrid-Intelligent',
  'v4-minimal-kreativ': '✨ Minimal-Kreativ',
  'v5-ai-meta-optimiert': '🤖 AI-Meta-Optimiert',
  'v6-quality-auditor': '🔍 Quality-Auditor'
};

export default function AdminInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.current_organization_id) return;

      const { data, error } = await supabase
        .from('prompt_insights')
        .select('*')
        .eq('organization_id', profile.current_organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInsights(data || []);
    } catch (error) {
      console.error('Load error:', error);
      toast({
        title: "Fehler",
        description: "Insights konnten nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateInsights = async () => {
    setIsRegenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.current_organization_id) return;

      const { error } = await supabase.functions.invoke('generate-insights', {
        body: { organizationId: profile.current_organization_id }
      });

      if (error) throw error;

      toast({
        title: "✅ Insights werden generiert",
        description: "Die Analyse läuft. Aktualisieren Sie die Seite in 10-20 Sekunden."
      });

      setTimeout(() => loadInsights(), 5000);

    } catch (error) {
      console.error('Regenerate error:', error);
      toast({
        title: "Fehler",
        description: "Insights konnten nicht regeneriert werden",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const markAsResolved = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('prompt_insights')
        .update({ status: 'resolved' })
        .eq('id', insightId);

      if (error) throw error;

      setInsights(insights.map(i => 
        i.id === insightId ? { ...i, status: 'resolved' } : i
      ));

      toast({
        title: "✅ Als gelöst markiert",
        description: "Insight wurde archiviert"
      });
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <CheckCircle2 className="h-4 w-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const newInsights = insights.filter(i => i.status === 'new');
  const resolvedInsights = insights.filter(i => i.status === 'resolved');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            KI-Lern-Insights
          </h1>
          <p className="text-muted-foreground mt-2">
            Automatisch generierte Verbesserungsvorschläge basierend auf Nutzer-Bewertungen
          </p>
        </div>
        <Button
          onClick={regenerateInsights}
          disabled={isRegenerating}
          variant="outline"
        >
          {isRegenerating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Neu analysieren
        </Button>
      </div>

      <Tabs defaultValue="new" className="space-y-6">
        <TabsList>
          <TabsTrigger value="new" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Neue Insights ({newInsights.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Gelöst ({resolvedInsights.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          {newInsights.length === 0 ? (
            <Card className="p-12 text-center">
              <Lightbulb className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Noch keine Insights</h3>
              <p className="text-muted-foreground">
                Sammeln Sie mehr Bewertungen, um KI-basierte Verbesserungsvorschläge zu erhalten.
              </p>
            </Card>
          ) : (
            newInsights.map((insight) => (
              <Card key={insight.id} className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(insight.suggestion_priority)}>
                          {getPriorityIcon(insight.suggestion_priority)}
                          <span className="ml-1 capitalize">{insight.suggestion_priority}</span>
                        </Badge>
                        <Badge variant="outline">
                          {promptVersionNames[insight.prompt_version] || insight.prompt_version}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-semibold">{insight.insight_summary}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {insight.based_on_ratings_count} Bewertungen
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          Ø {insight.average_rating?.toFixed(1)}/5
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsResolved(insight.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Als gelöst markieren
                    </Button>
                  </div>

                  {/* Analysis Details */}
                  {insight.detailed_analysis && (
                    <div className="space-y-4 border-t pt-4">
                      {/* Strengths */}
                      {insight.detailed_analysis.strengths && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Was funktioniert gut:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {insight.detailed_analysis.strengths.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {insight.detailed_analysis.weaknesses && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            Verbesserungspotenzial:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {insight.detailed_analysis.weaknesses.map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {insight.detailed_analysis.suggestions && (
                        <div>
                          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            Konkrete Verbesserungsvorschläge:
                          </h4>
                          <div className="space-y-3">
                            {insight.detailed_analysis.suggestions.map((suggestion: any, i: number) => (
                              <Card key={i} className="p-4 bg-primary/5">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <h5 className="font-medium">{suggestion.title}</h5>
                                    <Badge variant="outline" className="text-xs">
                                      {suggestion.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {suggestion.description}
                                  </p>
                                  {suggestion.expectedImpact && (
                                    <div className="flex items-start gap-2 text-sm">
                                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary" />
                                      <span className="text-primary font-medium">
                                        {suggestion.expectedImpact}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommended Action */}
                      {insight.detailed_analysis.recommendedAction && (
                        <div className="bg-primary/10 rounded-lg p-4">
                          <h4 className="font-semibold text-sm mb-2">🎯 Empfohlener nächster Schritt:</h4>
                          <p className="text-sm">{insight.detailed_analysis.recommendedAction}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {resolvedInsights.map((insight) => (
                <Card key={insight.id} className="p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {promptVersionNames[insight.prompt_version] || insight.prompt_version}
                        </Badge>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-sm font-medium">{insight.insight_summary}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
