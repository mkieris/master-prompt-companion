import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BeforeAfter } from "@/components/training/BeforeAfter";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { InteractiveExercise } from "@/components/training/InteractiveExercise";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { 
  FileText, Link, Image, Code, CheckCircle2, 
  AlertTriangle, ExternalLink
} from "lucide-react";

export const OnPageModule = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            OnPage-Optimierung
          </CardTitle>
          <CardDescription>
            Alle Faktoren, die Sie direkt auf Ihrer Seite kontrollieren können
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meta-Tags */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4 text-blue-500" />
                Meta-Tags: Title & Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Meta-Tags sind das Erste, was Nutzer in den Suchergebnissen sehen. Sie entscheiden über den Klick!
              </p>

              {/* Title Tag */}
              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">Title Tag (Meta-Titel)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Max. 60 Zeichen</Badge>
                    <Badge variant="outline">Keyword vorne</Badge>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">Ranking-Faktor</Badge>
                  </div>
                  <div className="p-3 bg-muted rounded mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Beispiel in den SERPs:</p>
                    <p className="text-blue-600 font-medium">Laufschuhe Test 2024: Die 10 besten Modelle | Sportmagazin</p>
                  </div>
                </div>
              </div>

              {/* Meta Description */}
              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">Meta Description</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Max. 160 Zeichen</Badge>
                    <Badge variant="outline">Call-to-Action</Badge>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600">Kein direkter Ranking-Faktor</Badge>
                  </div>
                  <div className="p-3 bg-muted rounded mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Beispiel:</p>
                    <p className="text-muted-foreground">Unser Experten-Test der besten Laufschuhe 2024 ✓ Alle Preisklassen ✓ Für Anfänger & Profis ✓ Jetzt vergleichen und das perfekte Modell finden!</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>💡 Wichtig:</strong> Google schreibt die Meta Description oft selbst um, wenn sie nicht zum Suchbegriff passt. 
                  Trotzdem lohnt sich eine gute Description – sie erhöht die CTR (Click-Through-Rate)!
                </p>
              </div>
            </CardContent>
          </Card>

          <BeforeAfter
            title="Meta-Titel Optimierung"
            before={{
              content: "Startseite | Mein Unternehmen GmbH",
              issues: [
                "Kein Keyword",
                "Kein Nutzenversprechen",
                "Verschwendet Zeichen",
                "Nicht klickwürdig"
              ]
            }}
            after={{
              content: "SEO Agentur München: Mehr Traffic & Rankings | Firmenname",
              improvements: [
                "Keyword vorne platziert",
                "Lokaler Bezug (München)",
                "Nutzenversprechen (Mehr Traffic)",
                "Marke am Ende"
              ]
            }}
            explanation="Der Meta-Titel ist einer der wichtigsten OnPage-Faktoren. Platzieren Sie das Keyword möglichst weit vorne und formulieren Sie ein klares Nutzenversprechen."
          />

          {/* Interne Verlinkung */}
          <Card className="bg-green-500/5 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Link className="h-4 w-4 text-green-500" />
                Interne Verlinkung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Interne Links verteilen Link-Equity (Ranking-Power) und helfen Google, Ihre Seitenstruktur zu verstehen.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 bg-background rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">🎯 Ziele der internen Verlinkung</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Wichtige Seiten stärken</li>
                    <li>• Themenrelevanz signalisieren</li>
                    <li>• Crawling erleichtern</li>
                    <li>• Nutzererfahrung verbessern</li>
                  </ul>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">📝 Best Practices</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Keyword-reiche Ankertexte nutzen</li>
                    <li>• Von starken auf schwache Seiten verlinken</li>
                    <li>• Kontextuelle Links im Fließtext</li>
                    <li>• Nicht zu viele Links pro Seite (&lt;100)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                <p className="text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Vermeiden:</strong> "Hier klicken" oder "Mehr erfahren" als Ankertext. 
                    Google braucht beschreibende Ankertexte, um den Kontext zu verstehen!
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bilder-SEO */}
          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4 text-purple-500" />
                Bilder-SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Bilder können über die Google Bildersuche zusätzlichen Traffic bringen – aber nur wenn sie optimiert sind.
              </p>

              <div className="space-y-3">
                {[
                  { label: "Alt-Text", desc: "Beschreibender Text für Screenreader und Google", example: "alt=\"Rote Nike Air Zoom Laufschuhe von der Seite\"", important: true },
                  { label: "Dateiname", desc: "Sprechender Name statt IMG_12345.jpg", example: "nike-air-zoom-laufschuhe-rot.jpg", important: true },
                  { label: "Dateigröße", desc: "Komprimieren für schnelle Ladezeiten", example: "WebP-Format, max. 200KB für große Bilder", important: false },
                  { label: "Lazy Loading", desc: "Bilder erst laden wenn sichtbar", example: "loading=\"lazy\" Attribut", important: false },
                ].map((item) => (
                  <div key={item.label} className={`p-3 rounded-lg border ${item.important ? 'bg-primary/5 border-primary/20' : 'bg-background'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.important && <Badge variant="outline" className="text-xs">Wichtig</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">{item.example}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <BestPracticeCard
            title="OnPage-Optimierung"
            dos={[
              "Meta-Titel mit Keyword am Anfang (max. 60 Zeichen)",
              "Meta-Description mit Call-to-Action (max. 160 Zeichen)",
              "Beschreibende Ankertexte für interne Links",
              "Alt-Texte für alle Bilder",
              "Sprechende Dateinamen für Bilder",
              "Bilder komprimieren (WebP-Format)"
            ]}
            donts={[
              "Gleiche Title/Description auf mehreren Seiten",
              "Ankertexte wie 'hier klicken'",
              "Bilder ohne Alt-Text",
              "Unkomprimierte Bilder",
              "Keyword-Stuffing in Meta-Tags"
            ]}
            proTip="Nutzen Sie die Screaming Frog SEO Spider (kostenlos bis 500 URLs), um alle OnPage-Faktoren Ihrer Website zu analysieren."
          />

          <InteractiveExercise
            title="Meta-Titel schreiben"
            description="Schreiben Sie einen optimierten Meta-Titel für eine Produktseite."
            task="Erstellen Sie einen Meta-Titel für eine Seite über 'Bio Kaffeebohnen aus Kolumbien' einer Kaffeerösterei namens 'Bohnenglück'."
            placeholder="Bio Kaffeebohnen Kolumbien..."
            criteria={[
              { id: "keyword", label: "Keyword enthalten", check: (t) => t.toLowerCase().includes("kaffeebohnen") || t.toLowerCase().includes("kaffee"), tip: "Der Titel sollte das Haupt-Keyword 'Kaffeebohnen' enthalten" },
              { id: "front", label: "Keyword vorne", check: (t) => t.toLowerCase().indexOf("kaffeebohnen") < 20 || t.toLowerCase().indexOf("kaffee") < 15, tip: "Platzieren Sie das Keyword möglichst am Anfang" },
              { id: "length", label: "Richtige Länge (max. 60 Zeichen)", check: (t) => t.length <= 65 && t.length >= 30, tip: "Der Titel sollte 30-60 Zeichen lang sein" },
              { id: "brand", label: "Marke enthalten", check: (t) => t.toLowerCase().includes("bohnenglück") || t.toLowerCase().includes("bohnengluck"), tip: "Fügen Sie den Markennamen hinzu (meist am Ende)" }
            ]}
            sampleSolution="Bio Kaffeebohnen aus Kolumbien | Fair Trade | Bohnenglück"
          />

          <QuizQuestion
            question="Was ist der wichtigste Faktor bei der internen Verlinkung?"
            options={[
              { id: "a", text: "Möglichst viele Links auf jeder Seite", isCorrect: false, explanation: "Qualität schlägt Quantität. Zu viele Links verwässern die Link-Equity." },
              { id: "b", text: "Beschreibende, keyword-reiche Ankertexte", isCorrect: true, explanation: "Richtig! Der Ankertext signalisiert Google, worum es auf der Zielseite geht." },
              { id: "c", text: "Immer auf die Startseite verlinken", isCorrect: false, explanation: "Die Startseite hat meist genug Links. Stärken Sie wichtige Unterseiten!" },
              { id: "d", text: "Links nur im Footer platzieren", isCorrect: false, explanation: "Kontextuelle Links im Fließtext sind wertvoller als Footer-Links." }
            ]}
          />

          <KeyTakeaway
            points={[
              "Meta-Titel: Max. 60 Zeichen, Keyword vorne, Nutzenversprechen",
              "Meta-Description: Max. 160 Zeichen, Call-to-Action, erhöht CTR",
              "Interne Verlinkung: Keyword-reiche Ankertexte, von stark zu schwach",
              "Bilder: Alt-Text, sprechende Dateinamen, Komprimierung",
              "Jede Seite braucht einen einzigartigen Titel und Description"
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};
