import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useOrganization } from "@/hooks/useOrganization";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Target, 
  FileText, 
  Search, 
  Layout,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Star,
  Lightbulb,
  GraduationCap,
  Quote,
  ListChecks,
  Shield,
  Zap,
  Users,
  BarChart3,
  Link as LinkIcon,
  MessageSquare,
  Type,
  HelpCircle,
  Compass,
  ShoppingCart,
  MapPin,
  Brain,
  PenTool,
  Bold,
  List,
  AlignLeft,
  Eye,
  Sparkles,
  FileQuestion,
  Table,
  Hash,
  Gauge,
  ChevronRight
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Session } from "@supabase/supabase-js";

interface SEOTrainingProps {
  session: Session | null;
}

const SEOTraining = ({ session }: SEOTrainingProps) => {
  const [activeModule, setActiveModule] = useState("intro");
  const { currentOrg, organizations, userRole, switchOrganization } = useOrganization(session);

  const modules = [
    { id: "intro", label: "Einführung", icon: BookOpen, progress: 100 },
    { id: "search-intent", label: "Search Intent", icon: Compass, progress: 0 },
    { id: "keywords", label: "Keywords", icon: Search, progress: 0 },
    { id: "structure", label: "Textstruktur", icon: Layout, progress: 0 },
    { id: "headings", label: "H1-H6 Guide", icon: Type, progress: 0 },
    { id: "w-fragen", label: "W-Fragen", icon: HelpCircle, progress: 0 },
    { id: "writing", label: "Schreibstil", icon: PenTool, progress: 0 },
    { id: "formatting", label: "Formatierung", icon: Bold, progress: 0 },
    { id: "eeat", label: "E-E-A-T", icon: Shield, progress: 0 },
    { id: "helpful", label: "Helpful Content", icon: Users, progress: 0 },
    { id: "checklist", label: "Checkliste", icon: ListChecks, progress: 0 },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        currentOrg={currentOrg}
        organizations={organizations}
        onSwitchOrg={switchOrganization}
        userRole={userRole}
      />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">SEO-Content Schulung</h1>
                <p className="text-muted-foreground">Basierend auf Textschulung MK + Google Guidelines + Evergreen Media</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="flex items-center gap-1 bg-blue-500/10 border-blue-500/30 text-blue-600">
                <FileText className="h-3 w-3" /> Textschulung MK
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10 border-green-500/30 text-green-600">
                <Star className="h-3 w-3" /> Google E-E-A-T 2024/2025
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 bg-purple-500/10 border-purple-500/30 text-purple-600">
                <Quote className="h-3 w-3" /> John Mueller
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 bg-orange-500/10 border-orange-500/30 text-orange-600">
                <BookOpen className="h-3 w-3" /> Evergreen Media
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px,1fr] gap-6">
            {/* Module Navigation Sidebar */}
            <div className="space-y-2">
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Module</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 p-2">
                  {modules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <button
                        key={module.id}
                        onClick={() => setActiveModule(module.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                          activeModule === module.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{module.label}</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${activeModule === module.id ? "rotate-90" : ""}`} />
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
              {/* Modul 1: Einführung */}
              {activeModule === "intro" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Willkommen zur SEO-Content Schulung
                      </CardTitle>
                      <CardDescription>
                        Grundlagen für suchmaschinenoptimierte Texte, die auch Menschen begeistern
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-3">🎯 Ziel dieser Schulung</h3>
                        <p className="text-muted-foreground mb-4">
                          Sie lernen, wie Sie Texte erstellen, die sowohl für Suchmaschinen als auch für Menschen optimiert sind. 
                          Diese Schulung basiert auf der internen Textschulung MK und wurde mit den aktuellen Google Guidelines und 
                          Best Practices von Evergreen Media angereichert.
                        </p>
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="bg-background/80 p-4 rounded-lg text-center">
                            <div className="text-3xl font-bold text-primary">11</div>
                            <div className="text-sm text-muted-foreground">Module</div>
                          </div>
                          <div className="bg-background/80 p-4 rounded-lg text-center">
                            <div className="text-3xl font-bold text-primary">~45</div>
                            <div className="text-sm text-muted-foreground">Minuten</div>
                          </div>
                          <div className="bg-background/80 p-4 rounded-lg text-center">
                            <div className="text-3xl font-bold text-primary">∞</div>
                            <div className="text-sm text-muted-foreground">Praxis-Tipps</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">📚 Was Sie lernen werden:</h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {[
                            "Search Intent verstehen & nutzen (Know/Do/Buy/Go)",
                            "Keyword-Recherche & -Integration",
                            "Optimale Textstruktur & Absatzlängen",
                            "H1-H6 Überschriften-Hierarchie",
                            "W-Fragen Methodik für relevante Inhalte",
                            "Aktivform vs. Passivform",
                            "Lesbarkeit & Flesch-Index",
                            "Formatierung: Fett, Listen, Tabellen",
                            "E-E-A-T Framework meistern",
                            "Google Helpful Content Guidelines",
                          ].map((item, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <span className="text-sm">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-700">Wichtiger Hinweis</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              SEO-Texte sind keine "Keyword-Wüsten"! Der Fokus liegt auf <strong>Nutzerorientierung</strong>. 
                              Google wird immer besser darin, qualitativ hochwertige Inhalte zu erkennen. Schreiben Sie für Menschen, 
                              optimieren Sie für Maschinen.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Modul 2: Search Intent */}
              {activeModule === "search-intent" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Compass className="h-5 w-5 text-primary" />
                        Search Intent – Die Suchintention verstehen
                      </CardTitle>
                      <CardDescription>
                        <span className="flex items-center gap-1 text-primary">
                          <ExternalLink className="h-3 w-3" />
                          Quelle: Textschulung MK, Kapitel 2.1 + Google Search Quality Rater Guidelines
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-red-700">KRITISCH: Meist unterschätzter SEO-Faktor!</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Der Search Intent ist der wichtigste Faktor für erfolgreiche SEO-Texte. Wenn Ihr Text nicht zur 
                              Suchintention passt, wird er nicht ranken – egal wie gut er geschrieben ist!
                            </p>
                          </div>
                        </div>
                      </div>

                      <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground bg-muted/50 p-4 rounded-r-lg">
                        "Understanding the intent behind searches is critical. If you create content that doesn't match what users are actually looking for, you won't rank."
                        <span className="block text-xs mt-2 not-italic font-medium">— John Mueller, Google Search Advocate</span>
                      </blockquote>

                      <h3 className="text-lg font-semibold">Die 4 Search Intent Typen</h3>
                      
                      {/* Know Intent */}
                      <div className="border rounded-lg p-5 bg-gradient-to-r from-blue-500/5 to-transparent">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <Brain className="h-5 w-5 text-blue-500" />
                            <span className="text-blue-600">KNOW</span> – Informationssuche
                          </h4>
                          <Badge className="bg-blue-500">Informational Intent</Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Der Nutzer möchte etwas <strong>lernen oder verstehen</strong>. Er sucht nach Informationen, 
                          Erklärungen oder Antworten auf Fragen.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">🔍 Typische Suchanfragen:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• "Was ist [Begriff]?"</li>
                              <li>• "Wie funktioniert [Thema]?"</li>
                              <li>• "Warum [Phänomen]?"</li>
                              <li>• "[Thema] erklärt"</li>
                              <li>• "[Thema] Definition"</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">📝 Optimaler Content:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• Ratgeber-Artikel</li>
                              <li>• How-To Guides</li>
                              <li>• Erklärvideos</li>
                              <li>• FAQ-Seiten</li>
                              <li>• Lexikon-Einträge</li>
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                          <span className="text-sm font-medium">💡 Praxis-Tipp:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Beantworten Sie die Kernfrage direkt im ersten Absatz. Google extrahiert diese oft als Featured Snippet!
                          </span>
                        </div>
                      </div>

                      {/* Do Intent */}
                      <div className="border rounded-lg p-5 bg-gradient-to-r from-green-500/5 to-transparent">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-green-500" />
                            <span className="text-green-600">DO</span> – Handlungsabsicht
                          </h4>
                          <Badge className="bg-green-500">Transactional Intent</Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Der Nutzer möchte eine <strong>Aktion ausführen</strong> – etwas herunterladen, 
                          sich anmelden, ein Tool nutzen oder eine Dienstleistung in Anspruch nehmen.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">🔍 Typische Suchanfragen:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• "[Service] buchen"</li>
                              <li>• "[Tool] kostenlos testen"</li>
                              <li>• "[PDF] download"</li>
                              <li>• "Angebot anfordern [Thema]"</li>
                              <li>• "[Dienstleistung] Termin"</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">📝 Optimaler Content:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• Landing Pages mit klarem CTA</li>
                              <li>• Service-Seiten</li>
                              <li>• Kontaktformulare</li>
                              <li>• Download-Seiten</li>
                              <li>• Buchungsseiten</li>
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
                          <span className="text-sm font-medium">💡 Praxis-Tipp:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Platzieren Sie den Call-to-Action prominent und mehrfach. Reduzieren Sie Ablenkungen!
                          </span>
                        </div>
                      </div>

                      {/* Buy Intent */}
                      <div className="border rounded-lg p-5 bg-gradient-to-r from-amber-500/5 to-transparent">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-amber-500" />
                            <span className="text-amber-600">BUY</span> – Kaufabsicht
                          </h4>
                          <Badge className="bg-amber-500">Commercial Intent</Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Der Nutzer ist <strong>kaufbereit</strong> und sucht nach dem besten Produkt, 
                          Vergleichen oder Bewertungen vor der endgültigen Entscheidung.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">🔍 Typische Suchanfragen:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• "[Produkt] kaufen"</li>
                              <li>• "[Produkt] Test / Vergleich"</li>
                              <li>• "Bester [Produkt] 2024"</li>
                              <li>• "[Produkt A] vs [Produkt B]"</li>
                              <li>• "[Produkt] Erfahrungen"</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">📝 Optimaler Content:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• Produktseiten mit Details</li>
                              <li>• Vergleichstabellen</li>
                              <li>• Testberichte</li>
                              <li>• Kundenbewertungen</li>
                              <li>• Kategorieseiten</li>
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
                          <span className="text-sm font-medium">💡 Praxis-Tipp:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Liefern Sie alle kaufrelevanten Infos: Preise, Vorteile, Garantien, Versand, Bewertungen!
                          </span>
                        </div>
                      </div>

                      {/* Go Intent */}
                      <div className="border rounded-lg p-5 bg-gradient-to-r from-purple-500/5 to-transparent">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-purple-500" />
                            <span className="text-purple-600">GO</span> – Navigationsabsicht
                          </h4>
                          <Badge className="bg-purple-500">Navigational Intent</Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Der Nutzer sucht eine <strong>bestimmte Website oder Marke</strong>. 
                          Er weiß bereits, wohin er will.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">🔍 Typische Suchanfragen:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• "[Markenname]"</li>
                              <li>• "[Marke] Login"</li>
                              <li>• "[Marke] Kontakt"</li>
                              <li>• "[Marke] [Stadt]"</li>
                              <li>• "[Website] Support"</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2">📝 Optimaler Content:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• Optimierte Startseite</li>
                              <li>• Klare Navigation</li>
                              <li>• Kontaktseite</li>
                              <li>• Standortseiten (Local SEO)</li>
                              <li>• Google My Business</li>
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-purple-500/10 rounded-lg">
                          <span className="text-sm font-medium">💡 Praxis-Tipp:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Optimieren Sie Ihre Marken-Keywords und sorgen Sie für konsistente NAP-Daten (Name, Adresse, Phone)!
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          So ermitteln Sie den Search Intent:
                        </h4>
                        <ol className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                            <span>Googeln Sie Ihr Fokus-Keyword und analysieren Sie die Top-10-Ergebnisse</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
                            <span>Welche Content-Typen ranken? (Blog, Produktseite, Video, etc.)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">3</span>
                            <span>Welche Fragen werden in "People also ask" gestellt?</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">4</span>
                            <span>Passen Sie Ihren Content-Typ an den dominierenden Intent an!</span>
                          </li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Modul 3: Keywords */}
              {activeModule === "keywords" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Keyword-Strategie & Integration
                      </CardTitle>
                      <CardDescription>
                        <span className="flex items-center gap-1 text-primary">
                          <ExternalLink className="h-3 w-3" />
                          Quelle: Textschulung MK, Kapitel 3 + Evergreen Media Best Practices
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/5 to-transparent">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Fokus-Keyword
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Das Hauptkeyword, für das Sie ranken möchten. <strong>Ein Fokus-Keyword pro Seite!</strong>
                          </p>
                          <ul className="text-sm space-y-1">
                            <li>• Im Title Tag (vorne)</li>
                            <li>• In der H1 (einmal)</li>
                            <li>• In der Meta Description</li>
                            <li>• In der URL</li>
                            <li>• Im ersten Absatz</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-4 bg-gradient-to-br from-secondary/10 to-transparent">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-secondary-foreground" />
                            Sekundäre Keywords
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Verwandte Begriffe, Synonyme und LSI-Keywords für thematische Tiefe.
                          </p>
                          <ul className="text-sm space-y-1">
                            <li>• In H2-H6 Überschriften</li>
                            <li>• Natürlich im Fließtext</li>
                            <li>• In Bildunterschriften</li>
                            <li>• In Tabellen & Listen</li>
                            <li>• In FAQ-Bereichen</li>
                          </ul>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-primary" />
                          Keyword-Dichte (Density)
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Die Keyword-Dichte beschreibt, wie oft ein Keyword im Verhältnis zur Gesamtwortzahl vorkommt.
                        </p>
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-red-500/10 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">&lt;0.5%</div>
                            <div className="text-xs text-muted-foreground mt-1">Zu niedrig</div>
                            <div className="text-xs text-red-600">Keyword fehlt</div>
                          </div>
                          <div className="text-center p-3 bg-green-500/10 rounded-lg border-2 border-green-500/50">
                            <div className="text-2xl font-bold text-green-600">1-2%</div>
                            <div className="text-xs text-muted-foreground mt-1">Optimal</div>
                            <div className="text-xs text-green-600">Empfohlen!</div>
                          </div>
                          <div className="text-center p-3 bg-red-500/10 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">&gt;3%</div>
                            <div className="text-xs text-muted-foreground mt-1">Zu hoch</div>
                            <div className="text-xs text-red-600">Keyword-Stuffing!</div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
                          <span className="text-sm font-medium">⚠️ Wichtig:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Keyword-Dichte ist KEIN direkter Ranking-Faktor! Natürlichkeit geht vor Zahlen. 
                            Wenn das Keyword unnatürlich klingt, reduzieren Sie es.
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Keyword-Platzierungen (Priorität)
                        </h4>
                        <div className="space-y-2">
                          {[
                            { place: "Title Tag", importance: 95, note: "Fokus-KW möglichst vorne" },
                            { place: "H1-Überschrift", importance: 90, note: "Genau 1x das Fokus-KW" },
                            { place: "Meta Description", importance: 80, note: "Für CTR, nicht Ranking" },
                            { place: "URL / Slug", importance: 75, note: "Kurz, mit Fokus-KW" },
                            { place: "Erster Absatz (100 Wörter)", importance: 85, note: "Früh platzieren" },
                            { place: "H2-H4 Überschriften", importance: 70, note: "Variationen & Sekundär-KW" },
                            { place: "Bild Alt-Texte", importance: 60, note: "Beschreibend + KW" },
                            { place: "Fließtext", importance: 50, note: "Natürlich, 1-2% Dichte" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-40 text-sm font-medium">{item.place}</div>
                              <div className="flex-1">
                                <Progress value={item.importance} className="h-2" />
                              </div>
                              <div className="w-12 text-right text-sm font-medium">{item.importance}%</div>
                              <div className="w-48 text-xs text-muted-foreground">{item.note}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground bg-muted/50 p-4 rounded-r-lg">
                        "Stop thinking about keywords as individual terms. Think about topics and the questions users have."
                        <span className="block text-xs mt-2 not-italic font-medium">— Alexander Rus, Evergreen Media</span>
                      </blockquote>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Modul 4: Textstruktur */}
              {activeModule === "structure" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5 text-primary" />
                        Optimale Textstruktur
                      </CardTitle>
                      <CardDescription>
                        <span className="flex items-center gap-1 text-primary">
                          <ExternalLink className="h-3 w-3" />
                          Quelle: Textschulung MK, Kapitel 4 + SEO Best Practices
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-primary/5 p-4 rounded-lg border">
                        <h4 className="font-semibold mb-3">📐 Der ideale Aufbau eines SEO-Textes</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                            <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</div>
                            <div>
                              <h5 className="font-medium">H1 + Einleitung (Hook)</h5>
                              <p className="text-sm text-muted-foreground">
                                Fesselnder Einstieg mit Fokus-Keyword. Problem ansprechen, Lösung anteasern. Max. 100-150 Wörter.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                            <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</div>
                            <div>
                              <h5 className="font-medium">Inhaltsverzeichnis (optional, aber empfohlen)</h5>
                              <p className="text-sm text-muted-foreground">
                                Bei Texten über 1000 Wörtern. Verbessert UX und kann zu Jump-Links in den SERPs führen.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                            <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</div>
                            <div>
                              <h5 className="font-medium">Hauptinhalt (H2-H4 Abschnitte)</h5>
                              <p className="text-sm text-muted-foreground">
                                Logisch strukturiert mit klaren Überschriften. Jeder Abschnitt behandelt einen Aspekt. 
                                <strong> Absätze: max. 300 Wörter!</strong>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                            <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">4</div>
                            <div>
                              <h5 className="font-medium">FAQ-Bereich</h5>
                              <p className="text-sm text-muted-foreground">
                                Häufige Fragen beantworten. Nutzt W-Fragen. Ideal für Featured Snippets und "People Also Ask".
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                            <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">5</div>
                            <div>
                              <h5 className="font-medium">Fazit + Call-to-Action</h5>
                              <p className="text-sm text-muted-foreground">
                                Zusammenfassung der Key Points. Klare Handlungsaufforderung (CTA). Was soll der Leser als nächstes tun?
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Absatzlänge – RICHTIG
                          </h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <span><strong>Max. 300 Wörter</strong> pro Absatz</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <span><strong>3-5 Sätze</strong> pro Absatz optimal</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <span><strong>Ein Gedanke</strong> pro Absatz</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <span>Visuell <strong>luftig</strong> formatieren</span>
                            </li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                            <XCircle className="h-4 w-4" />
                            Absatzlänge – FALSCH
                          </h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              <span>Textwände ohne Struktur</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              <span>Absätze mit 500+ Wörtern</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              <span>Mehrere Themen in einem Absatz</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              <span>Fehlende Zwischenüberschriften</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Table className="h-4 w-4 text-primary" />
                          Empfohlene Textlängen nach Seitentyp
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 pr-4">Seitentyp</th>
                                <th className="text-left py-2 pr-4">Min. Wörter</th>
                                <th className="text-left py-2 pr-4">Optimal</th>
                                <th className="text-left py-2">Hinweis</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="py-2 pr-4 font-medium">Produktseite</td>
                                <td className="py-2 pr-4">300</td>
                                <td className="py-2 pr-4">500-800</td>
                                <td className="py-2 text-muted-foreground">+ technische Daten</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 pr-4 font-medium">Kategorieseite</td>
                                <td className="py-2 pr-4">200</td>
                                <td className="py-2 pr-4">300-500</td>
                                <td className="py-2 text-muted-foreground">Intro + Produktliste</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 pr-4 font-medium">Ratgeber / Blog</td>
                                <td className="py-2 pr-4">1000</td>
                                <td className="py-2 pr-4">1500-2500</td>
                                <td className="py-2 text-muted-foreground">Tiefe vor Länge!</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 pr-4 font-medium">Landing Page</td>
                                <td className="py-2 pr-4">500</td>
                                <td className="py-2 pr-4">800-1200</td>
                                <td className="py-2 text-muted-foreground">Conversion-fokussiert</td>
                              </tr>
                              <tr>
                                <td className="py-2 pr-4 font-medium">Pillar Page</td>
                                <td className="py-2 pr-4">2000</td>
                                <td className="py-2 pr-4">3000-5000</td>
                                <td className="py-2 text-muted-foreground">Hub für Topic Cluster</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Modul 5: H1-H6 Guide */}
              {activeModule === "headings" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5 text-primary" />
                        H1-H6 Überschriften-Hierarchie
                      </CardTitle>
                      <CardDescription>
                        <span className="flex items-center gap-1 text-primary">
                          <ExternalLink className="h-3 w-3" />
                          Quelle: Google Search Central + John Mueller Statements
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground bg-muted/50 p-4 rounded-r-lg">
                        "Headings help users navigate the page, and they help Google understand the structure of your content."
                        <span className="block text-xs mt-2 not-italic font-medium">— John Mueller, Google</span>
                      </blockquote>

                      <div className="space-y-4">
                        {/* H1 */}
                        <div className="border rounded-lg p-4 bg-gradient-to-r from-primary/10 to-transparent">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xl font-bold flex items-center gap-2">
                              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-sm">H1</span>
                              Hauptüberschrift
                            </h4>
                            <Badge className="bg-green-500">Ranking: SEHR HOCH</Badge>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4 mt-3">
                            <div>
                              <h5 className="font-medium text-sm mb-2">✅ Regeln:</h5>
                              <ul className="text-sm space-y-1">
                                <li>• <strong>Genau 1x pro Seite!</strong></li>
                                <li>• Fokus-Keyword enthalten</li>
                                <li>• Beschreibt den Hauptinhalt</li>
                                <li>• Nicht identisch mit Title Tag</li>
                                <li>• Max. 60-70 Zeichen</li>
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium text-sm mb-2">💡 Beispiel:</h5>
                              <div className="bg-background p-3 rounded text-sm font-mono">
                                &lt;h1&gt;Ergonomische Bürostühle für gesundes Arbeiten&lt;/h1&gt;
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* H2 */}
                        <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-500/10 to-transparent">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold flex items-center gap-2">
                              <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-sm">H2</span>
                              Hauptabschnitte
                            </h4>
                            <Badge className="bg-blue-500">Ranking: HOCH</Badge>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4 mt-3">
                            <div>
                              <h5 className="font-medium text-sm mb-2">✅ Regeln:</h5>
                              <ul className="text-sm space-y-1">
                                <li>• Mehrfach verwendbar</li>
                                <li>• Sekundäre Keywords / Variationen</li>
                                <li>• Strukturieren den Hauptinhalt</li>
                                <li>• Sollten scannbar sein</li>
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium text-sm mb-2">💡 Beispiele:</h5>
                              <div className="bg-background p-3 rounded text-sm font-mono space-y-1">
                                <div>&lt;h2&gt;Vorteile ergonomischer Stühle&lt;/h2&gt;</div>
                                <div>&lt;h2&gt;Die wichtigsten Einstellmöglichkeiten&lt;/h2&gt;</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* H3 */}
                        <div className="border rounded-lg p-4 bg-gradient-to-r from-green-500/10 to-transparent">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-base font-semibold flex items-center gap-2">
                              <span className="bg-green-500 text-white px-2 py-0.5 rounded text-sm">H3</span>
                              Unterabschnitte
                            </h4>
                            <Badge className="bg-green-500">Ranking: MITTEL</Badge>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4 mt-3">
                            <div>
                              <h5 className="font-medium text-sm mb-2">✅ Regeln:</h5>
                              <ul className="text-sm space-y-1">
                                <li>• Unterteilen H2-Abschnitte</li>
                                <li>• Long-Tail Keywords</li>
                                <li>• Spezifischere Themen</li>
                                <li>• Gut für FAQs</li>
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium text-sm mb-2">💡 Beispiele:</h5>
                              <div className="bg-background p-3 rounded text-sm font-mono space-y-1">
                                <div>&lt;h3&gt;Sitzhöhe richtig einstellen&lt;/h3&gt;</div>
                                <div>&lt;h3&gt;Lordosenstütze anpassen&lt;/h3&gt;</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* H4-H6 */}
                        <div className="border rounded-lg p-4 bg-gradient-to-r from-amber-500/10 to-transparent">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-base font-medium flex items-center gap-2">
                              <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-sm">H4-H6</span>
                              Feine Unterteilungen
                            </h4>
                            <Badge className="bg-amber-500">Ranking: NIEDRIG</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            H4-H6 werden selten benötigt und haben minimalen SEO-Einfluss. Nutzen Sie diese nur bei 
                            sehr komplexen, langen Inhalten für zusätzliche Struktur. Bei den meisten Texten reichen H1-H3 aus.
                          </p>
                        </div>
                      </div>

                      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          Häufige Fehler vermeiden:
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span><strong>Mehrere H1:</strong> Nur eine H1 pro Seite verwenden!</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span><strong>Hierarchie überspringen:</strong> Nicht von H2 direkt zu H4 springen</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span><strong>Nur für Styling:</strong> Headings nicht nur wegen Schriftgröße nutzen</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span><strong>Keyword-Stuffing:</strong> Keywords nicht unnatürlich in jede Überschrift</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3">📊 Ranking-Einfluss nach Heading-Level:</h4>
                        <div className="space-y-2">
                          {[
                            { level: "H1", value: 95, color: "bg-primary" },
                            { level: "H2", value: 75, color: "bg-blue-500" },
                            { level: "H3", value: 50, color: "bg-green-500" },
                            { level: "H4", value: 25, color: "bg-amber-500" },
                            { level: "H5-H6", value: 10, color: "bg-gray-400" },
                          ].map((item) => (
                            <div key={item.level} className="flex items-center gap-3">
                              <div className="w-16 text-sm font-medium">{item.level}</div>
                              <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                                <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                              </div>
                              <div className="w-12 text-right text-sm text-muted-foreground">{item.value}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Modul 6: W-Fragen */}
              {activeModule === "w-fragen" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        W-Fragen Methodik
                      </CardTitle>
                      <CardDescription>
                        <span className="flex items-center gap-1 text-primary">
                          <ExternalLink className="h-3 w-3" />
                          Quelle: Textschulung MK, Kapitel 5 + "People Also Ask" Optimierung
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-primary/5 p-4 rounded-lg border">
                        <h4 className="font-semibold mb-2">🎯 Warum W-Fragen so wichtig sind:</h4>
                        <p className="text-sm text-muted-foreground">
                          W-Fragen sind die Fragen, die Nutzer tatsächlich in Google eingeben. Sie zu beantworten 
                          erhöht die Chance auf <strong>Featured Snippets</strong> und Platzierungen in <strong>"People Also Ask"</strong>.
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { question: "WAS?", desc: "Definition, Erklärung", example: "Was ist ein ergonomischer Bürostuhl?", color: "blue" },
                          { question: "WIE?", desc: "Anleitung, Prozess", example: "Wie stelle ich meinen Bürostuhl richtig ein?", color: "green" },
                          { question: "WARUM?", desc: "Gründe, Ursachen", example: "Warum sind ergonomische Stühle wichtig?", color: "purple" },
                          { question: "WER?", desc: "Zielgruppe, Akteure", example: "Wer braucht einen ergonomischen Stuhl?", color: "amber" },
                          { question: "WANN?", desc: "Zeitpunkt, Frequenz", example: "Wann sollte man den Stuhl wechseln?", color: "red" },
                          { question: "WO?", desc: "Ort, Bezugsquelle", example: "Wo kauft man hochwertige Bürostühle?", color: "cyan" },
                          { question: "WELCHE?", desc: "Auswahl, Vergleich", example: "Welcher Bürostuhl ist der beste?", color: "pink" },
                          { question: "WOZU?", desc: "Zweck, Nutzen", example: "Wozu dient die Lordosenstütze?", color: "orange" },
                          { question: "WOMIT?", desc: "Mittel, Tools", example: "Womit reinigt man Bürostühle?", color: "teal" },
                        ].map((item) => (
                          <div key={item.question} className={`border rounded-lg p-4 bg-${item.color}-500/5`}>
                            <h5 className={`font-bold text-${item.color}-600 mb-1`}>{item.question}</h5>
                            <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                            <p className="text-sm italic">"{item.example}"</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          So nutzen Sie W-Fragen für Featured Snippets:
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">📝 Paragraph Snippet (40-60 Wörter)</h5>
                            <div className="bg-muted p-3 rounded text-sm">
                              <div className="font-medium mb-1">&lt;h2&gt;Was ist ein ergonomischer Bürostuhl?&lt;/h2&gt;</div>
                              <div className="text-muted-foreground">
                                &lt;p&gt;Ein ergonomischer Bürostuhl ist ein speziell designter Sitz, der sich an die 
                                natürliche Körperhaltung anpasst und Rückenschmerzen vorbeugt...&lt;/p&gt;
                              </div>
                            </div>
                          </div>
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-2">📋 List Snippet</h5>
                            <div className="bg-muted p-3 rounded text-sm">
                              <div className="font-medium mb-1">&lt;h2&gt;Wie stelle ich meinen Bürostuhl ein?&lt;/h2&gt;</div>
                              <div className="text-muted-foreground">
                                &lt;ol&gt;<br />
                                &lt;li&gt;Sitzhöhe anpassen&lt;/li&gt;<br />
                                &lt;li&gt;Sitztiefe einstellen&lt;/li&gt;<br />
                                &lt;li&gt;Armlehnen justieren&lt;/li&gt;...<br />
                                &lt;/ol&gt;
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3">🔍 Tools zur W-Fragen-Recherche:</h4>
                        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                          <li className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3" />
                            <span>Google "People Also Ask"</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3" />
                            <span>AnswerThePublic.com</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3" />
                            <span>AlsoAsked.com</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3" />
                            <span>Google Autocomplete</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3" />
                            <span>Semrush Keyword Magic Tool</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3" />
                            <span>Ahrefs Questions Report</span>
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Modul 7: Schreibstil */}
              {activeModule === "writing" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-primary" />
                        Schreibstil & Lesbarkeit
                      </CardTitle>
                      <CardDescription>
                        <span className="flex items-center gap-1 text-primary">
                          <ExternalLink className="h-3 w-3" />
                          Quelle: Textschulung MK, Kapitel 6 + Flesch Reading Ease
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Aktivform vs. Passivform */}
                      <div className="bg-gradient-to-r from-green-500/10 to-red-500/10 p-4 rounded-lg border">
                        <h4 className="font-semibold mb-4 text-center">⚡ Aktivform vs. Passivform</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="bg-green-500/10 p-4 rounded-lg">
                            <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> AKTIV (bevorzugt!)
                            </h5>
                            <ul className="text-sm space-y-2">
                              <li>"<strong>Wir liefern</strong> innerhalb von 24h"</li>
                              <li>"<strong>Der Stuhl unterstützt</strong> Ihren Rücken"</li>
                              <li>"<strong>Sie sparen</strong> Zeit und Geld"</li>
                              <li>"<strong>Unser Team berät</strong> Sie gerne"</li>
                            </ul>
                            <p className="text-xs text-muted-foreground mt-3">
                              ✓ Direkt, klar, dynamisch<br />
                              ✓ Besser lesbar<br />
                              ✓ Höheres Engagement
                            </p>
                          </div>
                          <div className="bg-red-500/10 p-4 rounded-lg">
                            <h5 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                              <XCircle className="h-4 w-4" /> PASSIV (vermeiden!)
                            </h5>
                            <ul className="text-sm space-y-2">
                              <li>"Es <strong>wird geliefert</strong> innerhalb von 24h"</li>
                              <li>"Der Rücken <strong>wird unterstützt</strong>"</li>
                              <li>"Zeit und Geld <strong>werden gespart</strong>"</li>
                              <li>"Sie <strong>werden beraten</strong>"</li>
                            </ul>
                            <p className="text-xs text-muted-foreground mt-3">
                              ✗ Umständlich, distanziert<br />
                              ✗ Schwerer zu lesen<br />
                              ✗ Weniger überzeugend
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-500/10 rounded-lg text-center">
                          <span className="text-sm font-medium">🎯 Ziel: Mindestens 80% Aktivsätze!</span>
                        </div>
                      </div>

                      {/* Satzlänge */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlignLeft className="h-4 w-4 text-primary" />
                          Optimale Satzlänge
                        </h4>
                        <div className="grid sm:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-green-500/10 rounded-lg border-2 border-green-500/50">
                            <div className="text-2xl font-bold text-green-600">15-20</div>
                            <div className="text-xs text-muted-foreground">Wörter</div>
                            <div className="text-xs text-green-600 mt-1">Optimal!</div>
                          </div>
                          <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                            <div className="text-2xl font-bold text-amber-600">21-25</div>
                            <div className="text-xs text-muted-foreground">Wörter</div>
                            <div className="text-xs text-amber-600 mt-1">Akzeptabel</div>
                          </div>
                          <div className="text-center p-3 bg-red-500/10 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">&gt;25</div>
                            <div className="text-xs text-muted-foreground">Wörter</div>
                            <div className="text-xs text-red-600 mt-1">Zu lang!</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          💡 <strong>Variieren Sie die Satzlängen!</strong> Ein Mix aus kurzen und mittleren Sätzen 
                          hält den Lesefluss interessant. Kurze Sätze betonen. Längere erklären.
                        </p>
                      </div>

                      {/* Flesch Reading Ease */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-primary" />
                          Flesch Reading Ease (Deutsch)
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Der Flesch-Index misst die Lesbarkeit. Für B2B-Content empfehlen wir einen Wert von 40-60.
                        </p>
                        <div className="space-y-2">
                          {[
                            { range: "0-30", level: "Sehr schwer", example: "Wissenschaftliche Texte", color: "bg-red-500" },
                            { range: "30-50", level: "Schwer", example: "Fachtexte, B2B", color: "bg-amber-500" },
                            { range: "50-60", level: "Mittelschwer", example: "Qualitätsjournalismus", color: "bg-green-500" },
                            { range: "60-70", level: "Normal", example: "B2C-Marketing", color: "bg-green-400" },
                            { range: "70-100", level: "Leicht", example: "Social Media, Werbung", color: "bg-blue-500" },
                          ].map((item) => (
                            <div key={item.range} className="flex items-center gap-3">
                              <div className="w-16 text-sm font-medium">{item.range}</div>
                              <div className={`w-3 h-3 rounded-full ${item.color}`} />
                              <div className="w-28 text-sm">{item.level}</div>
                              <div className="text-sm text-muted-foreground">{item.example}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Füllwörter */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          Füllwörter vermeiden
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Diese Wörter blähen Texte auf, ohne Mehrwert zu bieten. Streichen Sie sie konsequent:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "eigentlich", "gewissermaßen", "sozusagen", "quasi", "irgendwie", 
                            "praktisch", "im Grunde", "grundsätzlich", "durchaus", "ziemlich",
                            "relativ", "eher", "wohl", "eben", "halt", "ja", "doch", "mal",
                            "nun", "also", "nämlich", "jedenfalls", "übrigens"
                          ].map((word) => (
                            <Badge key={word} variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                              {word}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Ansprache */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">🤝 B2C: "Sie" oder "Du"</h5>
                          <p className="text-sm text-muted-foreground mb-2">
                            Für Endverbraucher. Konsistent bleiben! "Du" wirkt persönlicher, "Sie" professioneller.
                          </p>
                          <div className="text-xs bg-muted p-2 rounded">
                            "Entdecken <strong>Sie</strong> unsere Produkte" oder<br />
                            "Entdecke <strong>jetzt deine</strong> Lieblingsstücke"
                          </div>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h5 className="font-medium mb-2">🏢 B2B: Immer "Sie"</h5>
                          <p className="text-sm text-muted-foreground mb-2">
                            Geschäftskunden erwarten professionelle Ansprache. Respektvoll und seriös.
                          </p>
                          <div className="text-xs bg-muted p-2 rounded">
                            "Optimieren <strong>Sie Ihre</strong> Geschäftsprozesse"<br />
                            "Wir unterstützen <strong>Ihr Unternehmen</strong>"
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Modul 8: Formatierung */}
              {activeModule === "formatting" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bold className="h-5 w-5 text-primary" />
                        Formatierung für bessere Lesbarkeit
                      </CardTitle>
                      <CardDescription>
                        <span className="flex items-center gap-1 text-primary">
                          <ExternalLink className="h-3 w-3" />
                          Quelle: Textschulung MK, Kapitel 7 + UX Best Practices
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground bg-muted/50 p-4 rounded-r-lg">
                        "Users don't read web pages, they scan them."
                        <span className="block text-xs mt-2 not-italic font-medium">— Jakob Nielsen, Nielsen Norman Group</span>
                      </blockquote>

                      {/* Fettschrift */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Bold className="h-4 w-4 text-primary" />
                          Fettschrift (Strong)
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2 text-green-600">✅ Richtig einsetzen:</h5>
                            <ul className="text-sm space-y-1">
                              <li>• <strong>Keywords</strong> hervorheben (1-2x pro Absatz)</li>
                              <li>• <strong>Wichtige Zahlen</strong> und Fakten betonen</li>
                              <li>• <strong>Kernaussagen</strong> markieren</li>
                              <li>• <strong>USPs</strong> und Vorteile herausstellen</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm mb-2 text-red-600">❌ Fehler vermeiden:</h5>
                            <ul className="text-sm space-y-1">
                              <li>• Ganze Sätze fett formatieren</li>
                              <li>• Zu viel Fettschrift (max. 10% des Textes)</li>
                              <li>• Nur Keywords ohne Kontext</li>
                              <li>• Fett + Kursiv + Unterstrichen kombinieren</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Listen */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <List className="h-4 w-4 text-primary" />
                          Listen (Bullet Points & Nummerierungen)
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">• Ungeordnete Liste (ul):</h5>
                            <p className="text-sm text-muted-foreground mb-2">Für Aufzählungen ohne Reihenfolge</p>
                            <ul className="text-sm list-disc list-inside space-y-1">
                              <li>Ergonomische Form</li>
                              <li>Höhenverstellbar</li>
                              <li>Atmungsaktiv</li>
                            </ul>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">1. Geordnete Liste (ol):</h5>
                            <p className="text-sm text-muted-foreground mb-2">Für Schritte, Rankings, Prozesse</p>
                            <ol className="text-sm list-decimal list-inside space-y-1">
                              <li>Sitzhöhe einstellen</li>
                              <li>Sitztiefe anpassen</li>
                              <li>Rückenlehne justieren</li>
                            </ol>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
                          <span className="text-sm font-medium">💡 SEO-Tipp:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Listen erhöhen die Chance auf Featured Snippets! Google liebt strukturierte Informationen.
                          </span>
                        </div>
                      </div>

                      {/* Tabellen */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Table className="h-4 w-4 text-primary" />
                          Tabellen für Vergleiche
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Ideal für Produktvergleiche, technische Daten und Preisübersichten.
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border">
                            <thead className="bg-muted">
                              <tr>
                                <th className="border p-2 text-left">Merkmal</th>
                                <th className="border p-2 text-left">Basis</th>
                                <th className="border p-2 text-left">Premium</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border p-2">Höhenverstellung</td>
                                <td className="border p-2">✓</td>
                                <td className="border p-2">✓</td>
                              </tr>
                              <tr>
                                <td className="border p-2">Lordosenstütze</td>
                                <td className="border p-2">—</td>
                                <td className="border p-2">✓</td>
                              </tr>
                              <tr>
                                <td className="border p-2">Kopfstütze</td>
                                <td className="border p-2">—</td>
                                <td className="border p-2">✓</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Inhaltsverzeichnis */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          Inhaltsverzeichnis
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Bei Texten über <strong>1000 Wörtern</strong> unbedingt ein Inhaltsverzeichnis mit Sprungmarken einbauen!
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Vorteile:</h5>
                            <ul className="text-sm space-y-1">
                              <li>• Verbesserte User Experience</li>
                              <li>• Niedrigere Bounce Rate</li>
                              <li>• Kann zu Jump-Links in SERPs führen</li>
                              <li>• Struktur auf einen Blick</li>
                            </ul>
                          </div>
                          <div className="bg-muted p-3 rounded text-xs font-mono">
                            Inhaltsverzeichnis:<br />
                            1. <a href="#intro" className="text-primary">Einleitung</a><br />
                            2. <a href="#vorteile" className="text-primary">Vorteile</a><br />
                            3. <a href="#anwendung" className="text-primary">Anwendung</a><br />
                            4. <a href="#faq" className="text-primary">FAQ</a>
                          </div>
                        </div>
                      </div>

                      {/* Visuelle Elemente */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3">📸 Visuelle Elemente nicht vergessen:</h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="bg-background p-3 rounded-lg text-center">
                            <Eye className="h-6 w-6 mx-auto mb-2 text-primary" />
                            <div className="text-sm font-medium">Bilder</div>
                            <div className="text-xs text-muted-foreground">Mit Alt-Text!</div>
                          </div>
                          <div className="bg-background p-3 rounded-lg text-center">
                            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                            <div className="text-sm font-medium">Infografiken</div>
                            <div className="text-xs text-muted-foreground">Komplexe Daten</div>
                          </div>
                          <div className="bg-background p-3 rounded-lg text-center">
                            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
                            <div className="text-sm font-medium">Zitate</div>
                            <div className="text-xs text-muted-foreground">Experten, Kunden</div>
                          </div>
                          <div className="bg-background p-3 rounded-lg text-center">
                            <Lightbulb className="h-6 w-6 mx-auto mb-2 text-primary" />
                            <div className="text-sm font-medium">Callout-Boxen</div>
                            <div className="text-xs text-muted-foreground">Tipps, Warnungen</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Modul 9: E-E-A-T */}
              {activeModule === "eeat" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Google E-E-A-T Framework (2024/2025)
                      </CardTitle>
                      <CardDescription>
                        <a href="https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf" 
                           target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          Quelle: Google Search Quality Rater Guidelines
                        </a>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-muted-foreground">
                        E-E-A-T steht für <strong>Experience, Expertise, Authoritativeness, Trustworthiness</strong>. 
                        Diese vier Faktoren bestimmen, wie Google die Qualität Ihrer Inhalte bewertet.
                      </p>

                      {/* Experience */}
                      <div className="border rounded-lg p-5 bg-gradient-to-r from-blue-500/5 to-transparent">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="text-blue-500 text-2xl font-bold">E</span>xperience (Erfahrung)
                          </h3>
                          <Badge className="bg-blue-500">Wichtigkeit: HOCH</Badge>
                        </div>
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-muted-foreground mb-4">
                          "Does the content creator have first-hand experience with the topic?"
                          <span className="block text-xs mt-1 not-italic">— Google Quality Rater Guidelines</span>
                        </blockquote>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2 text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> So zeigen Sie Erfahrung:
                            </h4>
                            <ul className="text-sm space-y-1">
                              <li>• Eigene Praxisbeispiele einbauen</li>
                              <li>• Konkrete Anwendungsfälle beschreiben</li>
                              <li>• Aus der Perspektive eines Experten schreiben</li>
                              <li>• Authentische Einblicke geben</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2 text-red-600 flex items-center gap-1">
                              <XCircle className="h-4 w-4" /> Vermeiden:
                            </h4>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• Generische, austauschbare Aussagen</li>
                              <li>• Offensichtlich nur recherchiert</li>
                              <li>• Fehlende praktische Beispiele</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Expertise */}
                      <div className="border rounded-lg p-5 bg-gradient-to-r from-green-500/5 to-transparent">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="text-green-500 text-2xl font-bold">E</span>xpertise (Fachwissen)
                          </h3>
                          <Badge className="bg-green-500">Wichtigkeit: SEHR HOCH bei YMYL</Badge>
                        </div>
                        <blockquote className="border-l-4 border-green-500 pl-4 italic text-muted-foreground mb-4">
                          "Does the content creator have the necessary knowledge or skill?"
                          <span className="block text-xs mt-1 not-italic">— Google Quality Rater Guidelines</span>
                        </blockquote>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Korrekter Einsatz von Fachbegriffen</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Referenzen auf Studien, Standards, Normen</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Qualifikationen und Zertifizierungen erwähnen</span>
                          </li>
                        </ul>
                        <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
                          <span className="text-sm font-medium">⚠️ YMYL-Hinweis:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Bei "Your Money or Your Life"-Themen (Gesundheit, Finanzen, Recht) ist Expertise besonders kritisch!
                          </span>
                        </div>
                      </div>

                      {/* Authoritativeness */}
                      <div className="border rounded-lg p-5 bg-gradient-to-r from-purple-500/5 to-transparent">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="text-purple-500 text-2xl font-bold">A</span>uthoritativeness (Autorität)
                          </h3>
                          <Badge className="bg-purple-500">Wichtigkeit: MITTEL-HOCH</Badge>
                        </div>
                        <blockquote className="border-l-4 border-purple-500 pl-4 italic text-muted-foreground mb-4">
                          "Is the content creator or website known as a go-to source?"
                          <span className="block text-xs mt-1 not-italic">— Google Quality Rater Guidelines</span>
                        </blockquote>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                            <span>Positionierung als vertrauenswürdige Quelle</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                            <span>Auszeichnungen, Marktführerschaft, Erfahrung erwähnen</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                            <span>Backlinks von autoritativen Quellen aufbauen</span>
                          </li>
                        </ul>
                      </div>

                      {/* Trustworthiness */}
                      <div className="border rounded-lg p-5 bg-gradient-to-r from-red-500/5 to-transparent">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="text-red-500 text-2xl font-bold">T</span>rustworthiness (Vertrauen)
                          </h3>
                          <Badge className="bg-red-500">Wichtigkeit: KRITISCH ⚠️</Badge>
                        </div>
                        <blockquote className="border-l-4 border-red-500 pl-4 italic text-muted-foreground mb-4">
                          "Trust is the most important member of the E-E-A-T family."
                          <span className="block text-xs mt-1 not-italic">— Google Quality Rater Guidelines, Section 3.1</span>
                        </blockquote>
                        <div className="bg-red-500/10 p-3 rounded-lg mb-4">
                          <p className="text-sm font-medium text-red-700">
                            ⚠️ Trust ist der WICHTIGSTE E-E-A-T-Faktor laut Google!
                          </p>
                        </div>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span>Transparent und ehrlich kommunizieren</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span>Keine übertriebenen Versprechen</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span>Garantien, Zertifizierungen, Prüfsiegel zeigen</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span>Impressum, Datenschutz, Kontaktdaten vollständig</span>
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Modul 10: Helpful Content */}
              {activeModule === "helpful" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Google Helpful Content System
                      </CardTitle>
                      <CardDescription>
                        <a href="https://developers.google.com/search/docs/appearance/helpful-content-system" 
                           target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          Quelle: Google Search Central
                        </a>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-primary/5 p-4 rounded-lg border">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500" />
                          Das Kernprinzip: People-First Content
                        </h4>
                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                          "Ask yourself: Would someone visiting your page leave feeling they've learned enough 
                          about a topic to help achieve their goal?"
                          <span className="block text-xs mt-2 not-italic font-medium">— John Mueller, Google Search Advocate</span>
                        </blockquote>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-green-600 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            ✅ People-First Content
                          </h4>
                          <div className="space-y-2">
                            {[
                              "Fokus auf den echten Nutzen für Leser",
                              "Beantwortet Fragen vollständig",
                              "Bietet einzigartigen Mehrwert",
                              "Basiert auf echter Erfahrung",
                              "Leser fühlen sich zufrieden",
                              "Würde Leser empfehlen oder bookmarken",
                            ].map((item, i) => (
                              <div key={i} className="flex items-start gap-2 p-2 bg-green-500/10 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span className="text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold text-red-600 flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            ❌ Search-Engine-First Content
                          </h4>
                          <div className="space-y-2">
                            {[
                              "Primär für Rankings geschrieben",
                              "Zusammengefasst ohne eigene Perspektive",
                              "Künstlich aufgebläht ohne Mehrwert",
                              "Keyword-Stuffing & unnatürliche Formulierungen",
                              "Trendthemen ohne echte Expertise",
                              "Automatisiert ohne menschliche Qualitätsprüfung",
                            ].map((item, i) => (
                              <div key={i} className="flex items-start gap-2 p-2 bg-red-500/10 rounded-lg">
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                <span className="text-sm">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3">🔍 Selbst-Check: Ist mein Content "Helpful"?</h4>
                        <ol className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                            <span>Beantwortet der Content die Frage vollständig?</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
                            <span>Bietet er echten Mehrwert gegenüber existierenden Inhalten?</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">3</span>
                            <span>Würde ein Experte den Content als korrekt und hilfreich bestätigen?</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">4</span>
                            <span>Würde der Leser die Seite weiterempfehlen?</span>
                          </li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Modul 11: Checkliste */}
              {activeModule === "checklist" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-primary" />
                        SEO-Content Checkliste
                      </CardTitle>
                      <CardDescription>
                        Prüfen Sie jeden Text vor der Veröffentlichung
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-primary/5 p-4 rounded-lg border">
                        <p className="text-sm text-muted-foreground">
                          Diese Checkliste fasst alle wichtigen Punkte aus der Schulung zusammen. 
                          Nutzen Sie sie als Qualitätskontrolle vor jeder Veröffentlichung.
                        </p>
                      </div>

                      <Accordion type="multiple" className="space-y-2">
                        <AccordionItem value="suchintent" className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="flex items-center gap-2">
                              <Compass className="h-4 w-4 text-primary" />
                              Search Intent
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {[
                              "Search Intent analysiert (Know/Do/Buy/Go)",
                              "Content-Typ passt zum Intent",
                              "SERPs für Fokus-Keyword geprüft",
                            ].map((item, i) => (
                              <label key={i} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                                <span className="text-sm">{item}</span>
                              </label>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="keywords" className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="flex items-center gap-2">
                              <Search className="h-4 w-4 text-primary" />
                              Keywords
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {[
                              "Fokus-Keyword im Title Tag (vorne)",
                              "Fokus-Keyword in H1 (1x)",
                              "Fokus-Keyword in Meta Description",
                              "Fokus-Keyword in URL",
                              "Fokus-Keyword im ersten Absatz",
                              "Sekundäre Keywords in H2-H4",
                              "Keyword-Dichte: 1-2%",
                              "Natürliche Formulierungen",
                            ].map((item, i) => (
                              <label key={i} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                                <span className="text-sm">{item}</span>
                              </label>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="struktur" className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="flex items-center gap-2">
                              <Layout className="h-4 w-4 text-primary" />
                              Struktur
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {[
                              "Genau 1x H1",
                              "Logische H2-H4 Hierarchie",
                              "Keine Ebenen übersprungen",
                              "Absätze max. 300 Wörter",
                              "Inhaltsverzeichnis (bei >1000 Wörtern)",
                              "Einleitung fesselt den Leser",
                              "Fazit + Call-to-Action vorhanden",
                            ].map((item, i) => (
                              <label key={i} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                                <span className="text-sm">{item}</span>
                              </label>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="schreibstil" className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="flex items-center gap-2">
                              <PenTool className="h-4 w-4 text-primary" />
                              Schreibstil
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {[
                              "Überwiegend Aktivsätze (>80%)",
                              "Satzlänge 15-20 Wörter (Durchschnitt)",
                              "Füllwörter entfernt",
                              "Konsistente Ansprache (Du/Sie)",
                              "Flesch-Index geprüft (40-60 für B2B)",
                              "Fachbegriffe bei Bedarf erklärt",
                            ].map((item, i) => (
                              <label key={i} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                                <span className="text-sm">{item}</span>
                              </label>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="formatierung" className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="flex items-center gap-2">
                              <Bold className="h-4 w-4 text-primary" />
                              Formatierung
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {[
                              "Wichtige Begriffe fett markiert",
                              "Bullet Points / Listen verwendet",
                              "Tabellen für Vergleiche",
                              "Bilder mit Alt-Text",
                              "Visuell aufgelockert",
                              "Mobile-friendly",
                            ].map((item, i) => (
                              <label key={i} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                                <span className="text-sm">{item}</span>
                              </label>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="eeat" className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              E-E-A-T
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {[
                              "Praxiserfahrung erkennbar",
                              "Fachwissen demonstriert",
                              "Autorität / Referenzen genannt",
                              "Vertrauenswürdig & transparent",
                              "Keine übertriebenen Versprechen",
                              "Quellen angegeben (bei Bedarf)",
                            ].map((item, i) => (
                              <label key={i} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                                <span className="text-sm">{item}</span>
                              </label>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="meta" className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              Meta-Daten
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {[
                              "Title Tag: 50-60 Zeichen",
                              "Meta Description: 150-160 Zeichen",
                              "URL kurz & keyword-relevant",
                              "Alt-Texte für alle Bilder",
                              "Schema Markup (bei Bedarf)",
                            ].map((item, i) => (
                              <label key={i} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                                <span className="text-sm">{item}</span>
                              </label>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="h-5 w-5" />
                          Bereit zur Veröffentlichung?
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Wenn Sie alle relevanten Punkte abgehakt haben, ist Ihr Text bereit für die Veröffentlichung. 
                          Denken Sie daran: <strong>Qualität vor Quantität</strong> – lieber einen perfekten Text als zehn mittelmäßige!
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SEOTraining;