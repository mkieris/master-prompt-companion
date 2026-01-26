import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import {
  Globe, Languages, CheckCircle2, XCircle, AlertTriangle,
  Code, Copy, Flag
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const InternationalSEOModule = () => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({ title: "Code kopiert!" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const hreflangExample = `<!-- Auf der deutschen Seite (example.com/de/produkt/) -->
<link rel="alternate" hreflang="de" href="https://example.com/de/produkt/" />
<link rel="alternate" hreflang="en" href="https://example.com/en/product/" />
<link rel="alternate" hreflang="fr" href="https://example.com/fr/produit/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/en/product/" />`;

  const hreflangCountryExample = `<!-- Sprache + Land Targeting -->
<link rel="alternate" hreflang="de-DE" href="https://example.de/produkt/" />
<link rel="alternate" hreflang="de-AT" href="https://example.at/produkt/" />
<link rel="alternate" hreflang="de-CH" href="https://example.ch/produkt/" />
<link rel="alternate" hreflang="en-US" href="https://example.com/product/" />
<link rel="alternate" hreflang="en-GB" href="https://example.co.uk/product/" />
<link rel="alternate" hreflang="x-default" href="https://example.com/product/" />`;

  return (
    <div className="space-y-6">
      {/* Einführung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Internationales SEO
          </CardTitle>
          <CardDescription>
            Mehrsprachige Websites und hreflang-Tags richtig implementieren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              Internationales SEO stellt sicher, dass Nutzer in verschiedenen Ländern und Sprachen
              die <strong>richtige Version</strong> Ihrer Website finden. Der Schlüssel dazu ist das
              <strong> hreflang-Attribut</strong>.
            </p>
          </div>

          {/* URL-Strukturen */}
          <h3 className="font-semibold text-lg">URL-Strukturen für internationale Websites</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                name: "ccTLD",
                example: "example.de\nexample.fr\nexample.co.uk",
                pros: ["Klares Geo-Signal", "Vertrauen bei lokalen Nutzern"],
                cons: ["Mehrere Domains verwalten", "Link-Equity nicht übertragbar", "Teuer"],
                recommendation: "Für große Unternehmen mit lokaler Präsenz"
              },
              {
                name: "Subdomain",
                example: "de.example.com\nfr.example.com\nuk.example.com",
                pros: ["Einfach einzurichten", "Separate Server möglich"],
                cons: ["Schwächeres Geo-Signal", "Wie separate Domains behandelt"],
                recommendation: "Für mittelgroße internationale Websites"
              },
              {
                name: "Unterverzeichnis",
                example: "example.com/de/\nexample.com/fr/\nexample.com/en-gb/",
                pros: ["Eine Domain, alle Equity", "Einfach zu verwalten", "Günstig"],
                cons: ["Server im einen Land", "Weniger lokales Vertrauen"],
                recommendation: "Für die meisten Websites empfohlen"
              }
            ].map((structure) => (
              <Card key={structure.name} className="bg-muted/30">
                <CardContent className="p-4">
                  <Badge className="mb-2">{structure.name}</Badge>
                  <pre className="text-xs bg-background p-2 rounded mb-3">{structure.example}</pre>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-green-700">Vorteile:</p>
                      <ul className="text-xs space-y-1">
                        {structure.pros.map((pro, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />{pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-700">Nachteile:</p>
                      <ul className="text-xs space-y-1">
                        {structure.cons.map((con, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />{con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-blue-500/10 rounded text-xs">
                    <strong>Empfehlung:</strong> {structure.recommendation}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* hreflang */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-blue-500" />
            hreflang-Tags implementieren
            <Badge className="bg-blue-500">Wichtig</Badge>
          </CardTitle>
          <CardDescription>
            Sagen Sie Google, welche Sprachversion für welche Nutzer gedacht ist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Was macht hreflang?</h4>
            <p className="text-sm text-muted-foreground">
              hreflang-Tags sagen Google: "Diese Seite existiert auch in anderen Sprachen/Ländern.
              Zeige Nutzern aus Deutschland die deutsche Version, Nutzern aus den USA die englische Version."
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="basic" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Nur Sprache (de, en, fr)</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Verwenden Sie nur den Sprachcode, wenn Sie keine länderspezifischen Versionen haben.
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{hreflangExample}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(hreflangExample, 'hreflang-basic')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'hreflang-basic' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="country" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Sprache + Land (de-DE, de-AT, en-US)</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Für länderspezifische Versionen (z.B. verschiedene Preise, Währungen, Inhalte).
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{hreflangCountryExample}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(hreflangCountryExample, 'hreflang-country')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'hreflang-country' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* x-default */}
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-amber-500" />
                Was ist x-default?
              </h4>
              <p className="text-sm text-muted-foreground">
                <code className="bg-muted px-2 py-1 rounded">hreflang="x-default"</code> ist die Fallback-Version
                für Nutzer, deren Sprache/Land nicht abgedeckt ist. Meist die englische oder die Hauptversion.
              </p>
            </CardContent>
          </Card>

          {/* Wichtige Regeln */}
          <h4 className="font-semibold">Wichtige hreflang-Regeln</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <h5 className="font-semibold text-sm text-green-700 mb-2">Richtig:</h5>
                <ul className="text-xs space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                    <span>Jede Seite verlinkt auf ALLE Sprachversionen (inkl. sich selbst)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                    <span>Rückverweise: A→B und B→A müssen beide existieren</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                    <span>x-default für die Fallback-Seite angeben</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                    <span>Absolute URLs verwenden</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <h5 className="font-semibold text-sm text-red-700 mb-2">Falsch:</h5>
                <ul className="text-xs space-y-2">
                  <li className="flex items-start gap-2">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                    <span>Nur von A nach B verlinken, nicht zurück</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                    <span>Relative URLs verwenden</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                    <span>hreflang auf noindex-Seiten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                    <span>Falsche Sprachcodes (de-DE statt DE-de)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Häufige Fehler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Häufige internationale SEO-Fehler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              {
                error: "Automatische Redirects nach Geo-IP",
                problem: "Google crawlt von den USA – sieht nur die US-Version",
                solution: "Keine Redirects! Stattdessen Banner mit Sprachwahl anzeigen"
              },
              {
                error: "Gleicher Content, nur andere Währung",
                problem: "Duplicate Content zwischen Länderversionen",
                solution: "Content lokalisieren oder Canonical auf Hauptversion"
              },
              {
                error: "Maschinelle Übersetzung ohne Review",
                problem: "Schlechte Qualität, E-E-A-T-Probleme",
                solution: "Übersetzungen immer von Muttersprachlern prüfen lassen"
              },
              {
                error: "hreflang nur auf der Startseite",
                problem: "Unterseiten werden nicht zugeordnet",
                solution: "hreflang auf JEDER Seite mit Sprachversion"
              }
            ].map((item, i) => (
              <Card key={i} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">{item.error}</p>
                      <p className="text-xs text-muted-foreground mt-1"><strong>Problem:</strong> {item.problem}</p>
                      <p className="text-xs text-green-700 mt-1"><strong>Lösung:</strong> {item.solution}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testing */}
      <Card>
        <CardHeader>
          <CardTitle>hreflang testen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">Tools zum Testen:</h4>
                <ul className="text-xs space-y-2">
                  <li>• <strong>Google Search Console:</strong> International Targeting Report</li>
                  <li>• <strong>Ahrefs:</strong> Site Audit → hreflang Errors</li>
                  <li>• <strong>Screaming Frog:</strong> hreflang Tab</li>
                  <li>• <strong>hreflang.org:</strong> Kostenloser Validator</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">Was prüfen:</h4>
                <ul className="text-xs space-y-2">
                  <li>• Alle Sprachversionen haben hreflang</li>
                  <li>• Rückverweise sind vorhanden</li>
                  <li>• Keine 404er oder Redirects in hreflang</li>
                  <li>• Sprachcodes sind korrekt (ISO 639-1)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <BestPracticeCard
        title="Internationales SEO"
        dos={[
          "hreflang auf jeder Seite mit allen Sprachversionen",
          "Gegenseitige Verlinkung (A→B und B→A)",
          "x-default für die Fallback-Version",
          "Content lokalisieren, nicht nur übersetzen",
          "Google Search Console für jede Sprachversion einrichten",
          "Absolute URLs in hreflang verwenden"
        ]}
        donts={[
          "Automatische Geo-IP Redirects",
          "hreflang auf noindex-Seiten",
          "Maschinelle Übersetzung ohne Review",
          "Nur Währung/Preise ändern ohne Content-Anpassung",
          "Falsche Sprachcodes verwenden",
          "hreflang vergessen bei neuen Seiten"
        ]}
        proTip="Für große internationale Websites: Implementieren Sie hreflang per XML-Sitemap statt HTML-Tags. Das ist einfacher zu verwalten."
      />

      <QuizQuestion
        question="Was passiert, wenn hreflang-Tags keine Rückverweise haben (A verlinkt auf B, aber B nicht auf A)?"
        options={[
          { id: "a", text: "Google ignoriert die hreflang-Tags", isCorrect: true, explanation: "Richtig! Ohne gegenseitige Verlinkung werden hreflang-Tags ignoriert." },
          { id: "b", text: "Nur die Seite mit den Tags wird zugeordnet", isCorrect: false, explanation: "Nein, ohne Rückverweise funktioniert hreflang nicht." },
          { id: "c", text: "Google zeigt eine Fehlermeldung in der GSC", isCorrect: false, explanation: "Es gibt zwar Warnungen, aber der Haupteffekt ist, dass hreflang ignoriert wird." },
          { id: "d", text: "Es macht keinen Unterschied", isCorrect: false, explanation: "Falsch! Rückverweise sind zwingend erforderlich." }
        ]}
      />

      <KeyTakeaway
        points={[
          "hreflang sagt Google, welche Sprachversion für welche Nutzer",
          "Unterverzeichnisse (/de/, /en/) sind für die meisten Websites optimal",
          "Jede Sprachversion muss auf ALLE anderen verlinken (inkl. sich selbst)",
          "x-default ist die Fallback-Version für nicht abgedeckte Sprachen",
          "Keine automatischen Geo-IP Redirects – Google crawlt aus den USA!"
        ]}
      />
    </div>
  );
};
