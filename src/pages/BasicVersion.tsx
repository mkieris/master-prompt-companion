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
import { ValidationPanel } from "@/components/seo-generator/ValidationPanel";
import { SerpAnalysisPanel } from "@/components/seo-generator/SerpAnalysisPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDebug } from "@/contexts/DebugContext";
import { useOrganization } from "@/hooks/useOrganization";
import { quickValidate } from "@/utils/formValidation";
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
import { sanitizeHtml, escapeHtml } from "@/lib/sanitize";
interface BasicVersionProps {
  session: Session | null;
}

interface FormData {
  // Kernfelder (immer sichtbar)
  focusKeyword: string;
  tone: "factual" | "advisory" | "sales";
  contentLength: "short" | "medium" | "long";
  targetAudience: "endCustomers" | "physiotherapists";
  formOfAddress: "du" | "sie" | "neutral";
  // Erweiterte Optionen (optional)
  secondaryKeywords: string[];
  wQuestions: string[];
  brandName: string;
  additionalInfo: string;
  // SEO-spezifische Felder
  pageType: "product" | "category";
  pageGoal: "inform" | "advise" | "preparePurchase" | "triggerPurchase";
  searchIntent: string[];
  keywordDensity: "low" | "medium" | "high";
  // Website-Scraping (optional)
  manufacturerWebsite: string;
  manufacturerInfo: string;
  // Compliance (optional)
  complianceCheck: boolean;
  checkMDR: boolean;
  checkHWG: boolean;
  checkStudies: boolean;
  // SERP-Analyse
  serpContext: string;
  // Intern verwendet (nicht in UI)
  promptVersion: string;
}

// SERP Analysis Result
interface SerpAnalysis {
  serpTerms: {
    mustHave: string[];
    shouldHave: string[];
    niceToHave: string[];
    all: string[];
  };
  questions: {
    peopleAlsoAsk: string[];
    relatedSearches: string[];
  };
  competitors: Array<{
    position: number;
    title: string;
    url: string;
    domain: string;
  }>;
  promptContext: string;
}

interface KeywordAnalysis {
  secondaryKeywords: string[];
  wQuestions: string[];
  searchIntent: "know" | "do" | "buy" | "go";
  suggestedTopics: string[];
}

// Domain/Topic Learning Analysis
interface DomainAnalysis {
  success: boolean;
  url: string;
  mode: 'topic' | 'category' | 'company';
  pagesAnalyzed: number;
  analysis: any;
  contentContext: string;
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
  const { currentOrg } = useOrganization(session);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("input");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showProcessFlow, setShowProcessFlow] = useState(true);
  const [showDebugPrompt, setShowDebugPrompt] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const [formData, setFormData] = useState<FormData>({
    // Kernfelder
    focusKeyword: "",
    tone: "advisory",
    contentLength: "medium",
    targetAudience: "endCustomers",
    formOfAddress: "du",
    // Erweiterte Optionen
    secondaryKeywords: [],
    wQuestions: [],
    brandName: "",
    additionalInfo: "",
    // SEO-spezifische Felder
    pageType: "product",
    pageGoal: "advise",
    searchIntent: [],
    keywordDensity: "medium",
    // Website-Scraping
    manufacturerWebsite: "",
    manufacturerInfo: "",
    // Compliance
    complianceCheck: false,
    checkMDR: false,
    checkHWG: false,
    checkStudies: false,
    // SERP-Analyse
    serpContext: "",
    // Intern
    promptVersion: "v9-master",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAnalyzingKeyword, setIsAnalyzingKeyword] = useState(false);
  const [isAnalyzingSerp, setIsAnalyzingSerp] = useState(false);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis | null>(null);
  const [serpAnalysis, setSerpAnalysis] = useState<SerpAnalysis | null>(null);
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [showSerpResults, setShowSerpResults] = useState(false);

  // Domain/Topic Learning State
  const [isAnalyzingDomain, setIsAnalyzingDomain] = useState(false);
  const [domainAnalysis, setDomainAnalysis] = useState<DomainAnalysis | null>(null);
  const [showDomainResults, setShowDomainResults] = useState(false);
  const [domainUrl, setDomainUrl] = useState("");

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
    log('form', 'Sekundär-Keyword entfernt', { keyword });
    setFormData({
      ...formData,
      secondaryKeywords: formData.secondaryKeywords.filter((k) => k !== keyword),
    });
  };

  const handleRemoveWQuestion = (question: string) => {
    log('form', 'W-Frage entfernt', { question });
    setFormData({
      ...formData,
      wQuestions: formData.wQuestions.filter((q) => q !== question),
    });
  };

  const handleAnalyzeKeyword = async () => {
    if (!formData.focusKeyword.trim()) {
      toast({ title: "Fehler", description: "Bitte zuerst ein Fokus-Keyword eingeben", variant: "destructive" });
      return;
    }

    setIsAnalyzingKeyword(true);
    const endTimer = logWithTimer('api', 'Keyword-Analyse');
    log('api', 'generate-seo-content (analyze-keyword mode) aufgerufen', { focusKeyword: formData.focusKeyword });

    try {
      // Use generate-seo-content with mode: 'analyze-keyword' instead of separate function
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          mode: 'analyze-keyword',
          focusKeyword: formData.focusKeyword,
          targetAudience: formData.targetAudience,
          language: 'de'
        },
      });

      if (error) throw error;

      log('response', 'keyword analysis erfolgreich', {
        secondaryKeywordsCount: data.analysis?.secondaryKeywords?.length,
        wQuestionsCount: data.analysis?.wQuestions?.length,
        searchIntent: data.analysis?.searchIntent,
      });

      setKeywordAnalysis(data.analysis);
      setShowKeywordSuggestions(true);
      setShowAdvanced(true); // Erweiterte Optionen öffnen um Übernahme zu sehen
      toast({ title: "Analyse abgeschlossen", description: "Keyword-Vorschläge wurden generiert" });
    } catch (error) {
      log('error', 'keyword analysis fehlgeschlagen', { error: String(error) });
      console.error("Keyword analysis error:", error);
      toast({ title: "Fehler", description: "Keyword-Analyse fehlgeschlagen", variant: "destructive" });
    } finally {
      endTimer();
      setIsAnalyzingKeyword(false);
    }
  };

  // SERP Analysis Handler
  const handleAnalyzeSerp = async () => {
    if (!formData.focusKeyword.trim()) {
      toast({ title: "Fehler", description: "Bitte zuerst ein Fokus-Keyword eingeben", variant: "destructive" });
      return;
    }

    setIsAnalyzingSerp(true);
    setCurrentStep("serp-analysis");
    const endTimer = logWithTimer('api', 'SERP-Analyse');
    log('api', 'analyze-serp aufgerufen', {
      keyword: formData.focusKeyword,
      country: 'de',
      language: 'de'
    });

    try {
      const { data, error } = await supabase.functions.invoke("analyze-serp", {
        body: {
          keyword: formData.focusKeyword,
          country: 'de',
          language: 'de',
          numResults: 10
        },
      });

      if (error) throw error;

      log('response', 'SERP-Analyse erfolgreich', {
        mustHaveCount: data.serpTerms?.mustHave?.length || 0,
        shouldHaveCount: data.serpTerms?.shouldHave?.length || 0,
        paaCount: data.questions?.peopleAlsoAsk?.length || 0,
        competitorsCount: data.competitors?.length || 0,
      });

      // Log detailed SERP results for analysis
      log('response', 'SERP mustHave Terme', data.serpTerms?.mustHave || []);
      log('response', 'SERP shouldHave Terme', data.serpTerms?.shouldHave || []);
      log('response', 'SERP People Also Ask', data.questions?.peopleAlsoAsk || []);

      setSerpAnalysis(data);
      setShowSerpResults(true);
      setShowAdvanced(true);

      // Auto-add mustHave terms to secondaryKeywords if not already present
      if (data.serpTerms?.mustHave?.length > 0) {
        const newKeywords = data.serpTerms.mustHave.filter(
          (term: string) => !formData.secondaryKeywords.includes(term)
        );
        if (newKeywords.length > 0) {
          setFormData(prev => ({
            ...prev,
            secondaryKeywords: [...prev.secondaryKeywords, ...newKeywords.slice(0, 5)]
          }));
          log('form', 'SERP mustHave Terme automatisch hinzugefügt', newKeywords.slice(0, 5));
        }
      }

      toast({
        title: "SERP-Analyse abgeschlossen",
        description: `${data.serpTerms?.mustHave?.length || 0} wichtige Terme gefunden`
      });
    } catch (error) {
      log('error', 'SERP-Analyse fehlgeschlagen', { error: String(error) });
      console.error("SERP analysis error:", error);
      toast({ title: "Fehler", description: "SERP-Analyse fehlgeschlagen", variant: "destructive" });
    } finally {
      endTimer();
      setIsAnalyzingSerp(false);
      setCurrentStep("input");
    }
  };

  // Combined Analysis: SERP + Keyword Analysis
  const handleFullAnalysis = async () => {
    if (!formData.focusKeyword.trim()) {
      toast({ title: "Fehler", description: "Bitte zuerst ein Fokus-Keyword eingeben", variant: "destructive" });
      return;
    }

    log('state', 'Vollständige Analyse gestartet', { keyword: formData.focusKeyword });

    // Run both analyses
    await handleAnalyzeSerp();
    await handleAnalyzeKeyword();

    log('state', 'Vollständige Analyse abgeschlossen', {
      serpAnalysis: !!serpAnalysis,
      keywordAnalysis: !!keywordAnalysis
    });
  };

  // Domain/Topic Learning Handler
  const handleAnalyzeDomain = async () => {
    if (!domainUrl.trim()) {
      toast({ title: "Fehler", description: "Bitte eine URL eingeben", variant: "destructive" });
      return;
    }

    setIsAnalyzingDomain(true);
    setDomainAnalysis(null);
    const endTimer = logWithTimer('api', 'Domain-Analyse');
    log('api', 'analyze-domain aufgerufen', { url: domainUrl, mode: 'topic' });

    try {
      const { data, error } = await supabase.functions.invoke("analyze-domain", {
        body: {
          url: domainUrl,
          mode: 'topic',
          depth: 'single',
        },
      });

      if (error) throw error;

      if (data.success) {
        log('response', 'Domain-Analyse erfolgreich', {
          pagesAnalyzed: data.pagesAnalyzed,
          hasContentContext: !!data.contentContext,
        });

        setDomainAnalysis(data);
        setShowDomainResults(true);
        setShowAdvanced(true);

        // Auto-add contentContext to additionalInfo
        if (data.contentContext) {
          setFormData(prev => ({
            ...prev,
            additionalInfo: prev.additionalInfo
              ? `${prev.additionalInfo}\n\n--- Themen-Kontext ---\n${data.contentContext}`
              : `--- Themen-Kontext ---\n${data.contentContext}`
          }));
          log('form', 'Themen-Kontext automatisch zu Zusatzinfos hinzugefügt');
        }

        toast({
          title: "Thema gelernt!",
          description: "Kontext wurde zu Zusatzinfos hinzugefügt"
        });
      } else {
        throw new Error(data.error || 'Analyse fehlgeschlagen');
      }
    } catch (error: any) {
      log('error', 'Domain-Analyse fehlgeschlagen', { error: String(error) });
      console.error("Domain analysis error:", error);
      toast({
        title: "Fehler",
        description: error.message || "Domain-Analyse fehlgeschlagen",
        variant: "destructive"
      });
    } finally {
      endTimer();
      setIsAnalyzingDomain(false);
    }
  };

  // Form change handler with logging
  const handleFormChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    log('form', `Feld geändert: ${field}`, {
      field,
      oldValue: formData[field],
      newValue: value
    });
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSuggestedKeyword = (keyword: string) => {
    if (!formData.secondaryKeywords.includes(keyword)) {
      setFormData({
        ...formData,
        secondaryKeywords: [...formData.secondaryKeywords, keyword],
      });
    }
  };

  const handleAddSuggestedQuestion = (question: string) => {
    if (!formData.wQuestions.includes(question)) {
      setFormData({
        ...formData,
        wQuestions: [...formData.wQuestions, question],
      });
    }
  };

  const handleAddAllSuggestedKeywords = () => {
    if (keywordAnalysis?.secondaryKeywords) {
      const newKeywords = keywordAnalysis.secondaryKeywords.filter(
        k => !formData.secondaryKeywords.includes(k)
      );
      setFormData({
        ...formData,
        secondaryKeywords: [...formData.secondaryKeywords, ...newKeywords],
      });
    }
  };

  const handleAddAllSuggestedQuestions = () => {
    if (keywordAnalysis?.wQuestions) {
      const newQuestions = keywordAnalysis.wQuestions.filter(
        q => !formData.wQuestions.includes(q)
      );
      setFormData({
        ...formData,
        wQuestions: [...formData.wQuestions, ...newQuestions],
      });
    }
  };

  // SERP-Analyse Handlers
  const handleSerpAddKeywords = (keywords: string[]) => {
    const newKeywords = keywords.filter(k => !formData.secondaryKeywords.includes(k));
    if (newKeywords.length > 0) {
      setFormData({
        ...formData,
        secondaryKeywords: [...formData.secondaryKeywords, ...newKeywords],
      });
      log('form', 'SERP-Keywords hinzugefügt', { count: newKeywords.length });
    }
  };

  const handleSerpAddQuestions = (questions: string[]) => {
    const newQuestions = questions.filter(q => !formData.wQuestions.includes(q));
    if (newQuestions.length > 0) {
      setFormData({
        ...formData,
        wQuestions: [...formData.wQuestions, ...newQuestions],
      });
      log('form', 'SERP-Fragen hinzugefügt', { count: newQuestions.length });
    }
  };

  const handleSerpContextReady = (context: string) => {
    setFormData({
      ...formData,
      serpContext: context,
    });
    log('form', 'SERP-Kontext übernommen', { length: context.length });
    setShowAdvanced(true); // Erweiterte Optionen öffnen
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
→ Jeden Satz ohne Mehrwert = LÖSCHEN!

✅ AEO (Answer Engine Optimization):
- Frage-H2? → Erster Satz = DIREKTE Antwort!
- Featured Snippet Format: 40-60 Wörter

📐 SKIMMABILITY:
- Alle 3 Absätze: Bullets / Tabelle / Fettung
- Variierte Satzlängen (Anti-KI-Monotonie)

TONALITÄT: ${formData.tone}`,

      'v8.1-sachlich': `[v8.1: Sachlich & Informativ]

STIL-VARIANTE: Sachlich & Informativ ⭐

- Faktenbasiert mit konkreten Details
- Klare Struktur, gut scannbar
- Nutze Listen wo sinnvoll
- Ruhiger, vertrauensbildender Ton
- Objektiv und informativ

Basiert auf V8-Grundprinzipien: Mensch + Google optimiert
TONALITÄT: ${formData.tone}`,

      'v8.2-aktivierend': `[v8.2: Nutzenorientiert & Aktivierend]

STIL-VARIANTE: Nutzenorientiert & Aktivierend

- Fokus auf Benefits und Problemlösung
- Direkte Ansprache, motivierend
- CTAs an passenden Stellen
- Zeige Transformation (vorher → nachher)
- Nutzenversprechen in Headlines

Basiert auf V8-Grundprinzipien: Mensch + Google optimiert
TONALITÄT: ${formData.tone}`,

      'v8.3-nahbar': `[v8.3: Nahbar & Authentisch]

STIL-VARIANTE: Nahbar & Authentisch

- Storytelling und Szenarien
- Persönliche, empathische Ansprache
- Praxisbeispiele aus dem Alltag
- Verbindend, auf Augenhöhe
- "Kennst du das?"-Einstiege

Basiert auf V8-Grundprinzipien: Mensch + Google optimiert
TONALITÄT: ${formData.tone}`,

      'v8-natural-seo': `[v8-natural-seo: Natural SEO - Basis]

Du bist SEO-Content-Stratege für Texte die bei Google UND Menschen funktionieren.

🎯 GRUNDPRINZIPIEN:
- Schreibe für MENSCHEN, optimiere für Google
- Keywords fließen organisch ein – niemals erzwungen
- Jeder Absatz hat Zweck und bietet Mehrwert

📊 KEYWORD-REGELN 2025:
- 0.5-1.5% Dichte (bei 800 Wörtern = 4-12x)
- H1, erster Absatz, mind. 1x H2, Schlussabsatz
- NIEMALS unnatürliche Wortstellungen
- Synonyme statt stumpfer Wiederholung

TONALITÄT: ${formData.tone}`,

      'v7-seo-content-master': `[v7-seo-content-master: SEO Content Master 2025]

Du bist Elite-SEO-Content-Stratege mit 15+ Jahren Erfahrung.
Basiert auf Google Quality Rater Guidelines 2025.

🎯 E-E-A-T IMPLEMENTATION:
- EXPERIENCE: Praxisbeispiele, "So funktioniert es"-Abschnitte
- EXPERTISE: Fachterminologie + verständliche Erklärungen
- AUTHORITATIVENESS: Quellen, Statistiken, Vertrauenssignale
- TRUSTWORTHINESS: Faktisch korrekt, keine Übertreibungen

📊 KEYWORD-STRATEGIE (KRITISCH):
- Fokus-Keyword: H1, Meta-Title, ersten 100 Wörtern, min. 1x H2, letzter Absatz
- KEYWORD-DICHTE: 0.5-1.5% (NICHT höher!) → Bei 800 Wörtern: 4-12x
- LSI-Keywords: Semantisch verwandte Begriffe natürlich einbauen
- Long-Tail: In W-Fragen und Zwischenüberschriften

📐 STRUKTUR:
- H1: Exakt 1x, max 60 Zeichen, mit Fokus-Keyword
- H2: Alle 200-400 Wörter
- Absätze: Max 3-4 Sätze pro Absatz
- Sätze: Variierte Länge, Flesch-Score 7-9

🚫 ANTI-PATTERNS:
❌ Keyword-Stuffing (>1.5%)
❌ Generische Einleitungen ("In diesem Artikel...")
❌ Überlange Absätze (>5 Sätze)
❌ AI-Monotonie (gleiche Satzanfänge)

✅ QUALITÄTSPRÜFUNG VOR OUTPUT:
- Fokus-Keyword korrekt platziert?
- Keyword-Dichte 0.5-1.5%?
- Meta-Title 30-60 Zeichen?
- E-E-A-T-Signale vorhanden?

TONALITÄT: ${formData.tone}`,

      'v9-master': `[v9-master: MASTER PROMPT 2025] ⭐ EMPFOHLEN

Du bist erfahrener SEO-Content-Stratege für Texte die bei Google UND Menschen funktionieren.

═══ FIXES GEGENÜBER V8 ═══
✅ tone → tonality Mapping (Frontend sendet "factual/advisory/sales")
✅ pageGoal Integration (inform/advise/preparePurchase/triggerPurchase)
✅ Compliance-Struktur (checkMDR + complianceChecks.mdr)
✅ Zielgruppen-spezifische Tiefe (B2B vs B2C)

═══ GRUNDPRINZIPIEN ═══
1. Schreibe für MENSCHEN, optimiere für Google
2. Keywords fließen organisch ein – niemals erzwungen
3. Jeder Absatz hat Zweck und bietet Mehrwert

═══ KEYWORD-STRATEGIE 2025 ═══
📍 PFLICHT-PLATZIERUNGEN:
- H1-Überschrift
- Erste 100 Wörter
- Mind. 1x H2
- Letzter Absatz
- Meta-Title + Description

📊 KEYWORD-DICHTE: 0.5-1.5%
- Bei ${formData.contentLength === 'short' ? '400' : formData.contentLength === 'long' ? '1200' : '800'} Wörtern = ${formData.contentLength === 'short' ? '2-6' : formData.contentLength === 'long' ? '6-18' : '4-12'}x
- NIEMALS unnatürliche Wortstellungen
- Synonyme + Variationen nutzen

═══ E-E-A-T KONKRET ═══
- Experience: "Kennst du das, wenn..." Szenarien
- Expertise: Konkrete Details, das "Warum" erklären
- Authority: Zahlen, Fakten, Zertifizierungen
- Trust: Ehrlich über Grenzen, keine Übertreibungen

═══ STRUKTUR ═══
1. H1 + Fokus-Keyword (nur 1x!)
2. Einstieg 80-150 Wörter (Hook + Keyword)
3. H2-Sektionen für Hauptthemen
4. H3 nur für echte Unterpunkte
5. Mind. 2-3 Bullet-Listen
6. <strong> für wichtige Begriffe
7. FAQ am Ende (5-8 W-Fragen)

═══ ANTI-PATTERNS (VERBOTEN!) ═══
❌ "In der heutigen Zeit..."
❌ "Es ist wichtig zu beachten..."
❌ "Zusammenfassend lässt sich sagen..."
❌ Keyword-Stuffing (>1.5%)
❌ Passive Formulierungen
❌ H1 → H3 Sprung (H2 fehlt)

═══ AKTUELLE KONFIGURATION ═══
TONALITÄT: ${formData.tone === 'sachlich' ? 'Sachlich & Informativ' : formData.tone === 'aktivierend' ? 'Aktivierend & Überzeugend' : 'Beratend & Nutzenorientiert'}
ANREDE: ${formData.formOfAddress === 'du' ? 'Du-Form' : formData.formOfAddress === 'sie' ? 'Sie-Form' : 'Neutral'}
ZIELGRUPPE: ${formData.targetAudience === 'physiotherapists' ? 'B2B (Fachpersonal)' : 'B2C (Endkunden)'}`,

      'v10-geo-optimized': `[v10-geo-optimized: GEO-OPTIMIZED 2026] 🚀 NEU

## ROLE
Du bist Senior Content Engineer für "Generative Engine Optimization" (GEO).
Ziel: Inhalte die (1) von Google AI Overviews zitiert werden und (2) echten Information Gain bieten.

## STRATEGISCHE PRINZIPIEN (2026)

1. ENTITY FIRST:
   Fokus-Keyword als Anker + semantisches Entitäts-Netz
   Thematische Vollständigkeit > starre Keyword-Dichten

2. ANSWER ENGINE READY (AEO):
   BLUF-Prinzip (Bottom Line Up Front)
   Zentrale Suchintention im ersten Absatz (max. 40 Wörter)

3. INFORMATION GAIN:
   Pro Sektion ein "Deep Insight" (spezifisches Szenario, 
   unerwartete Statistik, Experten-Kniff)

4. HUMAN SIGNATURE:
   Hohe Perplexität + Burstiness (variierende Satzlängen)
   KEINE KI-Standard-Einleitungen

## STRUKTUR-LOGIK

• H1: Intent-getriebene Headline (Problem + Lösung)
• LEAD: Direkte Antwort auf Suchanfrage (SGE-optimiert)
• BODY: Modularer Aufbau (jede H2 = eigenständiges Modul)
• VISUELLE ELEMENTE: Markdown-Tabellen + Checklisten
• FAQ: W-Fragen mit echtem Suchvolumen (People Also Ask)

## NEGATIVE CONSTRAINTS (VERBOTEN!)

❌ "In der Welt von heute"
❌ "Es ist wichtig zu verstehen"
❌ "Zusammenfassend"
❌ Passive Satzkonstruktionen
❌ Fluff (jeder Satz MUSS informieren oder überzeugen)

## BONUS-OUTPUT
✅ Valides JSON-LD FAQ-Schema am Ende generieren

═══ AKTUELLE KONFIGURATION ═══
TONALITÄT: ${formData.tone === 'sachlich' ? 'Sachlich' : formData.tone === 'aktivierend' ? 'Aktivierend' : 'Beratend'}
ANREDE: ${formData.formOfAddress === 'du' ? 'Du-Form' : formData.formOfAddress === 'sie' ? 'Sie-Form' : 'Neutral'}
ZIELGRUPPE: ${formData.targetAudience === 'physiotherapists' ? 'B2B (Fachpersonal)' : 'B2C (Endkunden)'}`,

      'v11-surfer-style': `[v11-surfer-style: SURFER-STYLE 2025] 🎯 NEU

Inspiriert von Surfer SEO / Clearscope - gewichtete Terms statt Keyword-Stuffing

═══ GRUNDPRINZIP ═══
• Terms werden nach WICHTIGKEIT gewichtet (nicht alle gleich)
• Long-Tail Keywords sind VARIATIONEN, nicht separate Pflicht-Keywords
• Information Gain aus SERP-Lücken, NICHTS ERFINDEN
• Content Score > reine Keyword-Dichte

═══ KEYWORD-STRATEGIE ═══

AGGREGATIONS-REGEL (KRITISCH!):
"Jako Trainingshose Herren" = 1 Erwähnung, NICHT 2!
Long-Tails zählen NICHT separat!

VARIATIONEN statt Wiederholung:
• "die Trainingshose" / "die Hose" / "das Modell"
• Synonyme wo passend
• Pronomen: "sie", "diese", "damit"

═══ INFORMATION GAIN (OHNE ERFINDUNG!) ═══

✅ ERLAUBT:
• "Jako bietet verschiedene Modelle und Serien"
• "Preise variieren je nach Modell"
• Allgemeine Materialeigenschaften
• Allgemeine Anwendungstipps

❌ VERBOTEN:
• Konkrete Preise (z.B. "29,99€")
• Unverifizierten Modellnamen
• Exakte technische Specs ohne Quelle

═══ ANTI-PATTERNS ═══

❌ "Kennst du das Gefühl, wenn..." → Max. 1x!
❌ "In der heutigen Zeit..."
❌ "Weit mehr als nur..."
❌ Mehr als max. Keywords
❌ Erfundene Fakten

═══ AKTUELLE KONFIGURATION ═══
TONALITÄT: ${formData.tone === 'sachlich' ? 'Sachlich' : formData.tone === 'aktivierend' ? 'Aktivierend' : 'Beratend'}
ANREDE: ${formData.formOfAddress === 'du' ? 'Du-Form' : formData.formOfAddress === 'sie' ? 'Sie-Form' : 'Neutral'}
ZIELGRUPPE: ${formData.targetAudience === 'physiotherapists' ? 'B2B (Fachpersonal)' : 'B2C (Endkunden)'}`,
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
    const lengthMap: Record<string, string> = {
      'short': '~400 Wörter',
      'medium': '~800 Wörter',
      'long': '~1200 Wörter'
    };

    let prompt = '=== GRUNDINFORMATIONEN ===\n';
    if (formData.brandName) prompt += `Marke: ${formData.brandName}\n`;
    if (formData.additionalInfo) prompt += `USPs/Zusatzinfos: ${formData.additionalInfo}\n`;

    prompt += '\n=== ZIELGRUPPE ===\n';
    prompt += `Audience: ${formData.targetAudience === 'endCustomers' ? 'B2C (Endkunden)' : 'B2B (Fachpersonal)'}\n`;
    prompt += `Anrede: ${formData.formOfAddress}\n`;
    prompt += `Tonalität: ${formData.tone}\n`;

    prompt += '\n=== SEO-STRUKTUR ===\n';
    prompt += `Fokus-Keyword: ${formData.focusKeyword || '(nicht gesetzt)'}\n`;
    if (formData.secondaryKeywords.length > 0) {
      prompt += `Sekundär-Keywords: ${formData.secondaryKeywords.join(', ')}\n`;
    }
    if (formData.wQuestions.length > 0) {
      prompt += `W-FRAGEN (müssen beantwortet werden):\n${formData.wQuestions.map(q => `  - ${q}`).join('\n')}\n`;
    }
    prompt += `Wortanzahl: ${lengthMap[formData.contentLength]}\n`;

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
    // Pre-validation check
    const validation = quickValidate(formData);
    if (!validation.canSubmit) {
      log('error', 'Validierung fehlgeschlagen', { 
        reason: validation.message, 
        details: validation.details 
      });
      toast({ 
        title: "Validierung fehlgeschlagen", 
        description: validation.details?.join(', ') || validation.message,
        variant: "destructive" 
      });
      return;
    }

    // Log validation warnings if any
    if (validation.details && validation.details.length > 0) {
      log('form', 'Validierungs-Warnungen', validation.details);
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
      pageGoal: formData.pageGoal,
      targetAudience: formData.targetAudience,
      formOfAddress: formData.formOfAddress,
      contentLength: formData.contentLength,
      tone: formData.tone,
      promptVersion: formData.promptVersion,
    });

    // Log SERP analysis status
    if (serpAnalysis) {
      log('state', 'SERP-Analyse verfügbar', {
        mustHaveTerms: serpAnalysis.serpTerms?.mustHave?.length || 0,
        shouldHaveTerms: serpAnalysis.serpTerms?.shouldHave?.length || 0,
        paaQuestions: serpAnalysis.questions?.peopleAlsoAsk?.length || 0,
        hasPromptContext: !!serpAnalysis.promptContext
      });
    } else {
      log('state', 'SERP-Analyse nicht durchgeführt', { hinweis: 'Für bessere Ergebnisse SERP-Analyse vor Generierung ausführen' });
    }

    const endTimer = logWithTimer('api', 'Content-Generierung');
    log('api', 'generate-seo-content aufgerufen', {
      promptVersion: formData.promptVersion,
      hasSerpContext: !!serpAnalysis?.promptContext,
      hinweis: 'System-Prompt definiert WIE die AI arbeitet, User-Prompt definiert WAS generiert wird'
    });

    // Build request body with optional SERP context
    const requestBody = {
      ...formData,
      // Include SERP context if available
      ...(serpAnalysis?.promptContext && { serpContext: serpAnalysis.promptContext }),
      ...(serpAnalysis?.serpTerms && { serpTerms: serpAnalysis.serpTerms }),
    };

    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: requestBody,
      });

      if (error) {
        log('error', 'generate-seo-content Fehler', { error: error.message });
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
        return;
      }

      log('response', 'generate-seo-content erfolgreich', {
        hasSeoText: !!data?.seoText,
        hasFaq: !!data?.faq
      });

      const content = data;

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
      
      // Automatisch in Datenbank speichern
      const projectId = await saveProjectToDatabase(content);
      if (projectId) {
        setSavedProjectId(projectId);
        toast({ title: "Erfolgreich", description: "SEO-Content wurde generiert und gespeichert" });
      } else {
        toast({ title: "Erfolgreich", description: "SEO-Content wurde generiert (nicht gespeichert)" });
      }
    } catch (error) {
      log('error', 'generate-seo-content Exception', { error: String(error) });
      console.error("Error:", error);
      toast({ title: "Fehler", description: "Ein unerwarteter Fehler ist aufgetreten", variant: "destructive" });
    } finally {
      endTimer();
      setIsLoading(false);
    }
  };

  // Auto-save project to database after successful generation
  const saveProjectToDatabase = async (content: GeneratedContent): Promise<string | null> => {
    if (!currentOrg || !session?.user) {
      log('state', 'Speichern übersprungen - keine Organisation', { hasOrg: !!currentOrg, hasUser: !!session?.user });
      return null;
    }

    try {
      log('api', 'Projekt speichern...', { org: currentOrg.name });
      
      const projectTitle = formData.focusKeyword || 'SEO Projekt';
      
      const { data, error } = await supabase.from('content_projects').insert([{
        organization_id: currentOrg.id,
        created_by: session.user.id,
        title: projectTitle,
        page_type: formData.pageType,
        focus_keyword: formData.focusKeyword,
        form_data: formData as any,
        generated_content: content as any,
        status: 'draft',
      }]).select('id').single();

      if (error) throw error;

      log('response', 'Projekt gespeichert', { id: data.id });
      return data.id;
    } catch (error) {
      log('error', 'Speichern fehlgeschlagen', { error: String(error) });
      console.error('Error saving project:', error);
      return null;
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

            {/* Simplified Input Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Content Basic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 1. Focus Keyword + Analysis Buttons */}
                <div>
                  <Label className="text-sm font-medium">Fokus-Keyword *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={formData.focusKeyword}
                      onChange={(e) => handleFormChange('focusKeyword', e.target.value)}
                      placeholder="z.B. Kinesiologie Tape"
                      className="flex-1"
                    />
                  </div>
                  {/* Analysis Buttons */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzeSerp}
                      disabled={isAnalyzingSerp || isAnalyzingKeyword || !formData.focusKeyword.trim()}
                      className="flex-1"
                    >
                      {isAnalyzingSerp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-1" />
                          SERP
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzeKeyword}
                      disabled={isAnalyzingKeyword || isAnalyzingSerp || !formData.focusKeyword.trim()}
                      className="flex-1"
                    >
                      {isAnalyzingKeyword ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Keywords
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    SERP = Google-Wettbewerberanalyse | Keywords = KI-Vorschläge
                  </p>

                  {/* SERP Analysis Results Badge */}
                  {serpAnalysis && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        SERP: {serpAnalysis.serpTerms?.mustHave?.length || 0} Must-Have
                      </Badge>
                      {serpAnalysis.questions?.peopleAlsoAsk?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {serpAnalysis.questions.peopleAlsoAsk.length} Fragen
                        </Badge>
                      )}
                    </div>
                  )}
                  {keywordAnalysis && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        KI: {keywordAnalysis.secondaryKeywords?.length || 0} Keywords
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Intent: {keywordAnalysis.searchIntent || 'n/a'}
                      </Badge>
                    </div>
                  )}
                  {domainAnalysis && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-600">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Thema gelernt
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Thema lernen (Domain-Analyse) */}
                <div className="p-3 border border-dashed rounded-lg bg-muted/30">
                  <Label className="text-xs font-medium flex items-center gap-1 mb-2">
                    <BookOpen className="h-3 w-3" />
                    Thema lernen (optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={domainUrl}
                      onChange={(e) => setDomainUrl(e.target.value)}
                      placeholder="URL einer Website zum Thema..."
                      className="flex-1 h-8 text-sm"
                      disabled={isAnalyzingDomain}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzeDomain}
                      disabled={isAnalyzingDomain || !domainUrl.trim()}
                      className="h-8"
                    >
                      {isAnalyzingDomain ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Analysiert eine Website um das Thema zu verstehen (z.B. Coaching, Medizinprodukte)
                  </p>
                </div>

                {/* SERP-Analyse (echte Google-Daten) */}
                <SerpAnalysisPanel
                  keyword={formData.focusKeyword}
                  onAddKeywords={handleSerpAddKeywords}
                  onAddWQuestions={handleSerpAddQuestions}
                  onSerpContextReady={handleSerpContextReady}
                  currentKeywords={formData.secondaryKeywords}
                  currentQuestions={formData.wQuestions}
                />

                {/* 2. Writing Style (Tone) */}
                <div>
                  <Label className="text-sm font-medium">Schreibstil</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {[
                      { value: "factual", label: "Sachlich", desc: "Faktenbasiert" },
                      { value: "advisory", label: "Beratend", desc: "Nutzenorientiert" },
                      { value: "sales", label: "Aktivierend", desc: "Überzeugend" },
                    ].map(({ value, label, desc }) => (
                      <label
                        key={value}
                        className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.tone === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          checked={formData.tone === value}
                          onChange={() => handleFormChange('tone', value as FormData['tone'])}
                        />
                        <span className="font-medium text-sm">{label}</span>
                        <span className="text-xs text-muted-foreground">{desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 3. Content Length */}
                <div>
                  <Label className="text-sm font-medium">Textlänge</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {[
                      { value: "short", label: "Kurz", desc: "~400 Wörter" },
                      { value: "medium", label: "Mittel", desc: "~800 Wörter" },
                      { value: "long", label: "Lang", desc: "~1200 Wörter" },
                    ].map(({ value, label, desc }) => (
                      <label
                        key={value}
                        className={`flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                          formData.contentLength === value
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          checked={formData.contentLength === value}
                          onChange={() => handleFormChange('contentLength', value as FormData['contentLength'])}
                        />
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">{desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. Target Audience */}
                <div>
                  <Label className="text-sm font-medium">Zielgruppe</Label>
                  <div className="flex gap-2 mt-1">
                    <label className={`flex-1 flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors ${
                      formData.targetAudience === "endCustomers" ? "border-primary bg-primary/10" : "hover:bg-muted"
                    }`}>
                      <input
                        type="radio"
                        className="sr-only"
                        checked={formData.targetAudience === "endCustomers"}
                        onChange={() => handleFormChange('targetAudience', 'endCustomers')}
                      />
                      <span className="font-medium text-sm">B2C</span>
                      <span className="text-xs text-muted-foreground">Endkunden</span>
                    </label>
                    <label className={`flex-1 flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors ${
                      formData.targetAudience === "physiotherapists" ? "border-primary bg-primary/10" : "hover:bg-muted"
                    }`}>
                      <input
                        type="radio"
                        className="sr-only"
                        checked={formData.targetAudience === "physiotherapists"}
                        onChange={() => handleFormChange('targetAudience', 'physiotherapists')}
                      />
                      <span className="font-medium text-sm">B2B</span>
                      <span className="text-xs text-muted-foreground">Fachpersonal</span>
                    </label>
                  </div>
                </div>

                {/* 5. Form of Address */}
                <div>
                  <Label className="text-sm font-medium">Anrede</Label>
                  <div className="flex gap-2 mt-1">
                    {(["du", "sie", "neutral"] as const).map((addr) => (
                      <label key={addr} className={`flex-1 flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors text-sm capitalize ${
                        formData.formOfAddress === addr ? "border-primary bg-primary/10" : "hover:bg-muted"
                      }`}>
                        <input
                          type="radio"
                          className="sr-only"
                          checked={formData.formOfAddress === addr}
                          onChange={() => handleFormChange('formOfAddress', addr)}
                        />
                        {addr === "neutral" ? "Neutral" : addr.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                {/* Prompt Version Selection */}
                <div className="flex gap-2 items-center">
                  <Select
                    value={formData.promptVersion}
                    onValueChange={(v) => handleFormChange('promptVersion', v)}
                  >
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v9-master">
                        <span className="flex items-center gap-2">
                          <span>⭐ v9: Master (Standard)</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="v11-surfer-style">
                        <span className="flex items-center gap-2">
                          <span>🎯 v11: Surfer-Style (NEU)</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="v10-geo-optimized">
                        <span className="flex items-center gap-2">
                          <span>🚀 v10: GEO-Optimized</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !formData.focusKeyword.trim()}
                    className="flex-1"
                    size="default"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generiere...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Content generieren
                      </>
                    )}
                  </Button>
                </div>

                {/* Advanced Options (Collapsible) */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full justify-center pt-2">
                    <Settings className="h-4 w-4" />
                    Erweiterte Optionen
                    {formData.serpContext && (
                      <Badge variant="secondary" className="text-xs">SERP</Badge>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4">
                    {/* SERP Analysis Results */}
                    {showSerpResults && serpAnalysis && (
                      <Card className="p-3 bg-green-500/5 border-green-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <Globe className="h-4 w-4 text-green-600" />
                            SERP-Analyse (Google Top 10)
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSerpResults(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Must-Have Terms */}
                        {serpAnalysis.serpTerms?.mustHave?.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                Pflicht-Begriffe
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {serpAnalysis.serpTerms.mustHave.map((term) => (
                                <Badge
                                  key={term}
                                  variant={formData.secondaryKeywords.includes(term) ? "secondary" : "outline"}
                                  className="text-xs cursor-pointer hover:bg-green-500/20 border-green-500/30"
                                  onClick={() => handleAddSuggestedKeyword(term)}
                                >
                                  {formData.secondaryKeywords.includes(term) ? (
                                    <Check className="h-3 w-3 mr-1" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 mr-1" />
                                  )}
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Should-Have Terms */}
                        {serpAnalysis.serpTerms?.shouldHave?.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs text-muted-foreground">Empfohlene Begriffe</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {serpAnalysis.serpTerms.shouldHave.slice(0, 8).map((term) => (
                                <Badge
                                  key={term}
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-primary/20"
                                  onClick={() => handleAddSuggestedKeyword(term)}
                                >
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* People Also Ask */}
                        {serpAnalysis.questions?.peopleAlsoAsk?.length > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">Häufige Fragen</span>
                            <div className="space-y-1 mt-1">
                              {serpAnalysis.questions.peopleAlsoAsk.slice(0, 5).map((q) => (
                                <div
                                  key={q}
                                  className={`text-xs p-1.5 rounded cursor-pointer flex items-center gap-1 ${
                                    formData.wQuestions.includes(q)
                                      ? 'bg-green-500/10 text-green-600'
                                      : 'bg-muted hover:bg-muted/80'
                                  }`}
                                  onClick={() => handleAddSuggestedQuestion(q)}
                                >
                                  {formData.wQuestions.includes(q) ? (
                                    <Check className="h-3 w-3 shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 shrink-0" />
                                  )}
                                  {q}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Competitor Titles */}
                        {serpAnalysis.competitors?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-green-500/20">
                            <span className="text-xs text-muted-foreground">Top 3 Wettbewerber</span>
                            <div className="space-y-1 mt-1">
                              {serpAnalysis.competitors.slice(0, 3).map((c, i) => (
                                <div key={i} className="text-xs text-muted-foreground truncate">
                                  {i + 1}. {c.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    )}

                    {/* Keyword Suggestions (if available) */}
                    {showKeywordSuggestions && keywordAnalysis && (
                      <Card className="p-3 bg-primary/5 border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Keyword-Vorschläge
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowKeywordSuggestions(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Search Intent Info */}
                        {keywordAnalysis.searchIntent && (
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                              Suchintention: {
                                keywordAnalysis.searchIntent === 'know' ? 'Informationssuche' :
                                keywordAnalysis.searchIntent === 'do' ? 'Transaktional' :
                                keywordAnalysis.searchIntent === 'buy' ? 'Kaufabsicht' : 'Navigation'
                              }
                            </Badge>
                          </div>
                        )}

                        {/* Secondary Keywords Suggestions */}
                        {keywordAnalysis.secondaryKeywords && keywordAnalysis.secondaryKeywords.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Sekundär-Keywords</span>
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                onClick={handleAddAllSuggestedKeywords}
                                className="h-auto p-0 text-xs"
                              >
                                Alle hinzufügen
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {keywordAnalysis.secondaryKeywords.map((kw) => (
                                <Badge
                                  key={kw}
                                  variant={formData.secondaryKeywords.includes(kw) ? "secondary" : "outline"}
                                  className="text-xs cursor-pointer hover:bg-primary/20"
                                  onClick={() => handleAddSuggestedKeyword(kw)}
                                >
                                  {formData.secondaryKeywords.includes(kw) ? (
                                    <Check className="h-3 w-3 mr-1" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 mr-1" />
                                  )}
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* W-Questions Suggestions */}
                        {keywordAnalysis.wQuestions && keywordAnalysis.wQuestions.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">W-Fragen</span>
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                onClick={handleAddAllSuggestedQuestions}
                                className="h-auto p-0 text-xs"
                              >
                                Alle hinzufügen
                              </Button>
                            </div>
                            <div className="space-y-1">
                              {keywordAnalysis.wQuestions.map((q) => (
                                <div
                                  key={q}
                                  className={`text-xs p-1.5 rounded cursor-pointer flex items-center gap-1 ${
                                    formData.wQuestions.includes(q)
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-muted hover:bg-muted/80'
                                  }`}
                                  onClick={() => handleAddSuggestedQuestion(q)}
                                >
                                  {formData.wQuestions.includes(q) ? (
                                    <Check className="h-3 w-3 shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 shrink-0" />
                                  )}
                                  {q}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    )}

                    {/* Domain Analysis Results */}
                    {showDomainResults && domainAnalysis && (
                      <Card className="p-3 bg-purple-500/5 border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <BookOpen className="h-4 w-4 text-purple-600" />
                            Thema gelernt
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDomainResults(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {domainAnalysis.analysis?.topicName && (
                          <div className="mb-2">
                            <span className="text-xs text-muted-foreground">Thema:</span>
                            <p className="text-sm font-medium">{domainAnalysis.analysis.topicName}</p>
                          </div>
                        )}

                        {domainAnalysis.analysis?.industry && (
                          <div className="mb-2">
                            <span className="text-xs text-muted-foreground">Branche:</span>
                            <p className="text-sm">{domainAnalysis.analysis.industry}</p>
                          </div>
                        )}

                        {domainAnalysis.analysis?.targetAudience?.demographics && (
                          <div className="mb-2">
                            <span className="text-xs text-muted-foreground">Zielgruppe:</span>
                            <p className="text-sm">{domainAnalysis.analysis.targetAudience.demographics}</p>
                          </div>
                        )}

                        {domainAnalysis.analysis?.toneRecommendation && (
                          <div className="mb-2">
                            <span className="text-xs text-muted-foreground">Empfohlene Tonalität:</span>
                            <p className="text-sm">{domainAnalysis.analysis.toneRecommendation}</p>
                          </div>
                        )}

                        <div className="mt-2 pt-2 border-t border-purple-500/20">
                          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Kontext in Zusatzinfos übernommen
                          </Badge>
                        </div>
                      </Card>
                    )}

                    {/* Secondary Keywords */}
                    <div>
                      <Label className="text-xs">Sekundär-Keywords</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                          placeholder="Keyword + Enter"
                          className="flex-1 h-9 text-sm"
                        />
                        <Button type="button" onClick={handleAddKeyword} variant="outline" size="icon" className="h-9 w-9">
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

                    {/* W-Questions (selected) */}
                    {formData.wQuestions.length > 0 && (
                      <div>
                        <Label className="text-xs">W-Fragen für FAQ</Label>
                        <div className="space-y-1 mt-1">
                          {formData.wQuestions.map((q) => (
                            <div key={q} className="flex items-center gap-1 text-xs bg-muted p-1.5 rounded">
                              <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <span className="flex-1">{q}</span>
                              <button onClick={() => handleRemoveWQuestion(q)} className="hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brand Name */}
                    <div>
                      <Label className="text-xs">Markenname</Label>
                      <Input
                        value={formData.brandName}
                        onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                        placeholder="z.B. K-Active, Musterfirma GmbH"
                        className="mt-1 h-9 text-sm"
                      />
                    </div>

                    {/* Additional Info */}
                    <div>
                      <Label className="text-xs">Zusatzinfos / USPs</Label>
                      <Textarea
                        value={formData.additionalInfo}
                        onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                        placeholder="Besonderheiten, Alleinstellungsmerkmale..."
                        rows={3}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Hint for other tools */}
                <div className="text-center pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Mehr Tools? <a href="/domain-learning" className="text-primary hover:underline">Wissensmanagement</a> | <a href="/seo-check" className="text-primary hover:underline">SEO-Check</a>
                  </p>
                </div>
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
                      <h3 className="font-semibold">Generiere SEO-Content...</h3>
                      <p className="text-sm text-muted-foreground">KI analysiert Eingaben und erstellt optimierten Text</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        ⏱️ Dies dauert ca. 15-25 Sekunden
                      </p>
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
                <>
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
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(getSeoTextHtml(generatedContent.seoText)) }} 
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
                </>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BasicVersion;
