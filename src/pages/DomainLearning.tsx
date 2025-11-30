import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Globe, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Target,
  Users,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Swords
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useOrganization } from "@/hooks/useOrganization";
import CompetitorAnalysis from "@/components/competitor/CompetitorAnalysis";

interface DomainLearningProps {
  session: Session | null;
}

interface DomainKnowledge {
  id: string;
  website_url: string;
  crawl_status: string;
  pages_crawled: number;
  total_pages: number;
  company_name: string | null;
  company_description: string | null;
  industry: string | null;
  target_audience: string | null;
  main_products_services: string[];
  unique_selling_points: string[];
  brand_voice: string | null;
  keywords: string[];
  ai_summary: string | null;
  crawled_at: string | null;
}

const DomainLearning = ({ session }: DomainLearningProps) => {
  const { toast } = useToast();
  const { currentOrg } = useOrganization(session);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [domainData, setDomainData] = useState<DomainKnowledge | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentOrg) {
      fetchDomainKnowledge();
    }
  }, [currentOrg]);

  // Poll for updates when crawling is in progress
  useEffect(() => {
    if (!domainData || domainData.crawl_status !== 'crawling') return;

    const pollInterval = setInterval(async () => {
      await fetchDomainKnowledge();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [domainData?.crawl_status, currentOrg]);

  const fetchDomainKnowledge = async () => {
    if (!currentOrg) return;

    const wasInitialFetch = isFetching;
    if (wasInitialFetch) setIsFetching(true);
    
    const { data, error } = await supabase
      .from('domain_knowledge')
      .select('*')
      .eq('organization_id', currentOrg.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setDomainData({
        ...data,
        main_products_services: Array.isArray(data.main_products_services) 
          ? (data.main_products_services as unknown as string[]) 
          : [],
        unique_selling_points: Array.isArray(data.unique_selling_points) 
          ? (data.unique_selling_points as unknown as string[]) 
          : [],
        keywords: Array.isArray(data.keywords) 
          ? (data.keywords as unknown as string[]) 
          : [],
      });
      setUrl(data.website_url);
      
      // Update progress based on crawl status
      if (data.crawl_status === 'crawling' && data.total_pages > 0) {
        setProgress(Math.round((data.pages_crawled / data.total_pages) * 90));
        setIsLoading(true);
      } else if (data.crawl_status === 'completed') {
        setProgress(100);
        setIsLoading(false);
      } else if (data.crawl_status === 'crawling') {
        // Still starting
        setProgress(5);
        setIsLoading(true);
      }
    }
    setIsFetching(false);
  };

  const startCrawl = async () => {
    if (!url.trim() || !currentOrg) {
      toast({
        title: "Fehler",
        description: "Bitte gib eine gültige URL ein.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      // Create or update domain knowledge entry
      const { data: existingData } = await supabase
        .from('domain_knowledge')
        .select('id')
        .eq('organization_id', currentOrg.id)
        .single();

      let domainId: string;

      if (existingData) {
        await supabase
          .from('domain_knowledge')
          .update({ 
            website_url: url, 
            crawl_status: 'crawling',
            pages_crawled: 0,
            total_pages: 0 
          })
          .eq('id', existingData.id);
        domainId = existingData.id;
      } else {
        const { data: newData, error: insertError } = await supabase
          .from('domain_knowledge')
          .insert({ 
            organization_id: currentOrg.id, 
            website_url: url,
            crawl_status: 'crawling' 
          })
          .select()
          .single();

        if (insertError) throw insertError;
        domainId = newData.id;
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Call the crawl function
      const { data, error } = await supabase.functions.invoke('crawl-domain', {
        body: { 
          url, 
          domainId,
          organizationId: currentOrg.id 
        }
      });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      setProgress(100);
      
      toast({
        title: "Domain Learning abgeschlossen",
        description: "Dein Unternehmens-Wissen wurde erfolgreich analysiert.",
      });

      // Refresh data
      await fetchDomainKnowledge();
    } catch (error) {
      console.error('Crawl error:', error);
      toast({
        title: "Fehler",
        description: "Das Domain Learning konnte nicht durchgeführt werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wissensmanagement</h1>
        <p className="text-muted-foreground">
          Domain Learning & Wettbewerber-Analyse für bessere Content-Generierung
        </p>
      </div>

      <Tabs defaultValue="domain" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="domain" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domain Learning
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Wettbewerber
          </TabsTrigger>
        </TabsList>

        <TabsContent value="domain" className="space-y-6">
          {/* Firecrawl Credits Warning */}
          <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-600 dark:text-amber-400">Hinweis: Firecrawl-Guthaben begrenzt</AlertTitle>
            <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
              Das Domain-Crawling verwendet Firecrawl-Credits. Bei erschöpftem Guthaben kann das Crawling fehlschlagen. 
              Für mehr Credits besuche{" "}
              <a href="https://firecrawl.dev/pricing" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                firecrawl.dev/pricing
              </a>
            </AlertDescription>
          </Alert>

          {/* Crawl Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Website analysieren
              </CardTitle>
              <CardDescription>
                Gib die URL deiner Website ein. Die KI wird bis zu 50 Seiten crawlen und dein Unternehmen analysieren.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="url" className="sr-only">Website URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://www.deine-website.de"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button onClick={startCrawl} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analysiere...
                    </>
                  ) : domainData ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Neu analysieren
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyse starten
                    </>
                  )}
                </Button>
              </div>

              {isLoading && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {domainData?.crawl_status === 'crawling' 
                        ? domainData.pages_crawled > 0 
                          ? `${domainData.pages_crawled} von ${domainData.total_pages || '~50'} Seiten gecrawlt`
                          : "Crawle Website..."
                        : progress < 30 ? "Starte Crawl..." : progress < 60 ? "Analysiere Inhalte..." : "Extrahiere Wissen..."
                      }
                    </span>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {domainData && domainData.crawl_status === 'completed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5" />
                    Unternehmensprofil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Unternehmen</p>
                    <p className="font-medium">{domainData.company_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Branche</p>
                    <p className="font-medium">{domainData.industry || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Beschreibung</p>
                    <p className="text-sm">{domainData.company_description || "—"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Target Audience */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    Zielgruppe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{domainData.target_audience || "Noch nicht analysiert"}</p>
                  {domainData.brand_voice && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Brand Voice</p>
                      <p className="text-sm">{domainData.brand_voice}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* USPs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5" />
                    Unique Selling Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {domainData.unique_selling_points.length > 0 ? (
                    <ul className="space-y-2">
                      {domainData.unique_selling_points.map((usp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          {String(usp)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine USPs gefunden</p>
                  )}
                </CardContent>
              </Card>

              {/* Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5" />
                    Relevante Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {domainData.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {domainData.keywords.map((keyword, i) => (
                        <Badge key={i} variant="secondary">{String(keyword)}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Keywords gefunden</p>
                  )}
                </CardContent>
              </Card>

              {/* AI Summary */}
              {domainData.ai_summary && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>KI-Zusammenfassung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{domainData.ai_summary}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {domainData && domainData.crawl_status === 'failed' && (
            <Card className="border-destructive">
              <CardContent className="p-6 flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="font-medium">Analyse fehlgeschlagen</p>
                  <p className="text-sm text-muted-foreground">
                    Die Website konnte nicht analysiert werden. Bitte überprüfe die URL und versuche es erneut.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="competitors">
          {currentOrg && (
            <CompetitorAnalysis 
              session={session} 
              organizationId={currentOrg.id}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DomainLearning;
