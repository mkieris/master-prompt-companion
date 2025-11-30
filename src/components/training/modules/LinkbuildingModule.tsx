import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { 
  Link2, ExternalLink, CheckCircle2, XCircle, 
  AlertTriangle, Star, TrendingUp, Shield
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const LinkbuildingModule = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Linkbuilding & OffPage-SEO
          </CardTitle>
          <CardDescription>
            Backlinks sind einer der stärksten Ranking-Faktoren – aber Qualität schlägt Quantität
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground bg-muted/50 p-4 rounded-r-lg">
            "Links are still one of the top ranking factors. But the quality of links matters far more than quantity."
            <span className="block text-xs mt-2 not-italic font-medium">— John Mueller, Google</span>
          </blockquote>

          {/* Was sind Backlinks */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-2">Was sind Backlinks?</h3>
            <p className="text-muted-foreground text-sm">
              Backlinks sind Links von anderen Websites zu Ihrer Website. Sie sind wie "Empfehlungen" – 
              je mehr hochwertige Websites auf Sie verlinken, desto vertrauenswürdiger erscheint Ihre Seite für Google.
            </p>
          </div>

          {/* Link-Qualitätsfaktoren */}
          <h3 className="text-lg font-semibold">Was macht einen guten Backlink aus?</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { 
                title: "Relevanz", 
                desc: "Link von thematisch passender Seite", 
                example: "Sportblog verlinkt auf Laufschuh-Shop",
                icon: Star,
                importance: "Sehr wichtig"
              },
              { 
                title: "Autorität", 
                desc: "Link von vertrauenswürdiger Domain", 
                example: "Link von etablierter Nachrichtenseite",
                icon: Shield,
                importance: "Sehr wichtig"
              },
              { 
                title: "Position", 
                desc: "Link im Hauptcontent (nicht Footer/Sidebar)", 
                example: "Kontextueller Link im Artikeltext",
                icon: CheckCircle2,
                importance: "Wichtig"
              },
              { 
                title: "Ankertext", 
                desc: "Beschreibender, natürlicher Ankertext", 
                example: "...wie dieser Laufschuh-Guide zeigt",
                icon: TrendingUp,
                importance: "Wichtig"
              },
            ].map((item) => (
              <Card key={item.title} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{item.title}</span>
                    <Badge variant="outline" className="ml-auto text-xs">{item.importance}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.desc}</p>
                  <p className="text-xs bg-background p-2 rounded border">
                    <span className="text-muted-foreground">Beispiel:</span> {item.example}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Linkbuilding-Strategien */}
          <h3 className="text-lg font-semibold">Erlaubte Linkbuilding-Strategien</h3>
          
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="content" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">1. Content Marketing (Linkbait)</span>
                  <Badge className="bg-green-500">Empfohlen</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Erstellen Sie Inhalte, die so wertvoll sind, dass andere freiwillig darauf verlinken.
                </p>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Studien & Originalforschung</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Umfassende Guides & Tutorials</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Infografiken & Datenvisualisierungen</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Kostenlose Tools & Rechner</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="broken" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">2. Broken Link Building</span>
                  <Badge className="bg-blue-500">Effektiv</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Finden Sie kaputte Links auf anderen Websites und bieten Sie Ihren Content als Ersatz an.
                </p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Finden Sie relevante Seiten mit Broken Links (z.B. mit Ahrefs)</li>
                  <li>Prüfen Sie, ob Sie passenden Content haben (oder erstellen können)</li>
                  <li>Kontaktieren Sie den Webmaster höflich</li>
                  <li>Schlagen Sie Ihren Content als Alternative vor</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="guest" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">3. Gastbeiträge</span>
                  <Badge className="bg-amber-500">Mit Vorsicht</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Schreiben Sie hochwertige Artikel für relevante Blogs in Ihrer Branche.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <h5 className="font-medium text-sm text-green-700 mb-2">✓ Richtig</h5>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Hochwertige, einzigartige Beiträge</li>
                      <li>• Auf relevanten, seriösen Blogs</li>
                      <li>• Mit echtem Mehrwert für Leser</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <h5 className="font-medium text-sm text-red-700 mb-2">✗ Falsch</h5>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Massenhaft minderwertige Posts</li>
                      <li>• Auf Spam-Blogs</li>
                      <li>• Nur für den Link, kein Mehrwert</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pr" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">4. Digital PR</span>
                  <Badge className="bg-purple-500">Premium</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Generieren Sie Medienaufmerksamkeit durch newsworthy Content oder Expertise.
                </p>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Pressemitteilungen bei echten Neuigkeiten</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />HARO/Expertise für Journalisten anbieten</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Studien & Daten für Medien aufbereiten</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Verbotene Praktiken */}
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-700">Verbotene Linkbuilding-Praktiken (Black Hat)</h4>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Diese Praktiken können zu manuellen Strafen oder algorithmischen Abwertungen führen:
                </p>
                <ul className="text-sm space-y-1 text-red-700">
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3" />Links kaufen oder verkaufen</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3" />Private Blog Networks (PBNs)</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3" />Automatisierte Link-Tools/Software</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3" />Link-Austausch-Programme</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3" />Spam-Kommentare mit Links</li>
                </ul>
              </div>
            </div>
          </div>

          <BestPracticeCard
            title="Linkbuilding"
            dos={[
              "Hochwertigen, verlinkungswürdigen Content erstellen",
              "Beziehungen zu relevanten Websites aufbauen",
              "Natürliches Linkprofil anstreben (verschiedene Quellen)",
              "Fokus auf thematisch relevante Links",
              "Broken Link Building betreiben"
            ]}
            donts={[
              "Links kaufen oder verkaufen",
              "Nur auf Quantität achten",
              "Spam-Taktiken verwenden",
              "Unnatürliche Ankertexte (zu viele exakte Keywords)",
              "Link-Farmen und PBNs nutzen"
            ]}
            proTip="Ein Link von einer hochautoritären, themenrelevanten Seite ist wertvoller als 100 Links von schwachen, irrelevanten Seiten."
          />

          <QuizQuestion
            question="Was ist der wichtigste Faktor bei der Bewertung eines Backlinks?"
            options={[
              { id: "a", text: "Die Anzahl der Links von der gleichen Domain", isCorrect: false, explanation: "Viele Links von einer Domain sind weniger wertvoll als einzelne Links von vielen Domains." },
              { id: "b", text: "Relevanz und Autorität der verlinkenden Seite", isCorrect: true, explanation: "Richtig! Ein thematisch passender Link von einer vertrauenswürdigen Quelle ist am wertvollsten." },
              { id: "c", text: "Ob der Link dofollow oder nofollow ist", isCorrect: false, explanation: "Dofollow ist besser, aber ein guter nofollow-Link kann auch wertvoll sein." },
              { id: "d", text: "Die Position im Footer der Seite", isCorrect: false, explanation: "Footer-Links sind weniger wertvoll als Links im Hauptcontent." }
            ]}
          />

          <KeyTakeaway
            points={[
              "Backlinks sind ein Top-3 Ranking-Faktor",
              "Qualität > Quantität: Ein starker Link schlägt 100 schwache",
              "Relevanz und Autorität der Quelle sind entscheidend",
              "Content Marketing ist die nachhaltigste Linkbuilding-Strategie",
              "Black-Hat-Taktiken führen zu Abstrafungen"
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};
