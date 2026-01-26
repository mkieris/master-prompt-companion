import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Sparkles,
  FileText,
  Zap,
  AlertTriangle,
  Copy,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FunctionTestProps {
  session: Session | null;
}

interface TestResult {
  success: boolean;
  duration: number;
  response: any;
  error?: string;
  timestamp: string;
}

const FunctionTest = ({ session }: FunctionTestProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // SERP Analysis State
  const [serpKeyword, setSerpKeyword] = useState("Kinesiologie Tape");
  const [serpLoading, setSerpLoading] = useState(false);
  const [serpResult, setSerpResult] = useState<TestResult | null>(null);

  // Keyword Analysis State
  const [kwKeyword, setKwKeyword] = useState("Kinesiologie Tape");
  const [kwAudience, setKwAudience] = useState("endCustomers");
  const [kwLoading, setKwLoading] = useState(false);
  const [kwResult, setKwResult] = useState<TestResult | null>(null);

  // Content Generation State
  const [genKeyword, setGenKeyword] = useState("Kinesiologie Tape");
  const [genTone, setGenTone] = useState("beratend");
  const [genLength, setGenLength] = useState("short");
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<TestResult | null>(null);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p>Bitte zuerst einloggen.</p>
          <Button onClick={() => navigate("/auth")} className="mt-4">Zum Login</Button>
        </Card>
      </div>
    );
  }

  const copyToClipboard = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast({ title: "Kopiert!" });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // ═══ SERP ANALYSIS TEST ═══
  const testSerpAnalysis = async () => {
    if (!serpKeyword.trim()) {
      toast({ title: "Fehler", description: "Keyword erforderlich", variant: "destructive" });
      return;
    }

    setSerpLoading(true);
    setSerpResult(null);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke("analyze-serp", {
        body: {
          keyword: serpKeyword.trim(),
          country: "de",
          language: "de",
          numResults: 10,
        },
      });

      const duration = Date.now() - startTime;

      if (error) {
        setSerpResult({
          success: false,
          duration,
          response: null,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        setSerpResult({
          success: true,
          duration,
          response: data,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      setSerpResult({
        success: false,
        duration,
        response: null,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSerpLoading(false);
    }
  };

  // ═══ KEYWORD ANALYSIS TEST ═══
  const testKeywordAnalysis = async () => {
    if (!kwKeyword.trim()) {
      toast({ title: "Fehler", description: "Keyword erforderlich", variant: "destructive" });
      return;
    }

    setKwLoading(true);
    setKwResult(null);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          mode: "analyze-keyword",
          focusKeyword: kwKeyword.trim(),
          targetAudience: kwAudience,
          language: "de",
        },
      });

      const duration = Date.now() - startTime;

      if (error) {
        setKwResult({
          success: false,
          duration,
          response: null,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        setKwResult({
          success: true,
          duration,
          response: data,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      setKwResult({
        success: false,
        duration,
        response: null,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setKwLoading(false);
    }
  };

  // ═══ CONTENT GENERATION TEST ═══
  const testContentGeneration = async () => {
    if (!genKeyword.trim()) {
      toast({ title: "Fehler", description: "Keyword erforderlich", variant: "destructive" });
      return;
    }

    setGenLoading(true);
    setGenResult(null);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          focusKeyword: genKeyword.trim(),
          tone: genTone,
          contentLength: genLength,
          targetAudience: "endCustomers",
          formOfAddress: "du",
          promptVersion: "v9-master",
          secondaryKeywords: [],
          wQuestions: [],
          brandName: "",
          additionalInfo: "",
          serpContext: "",
        },
      });

      const duration = Date.now() - startTime;

      if (error) {
        setGenResult({
          success: false,
          duration,
          response: null,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        setGenResult({
          success: true,
          duration,
          response: data,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      setGenResult({
        success: false,
        duration,
        response: null,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setGenLoading(false);
    }
  };

  // ═══ RESULT CARD COMPONENT ═══
  const ResultCard = ({ result, title }: { result: TestResult | null; title: string }) => {
    if (!result) return null;

    return (
      <Card className={`mt-4 ${result.success ? 'border-green-500/50' : 'border-red-500/50'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <CardTitle className="text-sm">
                {result.success ? "Erfolgreich" : "Fehlgeschlagen"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {(result.duration / 1000).toFixed(2)}s
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(result.response || result.error, null, 2), title)}
              >
                {copiedSection === title ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            {new Date(result.timestamp).toLocaleString("de-DE")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
              <p className="text-sm text-red-600 dark:text-red-400 font-mono">{result.error}</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto whitespace-pre-wrap">
                {JSON.stringify(result.response, null, 2)}
              </pre>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Funktionstest
            </h1>
          </div>
          <Badge variant="outline" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Entwickler-Tool
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card className="mb-6 bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Funktionstest-Bereich</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hier kannst du einzelne API-Funktionen isoliert testen, um Probleme zu identifizieren.
                  Die Ergebnisse zeigen die rohen API-Antworten und die Ausführungszeit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="serp" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="serp" className="gap-2">
              <Search className="h-4 w-4" />
              SERP-Analyse
            </TabsTrigger>
            <TabsTrigger value="keyword" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Keyword-Analyse
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-2">
              <FileText className="h-4 w-4" />
              Generierung
            </TabsTrigger>
          </TabsList>

          {/* ═══ SERP ANALYSIS TAB ═══ */}
          <TabsContent value="serp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-500" />
                  SERP-Analyse Test
                </CardTitle>
                <CardDescription>
                  Testet die <code className="bg-muted px-1 rounded">analyze-serp</code> Edge Function.
                  Ruft Google-Suchergebnisse über die Serper.dev API ab.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Keyword</Label>
                  <Input
                    value={serpKeyword}
                    onChange={(e) => setSerpKeyword(e.target.value)}
                    placeholder="z.B. Kinesiologie Tape"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={testSerpAnalysis} disabled={serpLoading}>
                    {serpLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Teste...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Test starten
                      </>
                    )}
                  </Button>
                </div>

                <ResultCard result={serpResult} title="SERP" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ KEYWORD ANALYSIS TAB ═══ */}
          <TabsContent value="keyword">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Keyword-Analyse Test
                </CardTitle>
                <CardDescription>
                  Testet die Keyword-Analyse über <code className="bg-muted px-1 rounded">generate-seo-content</code> mit <code className="bg-muted px-1 rounded">mode: 'analyze-keyword'</code>.
                  Nutzt AI um Sekundär-Keywords und W-Fragen zu generieren.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Keyword</Label>
                    <Input
                      value={kwKeyword}
                      onChange={(e) => setKwKeyword(e.target.value)}
                      placeholder="z.B. Kinesiologie Tape"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Zielgruppe</Label>
                    <Select value={kwAudience} onValueChange={setKwAudience}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="endCustomers">B2C (Endkunden)</SelectItem>
                        <SelectItem value="physiotherapists">B2B (Fachpersonal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={testKeywordAnalysis} disabled={kwLoading}>
                    {kwLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Teste...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Test starten
                      </>
                    )}
                  </Button>
                </div>

                <ResultCard result={kwResult} title="Keyword" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ CONTENT GENERATION TAB ═══ */}
          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  Content-Generierung Test
                </CardTitle>
                <CardDescription>
                  Testet die vollständige Content-Generierung über <code className="bg-muted px-1 rounded">generate-seo-content</code>.
                  Generiert SEO-optimierten Text mit AI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Keyword</Label>
                    <Input
                      value={genKeyword}
                      onChange={(e) => setGenKeyword(e.target.value)}
                      placeholder="z.B. Kinesiologie Tape"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Tonalität</Label>
                    <Select value={genTone} onValueChange={setGenTone}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sachlich">Sachlich</SelectItem>
                        <SelectItem value="beratend">Beratend</SelectItem>
                        <SelectItem value="aktivierend">Aktivierend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Textlänge</Label>
                    <Select value={genLength} onValueChange={setGenLength}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Kurz (~400 Wörter)</SelectItem>
                        <SelectItem value="medium">Mittel (~800 Wörter)</SelectItem>
                        <SelectItem value="long">Lang (~1200 Wörter)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span><strong>Hinweis:</strong> Content-Generierung dauert ca. 20-55 Sekunden.</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={testContentGeneration} disabled={genLoading}>
                    {genLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generiere... (kann bis zu 55s dauern)
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Test starten
                      </>
                    )}
                  </Button>
                </div>

                <ResultCard result={genResult} title="Generate" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FunctionTest;
