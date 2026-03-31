import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, ArrowLeft, Copy, Check, Eye, Globe, Code, MessageSquare,
  Shield, FileText, Sparkles, CheckCircle2, AlertCircle, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebug } from "@/contexts/DebugContext";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Session } from "@supabase/supabase-js";

interface ContentV2Props {
  session: Session | null;
}

interface GeneratedContent {
  title: string;
  metaDescription: string;
  seoText: string;
  faq: Array<{ question: string; answer: string }>;
  internalLinks: string[];
  qualityReport: any;
  serpDataUsed: boolean;
  generationTimeMs: number;
  model: string;
  _prompts?: {
    systemPrompt: string;
    userPrompt: string;
  };
}

const ContentCreatorV2 = ({ session }: ContentV2Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { log } = useDebug();

  // Form state
  const [productName, setProductName] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [audience, setAudience] = useState<"b2c" | "b2b">("b2c");
  const [wordCount, setWordCount] = useState("1500");
  const [pageType, setPageType] = useState<"produktseite" | "kategorieseite" | "markenseite" | "ratgeber">("produktseite");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState("seo-text");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // SERP lookup state
  const [serpAvailable, setSerpAvailable] = useState<boolean | null>(null);

  // Check SERP data availability
  const checkSerpData = async (keyword: string) => {
    if (!keyword.trim()) {
      setSerpAvailable(null);
      return;
    }
    try {
      const { data } = await supabase
        .from('serp_keywords' as any)
        .select('keyword')
        .eq('keyword', keyword.trim())
        .maybeSingle();
      setSerpAvailable(!!data);
    } catch {
      setSerpAvailable(null);
    }
  };

  const handleGenerate = async () => {
    if (!productName.trim() || !focusKeyword.trim()) {
      toast({
        title: "Eingabe fehlt",
        description: "Produkt/Thema und Fokus-Keyword sind Pflichtfelder.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);
    log('api', 'Content V2 Generation gestartet', {
      productName, focusKeyword, audience, wordCount, pageType,
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-content-v2', {
        body: {
          productName: productName.trim(),
          focusKeyword: focusKeyword.trim(),
          audience,
          wordCount: parseInt(wordCount),
          pageType,
          additionalInfo: additionalInfo.trim(),
        },
      });

      if (error) {
        log('error', 'Edge Function Fehler', { message: error.message });
        throw error;
      }

      if (data?.error) {
        log('error', 'API Fehler', { error: data.error, details: data.details });
        throw new Error(data.error);
      }

      log('response', 'Content V2 erfolgreich', {
        titleLength: data.title?.length,
        seoTextLength: data.seoText?.length,
        faqCount: data.faq?.length,
        serpUsed: data.serpDataUsed,
        timeMs: data.generationTimeMs,
      });

      setResult(data);
      setActiveTab("seo-text");
      toast({
        title: "Content generiert!",
        description: `${data.qualityReport?.wordCount || '?'} Woerter in ${Math.round((data.generationTimeMs || 0) / 1000)}s`,
      });
    } catch (err) {
      log('error', 'Generation fehlgeschlagen', {
        message: err instanceof Error ? err.message : String(err),
      });
      toast({
        title: "Fehler",
        description: err instanceof Error ? err.message : "Generierung fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({ title: "Kopiert!" });
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", variant: "destructive" });
    }
  };

  const generateFaqJsonLd = () => {
    if (!result?.faq?.length) return '';
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": result.faq.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer,
        },
      })),
    }, null, 2);
  };

  const wordCountNum = useMemo(() => {
    if (!result?.seoText) return 0;
    const text = result.seoText.replace(/<[^>]*>/g, '');
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }, [result?.seoText]);

  const keywordCount = useMemo(() => {
    if (!result?.seoText || !focusKeyword) return 0;
    const text = result.seoText.toLowerCase();
    const kw = focusKeyword.toLowerCase();
    return (text.match(new RegExp(kw, 'g')) || []).length;
  }, [result?.seoText, focusKeyword]);

  if (!session) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 flex-shrink-0">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Content Creator V2
              </h1>
              <p className="text-xs text-muted-foreground">K-Active Brand Voice + Claude Sonnet</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Claude Sonnet 4
          </Badge>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Input Form */}
        <div className="w-[380px] border-r border-border flex flex-col overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* 1. Produkt/Thema */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Produkt / Thema *</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="z.B. K-Active Tape Gentle"
              />
            </div>

            {/* 2. Fokus-Keyword */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Fokus-Keyword *</Label>
              <div className="relative">
                <Input
                  value={focusKeyword}
                  onChange={(e) => {
                    setFocusKeyword(e.target.value);
                    checkSerpData(e.target.value);
                  }}
                  placeholder="z.B. K-Active Tape Gentle"
                />
                {serpAvailable !== null && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {serpAvailable ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> SERP
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs text-muted-foreground">
                        Ohne SERP
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Zielgruppe */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Zielgruppe *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={audience === 'b2c' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAudience('b2c')}
                  className="w-full"
                >
                  B2C (Endkunden)
                </Button>
                <Button
                  variant={audience === 'b2b' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAudience('b2b')}
                  className="w-full"
                >
                  B2B (Therapeuten)
                </Button>
              </div>
            </div>

            {/* 4. Textlaenge */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Textlaenge *</Label>
              <Select value={wordCount} onValueChange={setWordCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="800">Kurz (~800 Woerter)</SelectItem>
                  <SelectItem value="1500">Standard (~1500 Woerter)</SelectItem>
                  <SelectItem value="2500">Lang (~2500 Woerter)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 5. Seitentyp */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Seitentyp *</Label>
              <Select value={pageType} onValueChange={(v) => setPageType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produktseite">Produktseite</SelectItem>
                  <SelectItem value="kategorieseite">Kategorieseite (Thema)</SelectItem>
                  <SelectItem value="markenseite">Markenseite (Brand)</SelectItem>
                  <SelectItem value="ratgeber">Ratgeber</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 6. Zusatzinfos */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Zusatzinfos (optional)</Label>
              <Textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Besondere Hinweise, USPs, Kontraindikationen..."
                rows={4}
              />
            </div>

            <Separator />

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !productName.trim() || !focusKeyword.trim()}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generiert... (bis zu 90s)
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  SEO-Content erstellen
                </>
              )}
            </Button>
          </div>
        </div>

        {/* RIGHT: Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!result ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-3">
                <FileText className="h-16 w-16 mx-auto opacity-20" />
                <p className="text-lg">Noch kein Content generiert</p>
                <p className="text-sm">Fuell das Formular aus und klicke "SEO-Content erstellen"</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="border-b px-4 pt-2 flex-shrink-0">
                  <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-0">
                    <TabsTrigger value="seo-text" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
                      <Eye className="h-4 w-4 mr-2" /> SEO-Text
                    </TabsTrigger>
                    <TabsTrigger value="meta" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
                      <Globe className="h-4 w-4 mr-2" /> Meta-Daten
                    </TabsTrigger>
                    <TabsTrigger value="faq" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
                      <MessageSquare className="h-4 w-4 mr-2" /> FAQ ({result.faq?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="prompt" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
                      <Code className="h-4 w-4 mr-2" /> Prompt
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {/* SEO-Text Tab */}
                    <TabsContent value="seo-text" className="mt-0">
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.seoText, 'html')}>
                            {copiedField === 'html' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            HTML kopieren
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            const text = result.seoText.replace(/<[^>]*>/g, '');
                            copyToClipboard(text, 'plaintext');
                          }}>
                            {copiedField === 'plaintext' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            Plaintext kopieren
                          </Button>
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed">
                          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(result.seoText) }} />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Meta Tab */}
                    <TabsContent value="meta" className="mt-0">
                      <div className="space-y-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Meta-Title</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm font-medium flex-1">{result.title}</p>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result.title, 'title')}>
                                {copiedField === 'title' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                            <p className="text-xs mt-2">
                              Zeichenzahl: {result.title.length}/60{' '}
                              {result.title.length <= 60
                                ? <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">OK</Badge>
                                : <Badge variant="destructive" className="text-[10px]">Zu lang</Badge>
                              }
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Meta-Description</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm flex-1">{result.metaDescription}</p>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result.metaDescription, 'meta')}>
                                {copiedField === 'meta' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                            <p className="text-xs mt-2">
                              Zeichenzahl: {result.metaDescription.length}/155{' '}
                              {result.metaDescription.length <= 155
                                ? <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">OK</Badge>
                                : <Badge variant="destructive" className="text-[10px]">Zu lang</Badge>
                              }
                            </p>
                          </CardContent>
                        </Card>

                        {/* Google SERP Preview */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Google Vorschau</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-white rounded-lg p-4 border">
                              <p className="text-blue-600 text-lg hover:underline cursor-pointer font-medium leading-tight">
                                {result.title || 'Titel fehlt'}
                              </p>
                              <p className="text-green-700 text-sm mt-1">www.k-active.com</p>
                              <p className="text-gray-600 text-sm mt-1 leading-snug">
                                {result.metaDescription || 'Description fehlt'}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* FAQ Tab */}
                    <TabsContent value="faq" className="mt-0">
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            const faqHtml = result.faq.map(f =>
                              `<div class="faq-item">\n  <h3>${f.question}</h3>\n  <p>${f.answer}</p>\n</div>`
                            ).join('\n');
                            copyToClipboard(faqHtml, 'faq-html');
                          }}>
                            {copiedField === 'faq-html' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            FAQ als HTML
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(generateFaqJsonLd(), 'faq-jsonld')}>
                            {copiedField === 'faq-jsonld' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                            FAQ als JSON-LD
                          </Button>
                        </div>

                        {result.faq?.map((item, i) => (
                          <Card key={i}>
                            <CardContent className="pt-4">
                              <p className="font-semibold text-sm mb-2">{item.question}</p>
                              <p className="text-sm text-muted-foreground">{item.answer}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Prompt Tab */}
                    <TabsContent value="prompt" className="mt-0">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">System Prompt</CardTitle>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result._prompts?.systemPrompt || '', 'system-prompt')}>
                                {copiedField === 'system-prompt' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto font-mono">
                              {result._prompts?.systemPrompt || 'Nicht verfuegbar'}
                            </pre>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">User Prompt</CardTitle>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result._prompts?.userPrompt || '', 'user-prompt')}>
                                {copiedField === 'user-prompt' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto font-mono">
                              {result._prompts?.userPrompt || 'Nicht verfuegbar'}
                            </pre>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>

                {/* Footer Stats */}
                <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0 bg-muted/30">
                  <span>Woerter: <strong>{wordCountNum}</strong></span>
                  <span>Keywords: <strong>{keywordCount}x</strong> ({wordCountNum > 0 ? ((keywordCount / wordCountNum) * 100).toFixed(1) : 0}%)</span>
                  <span>H2: <strong>{(result.seoText.match(/<h2/g) || []).length}</strong></span>
                  <span>Lesezeit: ~{Math.ceil(wordCountNum / 250)} Min</span>
                  {result.serpDataUsed && (
                    <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">SERP-optimiert</Badge>
                  )}
                  <span className="ml-auto">{result.model} | {Math.round(result.generationTimeMs / 1000)}s</span>
                </div>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCreatorV2;
