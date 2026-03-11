import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Swords,
  BookOpen,
  ShoppingBag,
  Copy,
  Check,
  ArrowRight
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

// Quick Analysis Result Interface
interface QuickAnalysisResult {
  success: boolean;
  url: string;
  mode: 'topic' | 'category' | 'company';
  pagesAnalyzed: number;
  analysis: any;
  contentContext: string;
  metadata: {
    title: string | null;
    description: string | null;
    analyzedAt: string;
  };
}

const DomainLearning = ({ session }: DomainLearningProps) => {
  const { toast } = useToast();
  const { currentOrg } = useOrganization(session);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [domainData, setDomainData] = useState<DomainKnowledge | null>(null);
  const [progress, setProgress] = useState(0);

  // Quick Analysis State
  const [quickUrl, setQuickUrl] = useState("");
  const [quickMode, setQuickMode] = useState<'topic' | 'category' | 'company'>('topic');
  const [quickDepth, setQuickDepth] = useState<'single' | 'multi'>('single');
  const [isQuickLoading, setIsQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<QuickAnalysisResult | null>(null);
  const [copiedContext, setCopiedContext] = useState(false);

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

  // Quick Analysis Function
  const startQuickAnalysis = async () => {
    if (!quickUrl.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib eine URL ein.",
        variant: "destructive",
      });
      return;
    }

    setIsQuickLoading(true);
    setQuickResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-domain', {
        body: {
          url: quickUrl,
          mode: quickMode,
          depth: quickDepth,
        }
      });

      if (error) throw error;

      if (data.success) {
        setQuickResult(data);
        toast({
          title: "Analyse abgeschlossen",
          description: `${data.pagesAnalyzed} Seite(n) analysiert.`,
        });
      } else {
        throw new Error(data.error || 'Analyse fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('Quick analysis error:', error);
      toast({
        title: "Fehler",
        description: error.message || "Die Analyse konnte nicht durchgeführt werden.",
        variant: "destructive",
      });
    } finally {
      setIsQuickLoading(false);
    }
  };

  const copyContentContext = async () => {
    if (quickResult?.contentContext) {
      await navigator.clipboard.writeText(quickResult.contentContext);
      setCopiedContext(true);
      toast({ title: "Kopiert!", description: "Content-Kontext in Zwischenablage." });
      setTimeout(() => setCopiedContext(false), 2000);
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

      <Tabs defaultValue="quick" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Schnellanalyse
          </TabsTrigger>
          <TabsTrigger value="domain" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domain Learning
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Wettbewerber
          </TabsTrigger>
        </TabsList>

        {/* Quick Analysis Tab */}
        <TabsContent value="quick" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Themen & Kategorien lernen
              </CardTitle>
              <CardDescription>
                Analysiere eine externe Website um ein Thema zu verstehen oder Produktkategorien zu lernen.
                Ideal für Content-Erstellung in unbekannten Bereichen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="quick-url">Website URL</Label>
                <Input
                  id="quick-url"
                  type="url"
                  placeholder="z.B. https://aragones-coaching.de oder Kategorieseite"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  disabled={isQuickLoading}
                />
              </div>

              {/* Analysis Mode */}
              <div className="space-y-2">
                <Label>Analyse-Modus</Label>
                <RadioGroup
                  value={quickMode}
                  onValueChange={(v) => setQuickMode(v as 'topic' | 'category' | 'company')}
                  className="grid grid-cols-3 gap-2"
                  disabled={isQuickLoading}
                >
                  <Label
                    htmlFor="mode-topic"
                    className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      quickMode === 'topic' ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="topic" id="mode-topic" className="sr-only" />
                    <BookOpen className="h-5 w-5 mb-1" />
                    <span className="font-medium text-sm">Thema lernen</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Branche verstehen
                    </span>
                  </Label>
                  <Label
                    htmlFor="mode-category"
                    className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      quickMode === 'category' ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="category" id="mode-category" className="sr-only" />
                    <ShoppingBag className="h-5 w-5 mb-1" />
                    <span className="font-medium text-sm">Kategorie</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Produkte analysieren
                    </span>
                  </Label>
                  <Label
                    htmlFor="mode-company"
                    className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      quickMode === 'company' ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="company" id="mode-company" className="sr-only" />
                    <Building2 className="h-5 w-5 mb-1" />
                    <span className="font-medium text-sm">Unternehmen</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Marke verstehen
                    </span>
                  </Label>
                </RadioGroup>
              </div>

              {/* Depth Selection */}
              <div className="space-y-2">
                <Label>Analyse-Tiefe</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={quickDepth === 'single' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setQuickDepth('single')}
                    disabled={isQuickLoading}
                  >
                    Einzelseite
                  </Button>
                  <Button
                    type="button"
                    variant={quickDepth === 'multi' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setQuickDepth('multi')}
                    disabled={isQuickLoading}
                  >
                    Mehrere Seiten (bis 20)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {quickDepth === 'single'
                    ? 'Schnell: Nur die angegebene Seite analysieren.'
                    : 'Gründlich: Bis zu 20 verlinkte Seiten analysieren (dauert länger).'}
                </p>
              </div>

              {/* Start Button */}
              <Button
                onClick={startQuickAnalysis}
                disabled={isQuickLoading || !quickUrl.trim()}
                className="w-full"
              >
                {isQuickLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analysiere {quickDepth === 'multi' ? '(kann 1-2 Min. dauern)' : '...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyse starten
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Analysis Results */}
          {quickResult && (
            <div className="space-y-4">
              <Card className="border-success/50 bg-success/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    Analyse abgeschlossen
                  </CardTitle>
                  <CardDescription>
                    {quickResult.pagesAnalyzed} Seite(n) analysiert • {quickResult.mode === 'topic' ? 'Themenanalyse' : quickResult.mode === 'category' ? 'Kategorieanalyse' : 'Unternehmensanalyse'}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Content Context (ready to copy) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Content-Kontext für SEO-Texte
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={copyContentContext}>
                      {copiedContext ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedContext ? 'Kopiert!' : 'Kopieren'}
                    </Button>
                  </div>
                  <CardDescription>
                    Dieser Text kann direkt in "Zusatzinfos" bei Content Basic verwendet werden.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={quickResult.contentContext}
                    readOnly
                    className="min-h-[200px] text-sm bg-muted"
                  />
                </CardContent>
              </Card>

              {/* Detailed Analysis by Mode */}
              {quickMode === 'topic' && quickResult.analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Topic Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Themen-Übersicht
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {quickResult.analysis.topicName && (
                        <div>
                          <p className="text-sm text-muted-foreground">Hauptthema</p>
                          <p className="font-medium">{quickResult.analysis.topicName}</p>
                        </div>
                      )}
                      {quickResult.analysis.industry && (
                        <div>
                          <p className="text-sm text-muted-foreground">Branche</p>
                          <p className="font-medium">{quickResult.analysis.industry}</p>
                        </div>
                      )}
                      {quickResult.analysis.toneRecommendation && (
                        <div>
                          <p className="text-sm text-muted-foreground">Empfohlene Tonalität</p>
                          <p className="text-sm">{quickResult.analysis.toneRecommendation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Target Audience */}
                  {quickResult.analysis.targetAudience && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Zielgruppe
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {quickResult.analysis.targetAudience.demographics && (
                          <div>
                            <p className="text-sm text-muted-foreground">Demografie</p>
                            <p className="text-sm">{quickResult.analysis.targetAudience.demographics}</p>
                          </div>
                        )}
                        {quickResult.analysis.targetAudience.painPoints?.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">Schmerzpunkte</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {quickResult.analysis.targetAudience.painPoints.map((p: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Core Concepts */}
                  {quickResult.analysis.coreConceptsExplained && Object.keys(quickResult.analysis.coreConceptsExplained).length > 0 && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-base">Kernkonzepte erklärt</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(quickResult.analysis.coreConceptsExplained).map(([concept, explanation]: [string, any]) => (
                            <div key={concept} className="p-3 bg-muted rounded-lg">
                              <p className="font-medium text-sm">{concept}</p>
                              <p className="text-sm text-muted-foreground mt-1">{explanation}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Marketing Angles */}
                  {quickResult.analysis.marketingAngles?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Marketing-Ansätze
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {quickResult.analysis.marketingAngles.map((angle: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              {angle}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Terminology */}
                  {quickResult.analysis.terminology && Object.keys(quickResult.analysis.terminology).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Fachbegriffe</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(quickResult.analysis.terminology).slice(0, 8).map(([term, def]: [string, any]) => (
                            <div key={term} className="text-sm">
                              <span className="font-medium">{term}:</span>{' '}
                              <span className="text-muted-foreground">{def}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {quickMode === 'category' && quickResult.analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Kategorie-Übersicht
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {quickResult.analysis.categoryName && (
                        <div>
                          <p className="text-sm text-muted-foreground">Kategorie</p>
                          <p className="font-medium">{quickResult.analysis.categoryName}</p>
                        </div>
                      )}
                      {quickResult.analysis.parentCategory && (
                        <div>
                          <p className="text-sm text-muted-foreground">Übergeordnet</p>
                          <p className="font-medium">{quickResult.analysis.parentCategory}</p>
                        </div>
                      )}
                      {quickResult.analysis.targetCustomer && (
                        <div>
                          <p className="text-sm text-muted-foreground">Zielkunde</p>
                          <p className="text-sm">{quickResult.analysis.targetCustomer}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Products */}
                  {quickResult.analysis.products?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Produkte gefunden</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {quickResult.analysis.products.slice(0, 6).map((product: any, i: number) => (
                            <div key={i} className="p-2 bg-muted rounded text-sm">
                              <span className="font-medium">{product.name}</span>
                              {product.keyFeatures?.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {product.keyFeatures.slice(0, 3).join(' • ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Buying Criteria */}
                  {quickResult.analysis.buyingCriteria?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Kaufkriterien</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {quickResult.analysis.buyingCriteria.map((c: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-success mt-1 flex-shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* SEO Keywords */}
                  {quickResult.analysis.seoKeywords?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          SEO-Keywords
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {quickResult.analysis.seoKeywords.map((kw: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {quickMode === 'company' && quickResult.analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Profile */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Unternehmensprofil
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {quickResult.analysis.companyName && (
                        <div>
                          <p className="text-sm text-muted-foreground">Unternehmen</p>
                          <p className="font-medium">{quickResult.analysis.companyName}</p>
                        </div>
                      )}
                      {quickResult.analysis.industry && (
                        <div>
                          <p className="text-sm text-muted-foreground">Branche</p>
                          <p className="font-medium">{quickResult.analysis.industry}</p>
                        </div>
                      )}
                      {quickResult.analysis.mission && (
                        <div>
                          <p className="text-sm text-muted-foreground">Mission</p>
                          <p className="text-sm">{quickResult.analysis.mission}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Brand Voice */}
                  {quickResult.analysis.brandVoice && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Brand Voice</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {quickResult.analysis.brandVoice.tone && (
                          <div>
                            <p className="text-sm text-muted-foreground">Tonalität</p>
                            <p className="font-medium">{quickResult.analysis.brandVoice.tone}</p>
                          </div>
                        )}
                        {quickResult.analysis.brandVoice.characteristics?.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">Charakteristika</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {quickResult.analysis.brandVoice.characteristics.map((c: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* USPs */}
                  {quickResult.analysis.usps?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          USPs
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {quickResult.analysis.usps.map((usp: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              {usp}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Products/Services */}
                  {quickResult.analysis.productsServices?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Produkte & Services</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {quickResult.analysis.productsServices.map((ps: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{ps}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>

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
