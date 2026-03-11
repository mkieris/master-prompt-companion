import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  FileText,
  ArrowLeft,
  RefreshCw,
  Target,
  Brain
} from "lucide-react";

interface GenerationAnalyticsProps {
  session: Session | null;
}

interface PromptVersionStats {
  prompt_version: string;
  total_generations: number;
  successful: number;
  failed: number;
  avg_content_score: number | null;
  avg_generation_time_ms: number | null;
  avg_word_count: number | null;
}

interface DailyStats {
  generation_date: string;
  total: number;
  unique_users: number;
  successful: number;
  avg_score: number | null;
  avg_time_ms: number | null;
}

interface RecentGeneration {
  id: string;
  focus_keyword: string;
  prompt_version: string;
  ai_model: string;
  success: boolean;
  generation_time_ms: number | null;
  output_word_count: number | null;
  content_score: number | null;
  created_at: string;
  serp_used: boolean;
  domain_knowledge_used: boolean;
}

const GenerationAnalytics = ({ session }: GenerationAnalyticsProps) => {
  const navigate = useNavigate();
  const [promptStats, setPromptStats] = useState<PromptVersionStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<RecentGeneration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      navigate("/auth");
      return;
    }
    loadAnalytics();
  }, [session]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load prompt version analytics
      const { data: promptData } = await supabase
        .from('content_projects' as any)
        .select('*');

      // These views/tables may not exist yet - use empty arrays as fallback
      if (promptData) setPromptStats(promptData as any);

      // Load daily stats
      const { data: dailyData } = await supabase
        .from('content_projects' as any)
        .select('*')
        .limit(14);

      if (dailyData) setDailyStats(dailyData as any);

      // Load recent generations
      const { data: recentData } = await supabase
        .from('content_projects' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (recentData) setRecentGenerations(recentData as any);

    } catch (error) {
      console.error('Analytics load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalGenerations = promptStats.reduce((sum, p) => sum + (p.total_generations || 0), 0);
  const totalSuccessful = promptStats.reduce((sum, p) => sum + (p.successful || 0), 0);
  const successRate = totalGenerations > 0 ? ((totalSuccessful / totalGenerations) * 100).toFixed(1) : '0';

  const avgScore = promptStats.length > 0
    ? (promptStats.reduce((sum, p) => sum + (p.avg_content_score || 0), 0) / promptStats.filter(p => p.avg_content_score).length).toFixed(0)
    : '0';

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Generation Analytics</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Generierungen (30 Tage)</p>
                  <p className="text-2xl font-bold">{totalGenerations}</p>
                </div>
                <FileText className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Erfolgsrate</p>
                  <p className="text-2xl font-bold text-green-500">{successRate}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Content Score</p>
                  <p className="text-2xl font-bold text-blue-500">{avgScore}/100</p>
                </div>
                <Target className="h-8 w-8 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prompt Versionen</p>
                  <p className="text-2xl font-bold">{promptStats.length}</p>
                </div>
                <Brain className="h-8 w-8 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="prompts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="prompts">Prompt-Versionen</TabsTrigger>
            <TabsTrigger value="daily">Tägliche Stats</TabsTrigger>
            <TabsTrigger value="recent">Letzte Generierungen</TabsTrigger>
          </TabsList>

          {/* Prompt Version Performance */}
          <TabsContent value="prompts">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Prompt-Version Performance (30 Tage)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {promptStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Noch keine Daten vorhanden. Generiere Content um Analytics zu sehen.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {promptStats.map((stat) => (
                      <div key={stat.prompt_version} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{stat.prompt_version}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {stat.total_generations} Generierungen
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-green-500">
                              <CheckCircle2 className="h-3 w-3" />
                              {stat.successful}
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="h-3 w-3" />
                              {stat.failed}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Avg. Score</p>
                            <p className="font-medium">
                              {stat.avg_content_score ? `${stat.avg_content_score}/100` : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg. Zeit</p>
                            <p className="font-medium">
                              {stat.avg_generation_time_ms ? `${(stat.avg_generation_time_ms / 1000).toFixed(1)}s` : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg. Wörter</p>
                            <p className="font-medium">
                              {stat.avg_word_count ? Math.round(stat.avg_word_count) : '-'}
                            </p>
                          </div>
                        </div>

                        {stat.avg_content_score && (
                          <div className="mt-3">
                            <Progress value={stat.avg_content_score} className="h-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Stats */}
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tägliche Statistiken (14 Tage)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Noch keine Daten vorhanden.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dailyStats.map((stat) => (
                      <div key={stat.generation_date} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium w-24">
                            {new Date(stat.generation_date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                          </span>
                          <Badge variant="secondary">{stat.total} Gen.</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{stat.unique_users} User</span>
                          <span className="text-green-500">{stat.successful} OK</span>
                          {stat.avg_score && <span>Score: {stat.avg_score}</span>}
                          {stat.avg_time_ms && <span>{(stat.avg_time_ms / 1000).toFixed(1)}s</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Generations */}
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Letzte Generierungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {recentGenerations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Noch keine Generierungen vorhanden.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentGenerations.map((gen) => (
                        <div key={gen.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">{gen.focus_keyword || 'Kein Keyword'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(gen.created_at).toLocaleString('de-DE')}
                              </p>
                            </div>
                            {gen.success ? (
                              <Badge variant="default" className="bg-green-500">Erfolg</Badge>
                            ) : (
                              <Badge variant="destructive">Fehler</Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">{gen.prompt_version}</Badge>
                            <Badge variant="outline">{gen.ai_model}</Badge>
                            {gen.generation_time_ms && (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                {(gen.generation_time_ms / 1000).toFixed(1)}s
                              </Badge>
                            )}
                            {gen.output_word_count && (
                              <Badge variant="secondary">{gen.output_word_count} Wörter</Badge>
                            )}
                            {gen.serp_used && (
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">SERP</Badge>
                            )}
                            {gen.domain_knowledge_used && (
                              <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">Domain</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GenerationAnalytics;
