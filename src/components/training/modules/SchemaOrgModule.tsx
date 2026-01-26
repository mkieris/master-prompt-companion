import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import {
  Code, FileJson, CheckCircle2, AlertTriangle, Copy,
  ShoppingCart, FileText, HelpCircle, ListOrdered, Star,
  Building2, Calendar, Video, Briefcase
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

export const SchemaOrgModule = () => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({ title: "Code kopiert!", description: "Der Schema-Code wurde in die Zwischenablage kopiert." });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const schemaExamples = {
    article: `{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "SEO-Grundlagen: Der ultimative Guide 2024",
  "author": {
    "@type": "Person",
    "name": "Max Mustermann",
    "url": "https://example.com/autor/max"
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-06-20",
  "image": "https://example.com/images/seo-guide.jpg",
  "publisher": {
    "@type": "Organization",
    "name": "SEO Magazin",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  }
}`,
    product: `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nike Air Zoom Laufschuhe",
  "image": "https://example.com/nike-air-zoom.jpg",
  "description": "Leichte Laufschuhe für Marathon und Training",
  "brand": {
    "@type": "Brand",
    "name": "Nike"
  },
  "offers": {
    "@type": "Offer",
    "price": "129.99",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "url": "https://example.com/nike-air-zoom"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "127"
  }
}`,
    faq: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Was ist SEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SEO (Search Engine Optimization) ist die Optimierung von Websites für Suchmaschinen, um bessere Rankings zu erzielen."
      }
    },
    {
      "@type": "Question",
      "name": "Wie lange dauert SEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SEO-Ergebnisse zeigen sich typischerweise nach 3-6 Monaten, abhängig von Wettbewerb und Maßnahmen."
      }
    }
  ]
}`,
    howto: `{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Meta-Title optimieren",
  "description": "Schritt-für-Schritt Anleitung zur Meta-Title Optimierung",
  "totalTime": "PT10M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Keyword recherchieren",
      "text": "Finden Sie das Haupt-Keyword für Ihre Seite"
    },
    {
      "@type": "HowToStep",
      "name": "Keyword platzieren",
      "text": "Setzen Sie das Keyword an den Anfang des Titles"
    },
    {
      "@type": "HowToStep",
      "name": "Länge prüfen",
      "text": "Stellen Sie sicher, dass der Title maximal 60 Zeichen hat"
    }
  ]
}`,
    localbusiness: `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "SEO Agentur München",
  "image": "https://example.com/agentur.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Marienplatz 1",
    "addressLocality": "München",
    "postalCode": "80331",
    "addressCountry": "DE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "48.137154",
    "longitude": "11.576124"
  },
  "telephone": "+49-89-123456",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "priceRange": "€€"
}`
  };

  return (
    <div className="space-y-6">
      {/* Einführung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Schema.org & Strukturierte Daten
          </CardTitle>
          <CardDescription>
            Rich Snippets, bessere CTR und Featured Snippets durch strukturierte Daten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700 mb-1">Warum Schema.org wichtig ist</p>
                <p className="text-sm text-muted-foreground">
                  Strukturierte Daten helfen Google, Ihre Inhalte besser zu verstehen. Sie ermöglichen
                  <strong className="text-foreground"> Rich Snippets</strong> in den Suchergebnissen (Sterne, Preise, FAQs),
                  die die <strong className="text-foreground">CTR um bis zu 30%</strong> steigern können.
                </p>
              </div>
            </div>
          </div>

          {/* Was sind strukturierte Daten */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <FileJson className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">JSON-LD Format</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Von Google empfohlen. Script-Tag im Head oder Body.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Rich Snippets</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Sterne, Preise, Verfügbarkeit direkt in den SERPs.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/5 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <HelpCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">FAQ Snippets</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Fragen & Antworten direkt unter Ihrem Suchergebnis.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Die wichtigsten Schema-Typen */}
          <h3 className="text-lg font-semibold">Die wichtigsten Schema-Typen</h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: FileText, name: "Article", use: "Blog-Artikel, News", color: "blue" },
              { icon: ShoppingCart, name: "Product", use: "Produktseiten", color: "green" },
              { icon: HelpCircle, name: "FAQPage", use: "FAQ-Bereiche", color: "purple" },
              { icon: ListOrdered, name: "HowTo", use: "Anleitungen", color: "orange" },
              { icon: Building2, name: "LocalBusiness", use: "Lokale Unternehmen", color: "red" },
              { icon: Calendar, name: "Event", use: "Veranstaltungen", color: "amber" },
              { icon: Video, name: "VideoObject", use: "Videos", color: "pink" },
              { icon: Briefcase, name: "JobPosting", use: "Stellenanzeigen", color: "cyan" },
            ].map((schema) => (
              <div key={schema.name} className={`p-3 rounded-lg border bg-${schema.color}-500/5 border-${schema.color}-500/20`}>
                <div className="flex items-center gap-2 mb-1">
                  <schema.icon className={`h-4 w-4 text-${schema.color}-500`} />
                  <span className="font-medium text-sm">{schema.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{schema.use}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Praktische Beispiele */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            JSON-LD Codebeispiele zum Kopieren
          </CardTitle>
          <CardDescription>
            Fertige Templates für die häufigsten Anwendungsfälle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {/* Article Schema */}
            <AccordionItem value="article" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Article Schema</span>
                  <Badge className="bg-blue-500">Blog & News</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Für Blog-Artikel, News-Beiträge und redaktionelle Inhalte. Zeigt Autor, Datum und Publisher in den SERPs.
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{schemaExamples.article}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(schemaExamples.article, 'article')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'article' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                  <p className="text-xs">
                    <strong>Pflichtfelder:</strong> headline, author, datePublished, image, publisher
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Product Schema */}
            <AccordionItem value="product" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Product Schema</span>
                  <Badge className="bg-green-500">E-Commerce</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Für Produktseiten. Zeigt Preis, Verfügbarkeit und Bewertungen direkt in den Suchergebnissen.
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{schemaExamples.product}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(schemaExamples.product, 'product')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'product' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-green-500/10 p-2 rounded">
                    <strong>Ergebnis:</strong> Preis, Sterne, Verfügbarkeit in SERPs
                  </div>
                  <div className="bg-blue-500/10 p-2 rounded">
                    <strong>CTR-Boost:</strong> Bis zu 30% mehr Klicks
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* FAQ Schema */}
            <AccordionItem value="faq" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">FAQ Schema</span>
                  <Badge className="bg-purple-500">Sehr effektiv</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Zeigt Fragen und Antworten direkt unter Ihrem Suchergebnis. Nimmt mehr Platz in den SERPs ein!
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{schemaExamples.faq}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(schemaExamples.faq, 'faq')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'faq' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                  <p className="text-xs flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Wichtig:</strong> FAQ-Schema nur auf Seiten verwenden, die tatsächlich FAQs enthalten.
                      Missbrauch kann zu Abstrafungen führen!
                    </span>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* HowTo Schema */}
            <AccordionItem value="howto" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <ListOrdered className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">HowTo Schema</span>
                  <Badge className="bg-orange-500">Anleitungen</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Für Schritt-für-Schritt-Anleitungen. Kann als expandierbare Liste in den SERPs erscheinen.
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{schemaExamples.howto}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(schemaExamples.howto, 'howto')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'howto' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* LocalBusiness Schema */}
            <AccordionItem value="localbusiness" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-red-500" />
                  <span className="font-semibold">LocalBusiness Schema</span>
                  <Badge className="bg-red-500">Local SEO</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Für lokale Unternehmen. Unterstützt das Google Business Profile und Local Pack Rankings.
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{schemaExamples.localbusiness}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(schemaExamples.localbusiness, 'localbusiness')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'localbusiness' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Implementierung */}
      <Card>
        <CardHeader>
          <CardTitle>Implementierung & Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">So implementieren Sie JSON-LD:</h4>
                <ol className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">1</span>
                    <span>JSON-LD Code erstellen (Templates oben nutzen)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">2</span>
                    <span>Code in <code className="bg-muted px-1 rounded">&lt;script type="application/ld+json"&gt;</code> einbetten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">3</span>
                    <span>Im <code className="bg-muted px-1 rounded">&lt;head&gt;</code> oder vor <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> einfügen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">4</span>
                    <span>Mit Rich Results Test validieren</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Testing Tools:</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Rich Results Test</strong>
                      <p className="text-xs text-muted-foreground">search.google.com/test/rich-results</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Schema Markup Validator</strong>
                      <p className="text-xs text-muted-foreground">validator.schema.org</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Google Search Console</strong>
                      <p className="text-xs text-muted-foreground">Enhancements Report</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <BestPracticeCard
            title="Schema.org Implementierung"
            dos={[
              "JSON-LD Format verwenden (von Google empfohlen)",
              "Nur relevante Schema-Typen für den Inhalt nutzen",
              "Alle Pflichtfelder ausfüllen",
              "Schema mit Rich Results Test validieren",
              "Schema-Daten aktuell halten (Preise, Verfügbarkeit)",
              "Mehrere Schema-Typen pro Seite sind erlaubt"
            ]}
            donts={[
              "Schema für nicht vorhandene Inhalte hinzufügen",
              "Fake-Bewertungen im Schema angeben",
              "FAQ-Schema auf Seiten ohne echte FAQs",
              "Veraltete Preise oder Verfügbarkeit",
              "Schema.org als Ranking-Trick missbrauchen"
            ]}
            proTip="Prüfen Sie in der Google Search Console unter 'Verbesserungen', ob Ihre strukturierten Daten erkannt werden und ob es Fehler gibt."
          />

          <QuizQuestion
            question="Welches Format empfiehlt Google für strukturierte Daten?"
            options={[
              { id: "a", text: "Microdata", isCorrect: false, explanation: "Microdata funktioniert, aber Google empfiehlt JSON-LD." },
              { id: "b", text: "JSON-LD", isCorrect: true, explanation: "Richtig! JSON-LD ist das von Google empfohlene Format, da es einfach zu implementieren und zu warten ist." },
              { id: "c", text: "RDFa", isCorrect: false, explanation: "RDFa wird unterstützt, aber JSON-LD ist die bessere Wahl." },
              { id: "d", text: "XML", isCorrect: false, explanation: "XML ist kein gültiges Format für Schema.org Markup." }
            ]}
          />

          <KeyTakeaway
            points={[
              "Strukturierte Daten ermöglichen Rich Snippets in den SERPs",
              "JSON-LD ist das von Google empfohlene Format",
              "FAQ und Product Schema haben den größten CTR-Impact",
              "Immer mit dem Rich Results Test validieren",
              "Schema muss zum tatsächlichen Seiteninhalt passen"
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};
