import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { ModuleProgress } from "@/components/training/ModuleProgress";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { InteractiveExercise } from "@/components/training/InteractiveExercise";
import { BeforeAfter } from "@/components/training/BeforeAfter";
import { TechnicalSEOModule } from "@/components/training/modules/TechnicalSEOModule";
import { OnPageModule } from "@/components/training/modules/OnPageModule";
import { LinkbuildingModule } from "@/components/training/modules/LinkbuildingModule";
import { ContentStrategyModule } from "@/components/training/modules/ContentStrategyModule";
import { LocalSEOModule } from "@/components/training/modules/LocalSEOModule";
import { SEOToolsModule } from "@/components/training/modules/SEOToolsModule";
import { RankingFactorsModule } from "@/components/training/modules/RankingFactorsModule";
import { AISEOModule } from "@/components/training/modules/AISEOModule";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  BookOpen, Search, Layout, CheckCircle2, AlertTriangle, Star, Lightbulb, 
  GraduationCap, ListChecks, Shield, Zap, Users, Type, HelpCircle, Compass, 
  ShoppingCart, MapPin, Brain, PenTool, Bold, ArrowRight, Trophy, Server, 
  FileText, Link2, Layers, Wrench, TrendingUp, Globe, Bot
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface SEOTrainingProps {
  session: Session | null;
}

const SEOTraining = ({ session }: SEOTrainingProps) => {
  const [activeModule, setActiveModule] = useState("intro");
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("seo-training-progress");
    if (saved) setCompletedModules(JSON.parse(saved));
  }, []);

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
    { id: "writing", label: "Schreibstil", icon: PenTool },
    { id: "formatting", label: "Formatierung", icon: Bold },
    { id: "technical", label: "Technische SEO", icon: Server },
    { id: "onpage", label: "OnPage-SEO", icon: FileText },
    { id: "content-strategy", label: "Content-Strategie", icon: Layers },
    { id: "linkbuilding", label: "Linkbuilding", icon: Link2 },
    { id: "local", label: "Local SEO", icon: MapPin },
    { id: "tools", label: "SEO-Tools", icon: Wrench },
    { id: "eeat", label: "E-E-A-T", icon: Shield },
    { id: "helpful", label: "Helpful Content", icon: Users },
    { id: "ranking", label: "Ranking-Faktoren", icon: TrendingUp },
    { id: "ai-seo", label: "KI & SEO", icon: Bot },
    { id: "checklist", label: "Checkliste", icon: ListChecks },
  ];

  const overallProgress = Math.round((completedModules.length / modules.length) * 100);

  const NavigationButtons = ({ prevModule, nextLabel }: { prevModule?: string; nextLabel: string }) => (
    <div className="flex justify-between mt-6">
      {prevModule ? (
        <Button variant="outline" onClick={() => setActiveModule(prevModule)}>Zurück</Button>
      ) : <div />}
      <Button onClick={goToNextModule} className="gap-2">
        {nextLabel} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

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
            <p className="text-muted-foreground">18 Module • ~3 Stunden • Vom Anfänger zum SEO-Profi</p>
          </div>
          {overallProgress === 100 && (
            <Badge className="bg-amber-500 text-white gap-1"><Trophy className="h-3 w-3" />Abgeschlossen!</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-600">Textschulung MK</Badge>
          <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-600">Google Guidelines 2024/2025</Badge>
          <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-600">Evergreen Media</Badge>
          <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-600">Sistrix & Bloofusion</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px,1fr] gap-6">
        <ModuleProgress modules={modules} activeModule={activeModule} completedModules={completedModules} onModuleClick={setActiveModule} />

        <div className="space-y-6">
          {/* Einführung */}
          {activeModule === "intro" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Willkommen zur SEO-Schulung</CardTitle>
                  <CardDescription>In 3 Tagen zum SEO-Experten – von den Grundlagen bis zu fortgeschrittenen Strategien</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">🎯 Das erwartet Sie:</h3>
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                      <div className="bg-background/80 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">18</div>
                        <div className="text-sm text-muted-foreground">Module</div>
                      </div>
                      <div className="bg-background/80 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">~3h</div>
                        <div className="text-sm text-muted-foreground">Lernzeit</div>
                      </div>
                      <div className="bg-background/80 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">∞</div>
                        <div className="text-sm text-muted-foreground">Praxis-Tipps</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                  {["Search Intent (Know/Do/Buy/Go)", "Keyword-Recherche & -Integration", "Textstruktur & Lesbarkeit", "Technische SEO & Core Web Vitals", 
                      "OnPage-Optimierung", "Content-Strategie & Themencluster", "Linkbuilding-Strategien", "Local SEO", 
                      "SEO-Tools (GSC, Screaming Frog)", "E-E-A-T Framework", "Helpful Content Guidelines", "KI & SEO (AI Overviews, ChatGPT)"
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>

                  <QuizQuestion
                    question="Was ist das Hauptziel von SEO-optimierten Texten?"
                    options={[
                      { id: "a", text: "Möglichst viele Keywords unterzubringen", isCorrect: false, explanation: "Keyword-Stuffing ist veraltet!" },
                      { id: "b", text: "Dem Nutzer echten Mehrwert zu bieten", isCorrect: true, explanation: "Richtig! Google belohnt hilfreiche Inhalte." },
                      { id: "c", text: "Möglichst lange Texte zu schreiben", isCorrect: false, explanation: "Länge ≠ Qualität. Relevanz zählt!" },
                      { id: "d", text: "Die Konkurrenz zu kopieren", isCorrect: false, explanation: "Duplicate Content wird abgestraft!" }
                    ]}
                  />
                </CardContent>
              </Card>
              <NavigationButtons nextLabel="Weiter zu Search Intent" />
            </div>
          )}

          {/* Search Intent - Kurzversion */}
          {activeModule === "search-intent" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Compass className="h-5 w-5 text-primary" />Search Intent</CardTitle>
                  <CardDescription>Der wichtigste SEO-Faktor: Verstehen Sie, was Nutzer wirklich suchen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                      <p className="text-sm"><strong className="text-red-700">KRITISCH:</strong> Wenn Ihr Content nicht zum Search Intent passt, wird er nicht ranken!</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { type: "KNOW", color: "blue", desc: "Informationssuche", example: "Was ist SEO?" },
                      { type: "DO", color: "green", desc: "Handlungsabsicht", example: "Newsletter anmelden" },
                      { type: "BUY", color: "purple", desc: "Kaufabsicht", example: "Laufschuhe Test 2024" },
                      { type: "GO", color: "orange", desc: "Navigation", example: "Facebook Login" },
                    ].map((item) => (
                      <Card key={item.type} className={`bg-${item.color}-500/5 border-${item.color}-500/20`}>
                        <CardContent className="p-4">
                          <Badge className={`bg-${item.color}-500 mb-2`}>{item.type}</Badge>
                          <p className="text-sm font-medium">{item.desc}</p>
                          <p className="text-xs text-muted-foreground mt-1">Beispiel: "{item.example}"</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <KeyTakeaway points={["Search Intent ist der wichtigste SEO-Faktor", "4 Typen: KNOW, DO, BUY, GO", "Content-Typ muss zum Intent passen"]} />
                </CardContent>
              </Card>
              <NavigationButtons prevModule="intro" nextLabel="Weiter zu Keywords" />
            </div>
          )}

          {/* Keywords - Kurzversion */}
          {activeModule === "keywords" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" />Keywords</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <BestPracticeCard
                    title="Keyword-Integration"
                    dos={["Hauptkeyword in H1 und erstem Absatz", "Keyword-Dichte 1-2%", "Synonyme und LSI-Keywords nutzen"]}
                    donts={["Keyword-Stuffing", "Unnatürliche Formulierungen", "Gleiche Phrase ständig wiederholen"]}
                  />
                  <KeyTakeaway points={["Keyword in H1 und erstem Absatz ist Pflicht", "Keyword-Dichte: 1-2%", "Natürliche Variationen verwenden"]} />
                </CardContent>
              </Card>
              <NavigationButtons prevModule="search-intent" nextLabel="Weiter zu Textstruktur" />
            </div>
          )}

          {/* Textstruktur */}
          {activeModule === "structure" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5 text-primary" />Textstruktur</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <BestPracticeCard
                    title="Textstruktur"
                    dos={["Max. 300 Wörter pro Absatz", "Zwischenüberschriften alle 200-350 Wörter", "Das Wichtigste zuerst"]}
                    donts={["Textwüsten ohne Absätze", "Wichtiges am Ende verstecken"]}
                  />
                  <KeyTakeaway points={["Max. 300 Wörter pro Absatz", "Umgekehrte Pyramide: Wichtigstes zuerst", "Inhaltsverzeichnis bei längeren Texten"]} />
                </CardContent>
              </Card>
              <NavigationButtons prevModule="keywords" nextLabel="Weiter zu H1-H6" />
            </div>
          )}

          {/* H1-H6 */}
          {activeModule === "headings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-primary" />H1-H6 Guide</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <BestPracticeCard
                    title="Überschriften"
                    dos={["Nur eine H1 pro Seite mit Keyword", "Logische Hierarchie H1→H2→H3", "Sprechende Überschriften"]}
                    donts={["Mehrere H1s", "H3 vor H2 verwenden", "Überschriften nur für Formatierung"]}
                  />
                  <KeyTakeaway points={["Nur eine H1 pro Seite", "Logische Hierarchie einhalten", "Überschriften allein sollten den Inhalt zusammenfassen"]} />
                </CardContent>
              </Card>
              <NavigationButtons prevModule="structure" nextLabel="Weiter zu Schreibstil" />
            </div>
          )}

          {/* Schreibstil */}
          {activeModule === "writing" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><PenTool className="h-5 w-5 text-primary" />Schreibstil</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <BeforeAfter
                    title="Aktiv vs. Passiv"
                    before={{ content: "Der Text wird vom Autor geschrieben.", issues: ["Passiv wirkt distanziert", "Umständlich"] }}
                    after={{ content: "Der Autor schreibt den Text.", improvements: ["Direkt und klar", "Lebendig"] }}
                  />
                  <KeyTakeaway points={["Aktivsätze statt Passiv", "Kurze Sätze (max. 20 Wörter)", "Flesch-Index über 60 anstreben"]} />
                </CardContent>
              </Card>
              <NavigationButtons prevModule="headings" nextLabel="Weiter zu Formatierung" />
            </div>
          )}

          {/* Formatierung */}
          {activeModule === "formatting" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Bold className="h-5 w-5 text-primary" />Formatierung</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <BestPracticeCard
                    title="Formatierung"
                    dos={["Fettdruck sparsam (1-2 pro Absatz)", "Aufzählungslisten für Punkte", "Tabellen für Vergleiche"]}
                    donts={["Zu viel Fettdruck", "Unterstreichungen (wirken wie Links)"]}
                  />
                  <KeyTakeaway points={["79% der Online-Leser scannen", "Fettdruck sparsam einsetzen", "Listen für Aufzählungen nutzen"]} />
                </CardContent>
              </Card>
              <NavigationButtons prevModule="writing" nextLabel="Weiter zu Technische SEO" />
            </div>
          )}

          {/* Module Components */}
          {activeModule === "technical" && (<><TechnicalSEOModule /><NavigationButtons prevModule="formatting" nextLabel="Weiter zu OnPage-SEO" /></>)}
          {activeModule === "onpage" && (<><OnPageModule /><NavigationButtons prevModule="technical" nextLabel="Weiter zu Content-Strategie" /></>)}
          {activeModule === "content-strategy" && (<><ContentStrategyModule /><NavigationButtons prevModule="onpage" nextLabel="Weiter zu Linkbuilding" /></>)}
          {activeModule === "linkbuilding" && (<><LinkbuildingModule /><NavigationButtons prevModule="content-strategy" nextLabel="Weiter zu Local SEO" /></>)}
          {activeModule === "local" && (<><LocalSEOModule /><NavigationButtons prevModule="linkbuilding" nextLabel="Weiter zu SEO-Tools" /></>)}
          {activeModule === "tools" && (<><SEOToolsModule /><NavigationButtons prevModule="local" nextLabel="Weiter zu E-E-A-T" /></>)}

          {/* E-E-A-T */}
          {activeModule === "eeat" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />E-E-A-T Framework</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { letter: "E", title: "Experience", desc: "Persönliche Erfahrung mit dem Thema" },
                      { letter: "E", title: "Expertise", desc: "Fachkenntnis und Qualifikation" },
                      { letter: "A", title: "Authoritativeness", desc: "Anerkannte Autorität im Bereich" },
                      { letter: "T", title: "Trustworthiness", desc: "Vertrauenswürdigkeit der Quelle" },
                    ].map((item, i) => (
                      <Card key={i} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{item.letter}</div>
                            <span className="font-semibold">{item.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <KeyTakeaway points={["E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness", "Besonders wichtig für YMYL-Themen", "Autoreninfo und Quellen zeigen"]} />
                </CardContent>
              </Card>
              <NavigationButtons prevModule="tools" nextLabel="Weiter zu Helpful Content" />
            </div>
          )}

          {/* Helpful Content */}
          {activeModule === "helpful" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Helpful Content</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                    <p className="text-sm"><strong className="text-red-700">Helpful Content Update:</strong> Google straft Websites ab, die für Rankings statt für Menschen schreiben!</p>
                  </div>
                  <BestPracticeCard
                    title="Helpful Content"
                    dos={["Für Menschen schreiben", "Fragen vollständig beantworten", "Echten Mehrwert bieten"]}
                    donts={["Content nur für Keywords", "Oberflächliche Zusammenfassungen", "Clickbait ohne Substanz"]}
                  />
                  <KeyTakeaway points={["People-First: Für Menschen schreiben", "Fragen vollständig beantworten", "Test: Würden Sie diesen Text einem Freund empfehlen?"]} />
                </CardContent>
              </Card>
              <NavigationButtons prevModule="eeat" nextLabel="Weiter zu Ranking-Faktoren" />
            </div>
          )}

          {activeModule === "ranking" && (<><RankingFactorsModule /><NavigationButtons prevModule="helpful" nextLabel="Weiter zu KI & SEO" /></>)}

          {/* KI & SEO Module */}
          {activeModule === "ai-seo" && (<><AISEOModule /><NavigationButtons prevModule="ranking" nextLabel="Weiter zur Checkliste" /></>)}

          {/* Checkliste */}
          {activeModule === "checklist" && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Die ultimative SEO-Checkliste</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { cat: "Search Intent & Keyword", items: ["Search Intent analysiert", "Keyword in H1 und erstem Absatz", "Keyword-Dichte 1-2%"] },
                    { cat: "Struktur", items: ["Nur eine H1", "Logische Hierarchie", "Absätze max. 300 Wörter"] },
                    { cat: "Schreibstil", items: ["Aktivsätze", "Kurze Sätze (max. 20 Wörter)", "Flesch-Index > 60"] },
                    { cat: "Technisch", items: ["Mobile-optimiert", "Core Web Vitals grün", "HTTPS aktiv"] },
                    { cat: "OnPage", items: ["Meta-Title optimiert", "Meta-Description vorhanden", "Bilder mit Alt-Text"] },
                    { cat: "E-E-A-T", items: ["Autoreninfo vorhanden", "Quellen zitiert", "Für Menschen geschrieben"] },
                    { cat: "KI & Content", items: ["KI-Fakten verifiziert", "Einzigartige Perspektiven hinzugefügt", "Redaktionelle Prüfung durchgeführt"] },
                  ].map((section) => (
                    <Card key={section.cat} className="bg-muted/30">
                      <CardHeader className="pb-2"><CardTitle className="text-base">{section.cat}</CardTitle></CardHeader>
                      <CardContent className="space-y-2">
                        {section.items.map((item, i) => (
                          <label key={i} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer">
                            <input type="checkbox" className="h-4 w-4 rounded" />
                            <span className="text-sm">{item}</span>
                          </label>
                        ))}
                      </CardContent>
                    </Card>
                  ))}

                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2"><Trophy className="h-5 w-5 text-green-500" /><span className="font-semibold text-green-700">Geschafft!</span></div>
                    <p className="text-sm text-muted-foreground">Sie haben die SEO-Schulung abgeschlossen!</p>
                  </div>

                  <Button onClick={() => markModuleComplete("checklist")} className="w-full gap-2" size="lg">
                    <Trophy className="h-5 w-5" />Schulung abschließen
                  </Button>
                </CardContent>
              </Card>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("ranking")}>Zurück</Button>
                <Button variant="outline" onClick={() => setActiveModule("intro")}>Zurück zum Anfang</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SEOTraining;
