import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProcessFlowPanel } from "@/components/seo-generator/ProcessFlowPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDebug } from "@/contexts/DebugContext";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  FileDown,
  FileText,
  Globe,
  Loader2,
  MessageSquare,
  Sparkles,
  Tag,
  Link as LinkIcon,
  Shield,
  X,
  Info,
  Wand2,
  Settings,
  Eye,
  Code,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";

interface BasicVersionProps {
  session: Session | null;
}

interface FormData {
  focusKeyword: string;
  secondaryKeywords: string[];
  wQuestions: string[];
  searchIntent: ("know" | "do" | "buy" | "go")[];
  keywordDensity: "low" | "medium" | "high";
  pageType: "product" | "category";
  targetAudience: "endCustomers" | "physiotherapists";
  formOfAddress: "du" | "sie" | "neutral";
  contentLength: "short" | "medium" | "long";
  tone: string;
  manufacturerWebsite: string;
  manufacturerInfo: string;
  additionalInfo: string;
  promptVersion: string;
}

interface SeoTextContent {
  type: string;
  text?: string;
  items?: string[];
}

interface SeoTextObject {
  h1: string;
  content: SeoTextContent[];
}

interface GeneratedContent {
  seoText: string | SeoTextObject;
  faq: Array<{ question: string; answer: string }>;
  title: string;
  metaDescription: string;
  internalLinks: Array<{ text: string; url: string } | { anchorText: string; url: string }>;
  technicalHints?: string;
  qualityReport?: any;
  guidelineValidation?: any;
}

const BasicVersion = ({ session }: BasicVersionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { log, logWithTimer } = useDebug();
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("input");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showProcessFlow, setShowProcessFlow] = useState(true);
  const [showDebugPrompt, setShowDebugPrompt] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const [formData, setFormData] = useState<FormData>({
    focusKeyword: "",
    secondaryKeywords: [],
    wQuestions: [],
    searchIntent: [],
    keywordDensity: "medium",
    pageType: "product",
    targetAudience: "endCustomers",
    formOfAddress: "du",
    contentLength: "medium",
    tone: "advisory",
    manufacturerWebsite: "",
    manufacturerInfo: "",
    additionalInfo: "",
    promptVersion: "v1-kompakt-seo",
  });
  
  const [wQuestionInput, setWQuestionInput] = useState("");

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  if (!session) return null;

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.secondaryKeywords.includes(keywordInput.trim())) {
      const newKeyword = keywordInput.trim();
      log('form', 'Sekundär-Keyword hinzugefügt', { keyword: newKeyword });
      setFormData({
        ...formData,
        secondaryKeywords: [...formData.secondaryKeywords, newKeyword],
      });
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      secondaryKeywords: formData.secondaryKeywords.filter((k) => k !== keyword),
    });
  };

  const handleAddWQuestion = () => {
    if (wQuestionInput.trim() && !formData.wQuestions.includes(wQuestionInput.trim())) {
      setFormData({
        ...formData,
        wQuestions: [...formData.wQuestions, wQuestionInput.trim()],
      });
      setWQuestionInput("");
    }
  };

  const handleRemoveWQuestion = (question: string) => {
    setFormData({
      ...formData,
      wQuestions: formData.wQuestions.filter((q) => q !== question),
    });
  };

  const toggleSearchIntent = (intent: "know" | "do" | "buy" | "go") => {
    setFormData({
      ...formData,
      searchIntent: formData.searchIntent.includes(intent)
        ? formData.searchIntent.filter((i) => i !== intent)
        : [...formData.searchIntent, intent],
    });
  };

  // Build preview of System-Prompt based on selected version
  const buildSystemPromptPreview = () => {
    const version = formData.promptVersion || 'v1-kompakt-seo';
    
    const systemPromptPreviews: Record<string, string> = {
      'v1-kompakt-seo': `[v1-kompakt-seo: Technisch präzise]

Du bist erfahrener SEO-Texter nach Google-Standards 2024/2025.

TOP 10 KRITISCHE SEO-FAKTOREN:
1. FOKUS-KEYWORD: MUSS in H1 und ersten 100 Wörtern
2. H1-STRUKTUR: NUR EINE H1, max 60-70 Zeichen
3. ABSATZLÄNGE: Max 300 Wörter pro Absatz
4. E-E-A-T: Experience, Expertise, Authority, Trust
5. TONALITÄT: ${formData.tone}
6. ANREDEFORM: ${formData.formOfAddress}
7. PEOPLE-FIRST: Echten Nutzen bieten
8. HEADING-HIERARCHIE: H1→H2→H3
9. AKTIVE SPRACHE: Max 15% Passiv
10. FAQ: 5-8 relevante W-Fragen

AUSGABE: JSON mit seoText, faq, title, metaDescription...`,

      'v2-marketing-first': `[v2-marketing-first: Emotion > Technik]

Du bist kreativer Marketing-Texter mit SEO-Kenntnissen.
Priorität: BEGEISTERN, dann optimieren.

MARKETING-FIRST PRINZIPIEN:
1. HOOK: Emotionaler Aufhänger
2. STORYTELLING: Geschichten & Szenarien
3. NUTZEN-SPRACHE: "Du bekommst/profitierst"
4. POWER-WORDS: revolutionär, erstaunlich, bewährt
5. CONVERSATIONAL TONE: Authentisch, direkt
6. VISUELLE SPRACHE: Metaphern, sensorische Details
7. SOCIAL PROOF: Beispiele, Erfolgsgeschichten

TONALITÄT: ${formData.tone} - aber IMMER fesselnd!`,

      'v3-hybrid-intelligent': `[v3-hybrid-intelligent: Balance SEO + Marketing]

Du kombinierst SEO-Expertise mit Marketing-Kreativität.

ZWEI-SÄULEN-ANSATZ:
SÄULE 1 - SEO-FUNDAMENT:
- Keyword-Platzierung nach Best Practices
- Strukturierte Überschriften-Hierarchie
- E-E-A-T Signale

SÄULE 2 - MARKETING-KREATIVITÄT:
- Emotionale Hooks zum Einstieg
- Nutzenorientierte Argumentation
- Aktivierende CTAs

TONALITÄT: ${formData.tone}`,

      'v4-minimal-kreativ': `[v4-minimal-kreativ: Weniger Regeln, mehr Freiraum]

Du bist erfahrener Content-Creator mit SEO-Verständnis.

ESSENTIALS (nur das Wichtigste):
- Fokus-Keyword natürlich integrieren
- Klare Überschriften-Struktur
- Leserfreundliche Absätze
- TONALITÄT: ${formData.tone}

KREATIVE FREIHEIT:
- Experimentiere mit Formaten
- Finde einzigartige Blickwinkel
- Überrasche den Leser`,

      'v5-ai-meta-optimiert': `[v5-ai-meta-optimiert: Selbstoptimierend]

Du bist AI-Content-Spezialist mit Meta-Analyse-Fähigkeit.

VOR DEM SCHREIBEN:
1. Analysiere das Thema aus 3 Perspektiven
2. Identifiziere die stärksten Argumente
3. Plane die optimale Struktur

WÄHREND DEM SCHREIBEN:
- Prüfe jeden Absatz auf Mehrwert
- Variiere Satzstrukturen bewusst
- Integriere Keywords natürlich

TONALITÄT: ${formData.tone}`,

      'v6-quality-auditor': `[v6-quality-auditor: Anti-Fluff + AEO]

Du bist "Senior SEO Editor & Quality Auditor".

🚫 ANTI-FLUFF BLACKLIST (VERBOTEN!):
- "In der heutigen digitalen Welt..."
- "Es ist wichtig zu beachten..."
- "Zusammenfassend lässt sich sagen..."
- "Tauchen wir tiefer ein..."
- "Ein entscheidender Faktor ist..."
- "Es ist kein Geheimnis, dass..."
- "Im Folgenden werden wir..."
- "Abschließend lässt sich festhalten..."
- "Bevor wir beginnen..."
→ Jeden Satz ohne Mehrwert = LÖSCHEN!

✅ AEO (Answer Engine Optimization):
- Frage-H2? → Erster Satz = DIREKTE Antwort!
- Featured Snippet Format: 40-60 Wörter

📐 SKIMMABILITY:
- Alle 3 Absätze: Bullets / Tabelle / Fettung
- Wichtige Begriffe mit <b>-Tags
- Variierte Satzlängen (Anti-KI-Monotonie)

TONALITÄT: ${formData.tone}`,
    };

    // Check for historical versions
    if (version.startsWith('v0-')) {
      return `[${version}: Historische Version]

⚠️ Historische Entwicklungsversion
Diese Version wurde während der Entwicklungsphase erstellt.

Hinweis: Im Backend wird auf v1-kompakt-seo zurückgefallen,
da historische Versionen nicht vollständig implementiert sind.`;
    }

    return systemPromptPreviews[version] || systemPromptPreviews['v1-kompakt-seo'];
  };

  // Build preview of User-Prompt (mirrors backend buildUserPrompt logic)
  const buildUserPromptPreview = () => {
    const intentMap: Record<string, string> = {
      'know': 'Know (Informationssuche)',
      'do': 'Do (Transaktional)',
      'buy': 'Buy (Kaufabsicht)',
      'go': 'Go (Navigation)'
    };
    const densityMap: Record<string, string> = {
      'low': 'Niedrig (1-2%)',
      'medium': 'Mittel (2-3%)',
      'high': 'Hoch (3-4%)'
    };
    const lengthMap: Record<string, string> = {
      'short': '~400 Wörter',
      'medium': '~800 Wörter',
      'long': '~1200 Wörter'
    };

    let prompt = '=== GRUNDINFORMATIONEN ===\n';
    if (formData.manufacturerInfo) prompt += `Info: ${formData.manufacturerInfo.substring(0, 200)}...\n`;
    if (formData.additionalInfo) prompt += `USPs: ${formData.additionalInfo}\n`;
    
    prompt += '\n=== ZIELGRUPPE ===\n';
    prompt += `Audience: ${formData.targetAudience === 'endCustomers' ? 'B2C (Endkunden)' : 'B2B (Fachpersonal)'}\n`;
    prompt += `Anrede: ${formData.formOfAddress}\n`;
    prompt += `Tonalität: ${formData.tone}\n`;
    
    prompt += '\n=== SEO-STRUKTUR ===\n';
    prompt += `Fokus-Keyword: ${formData.focusKeyword || '(nicht gesetzt)'}\n`;
    if (formData.secondaryKeywords.length > 0) {
      prompt += `Sekundär-Keywords: ${formData.secondaryKeywords.join(', ')}\n`;
    }
    if (formData.searchIntent.length > 0) {
      prompt += `SUCHINTENTION: ${formData.searchIntent.map(i => intentMap[i] || i).join(', ')}\n`;
      prompt += `WICHTIG: Struktur MUSS zur Suchintention passen!\n`;
    }
    prompt += `KEYWORD-DICHTE: ${densityMap[formData.keywordDensity]}\n`;
    if (formData.wQuestions.length > 0) {
      prompt += `W-FRAGEN (müssen beantwortet werden):\n${formData.wQuestions.map(q => `  - ${q}`).join('\n')}\n`;
    }
    prompt += `Wortanzahl: ${lengthMap[formData.contentLength]}\n`;
    prompt += `Seitentyp: ${formData.pageType === 'product' ? 'Produktseite' : 'Kategorieseite'}\n`;
    
    prompt += '\n=== AUFGABE ===\n';
    prompt += 'Erstelle hochwertigen, SEO-optimierten Text der alle Vorgaben erfüllt.';
    
    return prompt;
  };

  const handleScrapeWebsite = async () => {
    if (!formData.manufacturerWebsite.trim()) {
      toast({ title: "Fehler", description: "Bitte URL eingeben", variant: "destructive" });
      return;
    }

    setIsScraping(true);
    const endTimer = logWithTimer('api', 'Website-Scraping');
    log('api', 'scrape-website aufgerufen', { url: formData.manufacturerWebsite });
    
    try {
      const { data, error } = await supabase.functions.invoke("scrape-website", {
        body: { url: formData.manufacturerWebsite, mode: "single" },
      });

      if (error) throw error;

      log('response', 'scrape-website erfolgreich', { 
        title: data.title, 
        descriptionLength: data.description?.length,
        contentLength: data.content?.length 
      });
      
      setFormData({
        ...formData,
        manufacturerInfo: `Titel: ${data.title || "N/A"}\n\nBeschreibung: ${data.description || "N/A"}\n\nInhalt:\n${data.content?.substring(0, 2000) || ""}`,
      });

      toast({ title: "Erfolgreich", description: "Website wurde analysiert" });
    } catch (error) {
      log('error', 'scrape-website fehlgeschlagen', { error: String(error) });
      console.error("Scraping error:", error);
      toast({ title: "Fehler", description: "Website konnte nicht analysiert werden", variant: "destructive" });
    } finally {
      endTimer();
      setIsScraping(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.focusKeyword.trim()) {
      log('error', 'Validierung fehlgeschlagen', { reason: 'Fokus-Keyword fehlt' });
      toast({ title: "Fokus-Keyword erforderlich", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setCurrentStep("generating");
    
    // Log the complete form data and both prompts
    log('prompt', 'System-Prompt (Regeln & Rolle)', buildSystemPromptPreview());
    log('prompt', 'User-Prompt (Auftrag & Inputs)', buildUserPromptPreview());
    log('form', 'Formular-Daten komplett', {
      focusKeyword: formData.focusKeyword,
      secondaryKeywords: formData.secondaryKeywords,
      wQuestions: formData.wQuestions,
      searchIntent: formData.searchIntent,
      keywordDensity: formData.keywordDensity,
      pageType: formData.pageType,
      targetAudience: formData.targetAudience,
      formOfAddress: formData.formOfAddress,
      contentLength: formData.contentLength,
      promptVersion: formData.promptVersion,
    });
    
    const endTimer = logWithTimer('api', 'Content-Generierung');
    log('api', 'generate-seo-content aufgerufen', { 
      promptVersion: formData.promptVersion,
      hinweis: 'System-Prompt definiert WIE die AI arbeitet, User-Prompt definiert WAS generiert wird'
    });

    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: formData,
      });

      if (error) {
        log('error', 'generate-seo-content Fehler', { error: error.message });
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
        return;
      }

      log('response', 'generate-seo-content erfolgreich', { 
        hasVariants: !!data?.variants,
        variantCount: data?.variants?.length,
        selectedVariant: data?.selectedVariant 
      });

      let content = data;
      if (data?.variants && Array.isArray(data.variants) && data.variants.length > 0) {
        log('state', 'Variante ausgewählt', { index: 0, name: data.variants[0]?._variantInfo?.name });
        content = data.variants[0];
      }

      log('response', 'Content-Struktur', { 
        seoTextLength: content?.seoText?.length,
        faqCount: content?.faq?.length,
        hasTitle: !!content?.title,
        hasMetaDescription: !!content?.metaDescription
      });

      // Log the actual generated content for debugging
      if (content?.title) {
        log('response', 'Generierter Title', content.title);
      }
      if (content?.metaDescription) {
        log('response', 'Generierte Meta-Description', content.metaDescription);
      }
      if (content?.seoText) {
        const seoTextPreview = typeof content.seoText === 'string' 
          ? content.seoText.substring(0, 500) + '...'
          : JSON.stringify(content.seoText).substring(0, 500) + '...';
        log('response', 'Generierter SEO-Text (Vorschau)', seoTextPreview);
      }
      if (content?.faq && content.faq.length > 0) {
        log('response', 'Generierte FAQs', content.faq);
      }

      setGeneratedContent(content);
      setCurrentStep("display");
      toast({ title: "Erfolgreich", description: "SEO-Content wurde generiert" });
    } catch (error) {
      log('error', 'generate-seo-content Exception', { error: String(error) });
      console.error("Error:", error);
      toast({ title: "Fehler", description: "Ein unerwarteter Fehler ist aufgetreten", variant: "destructive" });
    } finally {
      endTimer();
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      toast({ title: "Kopiert!", description: `${section} wurde kopiert.` });
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      toast({ title: "Fehler", description: "Kopieren fehlgeschlagen", variant: "destructive" });
    }
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // Convert seoText object to HTML string if needed
  const getSeoTextHtml = (seoText: string | SeoTextObject): string => {
    if (typeof seoText === 'string') {
      return seoText;
    }
    
    // Convert structured seoText object to HTML
    let html = `<h1>${seoText.h1}</h1>\n`;
    
    for (const block of seoText.content || []) {
      switch (block.type) {
        case 'p':
          html += `<p>${block.text || ''}</p>\n`;
          break;
        case 'h2':
          html += `<h2>${block.text || ''}</h2>\n`;
          break;
        case 'h3':
          html += `<h3>${block.text || ''}</h3>\n`;
          break;
        case 'ul':
          html += '<ul>\n';
          for (const item of block.items || []) {
            html += `  <li>${item}</li>\n`;
          }
          html += '</ul>\n';
          break;
        case 'ol':
          html += '<ol>\n';
          for (const item of block.items || []) {
            html += `  <li>${item}</li>\n`;
          }
          html += '</ol>\n';
          break;
        default:
          if (block.text) {
            html += `<p>${block.text}</p>\n`;
          }
      }
    }
    
    return html;
  };

  // Get anchor text from link with either format
  const getLinkAnchorText = (link: { text?: string; anchorText?: string; url: string }): string => {
    return link.text || link.anchorText || '';
  };

  const exportAsHtml = () => {
    if (!generatedContent) return;
    const seoHtml = getSeoTextHtml(generatedContent.seoText);
    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${generatedContent.title}</title>
  <meta name="description" content="${generatedContent.metaDescription}">
</head>
<body>
  ${seoHtml}
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedContent.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'seo-content'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportiert!", description: "HTML-Datei heruntergeladen." });
  };

  const CopyButton = ({ text, section }: { text: string; section: string }) => (
    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(text, section)} className="h-8 px-2">
      {copiedSection === section ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </Button>
  );

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
              <Sparkles className="h-5 w-5 text-primary" />
              SEO Content Basic
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowProcessFlow(!showProcessFlow)}
            >
              <Info className="h-4 w-4 mr-2" />
              {showProcessFlow ? "Prozess ausblenden" : "Prozess anzeigen"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column: Form + Process */}
          <div className="xl:col-span-1 space-y-6">
            {/* Process Flow Panel */}
            {showProcessFlow && (
              <ProcessFlowPanel currentStep={currentStep} formData={formData} />
            )}

            {/* Compact Input Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Eingaben
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Focus Keyword */}
                <div>
                  <Label className="text-sm font-medium">Fokus-Keyword *</Label>
                  <Input
                    value={formData.focusKeyword}
                    onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                    placeholder="z.B. Kinesiologie Tape"
                    className="mt-1"
                  />
                </div>

                {/* Secondary Keywords */}
                <div>
                  <Label className="text-sm font-medium">Sekundär-Keywords</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                      placeholder="+ Enter"
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddKeyword} variant="outline" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.secondaryKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.secondaryKeywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="gap-1 pr-1 text-xs">
                          {kw}
                          <button onClick={() => handleRemoveKeyword(kw)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* W-Fragen */}
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    W-Fragen
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={wQuestionInput}
                      onChange={(e) => setWQuestionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddWQuestion())}
                      placeholder="z.B. Was ist Kinesiologie Tape?"
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddWQuestion} variant="outline" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.wQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.wQuestions.map((q) => (
                        <Badge key={q} variant="outline" className="gap-1 pr-1 text-xs bg-accent/50">
                          {q}
                          <button onClick={() => handleRemoveWQuestion(q)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suchintention */}
                <div>
                  <Label className="text-sm font-medium">Suchintention</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {[
                      { value: "know", label: "Know", icon: "📚" },
                      { value: "do", label: "Do", icon: "⚡" },
                      { value: "buy", label: "Buy", icon: "🛒" },
                      { value: "go", label: "Go", icon: "📍" },
                    ].map(({ value, label, icon }) => (
                      <label
                        key={value}
                        className={`flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors text-xs ${
                          formData.searchIntent.includes(value as any)
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={formData.searchIntent.includes(value as any)}
                          onChange={() => toggleSearchIntent(value as any)}
                        />
                        <span className="text-base mb-0.5">{icon}</span>
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quick Settings Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Seitentyp</Label>
                    <Select 
                      value={formData.pageType} 
                      onValueChange={(v: "product" | "category") => setFormData({ ...formData, pageType: v })}
                    >
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Produkt</SelectItem>
                        <SelectItem value="category">Kategorie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Textlänge</Label>
                    <Select 
                      value={formData.contentLength} 
                      onValueChange={(v: "short" | "medium" | "long") => setFormData({ ...formData, contentLength: v })}
                    >
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Kurz (~400)</SelectItem>
                        <SelectItem value="medium">Mittel (~800)</SelectItem>
                        <SelectItem value="long">Lang (~1200)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Keyword-Dichte</Label>
                    <Select 
                      value={formData.keywordDensity} 
                      onValueChange={(v: "low" | "medium" | "high") => setFormData({ ...formData, keywordDensity: v })}
                    >
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Niedrig (1-2%)</SelectItem>
                        <SelectItem value="medium">Mittel (2-3%)</SelectItem>
                        <SelectItem value="high">Hoch (3-4%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <Label className="text-xs">Zielgruppe</Label>
                  <div className="flex gap-2 mt-1">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors text-xs ${
                      formData.targetAudience === "endCustomers" ? "border-primary bg-primary/10" : "hover:bg-muted"
                    }`}>
                      <input 
                        type="radio" 
                        className="sr-only" 
                        checked={formData.targetAudience === "endCustomers"}
                        onChange={() => setFormData({ ...formData, targetAudience: "endCustomers" })}
                      />
                      B2C
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors text-xs ${
                      formData.targetAudience === "physiotherapists" ? "border-primary bg-primary/10" : "hover:bg-muted"
                    }`}>
                      <input 
                        type="radio" 
                        className="sr-only" 
                        checked={formData.targetAudience === "physiotherapists"}
                        onChange={() => setFormData({ ...formData, targetAudience: "physiotherapists" })}
                      />
                      B2B/Fach
                    </label>
                  </div>
                </div>

                {/* Address Form */}
                <div>
                  <Label className="text-xs">Anrede</Label>
                  <div className="flex gap-2 mt-1">
                    {(["du", "sie", "neutral"] as const).map((addr) => (
                      <label key={addr} className={`flex-1 flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors text-xs capitalize ${
                        formData.formOfAddress === addr ? "border-primary bg-primary/10" : "hover:bg-muted"
                      }`}>
                        <input 
                          type="radio" 
                          className="sr-only" 
                          checked={formData.formOfAddress === addr}
                          onChange={() => setFormData({ ...formData, formOfAddress: addr })}
                        />
                        {addr}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Prompt Version */}
                <div>
                  <Label className="text-xs">Prompt-Strategie</Label>
                  <Select 
                    value={formData.promptVersion} 
                    onValueChange={(v) => setFormData({ ...formData, promptVersion: v })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v1-kompakt-seo">v1: Kompakt-SEO (technisch)</SelectItem>
                      <SelectItem value="v2-marketing-first">v2: Marketing-First (emotional)</SelectItem>
                      <SelectItem value="v3-hybrid-intelligent">v3: Hybrid (Balance)</SelectItem>
                      <SelectItem value="v4-minimal-kreativ">v4: Minimal-Kreativ</SelectItem>
                      <SelectItem value="v5-ai-meta-optimiert">v5: Meta-Optimiert</SelectItem>
                      <SelectItem value="v6-quality-auditor">v6: Quality-Auditor (Anti-Fluff + AEO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Website Scrape */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronDown className="h-4 w-4" />
                    Website analysieren (optional)
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={formData.manufacturerWebsite}
                        onChange={(e) => setFormData({ ...formData, manufacturerWebsite: e.target.value })}
                        placeholder="https://example.com"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleScrapeWebsite}
                        disabled={isScraping || !formData.manufacturerWebsite.trim()}
                        variant="secondary"
                        size="icon"
                      >
                        {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                      </Button>
                    </div>
                    {formData.manufacturerInfo && (
                      <Textarea
                        value={formData.manufacturerInfo}
                        onChange={(e) => setFormData({ ...formData, manufacturerInfo: e.target.value })}
                        rows={4}
                        className="text-xs"
                      />
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Additional Info */}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronDown className="h-4 w-4" />
                    Zusatzinfos / USPs (optional)
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <Textarea
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                      placeholder="Besonderheiten, Alleinstellungsmerkmale..."
                      rows={3}
                      className="text-sm"
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Debug Prompt Preview */}
                <Collapsible open={showDebugPrompt} onOpenChange={setShowDebugPrompt}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Code className="h-4 w-4" />
                    <span className="flex-1 text-left">Debug: User-Prompt Vorschau</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showDebugPrompt ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <div className="bg-muted/50 border rounded-lg p-3 relative">
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => copyToClipboard(buildUserPromptPreview(), "User-Prompt")}
                        >
                          {copiedSection === "User-Prompt" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground overflow-x-auto max-h-64 overflow-y-auto">
                        {buildUserPromptPreview()}
                      </pre>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Dies wird an die KI gesendet (+ System-Prompt je nach Strategie)
                    </p>
                  </CollapsibleContent>
                </Collapsible>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate} 
                  disabled={isLoading || !formData.focusKeyword.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generiere Content...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Content generieren
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Output */}
          <div className="xl:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generierter Content
                </CardTitle>
                {generatedContent && (
                  <Button variant="outline" size="sm" onClick={exportAsHtml}>
                    <FileDown className="h-4 w-4 mr-2" />
                    HTML Export
                  </Button>
                )}
              </CardHeader>

              {isLoading ? (
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                      <div className="absolute -inset-2 rounded-full bg-primary/10 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Generiere 3 Content-Varianten...</h3>
                      <p className="text-sm text-muted-foreground">KI analysiert Eingaben und erstellt optimierten SEO-Content</p>
                    </div>
                  </div>
                </CardContent>
              ) : !generatedContent ? (
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                      <Eye className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Kein Content generiert</h3>
                      <p className="text-sm text-muted-foreground">Füllen Sie das Formular aus und klicken Sie auf "Generieren"</p>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <Tabs defaultValue="text" className="flex-1">
                  <TabsList className="mx-4 grid grid-cols-5 h-auto p-1">
                    <TabsTrigger value="text" className="text-xs py-2">
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="faq" className="text-xs py-2">
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      FAQ
                    </TabsTrigger>
                    <TabsTrigger value="meta" className="text-xs py-2">
                      <Tag className="h-3.5 w-3.5 mr-1.5" />
                      Meta
                    </TabsTrigger>
                    <TabsTrigger value="links" className="text-xs py-2">
                      <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                      Links
                    </TabsTrigger>
                    <TabsTrigger value="quality" className="text-xs py-2">
                      <Shield className="h-3.5 w-3.5 mr-1.5" />
                      Quality
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="h-[calc(100vh-300px)] p-4">
                    <TabsContent value="text" className="mt-0">
                      <div className="flex justify-end mb-2">
                        <CopyButton text={stripHtml(getSeoTextHtml(generatedContent.seoText))} section="SEO-Text" />
                      </div>
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: getSeoTextHtml(generatedContent.seoText) }} 
                      />
                    </TabsContent>

                    <TabsContent value="faq" className="mt-0 space-y-3">
                      {generatedContent.faq?.map((item, index) => (
                        <Card key={index} className="p-4">
                          <h4 className="font-semibold text-sm mb-2 flex items-start gap-2">
                            <Badge variant="outline" className="shrink-0">F{index + 1}</Badge>
                            {item.question}
                          </h4>
                          <p className="text-sm text-muted-foreground pl-8">{item.answer}</p>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="meta" className="mt-0 space-y-4">
                      <Card className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">Title Tag</h4>
                          <CopyButton text={generatedContent.title || ''} section="Title" />
                        </div>
                        <p className="text-sm bg-muted p-2 rounded">{generatedContent.title}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {generatedContent.title?.length || 0}/60 Zeichen
                          {(generatedContent.title?.length || 0) > 60 && (
                            <Badge variant="destructive" className="ml-2 text-xs">Zu lang</Badge>
                          )}
                        </p>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">Meta Description</h4>
                          <CopyButton text={generatedContent.metaDescription || ''} section="Meta" />
                        </div>
                        <p className="text-sm bg-muted p-2 rounded">{generatedContent.metaDescription}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {generatedContent.metaDescription?.length || 0}/155 Zeichen
                        </p>
                      </Card>
                    </TabsContent>

                    <TabsContent value="links" className="mt-0 space-y-3">
                      {generatedContent.internalLinks?.map((link, index) => {
                        const anchorText = getLinkAnchorText(link);
                        return (
                          <Card key={index} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{anchorText}</p>
                                <p className="text-xs text-muted-foreground mt-1">{link.url}</p>
                              </div>
                              <CopyButton 
                                text={`<a href="${link.url}">${anchorText}</a>`} 
                                section={`Link ${index + 1}`} 
                              />
                            </div>
                          </Card>
                        );
                      })}
                      {(!generatedContent.internalLinks || generatedContent.internalLinks.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Keine Link-Empfehlungen generiert
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="quality" className="mt-0 space-y-4">
                      {generatedContent.guidelineValidation ? (
                        <>
                          <Card className="p-4">
                            <h4 className="font-semibold text-sm mb-3">Guideline-Score</h4>
                            <div className="flex items-center gap-4">
                              <div className="text-3xl font-bold text-primary">
                                {generatedContent.guidelineValidation.overallScore || 0}%
                              </div>
                              <div className="flex-1">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${generatedContent.guidelineValidation.overallScore || 0}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                          
                          {generatedContent.guidelineValidation.googleEEAT && (
                            <Card className="p-4">
                              <h4 className="font-semibold text-sm mb-3">E-E-A-T Bewertung</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {Object.entries(generatedContent.guidelineValidation.googleEEAT).map(([key, value]: [string, any]) => (
                                  <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-xs capitalize">{key}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        value?.status === "green" ? "bg-success/20 text-success" :
                                        value?.status === "yellow" ? "bg-warning/20 text-warning" :
                                        "bg-destructive/20 text-destructive"
                                      }
                                    >
                                      {value?.score || 0}%
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Keine Qualitätsdaten verfügbar
                        </p>
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BasicVersion;
