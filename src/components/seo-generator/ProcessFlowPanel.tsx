import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  Globe, 
  FileText, 
  Wand2, 
  CheckCircle2, 
  ArrowRight,
  Code,
  Zap,
  Database,
  Bot
} from "lucide-react";
import { useState } from "react";

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "active" | "completed";
  details: {
    whatHappens: string;
    endpoint?: string;
    prompt?: string;
    inputs?: string[];
    outputs?: string[];
  };
}

interface ProcessFlowPanelProps {
  currentStep?: string;
  formData?: {
    focusKeyword?: string;
    pageType?: string;
    targetAudience?: string;
    contentLength?: string;
    tone?: string;
    manufacturerWebsite?: string;
    promptVersion?: string;
  };
}

export const ProcessFlowPanel = ({ currentStep, formData }: ProcessFlowPanelProps) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const steps: ProcessStep[] = [
    {
      id: "input",
      title: "1. Eingabe",
      description: "Formulardaten werden erfasst",
      icon: <FileText className="h-5 w-5" />,
      status: currentStep === "input" ? "active" : formData?.focusKeyword ? "completed" : "pending",
      details: {
        whatHappens: "Das Formular sammelt alle SEO-relevanten Informationen: Keyword, Zielgruppe, Tonalität, etc.",
        inputs: [
          formData?.focusKeyword ? `Fokus-Keyword: "${formData.focusKeyword}"` : "Fokus-Keyword: (leer)",
          `Seitentyp: ${formData?.pageType === "product" ? "Produkt" : "Kategorie"}`,
          `Zielgruppe: ${formData?.targetAudience === "endCustomers" ? "B2C" : "B2B"}`,
          `Textlänge: ${formData?.contentLength || "mittel"}`,
          `Tonalität: ${formData?.tone || "beratend"}`,
        ],
        outputs: ["Validierte Formulardaten als JSON-Objekt"],
      },
    },
    {
      id: "scrape",
      title: "2. Website-Analyse (optional)",
      description: "Firecrawl extrahiert Content",
      icon: <Globe className="h-5 w-5" />,
      status: formData?.manufacturerWebsite ? "completed" : "pending",
      details: {
        whatHappens: "Wenn eine Hersteller-Website angegeben wird, analysiert Firecrawl die Seite und extrahiert relevante Informationen.",
        endpoint: "supabase/functions/scrape-website",
        inputs: [
          formData?.manufacturerWebsite ? `URL: ${formData.manufacturerWebsite}` : "Keine URL angegeben",
          "Modus: single (eine Seite) oder multi (bis zu 50 Seiten)",
        ],
        outputs: [
          "Seitentitel & Meta-Description",
          "Markdown-Content der Seite",
          "KI-Analyse: Unternehmensname, Branche, USPs, Zielgruppe",
        ],
        prompt: `[Firecrawl API]
POST https://api.firecrawl.dev/v1/scrape
{
  "url": "${formData?.manufacturerWebsite || "https://example.com"}",
  "formats": ["markdown", "html"],
  "onlyMainContent": true
}

→ Anschließend KI-Analyse:
"Analysiere diesen Website-Content und extrahiere:
- Unternehmensname
- Branche
- Zielgruppe
- Hauptprodukte
- USPs
- Brand Voice"`,
      },
    },
    {
      id: "prompt-build",
      title: "3. Prompt-Konstruktion",
      description: "System- & User-Prompt werden gebaut",
      icon: <Code className="h-5 w-5" />,
      status: currentStep === "generating" ? "active" : "pending",
      details: {
        whatHappens: "Das Backend kombiniert den ausgewählten System-Prompt (v1-v5) mit den Formulardaten zu einem strukturierten User-Prompt.",
        endpoint: "supabase/functions/generate-seo-content",
        inputs: [
          `Prompt-Version: ${formData?.promptVersion || "v1-kompakt-seo"}`,
          "Alle Formulardaten (Keywords, Zielgruppe, Tonalität, etc.)",
          "Optionale Briefing-Dokumente",
        ],
        outputs: [
          "System-Prompt mit SEO-Regeln",
          "User-Prompt mit konkreten Anforderungen",
        ],
        prompt: getSystemPromptPreview(formData?.promptVersion || "v1-kompakt-seo"),
      },
    },
    {
      id: "generate",
      title: "4. Content-Generierung",
      description: "Gemini 2.5 Pro erzeugt 3 Varianten",
      icon: <Bot className="h-5 w-5" />,
      status: currentStep === "generating" ? "active" : "pending",
      details: {
        whatHappens: "Die KI generiert parallel 3 verschiedene Content-Varianten mit unterschiedlichen strategischen Ansätzen.",
        endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
        inputs: [
          "System-Prompt (SEO-Regeln)",
          "User-Prompt (Anforderungen)",
          "Varianten-Instruktionen (A/B/C)",
        ],
        outputs: [
          "Variante A: Strukturiert & Umfassend",
          "Variante B: Nutzenorientiert & Überzeugend",
          "Variante C: Emotional & Authentisch",
        ],
        prompt: `[Lovable AI Gateway]
Model: google/gemini-2.5-pro
Temperature: 0.55

Für jede Variante:
{
  "messages": [
    { "role": "system", "content": "[System-Prompt mit SEO-Regeln]" },
    { "role": "user", "content": "[Varianten-Stil-Instruktion] + [User-Prompt]" }
  ]
}

→ Parallel ausgeführt für alle 3 Varianten
→ JSON-Response wird geparst`,
      },
    },
    {
      id: "parse",
      title: "5. Parsing & Validierung",
      description: "JSON wird extrahiert und geprüft",
      icon: <Zap className="h-5 w-5" />,
      status: currentStep === "generating" ? "active" : "pending",
      details: {
        whatHappens: "Die KI-Antwort wird als JSON geparst und auf Vollständigkeit geprüft (seoText, FAQ, Meta-Daten, etc.).",
        inputs: ["Rohe KI-Antwort (Text mit JSON)"],
        outputs: [
          "seoText (HTML-formatiert)",
          "faq (Array mit Fragen/Antworten)",
          "title (max 60 Zeichen)",
          "metaDescription (max 155 Zeichen)",
          "internalLinks (Link-Empfehlungen)",
          "qualityReport (Compliance-Check)",
          "guidelineValidation (E-E-A-T Score)",
        ],
        prompt: `[JSON-Struktur der Ausgabe]
{
  "seoText": "<h1>...</h1><p>...</p>...",
  "faq": [
    { "question": "...", "answer": "..." }
  ],
  "title": "...",
  "metaDescription": "...",
  "internalLinks": [
    { "url": "...", "anchorText": "..." }
  ],
  "qualityReport": {
    "status": "green|yellow|red",
    "flags": [...]
  },
  "guidelineValidation": {
    "overallScore": 85,
    "googleEEAT": {...}
  }
}`,
      },
    },
    {
      id: "display",
      title: "6. Anzeige & Export",
      description: "Content wird dargestellt",
      icon: <CheckCircle2 className="h-5 w-5" />,
      status: "pending",
      details: {
        whatHappens: "Der generierte Content wird in Tabs aufgeteilt angezeigt (Text, FAQ, Meta, Links, Guidelines, Quality Check). Export als HTML möglich.",
        inputs: ["Geparste JSON-Daten"],
        outputs: [
          "SEO-Text mit formatierter Darstellung",
          "FAQ-Bereich",
          "Meta-Tags (Title, Description)",
          "Interne Link-Empfehlungen",
          "Guideline-Validierung (E-E-A-T)",
          "Compliance-Check (MDR, HWG)",
        ],
      },
    },
  ];

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Prozess-Übersicht: Was passiert wann?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step, index) => (
          <Collapsible
            key={step.id}
            open={expandedStep === step.id}
            onOpenChange={(open) => setExpandedStep(open ? step.id : null)}
          >
            <CollapsibleTrigger className="w-full">
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                step.status === "active" 
                  ? "bg-primary/20 border border-primary" 
                  : step.status === "completed"
                  ? "bg-success/10 border border-success/30"
                  : "bg-muted/50 hover:bg-muted"
              }`}>
                <div className={`p-2 rounded-full ${
                  step.status === "active" 
                    ? "bg-primary text-primary-foreground" 
                    : step.status === "completed"
                    ? "bg-success text-success-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground"
                }`}>
                  {step.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{step.title}</span>
                    {step.status === "completed" && (
                      <Badge variant="outline" className="text-xs bg-success/10 border-success/30 text-success">
                        ✓
                      </Badge>
                    )}
                    {step.status === "active" && (
                      <Badge variant="outline" className="text-xs bg-primary/20 border-primary animate-pulse">
                        Aktiv
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${
                  expandedStep === step.id ? "rotate-180" : ""
                }`} />
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="ml-12 mt-2 p-4 bg-background rounded-lg border space-y-3">
                <div>
                  <h5 className="font-medium text-sm text-foreground mb-1">Was passiert?</h5>
                  <p className="text-sm text-muted-foreground">{step.details.whatHappens}</p>
                </div>

                {step.details.endpoint && (
                  <div>
                    <h5 className="font-medium text-sm text-foreground mb-1">Endpoint</h5>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{step.details.endpoint}</code>
                  </div>
                )}

                {step.details.inputs && step.details.inputs.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm text-foreground mb-1">Eingaben</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {step.details.inputs.map((input, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ArrowRight className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                          <span>{input}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.details.outputs && step.details.outputs.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm text-foreground mb-1">Ausgaben</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {step.details.outputs.map((output, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-success flex-shrink-0" />
                          <span>{output}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.details.prompt && (
                  <div>
                    <h5 className="font-medium text-sm text-foreground mb-1">Prompt / API-Call</h5>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {step.details.prompt}
                    </pre>
                  </div>
                )}
              </div>
            </CollapsibleContent>

            {index < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="w-px h-4 bg-border" />
              </div>
            )}
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
};

function getSystemPromptPreview(version: string): string {
  const prompts: Record<string, string> = {
    "v1-kompakt-seo": `[v1-kompakt-seo: Technisch präzise]

Du bist erfahrener SEO-Texter nach Google-Standards 2024/2025.

TOP 10 KRITISCHE SEO-FAKTOREN:
1. FOKUS-KEYWORD in H1 und ersten 100 Wörtern
2. NUR EINE H1, max 60-70 Zeichen
3. Max 300 Wörter pro Absatz
4. E-E-A-T Signale (Experience, Expertise...)
5. People-First Content
6. Heading-Hierarchie H1→H2→H3
7. Aktive Sprache (max 15% Passiv)
8. FAQ mit 5-8 W-Fragen
...

AUSGABE: JSON mit seoText, faq, title, metaDescription...`,

    "v2-marketing-first": `[v2-marketing-first: Emotion > Technik]

Du bist kreativer Marketing-Texter mit SEO-Kenntnissen.
Priorität: BEGEISTERN, dann optimieren.

MARKETING-FIRST PRINZIPIEN:
1. HOOK: Emotionaler Aufhänger
2. STORYTELLING: Geschichten, Szenarien
3. NUTZEN-SPRACHE: "Du bekommst/profitierst"
4. POWER-WORDS: revolutionär, bewährt...
5. CONVERSATIONAL TONE: Authentisch
...`,

    "v3-hybrid-intelligent": `[v3-hybrid-intelligent: Balance]

Du bist intelligenter Content-Stratege.
SEO-Technik + kreatives Schreiben vereint.

STUFE 1 - SEO-Basis:
- Fokus-Keyword in H1 und Intro
- Klare Struktur H2/H3

STUFE 2 - Kreative Schicht:
- Bildhafte Sprache
- Storytelling-Elemente
...`,

    "v4-minimal-kreativ": `[v4-minimal-kreativ: Weniger Regeln]

Du bist kreativer Texter.
SEO ist Rahmen, nicht Käfig.

KREATIVITÄTS-PRINZIPIEN:
1. Überrasche den Leser
2. Schreibe wie ein Mensch
3. Nutze unerwartete Metaphern
...`,

    "v5-ai-meta-optimiert": `[v5-ai-meta-optimiert: Self-Improving]

Du bist KI-optimierter Content-Stratege.
Reflektiere deine eigene Ausgabe.

META-OPTIMIERUNG:
- Analysiere den generierten Text
- Identifiziere Schwächen
- Verbessere iterativ
...`,

    "v6-quality-auditor": `[v6-quality-auditor: Anti-Fluff + AEO]

Du bist "Senior SEO Editor & Quality Auditor".

ANTI-FLUFF BLACKLIST (VERBOTEN!):
- "In der heutigen digitalen Welt..."
- "Es ist wichtig zu beachten..."
- "Zusammenfassend lässt sich sagen..."
- Jeder Satz ohne Mehrwert = LÖSCHEN!

AEO (Answer Engine Optimization):
- Frage-H2? → Erster Satz = DIREKTE Antwort!
- Featured Snippet Format: 40-60 Wörter

SKIMMABILITY:
- Alle 3 Absätze: Bullet Points / Tabelle / Fettung
- Variierte Satzlängen (Anti-KI-Monotonie)
...`,
  };

  return prompts[version] || prompts["v1-kompakt-seo"];
}
