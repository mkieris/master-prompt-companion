import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BeforeAfter } from "@/components/training/BeforeAfter";
import { InteractiveExercise } from "@/components/training/InteractiveExercise";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { ModuleProgress } from "@/components/training/ModuleProgress";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  BookOpen, Search, Layout, CheckCircle2, AlertTriangle, ExternalLink,
  Star, Lightbulb, GraduationCap, Quote, ListChecks, Shield, Zap, Users,
  Type, HelpCircle, Compass, ShoppingCart, MapPin, Brain, PenTool, Bold,
  ArrowRight, Trophy, Target, ChevronRight, Copy, Eye
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface SEOTrainingProps {
  session: Session | null;
}

const SEOTraining = ({ session }: SEOTrainingProps) => {
  const [activeModule, setActiveModule] = useState("intro");
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("seo-training-progress");
    if (saved) {
      setCompletedModules(JSON.parse(saved));
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem("seo-training-progress", JSON.stringify(completedModules));
  }, [completedModules]);

  const markModuleComplete = (moduleId: string) => {
    if (!completedModules.includes(moduleId)) {
      setCompletedModules([...completedModules, moduleId]);
    }
  };

  const goToNextModule = () => {
    const currentIndex = modules.findIndex(m => m.id === activeModule);
    if (currentIndex < modules.length - 1) {
      markModuleComplete(activeModule);
      setActiveModule(modules[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const modules = [
    { id: "intro", label: "Einführung", icon: BookOpen },
    { id: "search-intent", label: "Search Intent", icon: Compass },
    { id: "keywords", label: "Keywords", icon: Search },
    { id: "structure", label: "Textstruktur", icon: Layout },
    { id: "headings", label: "H1-H6 Guide", icon: Type },
    { id: "w-fragen", label: "W-Fragen", icon: HelpCircle },
    { id: "writing", label: "Schreibstil", icon: PenTool },
    { id: "formatting", label: "Formatierung", icon: Bold },
    { id: "eeat", label: "E-E-A-T", icon: Shield },
    { id: "helpful", label: "Helpful Content", icon: Users },
    { id: "checklist", label: "Checkliste", icon: ListChecks },
  ];

  const overallProgress = Math.round((completedModules.length / modules.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">SEO-Content Schulung</h1>
            <p className="text-muted-foreground">Interaktives Training mit Quizzen, Übungen & Best Practices</p>
          </div>
          {overallProgress === 100 && (
            <Badge className="bg-amber-500 text-white gap-1">
              <Trophy className="h-3 w-3" />
              Abgeschlossen!
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-600">
            Textschulung MK
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-600">
            Google E-E-A-T 2024/2025
          </Badge>
          <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-600">
            John Mueller
          </Badge>
          <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-600">
            Evergreen Media
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px,1fr] gap-6">
        {/* Module Navigation */}
        <ModuleProgress
          modules={modules}
          activeModule={activeModule}
          completedModules={completedModules}
          onModuleClick={setActiveModule}
        />

        {/* Content Area */}
        <div className="space-y-6">
          {/* MODUL 1: Einführung */}
          {activeModule === "intro" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Willkommen zur interaktiven SEO-Content Schulung
                  </CardTitle>
                  <CardDescription>
                    Lernen Sie durch Praxis: Quizze, Übungen und echte Beispiele
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-3">🎯 Was macht diese Schulung besonders?</h3>
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      {[
                        { icon: HelpCircle, label: "Interaktive Quizze", desc: "Testen Sie Ihr Wissen nach jedem Thema" },
                        { icon: PenTool, label: "Praktische Übungen", desc: "Schreiben Sie selbst und erhalten Feedback" },
                        { icon: Eye, label: "Vorher/Nachher", desc: "Lernen Sie aus echten Beispielen" },
                        { icon: Star, label: "Best Practices", desc: "Do's und Don'ts auf einen Blick" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-background/80 rounded-lg">
                          <item.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-sm">{item.label}</span>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-700">Goldene Regel</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>Schreiben Sie für Menschen, optimieren Sie für Maschinen.</strong> SEO-Texte sind keine "Keyword-Wüsten"! 
                          Der Fokus liegt immer auf Nutzerorientierung und Mehrwert.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Intro Quiz */}
                  <QuizQuestion
                    question="Was ist das Hauptziel von SEO-optimierten Texten?"
                    options={[
                      { 
                        id: "a", 
                        text: "Möglichst viele Keywords unterzubringen", 
                        isCorrect: false,
                        explanation: "Keyword-Stuffing ist veraltet und wird von Google abgestraft!"
                      },
                      { 
                        id: "b", 
                        text: "Dem Nutzer echten Mehrwert zu bieten und seine Frage zu beantworten", 
                        isCorrect: true,
                        explanation: "Genau! Google belohnt Inhalte, die Nutzern wirklich helfen."
                      },
                      { 
                        id: "c", 
                        text: "Möglichst lange Texte zu schreiben", 
                        isCorrect: false,
                        explanation: "Länge allein ist kein Qualitätsmerkmal. Relevanz zählt!"
                      },
                      { 
                        id: "d", 
                        text: "Die Konkurrenz zu kopieren", 
                        isCorrect: false,
                        explanation: "Duplicate Content wird abgestraft. Einzigartigkeit ist wichtig!"
                      }
                    ]}
                    hint="Denken Sie an die Helpful Content Guidelines von Google."
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={goToNextModule} className="gap-2">
                  Weiter zu Search Intent
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* MODUL 2: Search Intent */}
          {activeModule === "search-intent" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-primary" />
                    Search Intent – Die Suchintention verstehen
                  </CardTitle>
                  <CardDescription>
                    Der wichtigste SEO-Faktor: Verstehen Sie, was Nutzer wirklich suchen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-700">KRITISCH: Meist unterschätzter SEO-Faktor!</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Wenn Ihr Text nicht zur Suchintention passt, wird er nicht ranken – egal wie gut er geschrieben ist!
                        </p>
                      </div>
                    </div>
                  </div>

                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground bg-muted/50 p-4 rounded-r-lg">
                    "Understanding the intent behind searches is critical. If you create content that doesn't match what users are actually looking for, you won't rank."
                    <span className="block text-xs mt-2 not-italic font-medium">— John Mueller, Google Search Advocate</span>
                  </blockquote>

                  {/* Die 4 Intent-Typen als Accordion */}
                  <h3 className="text-lg font-semibold">Die 4 Search Intent Typen</h3>
                  
                  <Accordion type="single" collapsible className="space-y-2">
                    <AccordionItem value="know" className="border rounded-lg bg-blue-500/5 px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-blue-500" />
                          <span className="font-semibold">KNOW – Informationssuche</span>
                          <Badge className="bg-blue-500 ml-2">Informational</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-4">
                        <p className="text-muted-foreground">
                          Der Nutzer möchte etwas <strong>lernen oder verstehen</strong>.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="bg-background/80 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">🔍 Typische Suchanfragen:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• "Was ist [Begriff]?"</li>
                              <li>• "Wie funktioniert [Thema]?"</li>
                              <li>• "[Thema] erklärt"</li>
                            </ul>
                          </div>
                          <div className="bg-background/80 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">📝 Optimaler Content:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• Ratgeber-Artikel</li>
                              <li>• How-To Guides</li>
                              <li>• FAQ-Seiten</li>
                            </ul>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                          <span className="text-sm font-medium">💡 Pro-Tipp:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Beantworten Sie die Kernfrage direkt im ersten Absatz – Google extrahiert dies oft als Featured Snippet!
                          </span>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="do" className="border rounded-lg bg-green-500/5 px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-green-500" />
                          <span className="font-semibold">DO – Handlungsabsicht</span>
                          <Badge className="bg-green-500 ml-2">Transactional</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-4">
                        <p className="text-muted-foreground">
                          Der Nutzer möchte eine <strong>Aktion ausführen</strong> – herunterladen, anmelden, buchen.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="bg-background/80 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">🔍 Typische Suchanfragen:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• "[Service] buchen"</li>
                              <li>• "[Tool] kostenlos testen"</li>
                              <li>• "Angebot anfordern"</li>
                            </ul>
                          </div>
                          <div className="bg-background/80 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">📝 Optimaler Content:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• Landing Pages mit CTA</li>
                              <li>• Service-Seiten</li>
                              <li>• Kontaktformulare</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="buy" className="border rounded-lg bg-purple-500/5 px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="h-5 w-5 text-purple-500" />
                          <span className="font-semibold">BUY – Kaufabsicht</span>
                          <Badge className="bg-purple-500 ml-2">Commercial</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-4">
                        <p className="text-muted-foreground">
                          Der Nutzer ist in der <strong>Kaufphase</strong> und vergleicht Optionen.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="bg-background/80 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">🔍 Typische Suchanfragen:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• "[Produkt] kaufen"</li>
                              <li>• "[Produkt] Test/Vergleich"</li>
                              <li>• "Bester [Produkttyp] 2024"</li>
                            </ul>
                          </div>
                          <div className="bg-background/80 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">📝 Optimaler Content:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• Produktseiten</li>
                              <li>• Vergleichsseiten</li>
                              <li>• Reviews & Tests</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="go" className="border rounded-lg bg-orange-500/5 px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-orange-500" />
                          <span className="font-semibold">GO – Navigation</span>
                          <Badge className="bg-orange-500 ml-2">Navigational</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-4">
                        <p className="text-muted-foreground">
                          Der Nutzer sucht eine <strong>bestimmte Website oder Seite</strong>.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="bg-background/80 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">🔍 Typische Suchanfragen:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• "[Markenname] Login"</li>
                              <li>• "[Firma] Kontakt"</li>
                              <li>• "[Website] Support"</li>
                            </ul>
                          </div>
                          <div className="bg-background/80 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">📝 Optimaler Content:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              <li>• Gut strukturierte Navigation</li>
                              <li>• Klare URL-Struktur</li>
                              <li>• Aussagekräftige Titel</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Quiz */}
                  <QuizQuestion
                    question="Jemand sucht nach 'Laufschuhe Nike Test 2024'. Welcher Search Intent liegt vor?"
                    options={[
                      { id: "a", text: "KNOW – Informationssuche", isCorrect: false, explanation: "Der Nutzer will nicht nur informiert werden, sondern befindet sich in der Kaufvorbereitung." },
                      { id: "b", text: "DO – Handlungsabsicht", isCorrect: false, explanation: "Es geht nicht um eine direkte Aktion wie Anmeldung oder Download." },
                      { id: "c", text: "BUY – Kaufabsicht", isCorrect: true, explanation: "Richtig! Der Nutzer vergleicht aktiv Produkte vor einem Kauf." },
                      { id: "d", text: "GO – Navigation", isCorrect: false, explanation: "Er sucht keine bestimmte Website, sondern Produktinformationen." }
                    ]}
                    hint="Achten Sie auf das Wort 'Test' – was sagt das über die Kaufabsicht?"
                  />

                  {/* Übung */}
                  <InteractiveExercise
                    title="Search Intent erkennen"
                    description="Ordnen Sie die folgenden Suchanfragen dem richtigen Intent zu."
                    task="Schreiben Sie für jede Suchanfrage den Intent (KNOW, DO, BUY oder GO):\n\n1. 'Was ist SEO?'\n2. 'Amazon Prime kündigen'\n3. 'beste Kaffeemaschine unter 200€'\n4. 'Facebook Login'"
                    placeholder="1. KNOW (Nutzer will lernen/verstehen)&#10;2. ...&#10;3. ...&#10;4. ..."
                    criteria={[
                      { id: "know", label: "KNOW richtig erkannt", check: (t) => t.toLowerCase().includes("1") && t.toLowerCase().includes("know"), tip: "Frage 1 'Was ist SEO?' ist eine klassische Informationssuche (KNOW)" },
                      { id: "do", label: "DO richtig erkannt", check: (t) => t.toLowerCase().includes("2") && t.toLowerCase().includes("do"), tip: "Frage 2 'Amazon Prime kündigen' ist eine Handlungsabsicht (DO)" },
                      { id: "buy", label: "BUY richtig erkannt", check: (t) => t.toLowerCase().includes("3") && t.toLowerCase().includes("buy"), tip: "Frage 3 'beste Kaffeemaschine...' ist Kaufabsicht (BUY)" },
                      { id: "go", label: "GO richtig erkannt", check: (t) => t.toLowerCase().includes("4") && t.toLowerCase().includes("go"), tip: "Frage 4 'Facebook Login' ist Navigation (GO)" }
                    ]}
                    sampleSolution="1. KNOW – Der Nutzer will lernen, was SEO ist\n2. DO – Der Nutzer will eine Aktion ausführen (kündigen)\n3. BUY – Der Nutzer vergleicht Produkte vor dem Kauf\n4. GO – Der Nutzer sucht eine bestimmte Website"
                  />

                  <KeyTakeaway
                    points={[
                      "Search Intent ist der wichtigste SEO-Faktor – ohne Match kein Ranking",
                      "Es gibt 4 Typen: KNOW, DO, BUY, GO",
                      "Analysieren Sie die SERPs, um den Intent zu verstehen",
                      "Passen Sie Ihren Content-Typ dem Intent an"
                    ]}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("intro")}>
                  Zurück
                </Button>
                <Button onClick={goToNextModule} className="gap-2">
                  Weiter zu Keywords
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* MODUL 3: Keywords */}
          {activeModule === "keywords" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Keywords – Recherche & Integration
                  </CardTitle>
                  <CardDescription>
                    Die richtigen Keywords finden und natürlich einbauen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <BestPracticeCard
                    title="Keyword-Integration"
                    dos={[
                      "Hauptkeyword in H1 und erstem Absatz",
                      "Natürliche Variationen und Synonyme nutzen",
                      "LSI-Keywords (verwandte Begriffe) einbauen",
                      "Keyword-Dichte von 1-2% anstreben",
                      "Keywords in Zwischenüberschriften platzieren"
                    ]}
                    donts={[
                      "Keyword-Stuffing (zu viele Keywords)",
                      "Unnatürliche Formulierungen",
                      "Keywords ohne Kontext einbauen",
                      "Exakte Keywords erzwingen wenn es holprig klingt",
                      "Gleiche Phrase ständig wiederholen"
                    ]}
                    proTip="Google versteht Synonyme und Variationen. Schreiben Sie natürlich – die semantische Analyse erledigt den Rest."
                  />

                  {/* Keyword-Platzierung */}
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">📍 Optimale Keyword-Platzierung</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { place: "H1-Überschrift", importance: 95, note: "Pflicht! Am Anfang platzieren" },
                          { place: "Erster Absatz", importance: 90, note: "In den ersten 100 Wörtern" },
                          { place: "Meta-Title", importance: 85, note: "Vorne im Titel" },
                          { place: "Meta-Description", importance: 70, note: "Natürlich einbauen" },
                          { place: "H2/H3-Überschriften", importance: 65, note: "Variationen nutzen" },
                          { place: "Alt-Texte", importance: 50, note: "Bei relevanten Bildern" },
                          { place: "URL", importance: 40, note: "Kurz und prägnant" }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-36 text-sm font-medium">{item.place}</div>
                            <div className="flex-1">
                              <Progress value={item.importance} className="h-2" />
                            </div>
                            <div className="w-12 text-right text-sm font-medium">{item.importance}%</div>
                            <div className="w-44 text-xs text-muted-foreground">{item.note}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vorher/Nachher Beispiel */}
                  <BeforeAfter
                    title="Keyword-Integration"
                    before={{
                      content: "Laufschuhe kaufen Laufschuhe Test beste Laufschuhe Laufschuhe günstig. Wenn Sie Laufschuhe suchen, sind unsere Laufschuhe die besten Laufschuhe.",
                      issues: [
                        "Keyword-Stuffing (9x 'Laufschuhe')",
                        "Kein Lesefluss",
                        "Wirkt wie Spam",
                        "Google straft das ab"
                      ]
                    }}
                    after={{
                      content: "Die besten Laufschuhe für Einsteiger 2024: In unserem Test vergleichen wir aktuelle Running-Modelle und zeigen, welche Jogging-Schuhe das beste Preis-Leistungs-Verhältnis bieten.",
                      improvements: [
                        "Natürlicher Lesefluss",
                        "Synonyme: Running, Jogging",
                        "Keyword im Titel und Text",
                        "Mehrwert für Leser erkennbar"
                      ]
                    }}
                    explanation="Google erkennt semantische Zusammenhänge. Natürliche Variationen werden belohnt, Keyword-Stuffing bestraft."
                  />

                  {/* Quiz */}
                  <QuizQuestion
                    question="Was ist die empfohlene Keyword-Dichte für SEO-Texte?"
                    options={[
                      { id: "a", text: "5-10% – Je mehr, desto besser", isCorrect: false, explanation: "Das wäre Keyword-Stuffing und wird von Google abgestraft." },
                      { id: "b", text: "1-2% – Natürlich und ausgewogen", isCorrect: true, explanation: "Genau! Eine moderate Dichte mit natürlichen Variationen ist optimal." },
                      { id: "c", text: "0,5% – Lieber zu wenig als zu viel", isCorrect: false, explanation: "Zu wenig kann bedeuten, dass Google die Relevanz nicht erkennt." },
                      { id: "d", text: "Es gibt keine feste Regel", isCorrect: false, explanation: "Es gibt durchaus Richtwerte, auch wenn sie nicht in Stein gemeißelt sind." }
                    ]}
                  />

                  <KeyTakeaway
                    points={[
                      "Keyword in H1 und erstem Absatz ist Pflicht",
                      "Keyword-Dichte: 1-2% als Richtwert",
                      "Synonyme und LSI-Keywords natürlich einbauen",
                      "Keyword-Stuffing wird von Google abgestraft"
                    ]}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("search-intent")}>
                  Zurück
                </Button>
                <Button onClick={goToNextModule} className="gap-2">
                  Weiter zu Textstruktur
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* MODUL 4: Textstruktur */}
          {activeModule === "structure" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5 text-primary" />
                    Textstruktur – Der rote Faden
                  </CardTitle>
                  <CardDescription>
                    Klare Struktur für Leser und Suchmaschinen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h3 className="font-semibold mb-2">Die Goldene Regel der Absatzlänge</h3>
                    <p className="text-muted-foreground text-sm">
                      <strong className="text-primary">Maximal 300 Wörter pro Absatz</strong> – kürzere Absätze (100-150 Wörter) sind für Online-Leser noch besser. 
                      Jeder Absatz sollte genau einen Gedanken behandeln.
                    </p>
                  </div>

                  <BestPracticeCard
                    title="Textstruktur"
                    dos={[
                      "Einleitung: Direkt zur Sache kommen",
                      "Absätze: Max. 300 Wörter, ein Gedanke",
                      "Zwischenüberschriften alle 200-350 Wörter",
                      "Inhaltsverzeichnis bei längeren Texten",
                      "Fazit mit klarer Handlungsempfehlung"
                    ]}
                    donts={[
                      "Textwüsten ohne Absätze",
                      "Endlos lange Absätze",
                      "Fehlende Struktur/Überschriften",
                      "Wichtiges am Ende verstecken",
                      "Ohne Einleitung starten"
                    ]}
                    proTip="Die umgekehrte Pyramide: Das Wichtigste zuerst. 80% der Leser scrollen nicht bis zum Ende!"
                  />

                  {/* Struktur-Vorlage */}
                  <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-emerald-500" />
                        Optimale SEO-Text-Struktur
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { nr: "1", title: "H1: Hauptüberschrift mit Keyword", desc: "1x pro Seite, verspricht den Inhalt" },
                        { nr: "2", title: "Einleitung (50-150 Wörter)", desc: "Problem ansprechen, Lösung andeuten, Keyword einbauen" },
                        { nr: "3", title: "H2: Erste Zwischenüberschrift", desc: "Strukturiert den Text, enthält ggf. Keyword-Variation" },
                        { nr: "4", title: "Absätze (je 100-300 Wörter)", desc: "Ein Gedanke pro Absatz, leicht scanbar" },
                        { nr: "5", title: "H3/H4: Unterüberschriften", desc: "Bei Bedarf für tiefere Gliederung" },
                        { nr: "6", title: "Fazit / Call-to-Action", desc: "Zusammenfassung + klare Handlungsaufforderung" },
                      ].map((item) => (
                        <div key={item.nr} className="flex gap-3 p-3 bg-background/80 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {item.nr}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{item.title}</span>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <QuizQuestion
                    question="Wie viele Wörter sollte ein Absatz maximal haben?"
                    options={[
                      { id: "a", text: "50 Wörter", isCorrect: false, explanation: "Das wäre sehr kurz, aber nicht falsch. Mehr Kontext ist oft nötig." },
                      { id: "b", text: "300 Wörter", isCorrect: true, explanation: "Richtig! 100-300 Wörter sind ideal für Online-Texte." },
                      { id: "c", text: "500 Wörter", isCorrect: false, explanation: "Zu lang! Lange Absätze schrecken Online-Leser ab." },
                      { id: "d", text: "Es gibt keine Obergrenze", isCorrect: false, explanation: "Doch! Lesbarkeit und UX erfordern strukturierte Absätze." }
                    ]}
                  />

                  <KeyTakeaway
                    points={[
                      "Max. 300 Wörter pro Absatz",
                      "Zwischenüberschriften alle 200-350 Wörter",
                      "Das Wichtigste zuerst (umgekehrte Pyramide)",
                      "Jeder Absatz = ein Gedanke",
                      "Inhaltsverzeichnis bei längeren Texten"
                    ]}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("keywords")}>
                  Zurück
                </Button>
                <Button onClick={goToNextModule} className="gap-2">
                  Weiter zu H1-H6 Guide
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* MODUL 5: Headings */}
          {activeModule === "headings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-primary" />
                    H1-H6 Guide – Die Überschriften-Hierarchie
                  </CardTitle>
                  <CardDescription>
                    Strukturieren Sie Ihre Inhalte logisch und SEO-freundlich
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hierarchie Visualisierung */}
                  <div className="space-y-2">
                    {[
                      { tag: "H1", size: "text-3xl", desc: "Hauptüberschrift – 1x pro Seite", example: "Laufschuhe Test 2024: Die besten Modelle im Vergleich", important: true },
                      { tag: "H2", size: "text-2xl", desc: "Hauptabschnitte", example: "1. Die Top 5 Laufschuhe für Anfänger" },
                      { tag: "H3", size: "text-xl", desc: "Unterabschnitte", example: "1.1 Nike Air Zoom Pegasus – Der Allrounder" },
                      { tag: "H4", size: "text-lg", desc: "Weitere Untergliederung", example: "Technische Daten" },
                      { tag: "H5", size: "text-base", desc: "Seltener verwendet", example: "Dämpfungstechnologie" },
                      { tag: "H6", size: "text-sm", desc: "Sehr selten", example: "Detailspezifikation" },
                    ].map((h, i) => (
                      <div key={h.tag} className={`flex items-start gap-4 p-3 rounded-lg ${h.important ? "bg-primary/10 border border-primary/30" : "bg-muted/30"}`} style={{ marginLeft: `${i * 16}px` }}>
                        <Badge variant={h.important ? "default" : "outline"} className="shrink-0 w-12 justify-center">
                          {h.tag}
                        </Badge>
                        <div className="flex-1">
                          <span className={`${h.size} font-bold block`}>{h.example}</span>
                          <span className="text-xs text-muted-foreground">{h.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <BestPracticeCard
                    title="Überschriften-Regeln"
                    dos={[
                      "H1 enthält das Hauptkeyword",
                      "Logische Hierarchie einhalten (H1→H2→H3)",
                      "Sprechende Überschriften formulieren",
                      "H2s für Hauptabschnitte nutzen",
                      "Max. 60 Zeichen pro Überschrift"
                    ]}
                    donts={[
                      "Mehrere H1s auf einer Seite",
                      "H3 vor H2 verwenden (Hierarchie brechen)",
                      "Nur zur Formatierung nutzen (nicht für Größe)",
                      "Leere oder nichtssagende Überschriften",
                      "Überschriften als komplette Sätze"
                    ]}
                    proTip="Die Überschriften allein sollten den gesamten Inhalt zusammenfassen. Leser scannen oft nur die Überschriften!"
                  />

                  <QuizQuestion
                    question="Wie viele H1-Überschriften sollte eine Seite haben?"
                    options={[
                      { id: "a", text: "So viele wie nötig", isCorrect: false, explanation: "Nein! Nur eine H1 pro Seite ist der Standard." },
                      { id: "b", text: "Genau eine", isCorrect: true, explanation: "Richtig! Die H1 ist die Hauptüberschrift und definiert das Thema der Seite." },
                      { id: "c", text: "Mindestens zwei", isCorrect: false, explanation: "Eine H1 reicht. Für weitere Abschnitte nutzen Sie H2." },
                      { id: "d", text: "Keine, H1 ist veraltet", isCorrect: false, explanation: "Die H1 ist nach wie vor ein wichtiges SEO-Signal." }
                    ]}
                  />

                  <KeyTakeaway
                    points={[
                      "Nur eine H1 pro Seite – mit Hauptkeyword",
                      "Logische Hierarchie: H1 → H2 → H3 → H4",
                      "Überschriften beschreiben den folgenden Inhalt",
                      "Allein die Überschriften sollten den Text zusammenfassen"
                    ]}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("structure")}>
                  Zurück
                </Button>
                <Button onClick={goToNextModule} className="gap-2">
                  Weiter zu W-Fragen
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* MODUL 6: W-Fragen */}
          {activeModule === "w-fragen" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    W-Fragen Methodik
                  </CardTitle>
                  <CardDescription>
                    Die Fragen Ihrer Zielgruppe systematisch beantworten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h3 className="font-semibold mb-2">Warum W-Fragen?</h3>
                    <p className="text-muted-foreground text-sm">
                      W-Fragen sind ein mächtiges Tool, um die Suchintention Ihrer Zielgruppe zu verstehen und alle relevanten Aspekte eines Themas abzudecken.
                      Google zeigt W-Fragen oft als "Ähnliche Fragen" in den Suchergebnissen!
                    </p>
                  </div>

                  {/* W-Fragen Übersicht */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { q: "Was?", desc: "Definition, Erklärung", example: "Was ist SEO?", color: "blue" },
                      { q: "Wie?", desc: "Anleitung, Prozess", example: "Wie funktioniert SEO?", color: "green" },
                      { q: "Warum?", desc: "Gründe, Ursachen", example: "Warum ist SEO wichtig?", color: "purple" },
                      { q: "Wer?", desc: "Zielgruppe, Experten", example: "Wer braucht SEO?", color: "orange" },
                      { q: "Wann?", desc: "Zeitpunkt, Dauer", example: "Wann wirkt SEO?", color: "pink" },
                      { q: "Wo?", desc: "Ort, Plattform", example: "Wo finde ich SEO-Hilfe?", color: "cyan" },
                      { q: "Welche?", desc: "Optionen, Vergleich", example: "Welche SEO-Tools gibt es?", color: "amber" },
                      { q: "Wie viel?", desc: "Kosten, Menge", example: "Wie viel kostet SEO?", color: "red" },
                    ].map((item) => (
                      <div key={item.q} className={`p-3 rounded-lg border bg-${item.color}-500/5 border-${item.color}-500/20`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`bg-${item.color}-500/10 text-${item.color}-600 border-${item.color}-500/30`}>
                            {item.q}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.desc}</span>
                        </div>
                        <p className="text-sm italic text-muted-foreground">{item.example}</p>
                      </div>
                    ))}
                  </div>

                  <InteractiveExercise
                    title="W-Fragen generieren"
                    description="Entwickeln Sie W-Fragen für das Thema 'Homeoffice'"
                    task="Schreiben Sie mindestens 5 verschiedene W-Fragen zum Thema 'Homeoffice', die ein Ratgeber-Artikel beantworten sollte."
                    placeholder="1. Was braucht man für effektives Homeoffice?&#10;2. Wie richtet man einen ergonomischen Arbeitsplatz ein?&#10;3. ..."
                    criteria={[
                      { id: "count", label: "Mindestens 5 Fragen", check: (t) => (t.match(/\?/g) || []).length >= 5, tip: "Formulieren Sie mehr Fragen (mindestens 5 mit Fragezeichen)" },
                      { id: "variety", label: "Verschiedene W-Fragewörter", check: (t) => {
                        const lower = t.toLowerCase();
                        const words = ["was", "wie", "warum", "wer", "wann", "wo", "welche"];
                        return words.filter(w => lower.includes(w)).length >= 3;
                      }, tip: "Verwenden Sie verschiedene W-Fragewörter (Was, Wie, Warum, etc.)" },
                      { id: "relevant", label: "Themenrelevanz", check: (t) => t.toLowerCase().includes("homeoffice") || t.toLowerCase().includes("home office") || t.toLowerCase().includes("arbeit"), tip: "Beziehen Sie die Fragen auf das Thema Homeoffice" }
                    ]}
                    sampleSolution="1. Was braucht man für effektives Homeoffice?\n2. Wie richtet man einen ergonomischen Arbeitsplatz ein?\n3. Warum ist Homeoffice für viele Arbeitnehmer attraktiv?\n4. Welche Herausforderungen gibt es im Homeoffice?\n5. Wie viel produktiver ist man im Homeoffice?\n6. Wann sollte man ins Büro kommen statt Homeoffice zu machen?\n7. Wo findet man die beste Homeoffice-Ausstattung?"
                  />

                  <KeyTakeaway
                    points={[
                      "W-Fragen decken alle wichtigen Aspekte eines Themas ab",
                      "Google zeigt W-Fragen als 'Ähnliche Fragen' (PAA)",
                      "Nutzen Sie Tools wie AnswerThePublic für Inspiration",
                      "Beantworten Sie W-Fragen in Ihren Überschriften"
                    ]}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("headings")}>
                  Zurück
                </Button>
                <Button onClick={goToNextModule} className="gap-2">
                  Weiter zu Schreibstil
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* MODUL 7: Schreibstil */}
          {activeModule === "writing" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-primary" />
                    Schreibstil – Aktiv & Lesbar
                  </CardTitle>
                  <CardDescription>
                    Schreiben Sie verständlich, aktivierend und auf den Punkt
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Aktiv vs. Passiv */}
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-700 mb-2">⚠️ Vermeiden Sie das Passiv!</h3>
                    <p className="text-sm text-muted-foreground">
                      Passive Formulierungen wirken distanziert, umständlich und langweilig. 
                      <strong className="text-foreground"> Aktivsätze sind direkter, lebendiger und überzeugender.</strong>
                    </p>
                  </div>

                  <BeforeAfter
                    title="Aktiv vs. Passiv"
                    before={{
                      content: "Der Text wird von dem Autor geschrieben. Die Entscheidung wurde vom Team getroffen. Es wird empfohlen, regelmäßig zu trainieren.",
                      issues: [
                        "Passiv-Konstruktionen wirken distanziert",
                        "Umständlich und lang",
                        "Wer handelt, ist unklar",
                        "Langweilig zu lesen"
                      ]
                    }}
                    after={{
                      content: "Der Autor schreibt den Text. Das Team trifft die Entscheidung. Wir empfehlen regelmäßiges Training.",
                      improvements: [
                        "Aktivsätze sind direkt und klar",
                        "Kürzer und prägnanter",
                        "Der Handelnde ist sichtbar",
                        "Lebendig und aktivierend"
                      ]
                    }}
                    explanation="Aktive Formulierungen erhöhen die Lesbarkeit um bis zu 25%. Nutzen Sie Passiv nur, wenn der Handelnde unwichtig ist."
                  />

                  <BestPracticeCard
                    title="Schreibstil"
                    dos={[
                      "Aktive Verbformen verwenden",
                      "Kurze Sätze (max. 20 Wörter)",
                      "Einfache, verständliche Wörter",
                      "Direkte Ansprache (Sie/Du)",
                      "Konkret statt abstrakt"
                    ]}
                    donts={[
                      "Passiv-Konstruktionen",
                      "Schachtelsätze",
                      "Fachbegriffe ohne Erklärung",
                      "Füllwörter (eigentlich, irgendwie, quasi)",
                      "Nominalstil (die Durchführung der Analyse)"
                    ]}
                    proTip="Lesen Sie Ihren Text laut vor. Stocken Sie? Dann ist der Satz zu kompliziert."
                  />

                  {/* Flesch-Index */}
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">📊 Flesch-Lesbarkeitsindex (Deutsch)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {[
                          { range: "0-30", label: "Sehr schwer", desc: "Akademisch, Behördendeutsch", color: "red" },
                          { range: "30-50", label: "Schwer", desc: "Fachpublikum", color: "orange" },
                          { range: "50-60", label: "Mittel", desc: "Qualitätsjournalismus", color: "amber" },
                          { range: "60-70", label: "Gut", desc: "Allgemeinverständlich ✓", color: "green" },
                          { range: "70-100", label: "Sehr gut", desc: "Einfache Texte ✓✓", color: "emerald" },
                        ].map((item) => (
                          <div key={item.range} className={`flex items-center gap-3 p-2 rounded bg-${item.color}-500/10`}>
                            <Badge variant="outline" className="w-16 justify-center">{item.range}</Badge>
                            <span className="font-medium w-24">{item.label}</span>
                            <span className="text-muted-foreground">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        💡 Ziel für Webtexte: Flesch-Index über 60. Je höher, desto lesbarer.
                      </p>
                    </CardContent>
                  </Card>

                  <QuizQuestion
                    question="Welcher Satz ist besser für SEO-Texte?"
                    options={[
                      { id: "a", text: "Die Durchführung der Optimierung wurde vom Team erfolgreich abgeschlossen.", isCorrect: false, explanation: "Passiv + Nominalstil = schwer lesbar und langweilig." },
                      { id: "b", text: "Unser Team hat die Optimierung erfolgreich abgeschlossen.", isCorrect: true, explanation: "Aktiv, klar, direkt – so soll es sein!" },
                      { id: "c", text: "Es ist zu konstatieren, dass die Optimierungsmaßnahmen finalisiert worden sind.", isCorrect: false, explanation: "Behördendeutsch hat im Web nichts verloren." },
                      { id: "d", text: "Alle drei sind gleichwertig.", isCorrect: false, explanation: "Nein! Lesbarkeit und Verständlichkeit unterscheiden sich deutlich." }
                    ]}
                  />

                  <KeyTakeaway
                    points={[
                      "Aktivsätze statt Passivsätze verwenden",
                      "Kurze Sätze (max. 20 Wörter)",
                      "Flesch-Index über 60 anstreben",
                      "Füllwörter und Nominalstil vermeiden",
                      "Text laut vorlesen als Qualitätscheck"
                    ]}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("w-fragen")}>
                  Zurück
                </Button>
                <Button onClick={goToNextModule} className="gap-2">
                  Weiter zu Formatierung
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* MODUL 8: Formatierung */}
          {activeModule === "formatting" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bold className="h-5 w-5 text-primary" />
                    Formatierung – Scanbar & Übersichtlich
                  </CardTitle>
                  <CardDescription>
                    Visuelle Struktur für bessere Lesbarkeit und Engagement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h3 className="font-semibold mb-2">Warum Formatierung so wichtig ist</h3>
                    <p className="text-muted-foreground text-sm">
                      <strong>79% der Online-Leser scannen</strong> statt zu lesen. Gute Formatierung hilft ihnen, 
                      die wichtigsten Informationen schnell zu erfassen – und erhöht die Verweildauer!
                    </p>
                  </div>

                  <BestPracticeCard
                    title="Formatierungs-Elemente"
                    dos={[
                      "Fettdruck für wichtige Begriffe (sparsam!)",
                      "Aufzählungslisten für mehrere Punkte",
                      "Nummerierte Listen für Schritte/Rankings",
                      "Tabellen für Vergleiche",
                      "Bilder/Grafiken zur Auflockerung",
                      "Infoboxen für wichtige Hinweise"
                    ]}
                    donts={[
                      "Zu viel Fettdruck (verliert Wirkung)",
                      "Unterstreichungen (wirken wie Links)",
                      "Kursiv für lange Textpassagen",
                      "Zu viele verschiedene Formatierungen",
                      "Formatierung ohne Mehrwert"
                    ]}
                    proTip="Die Faustregel: Pro Absatz maximal 1-2 fett markierte Begriffe. Weniger ist mehr!"
                  />

                  {/* Beispiel-Formatierungen */}
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Beispiele für gute Formatierung</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-background rounded-lg border">
                        <h4 className="font-semibold mb-2">✅ Aufzählungsliste</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Übersichtlich und schnell erfassbar</li>
                          <li>Ideal für Features, Vorteile, Tipps</li>
                          <li>Erhöht die Scanbarkeit</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-background rounded-lg border">
                        <h4 className="font-semibold mb-2">✅ Nummerierte Liste (für Schritte)</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Keyword-Recherche durchführen</li>
                          <li>Struktur planen</li>
                          <li>Text schreiben</li>
                          <li>SEO-Check durchführen</li>
                        </ol>
                      </div>

                      <div className="p-4 bg-background rounded-lg border">
                        <h4 className="font-semibold mb-2">✅ Fettdruck (sparsam)</h4>
                        <p className="text-sm text-muted-foreground">
                          Der <strong>Search Intent</strong> ist der wichtigste Faktor für erfolgreiches SEO. 
                          Ohne passenden Intent kann selbst der beste Text nicht ranken.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <QuizQuestion
                    question="Wie viel Fettdruck sollte man pro Absatz maximal verwenden?"
                    options={[
                      { id: "a", text: "So viel wie möglich für mehr Sichtbarkeit", isCorrect: false, explanation: "Zu viel Fettdruck verliert seine Wirkung und wirkt chaotisch." },
                      { id: "b", text: "1-2 wichtige Begriffe", isCorrect: true, explanation: "Genau! Sparsamer Einsatz erhöht die Wirkung." },
                      { id: "c", text: "Gar keinen, das ist veraltet", isCorrect: false, explanation: "Fettdruck ist nach wie vor ein wichtiges Formatierungsmittel." },
                      { id: "d", text: "Jeden zweiten Satz", isCorrect: false, explanation: "Viel zu viel! Das macht den Text unlesbar." }
                    ]}
                  />

                  <KeyTakeaway
                    points={[
                      "79% der Online-Leser scannen – formatieren Sie entsprechend",
                      "Fettdruck sparsam einsetzen (1-2 Begriffe pro Absatz)",
                      "Listen für Aufzählungen und Schritte nutzen",
                      "Tabellen für Vergleiche",
                      "Weniger ist mehr – Konsistenz schlägt Vielfalt"
                    ]}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("writing")}>
                  Zurück
                </Button>
                <Button onClick={goToNextModule} className="gap-2">
                  Weiter zu E-E-A-T
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* MODUL 9: E-E-A-T */}
          {activeModule === "eeat" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    E-E-A-T Framework
                  </CardTitle>
                  <CardDescription>
                    Experience, Expertise, Authoritativeness, Trustworthiness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h3 className="font-semibold mb-2">Was ist E-E-A-T?</h3>
                    <p className="text-muted-foreground text-sm">
                      E-E-A-T ist das Qualitäts-Framework von Google. Es beschreibt die Faktoren, nach denen Google die 
                      <strong className="text-foreground"> Glaubwürdigkeit und Qualität</strong> von Inhalten bewertet.
                    </p>
                  </div>

                  {/* E-E-A-T Breakdown */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      {
                        letter: "E",
                        title: "Experience",
                        subtitle: "Erfahrung",
                        desc: "Hat der Autor persönliche Erfahrung mit dem Thema?",
                        examples: ["Produktbewertungen nach echtem Test", "Reiseberichte von echten Reisen", "Fallstudien aus der Praxis"],
                        color: "blue"
                      },
                      {
                        letter: "E",
                        title: "Expertise",
                        subtitle: "Fachkenntnis",
                        desc: "Verfügt der Autor über das nötige Fachwissen?",
                        examples: ["Ausbildung im relevanten Bereich", "Berufserfahrung", "Zertifizierungen"],
                        color: "green"
                      },
                      {
                        letter: "A",
                        title: "Authoritativeness",
                        subtitle: "Autorität",
                        desc: "Ist die Quelle als Autorität im Thema anerkannt?",
                        examples: ["Branchenreferenzen", "Medienerwähnungen", "Backlinks von vertrauenswürdigen Seiten"],
                        color: "purple"
                      },
                      {
                        letter: "T",
                        title: "Trustworthiness",
                        subtitle: "Vertrauenswürdigkeit",
                        desc: "Kann man der Website und dem Inhalt vertrauen?",
                        examples: ["Impressum & Kontaktdaten", "SSL-Verschlüsselung", "Transparente Quellen"],
                        color: "orange"
                      }
                    ].map((item) => (
                      <Card key={item.title} className={`bg-${item.color}-500/5 border-${item.color}-500/20`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-full bg-${item.color}-500 text-white flex items-center justify-center font-bold text-lg`}>
                              {item.letter}
                            </div>
                            <div>
                              <h4 className="font-semibold">{item.title}</h4>
                              <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                          <ul className="space-y-1">
                            {item.examples.map((ex, i) => (
                              <li key={i} className="text-xs flex items-center gap-2">
                                <CheckCircle2 className={`h-3 w-3 text-${item.color}-500`} />
                                {ex}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <BestPracticeCard
                    title="E-E-A-T verbessern"
                    dos={[
                      "Autorenbiografien mit Qualifikationen",
                      "Quellen und Studien zitieren",
                      "Praxisbeispiele und Fallstudien einbauen",
                      "Vollständiges Impressum",
                      "Regelmäßige Aktualisierung der Inhalte"
                    ]}
                    donts={[
                      "Anonyme Inhalte ohne Autor",
                      "Unbelegte Behauptungen",
                      "Copy & Paste von anderen Seiten",
                      "Veraltete Informationen",
                      "Versteckte Kontaktdaten"
                    ]}
                    proTip="Besonders wichtig bei YMYL-Themen (Your Money, Your Life) wie Gesundheit, Finanzen und Recht!"
                  />

                  <QuizQuestion
                    question="Wofür steht das erste 'E' in E-E-A-T?"
                    options={[
                      { id: "a", text: "Efficiency – Effizienz", isCorrect: false, explanation: "Nein, das E steht für Experience." },
                      { id: "b", text: "Experience – Erfahrung", isCorrect: true, explanation: "Richtig! Google hat 2022 'Experience' hinzugefügt – echte Erfahrung mit dem Thema zählt." },
                      { id: "c", text: "Excellence – Exzellenz", isCorrect: false, explanation: "Nein, aber Exzellenz ist natürlich trotzdem wichtig!" },
                      { id: "d", text: "Education – Bildung", isCorrect: false, explanation: "Nein, das E steht für Experience (Erfahrung)." }
                    ]}
                  />

                  <KeyTakeaway
                    points={[
                      "E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness",
                      "Besonders wichtig für YMYL-Themen (Gesundheit, Finanzen, Recht)",
                      "Autoren-Expertise sichtbar machen",
                      "Quellen zitieren und Transparenz zeigen",
                      "Regelmäßige Aktualisierung für Aktualität"
                    ]}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("formatting")}>
                  Zurück
                </Button>
                <Button onClick={goToNextModule} className="gap-2">
                  Weiter zu Helpful Content
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* MODUL 10: Helpful Content */}
          {activeModule === "helpful" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Google Helpful Content Guidelines
                  </CardTitle>
                  <CardDescription>
                    Inhalte, die Menschen wirklich helfen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-700 mb-2">⚠️ Helpful Content Update (2022-2024)</h3>
                    <p className="text-sm text-muted-foreground">
                      Google straft aktiv Websites ab, die primär für Suchmaschinen statt für Menschen schreiben. 
                      <strong className="text-foreground"> People-First Content ist keine Option mehr – es ist Pflicht!</strong>
                    </p>
                  </div>

                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground bg-muted/50 p-4 rounded-r-lg">
                    "Our helpful content system generates a signal used by our automated ranking systems to better ensure people see original, helpful content written by people, for people."
                    <span className="block text-xs mt-2 not-italic font-medium">— Google Search Central</span>
                  </blockquote>

                  {/* Die Kern-Fragen */}
                  <Card className="bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">🎯 Die 5 Kern-Fragen für Helpful Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        "Würde jemand, der Ihre Website direkt besucht, diesen Inhalt nützlich finden?",
                        "Zeigt Ihr Inhalt echte Erfahrung und tiefes Wissen?",
                        "Hat Ihre Website einen klaren Fokus oder Zweck?",
                        "Fühlt sich der Leser nach dem Lesen gut informiert?",
                        "Ist der Inhalt einzigartig und bringt er echten Mehrwert?"
                      ].map((q, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-sm">{q}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <BestPracticeCard
                    title="Helpful Content"
                    dos={[
                      "Für Menschen schreiben, nicht für Rankings",
                      "Fragen vollständig und ehrlich beantworten",
                      "Eigene Perspektive und Mehrwert bieten",
                      "Aktuelle und genaue Informationen",
                      "Klaren Fokus behalten"
                    ]}
                    donts={[
                      "Inhalte nur für Keywords erstellen",
                      "Oberflächliche Zusammenfassungen",
                      "Automatisch generierte Texte ohne Prüfung",
                      "Clickbait ohne Substanz",
                      "Trends jagen außerhalb der Expertise"
                    ]}
                    proTip="Stellen Sie sich vor, Sie sprechen mit einem Freund. Würden Sie ihm diesen Text empfehlen?"
                  />

                  <QuizQuestion
                    question="Was ist das Hauptziel der Helpful Content Guidelines?"
                    options={[
                      { id: "a", text: "Längere Texte zu fördern", isCorrect: false, explanation: "Länge ist kein Qualitätsmerkmal. Relevanz zählt." },
                      { id: "b", text: "Mehr Keywords in Texten zu fördern", isCorrect: false, explanation: "Im Gegenteil – keyword-fokussierte Texte werden abgestraft." },
                      { id: "c", text: "Inhalte zu belohnen, die Menschen wirklich helfen", isCorrect: true, explanation: "Genau! People-First Content ist das Ziel." },
                      { id: "d", text: "Nur große Websites zu bevorzugen", isCorrect: false, explanation: "Nein, auch kleine Websites können mit hilfreichem Content ranken." }
                    ]}
                  />

                  <KeyTakeaway
                    points={[
                      "People-First: Für Menschen schreiben, nicht für Rankings",
                      "Fragen vollständig beantworten",
                      "Echten Mehrwert und eigene Perspektive bieten",
                      "Helpful Content Update kann ganze Domains abstrafen",
                      "Test: Würden Sie diesen Text einem Freund empfehlen?"
                    ]}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("eeat")}>
                  Zurück
                </Button>
                <Button onClick={goToNextModule} className="gap-2">
                  Weiter zur Checkliste
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* MODUL 11: Checkliste */}
          {activeModule === "checklist" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    Die ultimative SEO-Text Checkliste
                  </CardTitle>
                  <CardDescription>
                    Ihr Qualitätscheck vor der Veröffentlichung
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      category: "Search Intent & Keyword",
                      items: [
                        "Search Intent analysiert und Content-Typ angepasst",
                        "Hauptkeyword in H1 und erstem Absatz",
                        "Keyword-Dichte: 1-2%",
                        "Synonyme und LSI-Keywords eingebaut"
                      ]
                    },
                    {
                      category: "Struktur & Aufbau",
                      items: [
                        "Nur eine H1 pro Seite",
                        "Logische Überschriften-Hierarchie (H1→H2→H3)",
                        "Absätze max. 300 Wörter",
                        "Zwischenüberschriften alle 200-350 Wörter",
                        "Das Wichtigste zuerst (umgekehrte Pyramide)"
                      ]
                    },
                    {
                      category: "Schreibstil & Lesbarkeit",
                      items: [
                        "Aktivsätze statt Passiv",
                        "Kurze Sätze (max. 20 Wörter)",
                        "Flesch-Index über 60",
                        "Keine Füllwörter",
                        "Direkte Ansprache"
                      ]
                    },
                    {
                      category: "Formatierung",
                      items: [
                        "Fettdruck sparsam eingesetzt",
                        "Listen für Aufzählungen",
                        "Tabellen für Vergleiche",
                        "Bilder mit Alt-Texten"
                      ]
                    },
                    {
                      category: "E-E-A-T & Helpful Content",
                      items: [
                        "Autoreninfo vorhanden",
                        "Quellen zitiert",
                        "Einzigartiger Mehrwert",
                        "Für Menschen geschrieben, nicht für Rankings",
                        "Frage vollständig beantwortet"
                      ]
                    },
                    {
                      category: "Meta-Daten",
                      items: [
                        "Meta-Title mit Keyword (max. 60 Zeichen)",
                        "Meta-Description (max. 160 Zeichen)",
                        "URL kurz und aussagekräftig"
                      ]
                    }
                  ].map((section) => (
                    <Card key={section.category} className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{section.category}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {section.items.map((item, i) => (
                          <label key={i} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer">
                            <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                            <span className="text-sm">{item}</span>
                          </label>
                        ))}
                      </CardContent>
                    </Card>
                  ))}

                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-green-500" />
                      <span className="font-semibold text-green-700">Geschafft!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sie haben die SEO-Content Schulung abgeschlossen! Nutzen Sie diese Checkliste bei jedem neuen Text 
                      und Sie werden sehen, wie Ihre Rankings steigen.
                    </p>
                  </div>

                  <Button 
                    onClick={() => {
                      markModuleComplete("checklist");
                    }} 
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Trophy className="h-5 w-5" />
                    Schulung abschließen
                  </Button>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("helpful")}>
                  Zurück
                </Button>
                <Button variant="outline" onClick={() => setActiveModule("intro")}>
                  Zurück zum Anfang
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SEOTraining;
