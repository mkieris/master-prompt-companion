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
import { MemoryBox } from "@/components/training/MemoryBox";
import { ModuleChecklist } from "@/components/training/ModuleChecklist";
import { MasterChecklist } from "@/components/training/MasterChecklist";
import { TechnicalSEOModule } from "@/components/training/modules/TechnicalSEOModule";
import { OnPageModule } from "@/components/training/modules/OnPageModule";
import { LinkbuildingModule } from "@/components/training/modules/LinkbuildingModule";
import { ContentStrategyModule } from "@/components/training/modules/ContentStrategyModule";
import { LocalSEOModule } from "@/components/training/modules/LocalSEOModule";
import { SEOToolsModule } from "@/components/training/modules/SEOToolsModule";
import { RankingFactorsModule } from "@/components/training/modules/RankingFactorsModule";
import { AISEOModule } from "@/components/training/modules/AISEOModule";
import { SchemaOrgModule } from "@/components/training/modules/SchemaOrgModule";
import { SEOAuditModule } from "@/components/training/modules/SEOAuditModule";
import { TechnicalSEOAdvancedModule } from "@/components/training/modules/TechnicalSEOAdvancedModule";
import { JavaScriptSEOModule } from "@/components/training/modules/JavaScriptSEOModule";
import { SiteMigrationModule } from "@/components/training/modules/SiteMigrationModule";
import { InternationalSEOModule } from "@/components/training/modules/InternationalSEOModule";
import { SEOKPIsModule } from "@/components/training/modules/SEOKPIsModule";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  BookOpen, Search, Layout, CheckCircle2, AlertTriangle, Star, Lightbulb,
  GraduationCap, ListChecks, Shield, Zap, Users, Type, HelpCircle, Compass,
  ShoppingCart, MapPin, Brain, PenTool, Bold, ArrowRight, Trophy, Server,
  FileText, Link2, Layers, Wrench, TrendingUp, Globe, Bot, Code, ClipboardCheck,
  Settings, ArrowRightLeft, Languages, BarChart3
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
    { id: "technical-advanced", label: "Technische SEO+", icon: Settings },
    { id: "onpage", label: "OnPage-SEO", icon: FileText },
    { id: "schema", label: "Schema.org", icon: Code },
    { id: "content-strategy", label: "Content-Strategie", icon: Layers },
    { id: "linkbuilding", label: "Linkbuilding", icon: Link2 },
    { id: "local", label: "Local SEO", icon: MapPin },
    { id: "international", label: "Internationales SEO", icon: Languages },
    { id: "tools", label: "SEO-Tools", icon: Wrench },
    { id: "audit", label: "SEO-Audit", icon: ClipboardCheck },
    { id: "javascript-seo", label: "JavaScript SEO", icon: Code },
    { id: "migration", label: "Site Migration", icon: ArrowRightLeft },
    { id: "eeat", label: "E-E-A-T", icon: Shield },
    { id: "helpful", label: "Helpful Content", icon: Users },
    { id: "ranking", label: "Ranking-Faktoren", icon: TrendingUp },
    { id: "kpis", label: "KPIs & Reporting", icon: BarChart3 },
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
            <p className="text-muted-foreground">25 Module • ~5 Stunden • Vom Anfänger zum SEO-Experten</p>
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
                  <CardDescription>In 30 Tagen zum SEO-Experten – von den Grundlagen bis zu fortgeschrittenen Strategien</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">🎯 Das erwartet Sie:</h3>
                    <div className="grid sm:grid-cols-3 gap-4 mb-4">
                      <div className="bg-background/80 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">25</div>
                        <div className="text-sm text-muted-foreground">Module</div>
                      </div>
                      <div className="bg-background/80 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">~5h</div>
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
                      "Schema.org & Strukturierte Daten", "JavaScript SEO & Rendering", "Site Migration & Relaunch", "Internationales SEO & hreflang",
                      "SEO-Audit durchführen", "SEO-Tools (GSC, Screaming Frog)", "E-E-A-T Framework", "KPIs & Reporting",
                      "Linkbuilding-Strategien", "Local SEO & Google Business", "KI & SEO (AI Overviews, ChatGPT)", "Content-Strategie & Themencluster"
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

          {/* Search Intent */}
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
                          <p className="text-xs text-muted-foreground mt-1">Beispiel: &quot;{item.example}&quot;</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <MemoryBox
                    title="Search Intent merken"
                    mnemonic="KNOW-DO-BUY-GO"
                    mnemonicExplanation="K=Wissen wollen, D=Tun wollen, B=Kaufen wollen, G=Gehen wollen (Navigation)"
                    visualHook="🧠 📚 ✅ 🛒 🧭"
                    keyPoints={[
                      "KNOW: Nutzer will etwas WISSEN (Informationssuche)",
                      "DO: Nutzer will etwas TUN (Handlung ausführen)",
                      "BUY: Nutzer will etwas KAUFEN (Transaktionsabsicht)",
                      "GO: Nutzer will irgendwo HIN (Navigation zu Seite/Marke)"
                    ]}
                  />

                  <QuizQuestion
                    question="Welcher Search Intent passt zu 'Nike Air Max 90 kaufen'?"
                    options={[
                      { id: "a", text: "KNOW - Informationssuche", isCorrect: false, explanation: "Nein, hier wird nicht nach Informationen gesucht." },
                      { id: "b", text: "DO - Handlungsabsicht", isCorrect: false, explanation: "Nein, 'kaufen' zeigt klare Kaufabsicht." },
                      { id: "c", text: "BUY - Kaufabsicht", isCorrect: true, explanation: "Richtig! Das Wort 'kaufen' zeigt eindeutige Transaktionsabsicht." },
                      { id: "d", text: "GO - Navigation", isCorrect: false, explanation: "Nein, der Nutzer sucht nicht nach einer bestimmten Seite." }
                    ]}
                  />
                </CardContent>
              </Card>

              <ModuleChecklist
                moduleId="search-intent"
                title="Search Intent Checkliste"
                description="Prüfen Sie diese Punkte bei jeder Content-Erstellung"
                items={[
                  { id: "si1", text: "Search Intent der Ziel-Keywords analysiert", tip: "Googlen Sie das Keyword und schauen Sie, welche Ergebnisse angezeigt werden" },
                  { id: "si2", text: "Content-Typ passend zum Intent gewählt", tip: "KNOW = Ratgeber, BUY = Produktseite, DO = Anleitung" },
                  { id: "si3", text: "SERP-Features analysiert (Featured Snippets, Videos, etc.)", tip: "Passen Sie Ihren Content an die SERP-Features an" },
                  { id: "si4", text: "Nutzerabsicht vollständig beantwortet", tip: "Fragen Sie sich: Würde der Nutzer nach dem Lesen woanders weitersuchen?" }
                ]}
              />

              <NavigationButtons prevModule="intro" nextLabel="Weiter zu Keywords" />
            </div>
          )}

          {/* Keywords */}
          {activeModule === "keywords" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" />Keywords</CardTitle>
                  <CardDescription>Die richtigen Keywords finden und optimal einsetzen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <BestPracticeCard
                    title="Keyword-Integration"
                    dos={["Hauptkeyword in H1 und erstem Absatz", "Keyword-Dichte 1-2%", "Synonyme und LSI-Keywords nutzen"]}
                    donts={["Keyword-Stuffing", "Unnatürliche Formulierungen", "Gleiche Phrase ständig wiederholen"]}
                  />

                  <MemoryBox
                    title="Keyword-Platzierung"
                    mnemonic="H1 → Intro → Überall natürlich"
                    mnemonicExplanation="Keyword zuerst in H1, dann im ersten Absatz, dann natürlich im Text verteilen"
                    visualHook="🔑 → 📋 → 📝"
                    keyPoints={[
                      "H1: Keyword MUSS enthalten sein",
                      "Erster Absatz: Keyword in den ersten 100 Wörtern",
                      "Keyword-Dichte: 1-2% (nicht mehr!)",
                      "Variationen: Synonyme, LSI-Keywords, Wortstamm-Varianten"
                    ]}
                  />
                </CardContent>
              </Card>

              <ModuleChecklist
                moduleId="keywords"
                title="Keyword Checkliste"
                items={[
                  { id: "kw1", text: "Haupt-Keyword definiert", tip: "Ein primäres Keyword pro Seite" },
                  { id: "kw2", text: "Keyword in H1 platziert", tip: "Möglichst am Anfang der H1" },
                  { id: "kw3", text: "Keyword im ersten Absatz", tip: "Idealerweise in den ersten 100 Wörtern" },
                  { id: "kw4", text: "Keyword-Dichte zwischen 1-2%", tip: "Tools wie Yoast können das prüfen" },
                  { id: "kw5", text: "Synonyme und Variationen verwendet", tip: "Natürliche Sprache, keine Robotertexte" },
                  { id: "kw6", text: "Kein Keyword-Stuffing", tip: "Wenn es unnatürlich klingt, ist es zu viel" }
                ]}
              />

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

                  <MemoryBox
                    title="Umgekehrte Pyramide"
                    mnemonic="WICHTIG → DETAILS → HINTERGRUND"
                    mnemonicExplanation="Wie bei Nachrichten: Die wichtigste Info zuerst!"
                    visualHook="🔺 Wichtigstes oben, Details unten"
                    keyPoints={[
                      "Erster Absatz: Kernaussage + Keyword",
                      "Absätze: Max. 300 Wörter",
                      "Zwischenüberschriften: Alle 200-350 Wörter",
                      "Inhaltsverzeichnis: Bei Texten über 1000 Wörter"
                    ]}
                  />
                </CardContent>
              </Card>

              <ModuleChecklist
                moduleId="structure"
                title="Textstruktur Checkliste"
                items={[
                  { id: "str1", text: "Kernaussage im ersten Absatz", tip: "Der Leser sollte sofort wissen, worum es geht" },
                  { id: "str2", text: "Absätze max. 300 Wörter", tip: "Kürzere Absätze sind leichter zu lesen" },
                  { id: "str3", text: "Zwischenüberschriften alle 200-350 Wörter", tip: "Hilft beim Scannen des Textes" },
                  { id: "str4", text: "Inhaltsverzeichnis bei langen Texten", tip: "Ab ca. 1000 Wörtern sinnvoll" },
                  { id: "str5", text: "Logischer Aufbau (Umgekehrte Pyramide)", tip: "Wichtigstes zuerst, dann Details" }
                ]}
              />

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

                  <MemoryBox
                    title="Überschriften-Hierarchie"
                    mnemonic="1 König, viele Minister"
                    mnemonicExplanation="Nur EINE H1 (König), beliebig viele H2-H6 (Minister)"
                    visualHook="👑 H1 → 🎩 H2 → 🎩 H2 → 👔 H3"
                    keyPoints={[
                      "H1: Nur EINE pro Seite (mit Keyword!)",
                      "H2: Hauptabschnitte (können mehrfach vorkommen)",
                      "H3-H6: Unterabschnitte (hierarchisch einsetzen)",
                      "Test: Überschriften allein = Zusammenfassung"
                    ]}
                  />
                </CardContent>
              </Card>

              <ModuleChecklist
                moduleId="headings"
                title="Überschriften Checkliste"
                items={[
                  { id: "head1", text: "Nur EINE H1 auf der Seite", tip: "Die wichtigste Regel für Überschriften" },
                  { id: "head2", text: "H1 enthält das Hauptkeyword", tip: "Möglichst am Anfang der H1" },
                  { id: "head3", text: "Logische Hierarchie eingehalten", tip: "H2 kommt vor H3, nie umgekehrt" },
                  { id: "head4", text: "Überschriften sind aussagekräftig", tip: "Der Leser sollte wissen, was im Abschnitt kommt" },
                  { id: "head5", text: "Überschriften-Scan-Test bestanden", tip: "Nur die Überschriften lesen = Inhalt verstehen" }
                ]}
              />

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

                  <MemoryBox
                    title="Lesbarkeit optimieren"
                    mnemonic="KISS - Keep It Short & Simple"
                    mnemonicExplanation="Kurze Sätze, einfache Wörter, aktive Sprache"
                    visualHook="📖 Flesch > 60 = 👍"
                    keyPoints={[
                      "Sätze: Max. 20 Wörter",
                      "Aktiv statt Passiv schreiben",
                      "Flesch-Index: Über 60 (leicht lesbar)",
                      "Füllwörter eliminieren (eigentlich, irgendwie, etc.)"
                    ]}
                  />
                </CardContent>
              </Card>

              <ModuleChecklist
                moduleId="writing"
                title="Schreibstil Checkliste"
                items={[
                  { id: "wri1", text: "Aktivsätze verwendet (kein Passiv)", tip: "'Der Autor schreibt' statt 'wird geschrieben'" },
                  { id: "wri2", text: "Sätze max. 20 Wörter", tip: "Lange Sätze in mehrere kurze aufteilen" },
                  { id: "wri3", text: "Flesch-Index über 60", tip: "Tools wie textinspektor.de helfen beim Prüfen" },
                  { id: "wri4", text: "Füllwörter entfernt", tip: "Eigentlich, irgendwie, sozusagen - streichen!" },
                  { id: "wri5", text: "Fachbegriffe erklärt", tip: "Beim ersten Auftreten kurz erklären" }
                ]}
              />

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

                  <MemoryBox
                    title="Scannable Content"
                    mnemonic="79% scannen nur!"
                    mnemonicExplanation="Die meisten Leser überfliegen Texte - formatieren Sie entsprechend"
                    visualHook="👁️ Scan → 📋 Liste → ✅ Verstanden"
                    keyPoints={[
                      "Fettdruck: 1-2 Wörter pro Absatz hervorheben",
                      "Listen: Aufzählungen für mehrere Punkte",
                      "Tabellen: Für Vergleiche und Daten",
                      "Keine Unterstreichungen (werden als Links verwechselt)"
                    ]}
                  />
                </CardContent>
              </Card>

              <ModuleChecklist
                moduleId="formatting"
                title="Formatierung Checkliste"
                items={[
                  { id: "fmt1", text: "Wichtige Begriffe fett markiert", tip: "Max. 1-2 pro Absatz, nicht ganze Sätze" },
                  { id: "fmt2", text: "Aufzählungslisten für Punkte verwendet", tip: "Ab 3+ Punkten immer eine Liste nutzen" },
                  { id: "fmt3", text: "Tabellen für Vergleiche eingesetzt", tip: "Ideal für Produktvergleiche, Vor-/Nachteile" },
                  { id: "fmt4", text: "Keine Unterstreichungen verwendet", tip: "Werden als Links missverstanden" },
                  { id: "fmt5", text: "Scan-Test bestanden", tip: "Kann man die Kernaussagen beim Überfliegen erfassen?" }
                ]}
              />

              <NavigationButtons prevModule="writing" nextLabel="Weiter zu Technische SEO" />
            </div>
          )}

          {/* Module Components */}
          {activeModule === "technical" && (<><TechnicalSEOModule /><NavigationButtons prevModule="formatting" nextLabel="Weiter zu Technische SEO+" /></>)}
          {activeModule === "technical-advanced" && (<><TechnicalSEOAdvancedModule /><NavigationButtons prevModule="technical" nextLabel="Weiter zu OnPage-SEO" /></>)}
          {activeModule === "onpage" && (<><OnPageModule /><NavigationButtons prevModule="technical-advanced" nextLabel="Weiter zu Schema.org" /></>)}
          {activeModule === "schema" && (<><SchemaOrgModule /><NavigationButtons prevModule="onpage" nextLabel="Weiter zu Content-Strategie" /></>)}
          {activeModule === "content-strategy" && (<><ContentStrategyModule /><NavigationButtons prevModule="schema" nextLabel="Weiter zu Linkbuilding" /></>)}
          {activeModule === "linkbuilding" && (<><LinkbuildingModule /><NavigationButtons prevModule="content-strategy" nextLabel="Weiter zu Local SEO" /></>)}
          {activeModule === "local" && (<><LocalSEOModule /><NavigationButtons prevModule="linkbuilding" nextLabel="Weiter zu Internationales SEO" /></>)}
          {activeModule === "international" && (<><InternationalSEOModule /><NavigationButtons prevModule="local" nextLabel="Weiter zu SEO-Tools" /></>)}
          {activeModule === "tools" && (<><SEOToolsModule /><NavigationButtons prevModule="international" nextLabel="Weiter zu SEO-Audit" /></>)}
          {activeModule === "audit" && (<><SEOAuditModule /><NavigationButtons prevModule="tools" nextLabel="Weiter zu JavaScript SEO" /></>)}
          {activeModule === "javascript-seo" && (<><JavaScriptSEOModule /><NavigationButtons prevModule="audit" nextLabel="Weiter zu Site Migration" /></>)}
          {activeModule === "migration" && (<><SiteMigrationModule /><NavigationButtons prevModule="javascript-seo" nextLabel="Weiter zu E-E-A-T" /></>)}

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
                  <MemoryBox
                    title="E-E-A-T merken"
                    mnemonic="Erfahrung + Expertise + Autorität = Trust"
                    mnemonicExplanation="Die ersten drei E-A bauen das T (Vertrauen) auf"
                    visualHook="👤 🎓 🏆 → 🛡️"
                    keyPoints={[
                      "Experience: Echte Erfahrung mit dem Thema zeigen",
                      "Expertise: Fachkenntnis durch Inhalte demonstrieren",
                      "Authoritativeness: Als Autorität im Bereich anerkannt sein",
                      "Trustworthiness: Vertrauenswürdigkeit durch alles oben"
                    ]}
                  />
                </CardContent>
              </Card>

              <ModuleChecklist
                moduleId="eeat"
                title="E-E-A-T Checkliste"
                items={[
                  { id: "eeat1", text: "Autoreninfo mit Qualifikationen vorhanden", tip: "Name, Titel, Erfahrung, Links zu Profilen" },
                  { id: "eeat2", text: "Quellen und Referenzen angegeben", tip: "Verlinken Sie zu vertrauenswürdigen Quellen" },
                  { id: "eeat3", text: "Datum der Veröffentlichung/Aktualisierung sichtbar", tip: "Zeigt, dass Content aktuell gehalten wird" },
                  { id: "eeat4", text: "Impressum und Kontaktdaten vorhanden", tip: "Transparenz schafft Vertrauen" },
                  { id: "eeat5", text: "Bei YMYL: Besondere Sorgfalt angewendet", tip: "Medizin, Finanzen, Recht erfordern Experten" }
                ]}
              />

              <NavigationButtons prevModule="migration" nextLabel="Weiter zu Helpful Content" />
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

                  <MemoryBox
                    title="Helpful Content Test"
                    mnemonic="Würde ich das einem Freund empfehlen?"
                    mnemonicExplanation="Der ultimative Test für jeden Content"
                    visualHook="👥 ❤️ ✅"
                    keyPoints={[
                      "People-First: Schreiben Sie für Menschen, nicht für Suchmaschinen",
                      "Vollständigkeit: Beantwortet der Text alle Fragen zum Thema?",
                      "Mehrwert: Bieten Sie etwas, das andere nicht haben",
                      "Zufriedenheit: Würde der Nutzer nach dem Lesen woanders suchen?"
                    ]}
                  />
                </CardContent>
              </Card>

              <ModuleChecklist
                moduleId="helpful"
                title="Helpful Content Checkliste"
                items={[
                  { id: "hc1", text: "Content ist für Menschen geschrieben", tip: "Lesen Sie den Text laut vor - klingt er natürlich?" },
                  { id: "hc2", text: "Alle wichtigen Fragen zum Thema beantwortet", tip: "W-Fragen als Leitfaden nutzen" },
                  { id: "hc3", text: "Einzigartiger Mehrwert vorhanden", tip: "Was bieten Sie, das andere nicht haben?" },
                  { id: "hc4", text: "Kein Clickbait oder irreführende Überschriften", tip: "Halten Sie, was die Überschrift verspricht" },
                  { id: "hc5", text: "Freund-Test bestanden", tip: "Würden Sie diesen Artikel einem Freund empfehlen?" }
                ]}
              />

              <NavigationButtons prevModule="eeat" nextLabel="Weiter zu Ranking-Faktoren" />
            </div>
          )}

          {activeModule === "ranking" && (<><RankingFactorsModule /><NavigationButtons prevModule="helpful" nextLabel="Weiter zu KPIs & Reporting" /></>)}
          {activeModule === "kpis" && (<><SEOKPIsModule /><NavigationButtons prevModule="ranking" nextLabel="Weiter zu KI & SEO" /></>)}

          {/* KI & SEO Module */}
          {activeModule === "ai-seo" && (<><AISEOModule /><NavigationButtons prevModule="kpis" nextLabel="Weiter zur Checkliste" /></>)}

          {/* Checkliste */}
          {activeModule === "checklist" && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-amber-500" />
                    Herzlichen Glückwunsch!
                  </CardTitle>
                  <CardDescription>
                    Sie haben alle Module der SEO-Schulung durchgearbeitet. Nutzen Sie die Master-Checkliste 
                    bei jeder Content-Erstellung, um sicherzustellen, dass Sie nichts vergessen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-background/60 rounded-lg">
                      <div className="text-3xl mb-1">📚</div>
                      <div className="font-semibold">25 Module</div>
                      <div className="text-xs text-muted-foreground">absolviert</div>
                    </div>
                    <div className="p-4 bg-background/60 rounded-lg">
                      <div className="text-3xl mb-1">✅</div>
                      <div className="font-semibold">80+ Punkte</div>
                      <div className="text-xs text-muted-foreground">in der Checkliste</div>
                    </div>
                    <div className="p-4 bg-background/60 rounded-lg">
                      <div className="text-3xl mb-1">🎯</div>
                      <div className="font-semibold">Druckbar</div>
                      <div className="text-xs text-muted-foreground">für jeden Content</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <MasterChecklist />

              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="h-8 w-8 text-amber-500" />
                    <div>
                      <h3 className="font-bold text-lg text-green-700">Schulung abschließen</h3>
                      <p className="text-sm text-muted-foreground">Markieren Sie die Schulung als abgeschlossen</p>
                    </div>
                  </div>
                  <Button onClick={() => markModuleComplete("checklist")} className="w-full gap-2" size="lg">
                    <CheckCircle2 className="h-5 w-5" />Schulung als abgeschlossen markieren
                  </Button>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveModule("ai-seo")}>Zurück</Button>
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
