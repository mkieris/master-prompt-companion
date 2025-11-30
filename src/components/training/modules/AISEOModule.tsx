import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { BeforeAfter } from "@/components/training/BeforeAfter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bot, Brain, AlertTriangle, CheckCircle2, Search, FileText, Lightbulb, Shield, Sparkles, Eye, PenTool, Target, Zap } from "lucide-react";

export const AISEOModule = () => {
  return (
    <div className="space-y-6">
      {/* Einführung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            KI & SEO: Das müssen Sie wissen
          </CardTitle>
          <CardDescription>
            Faktenbasierter Überblick über AI Overviews, ChatGPT für SEO und AI-generierte Inhalte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-700 mb-1">Wichtiger Hinweis</p>
                <p className="text-sm text-muted-foreground">
                  KI im SEO-Bereich entwickelt sich schnell. Die folgenden Informationen basieren auf 
                  offiziellen Google-Aussagen und bewährten Best Practices (Stand: Ende 2024/Anfang 2025). 
                  Überprüfen Sie wichtige Entscheidungen immer mit aktuellen Quellen.
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">AI Overviews</h4>
                <p className="text-xs text-muted-foreground mt-1">Googles KI-gestützte Suchergebnisse</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4 text-center">
                <Brain className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">ChatGPT für SEO</h4>
                <p className="text-xs text-muted-foreground mt-1">KI als Werkzeug nutzen</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/5 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">AI-Inhalte</h4>
                <p className="text-xs text-muted-foreground mt-1">Googles offizielle Position</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* AI Overviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-500" />
            AI Overviews (Google SGE)
          </CardTitle>
          <CardDescription>
            Was sind AI Overviews und wie beeinflussen sie SEO?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Was sind AI Overviews?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              AI Overviews (früher SGE - Search Generative Experience) sind KI-generierte Zusammenfassungen, 
              die Google bei bestimmten Suchanfragen über den klassischen Suchergebnissen anzeigt. 
              Sie fassen Informationen aus mehreren Quellen zusammen.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm">Werden bei komplexen Fragen angezeigt</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm">Verlinken auf Quellen unterhalb des Texts</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm">Nicht bei allen Suchanfragen aktiv</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm">Verfügbarkeit variiert nach Region/Sprache</span>
              </div>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="impact">
              <AccordionTrigger className="text-sm font-semibold">
                Auswirkungen auf SEO-Traffic
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Aktuelle Beobachtungen:</strong> Die Auswirkungen auf organischen Traffic sind 
                    noch nicht abschließend messbar, da AI Overviews noch nicht flächendeckend ausgerollt sind. 
                    Erste Studien zeigen unterschiedliche Ergebnisse je nach Branche und Query-Typ.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Bei informativen Queries könnte der Zero-Click-Anteil steigen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Websites, die als Quelle zitiert werden, können profitieren</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Transaktionale Suchen sind weniger betroffen</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="optimize">
              <AccordionTrigger className="text-sm font-semibold">
                Wie optimiert man für AI Overviews?
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Google hat bestätigt, dass es keine separate "AI Overview Optimierung" gibt. 
                  Die gleichen Faktoren, die für gute Rankings sorgen, helfen auch bei AI Overviews:
                </p>
                <div className="grid gap-2">
                  {[
                    "Hochwertige, vertrauenswürdige Inhalte erstellen (E-E-A-T)",
                    "Fragen klar und präzise beantworten",
                    "Strukturierte Daten verwenden (Schema.org)",
                    "Gut strukturierte Inhalte mit klaren Überschriften",
                    "Expertise und Autorenschaft zeigen",
                    "Einzigartige Einblicke und Perspektiven bieten",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <KeyTakeaway 
            points={[
              "AI Overviews sind KI-Zusammenfassungen über den Suchergebnissen",
              "Keine separate Optimierung nötig – guter Content hilft automatisch",
              "E-E-A-T und klare Antworten bleiben entscheidend"
            ]} 
          />
        </CardContent>
      </Card>

      {/* ChatGPT für SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-green-500" />
            ChatGPT & KI-Tools für SEO nutzen
          </CardTitle>
          <CardDescription>
            Sinnvolle Anwendungsfälle für KI im SEO-Workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <BestPracticeCard
            title="KI als SEO-Assistent"
            dos={[
              "Ideenfindung und Brainstorming für Content-Themen",
              "Gliederungen und Strukturen erstellen lassen",
              "Erste Entwürfe als Ausgangspunkt nutzen",
              "Keyword-Recherche unterstützen (nicht ersetzen)",
              "Meta-Descriptions formulieren lassen",
              "Texte auf Lesbarkeit prüfen",
              "Zusammenfassungen komplexer Themen erstellen"
            ]}
            donts={[
              "KI-Output ungeprüft veröffentlichen",
              "Faktische Aussagen ohne Überprüfung übernehmen",
              "KI für aktuelle Ereignisse/Daten nutzen (Halluzinationen!)",
              "Expertise durch KI ersetzen wollen",
              "Massenproduktion von Low-Quality-Content"
            ]}
            proTip="KI ist ein Werkzeug, kein Ersatz für Expertise. Nutzen Sie KI für Effizienz, aber behalten Sie die redaktionelle Kontrolle."
          />

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Praktische Anwendungsfälle
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  title: "Keyword-Clustering",
                  desc: "Keywords thematisch gruppieren lassen",
                  quality: "Gut geeignet"
                },
                {
                  title: "Content-Gliederungen",
                  desc: "Strukturvorschläge für Artikel",
                  quality: "Sehr gut geeignet"
                },
                {
                  title: "Title-Tag-Varianten",
                  desc: "Verschiedene Formulierungen generieren",
                  quality: "Gut geeignet"
                },
                {
                  title: "FAQ-Generierung",
                  desc: "Relevante Fragen zum Thema finden",
                  quality: "Gut geeignet"
                },
                {
                  title: "Schema Markup",
                  desc: "Strukturierte Daten erstellen",
                  quality: "Mit Vorsicht nutzen"
                },
                {
                  title: "Technische Analysen",
                  desc: "Robots.txt, htaccess prüfen",
                  quality: "Nur als Unterstützung"
                },
              ].map((useCase, i) => (
                <Card key={i} className="bg-muted/30">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{useCase.title}</span>
                      <Badge variant="outline" className="text-xs">{useCase.quality}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{useCase.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 mb-1">Vorsicht: KI-Halluzinationen</p>
                <p className="text-sm text-muted-foreground">
                  KI-Modelle wie ChatGPT können faktisch falsche Informationen generieren, die überzeugend klingen. 
                  Prüfen Sie <strong>alle</strong> Fakten, Statistiken und Zitate manuell, bevor Sie sie veröffentlichen.
                </p>
              </div>
            </div>
          </div>

          <QuizQuestion
            question="Wofür eignet sich ChatGPT im SEO-Kontext am besten?"
            options={[
              { 
                id: "a", 
                text: "Vollständige Artikel ohne Überprüfung veröffentlichen", 
                isCorrect: false, 
                explanation: "Falsch! KI-Output muss immer geprüft und bearbeitet werden." 
              },
              { 
                id: "b", 
                text: "Als Brainstorming-Tool und für erste Entwürfe", 
                isCorrect: true, 
                explanation: "Richtig! KI ist ein hervorragendes Werkzeug für Ideenfindung und Strukturierung." 
              },
              { 
                id: "c", 
                text: "Aktuelle Statistiken und Daten recherchieren", 
                isCorrect: false, 
                explanation: "Vorsicht! KI-Modelle haben einen Trainingsdatenstand und können Fakten halluzinieren." 
              },
              { 
                id: "d", 
                text: "Konkurrenzanalysen automatisieren", 
                isCorrect: false, 
                explanation: "KI hat keinen Zugriff auf aktuelle Wettbewerberdaten. Nutzen Sie dafür SEO-Tools." 
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* AI-generierte Inhalte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            AI-generierte Inhalte: Googles Position
          </CardTitle>
          <CardDescription>
            Was Google offiziell zu KI-generierten Inhalten sagt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700 mb-1">Offizielle Google-Aussage (Februar 2023)</p>
                <p className="text-sm text-muted-foreground">
                  "Google belohnt qualitativ hochwertige Inhalte, unabhängig davon, wie sie produziert werden. 
                  Unser Fokus liegt seit Jahren darauf, qualitativ hochwertige Inhalte zu belohnen. 
                  Das wird auch weiterhin so sein."
                </p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Quelle: Google Search Central Blog, "Google Search's guidance about AI-generated content"
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Was das bedeutet:</h4>
            <div className="grid gap-3">
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">KI-Inhalte sind nicht per se verboten</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Google straft nicht automatisch ab, nur weil Inhalte mit KI erstellt wurden.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Qualität steht im Mittelpunkt</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        E-E-A-T und Helpful Content Guidelines gelten unverändert – egal wie der Content erstellt wurde.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Spam bleibt Spam</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Massenhaft produzierte, minderwertige Inhalte werden abgestraft – mit oder ohne KI.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <BeforeAfter
            title="KI-Content richtig einsetzen"
            before={{
              content: "10 generische KI-Artikel pro Tag veröffentlichen, ohne redaktionelle Prüfung, um schnell viele Rankings zu bekommen.",
              issues: [
                "Massenproduktion ohne Qualitätskontrolle",
                "Kein Mehrwert gegenüber Wettbewerb",
                "Hohes Risiko für Helpful Content Abstrafung",
                "Fehlende Expertise und Einzigartigkeit"
              ]
            }}
            after={{
              content: "KI für Research und Gliederung nutzen, dann mit Fachwissen anreichern, Fakten prüfen und einzigartige Perspektiven hinzufügen.",
              improvements: [
                "Effizienter Workflow mit Qualitätsfokus",
                "Menschliche Expertise bleibt zentral",
                "Mehrwert durch einzigartige Einblicke",
                "E-E-A-T wird erfüllt"
              ]
            }}
          />

          <BestPracticeCard
            title="KI-generierte Inhalte veröffentlichen"
            dos={[
              "Alle Fakten unabhängig verifizieren",
              "Eigene Expertise und Erfahrung einbringen",
              "Einzigartige Perspektiven hinzufügen",
              "Redaktionelle Qualitätsprüfung durchführen",
              "Bei YMYL-Themen besonders sorgfältig sein",
              "Transparenz: Bei Bedarf KI-Nutzung offenlegen"
            ]}
            donts={[
              "Ungeprüfte KI-Texte veröffentlichen",
              "Massenproduktion ohne Qualitätskontrolle",
              "KI-Output als 'einzigartig' verkaufen",
              "Faktische Fehler durch mangelnde Prüfung",
              "YMYL-Themen ohne Expertenwissen behandeln"
            ]}
            proTip="Die Frage ist nicht 'KI oder Mensch', sondern 'Gut oder schlecht'. Nutzen Sie KI, um effizienter guten Content zu erstellen."
          />
        </CardContent>
      </Card>

      {/* Zukunft von KI & SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Ausblick: KI & SEO
          </CardTitle>
          <CardDescription>
            Was wir wissen und was unsicher ist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Was sicher ist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "Qualität bleibt der wichtigste Faktor",
                  "E-E-A-T behält seine Bedeutung",
                  "User Experience wird wichtiger",
                  "Einzigartige Inhalte werden bevorzugt",
                  "Spam wird weiterhin bekämpft"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Was noch unklar ist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "Vollständige Auswirkungen von AI Overviews",
                  "Wie sich Such-Verhalten langfristig ändert",
                  "KI-Erkennungsmethoden von Google",
                  "Regulatorische Entwicklungen",
                  "Neue Ranking-Faktoren"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-700 mb-1">Empfehlung</p>
                <p className="text-sm text-muted-foreground">
                  Konzentrieren Sie sich auf zeitlose SEO-Prinzipien: Erstellen Sie hochwertige, 
                  nutzerorientierte Inhalte mit echter Expertise. Unabhängig von KI-Entwicklungen 
                  werden diese Grundlagen wichtig bleiben.
                </p>
              </div>
            </div>
          </div>

          <QuizQuestion
            question="Wie sollten Sie mit KI-generierten Inhalten umgehen?"
            options={[
              { 
                id: "a", 
                text: "KI komplett vermeiden, weil Google sie abstraft", 
                isCorrect: false, 
                explanation: "Falsch! Google straft KI-Inhalte nicht automatisch ab – nur minderwertige Inhalte." 
              },
              { 
                id: "b", 
                text: "KI für Effizienz nutzen, aber Qualität und Fakten manuell prüfen", 
                isCorrect: true, 
                explanation: "Richtig! KI ist ein Werkzeug. Die redaktionelle Verantwortung bleibt beim Menschen." 
              },
              { 
                id: "c", 
                text: "So viel KI-Content wie möglich produzieren", 
                isCorrect: false, 
                explanation: "Falsch! Massenproduktion ohne Qualitätskontrolle führt zu Abstrafungen." 
              },
              { 
                id: "d", 
                text: "Abwarten, bis KI perfekt ist", 
                isCorrect: false, 
                explanation: "KI ist heute schon ein nützliches Werkzeug – mit den richtigen Prozessen." 
              },
            ]}
          />

          <KeyTakeaway 
            points={[
              "Google bewertet Qualität, nicht die Produktionsmethode",
              "KI ist ein Werkzeug – Expertise und Qualitätskontrolle bleiben menschliche Aufgaben",
              "Fokus auf zeitlose Prinzipien: E-E-A-T, Helpful Content, User Experience",
              "Bei YMYL-Themen besondere Sorgfalt walten lassen"
            ]} 
          />
        </CardContent>
      </Card>
    </div>
  );
};
