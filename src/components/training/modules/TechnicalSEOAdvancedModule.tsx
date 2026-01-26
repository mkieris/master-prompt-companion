import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { BeforeAfter } from "@/components/training/BeforeAfter";
import {
  FileCode, FileText, Link, Copy, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, Globe, RefreshCw, Server
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

export const TechnicalSEOAdvancedModule = () => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast({ title: "Code kopiert!" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const robotsExamples = {
    basic: `# robots.txt für example.com
User-agent: *
Allow: /

# Sitemap Location
Sitemap: https://example.com/sitemap.xml`,
    advanced: `# robots.txt - Erweiterte Konfiguration
User-agent: *
Disallow: /admin/
Disallow: /wp-admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /my-account/
Disallow: /*?s=
Disallow: /*?filter=
Disallow: /tag/
Allow: /wp-admin/admin-ajax.php

# Crawl-Delay (optional, wird von Google ignoriert)
# Crawl-delay: 10

# Sitemap
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-products.xml`,
    ecommerce: `# robots.txt für E-Commerce
User-agent: *

# Wichtige Seiten erlauben
Allow: /
Allow: /produkte/
Allow: /kategorien/

# Interne Seiten blockieren
Disallow: /warenkorb/
Disallow: /kasse/
Disallow: /mein-konto/
Disallow: /wunschliste/

# Filterseiten blockieren (Duplicate Content!)
Disallow: /*?farbe=
Disallow: /*?groesse=
Disallow: /*?sortierung=
Disallow: /*?seite=

# Suchergebnisse blockieren
Disallow: /suche/
Disallow: /*?s=

# Admin & System
Disallow: /wp-admin/
Disallow: /wp-includes/
Allow: /wp-admin/admin-ajax.php

Sitemap: https://example.com/sitemap_index.xml`
  };

  const sitemapExample = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/produkte/</loc>
    <lastmod>2024-01-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/blog/seo-guide/</loc>
    <lastmod>2024-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

  const sitemapIndexExample = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap-pages.xml</loc>
    <lastmod>2024-01-15</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-posts.xml</loc>
    <lastmod>2024-01-14</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap-products.xml</loc>
    <lastmod>2024-01-13</lastmod>
  </sitemap>
</sitemapindex>`;

  return (
    <div className="space-y-6">
      {/* Einführung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Technische SEO: Vertiefung
          </CardTitle>
          <CardDescription>
            Praktische Anleitungen für robots.txt, XML-Sitemap, Canonical Tags und Redirects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              In diesem Modul lernen Sie die <strong>praktische Umsetzung</strong> der wichtigsten technischen SEO-Elemente.
              Mit den Code-Beispielen können Sie direkt loslegen.
            </p>
          </div>

          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { icon: FileCode, name: "robots.txt", desc: "Crawling steuern" },
              { icon: FileText, name: "XML-Sitemap", desc: "URLs für Google" },
              { icon: Link, name: "Canonical Tags", desc: "Duplicate Content" },
              { icon: RefreshCw, name: "Redirects", desc: "URLs weiterleiten" },
            ].map((item) => (
              <Card key={item.name} className="bg-muted/30">
                <CardContent className="p-3 text-center">
                  <item.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <span className="font-medium text-sm block">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.desc}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* robots.txt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-500" />
            robots.txt erstellen
            <Badge className="bg-blue-500">Crawling</Badge>
          </CardTitle>
          <CardDescription>
            Steuern Sie, welche Seiten Google crawlen darf
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-3">Wichtige Direktiven:</h4>
              <ul className="text-sm space-y-2">
                <li><code className="bg-background px-2 py-1 rounded">User-agent: *</code> - Gilt für alle Bots</li>
                <li><code className="bg-background px-2 py-1 rounded">Allow: /</code> - Erlaubt Crawling</li>
                <li><code className="bg-background px-2 py-1 rounded">Disallow: /admin/</code> - Blockiert Pfad</li>
                <li><code className="bg-background px-2 py-1 rounded">Sitemap:</code> - Verweist auf Sitemap</li>
              </ul>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
              <h4 className="font-semibold text-red-700 mb-3">Wichtig zu wissen:</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• robots.txt blockiert nur das <strong>Crawling</strong>, nicht die Indexierung!</li>
                <li>• Für Nicht-Indexierung: <code>noindex</code> Meta-Tag verwenden</li>
                <li>• robots.txt muss im Root-Verzeichnis liegen</li>
              </ul>
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="basic" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Basis robots.txt</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{robotsExamples.basic}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(robotsExamples.basic, 'robots-basic')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'robots-basic' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="advanced" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Erweiterte robots.txt (WordPress)</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{robotsExamples.advanced}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(robotsExamples.advanced, 'robots-advanced')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'robots-advanced' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ecommerce" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">E-Commerce robots.txt</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{robotsExamples.ecommerce}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(robotsExamples.ecommerce, 'robots-ecom')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'robots-ecom' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* XML-Sitemap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            XML-Sitemap erstellen
            <Badge className="bg-green-500">Indexierung</Badge>
          </CardTitle>
          <CardDescription>
            Helfen Sie Google, alle wichtigen Seiten zu finden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">Was gehört in die Sitemap:</h4>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Alle indexierbaren Seiten</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Nur URLs mit Status 200</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Kanonische URLs</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Letzte Änderung (lastmod)</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">Was NICHT rein gehört:</h4>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />noindex-Seiten</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />Redirects (301/302)</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />404-Fehlerseiten</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />Nicht-kanonische URLs</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="sitemap" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Einfache XML-Sitemap</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{sitemapExample}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(sitemapExample, 'sitemap')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'sitemap' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
                <div className="mt-3 p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-xs">
                    <strong>Hinweis:</strong> <code>changefreq</code> und <code>priority</code> werden von Google weitgehend ignoriert.
                    <code>lastmod</code> ist der wichtigste optionale Tag.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sitemap-index" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Sitemap Index (für große Websites)</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Bei mehr als 50.000 URLs oder 50MB pro Sitemap: Mehrere Sitemaps mit einem Index verknüpfen.
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    <code>{sitemapIndexExample}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(sitemapIndexExample, 'sitemap-index')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedCode === 'sitemap-index' ? 'Kopiert!' : 'Kopieren'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Sitemap einreichen:</h4>
            <ol className="text-sm space-y-1">
              <li>1. Google Search Console öffnen</li>
              <li>2. Sitemaps → Neue Sitemap hinzufügen</li>
              <li>3. URL eingeben: <code className="bg-muted px-2 py-1 rounded">sitemap.xml</code></li>
              <li>4. Senden klicken</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Canonical Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-purple-500" />
            Canonical Tags
            <Badge className="bg-purple-500">Duplicate Content</Badge>
          </CardTitle>
          <CardDescription>
            Die Originalversion einer Seite definieren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/20">
            <p className="text-sm text-muted-foreground">
              Canonical Tags sagen Google: "Diese URL ist die Originalversion. Bitte diese URL indexieren, nicht die Varianten."
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">So sieht ein Canonical Tag aus:</h4>
            <code className="text-sm bg-background px-3 py-2 rounded block">
              &lt;link rel="canonical" href="https://example.com/seite/" /&gt;
            </code>
            <p className="text-xs text-muted-foreground mt-2">Platzierung: Im &lt;head&gt; Bereich jeder Seite</p>
          </div>

          <h4 className="font-semibold">Wann Canonical Tags verwenden?</h4>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "URL-Parameter",
                problem: "example.com/schuhe\nexample.com/schuhe?farbe=rot\nexample.com/schuhe?sort=preis",
                solution: "Alle zeigen auf:\nexample.com/schuhe",
                color: "blue"
              },
              {
                title: "HTTP vs. HTTPS",
                problem: "http://example.com/seite\nhttps://example.com/seite",
                solution: "Canonical auf HTTPS:\nhttps://example.com/seite",
                color: "green"
              },
              {
                title: "www vs. non-www",
                problem: "www.example.com/seite\nexample.com/seite",
                solution: "Eine Version wählen\nund konsistent bleiben",
                color: "orange"
              },
              {
                title: "Trailing Slash",
                problem: "example.com/seite\nexample.com/seite/",
                solution: "Eine Version wählen\nund Canonical setzen",
                color: "purple"
              }
            ].map((item) => (
              <Card key={item.title} className={`bg-${item.color}-500/5 border-${item.color}-500/20`}>
                <CardContent className="p-4">
                  <h5 className="font-semibold text-sm mb-2">{item.title}</h5>
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                    <div className="p-2 bg-red-500/10 rounded text-xs">
                      <span className="text-red-700 font-medium">Problem:</span>
                      <pre className="whitespace-pre-wrap mt-1">{item.problem}</pre>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="p-2 bg-green-500/10 rounded text-xs">
                      <span className="text-green-700 font-medium">Lösung:</span>
                      <pre className="whitespace-pre-wrap mt-1">{item.solution}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-700 mb-1">Häufige Canonical-Fehler</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Canonical auf 404- oder Redirect-Seiten</li>
                  <li>• Canonical auf noindex-Seiten</li>
                  <li>• Canonical-Ketten (A → B → C)</li>
                  <li>• Paginierte Seiten alle auf Seite 1 canonicalisieren</li>
                  <li>• Canonical vergessen (selbstreferenzierend fehlt)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redirects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-orange-500" />
            Redirects richtig einsetzen
            <Badge className="bg-orange-500">URL-Management</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <Badge className="bg-green-500 mb-2">301</Badge>
                <h4 className="font-semibold text-sm">Permanent Redirect</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Für dauerhafte Weiterleitungen. Überträgt ~90% der Link-Equity.
                </p>
                <p className="text-xs font-medium text-green-700 mt-2">Nutzen für: URL-Änderungen, Domain-Umzug</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4">
                <Badge className="bg-amber-500 mb-2">302</Badge>
                <h4 className="font-semibold text-sm">Temporary Redirect</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Für temporäre Weiterleitungen. Alte URL bleibt im Index.
                </p>
                <p className="text-xs font-medium text-amber-700 mt-2">Nutzen für: A/B-Tests, Wartungsseiten</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <Badge className="bg-red-500 mb-2">Ketten</Badge>
                <h4 className="font-semibold text-sm">Redirect Chains</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  A → B → C → D verliert Equity und verlangsamt Crawling.
                </p>
                <p className="text-xs font-medium text-red-700 mt-2">Vermeiden! Max. 1 Hop: A → D</p>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Redirect in .htaccess (Apache):</h4>
            <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`# Einzelne URL weiterleiten
Redirect 301 /alte-seite/ https://example.com/neue-seite/

# Mit RegEx (RewriteRule)
RewriteEngine On
RewriteRule ^alte-kategorie/(.*)$ /neue-kategorie/$1 [R=301,L]

# HTTP zu HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]`}
            </pre>
          </div>

          <BeforeAfter
            title="Redirect Chain auflösen"
            before={{
              content: "/seite-v1/ → /seite-v2/ → /seite-v3/ → /seite-final/",
              issues: [
                "3 Redirects = viel Equity-Verlust",
                "Langsames Crawling",
                "Schlechte User Experience",
                "Kann zu Crawl-Budget-Verschwendung führen"
              ]
            }}
            after={{
              content: "/seite-v1/ → /seite-final/\n/seite-v2/ → /seite-final/\n/seite-v3/ → /seite-final/",
              improvements: [
                "Alle alten URLs direkt auf Ziel",
                "Maximale Equity-Übertragung",
                "Schnelles Crawling",
                "Bessere User Experience"
              ]
            }}
          />
        </CardContent>
      </Card>

      <BestPracticeCard
        title="Technische SEO Implementierung"
        dos={[
          "robots.txt im Root-Verzeichnis platzieren",
          "Sitemap mit nur indexierbaren 200er URLs",
          "Selbstreferenzierende Canonicals auf jeder Seite",
          "301-Redirects für permanente URL-Änderungen",
          "Redirect Chains auf maximal 1 Hop reduzieren",
          "Alle Konfigurationen in GSC verifizieren"
        ]}
        donts={[
          "Wichtige Seiten in robots.txt blockieren",
          "Redirects oder 404s in der Sitemap",
          "Canonical auf nicht-existente URLs",
          "302 statt 301 für permanente Änderungen",
          "Lange Redirect-Ketten ignorieren",
          "Änderungen ohne Testing deployen"
        ]}
        proTip="Nutzen Sie Screaming Frog, um alle technischen Probleme auf einmal zu identifizieren. Der kostenlose Plan reicht für bis zu 500 URLs."
      />

      <QuizQuestion
        question="Wann sollten Sie einen 301-Redirect statt eines 302-Redirects verwenden?"
        options={[
          { id: "a", text: "Für temporäre Wartungsseiten", isCorrect: false, explanation: "Für temporäre Weiterleitungen ist 302 richtig." },
          { id: "b", text: "Für dauerhafte URL-Änderungen", isCorrect: true, explanation: "Richtig! 301 signalisiert Google, dass die Änderung permanent ist und überträgt Link-Equity." },
          { id: "c", text: "Für A/B-Tests", isCorrect: false, explanation: "A/B-Tests sind temporär, also 302." },
          { id: "d", text: "Es macht keinen Unterschied", isCorrect: false, explanation: "Falsch! 301 überträgt Link-Equity, 302 nicht." }
        ]}
      />

      <KeyTakeaway
        points={[
          "robots.txt steuert Crawling, nicht Indexierung (dafür noindex)",
          "XML-Sitemap nur mit indexierbaren 200er URLs befüllen",
          "Jede Seite braucht einen selbstreferenzierenden Canonical Tag",
          "301 für permanente, 302 für temporäre Redirects",
          "Redirect Chains vermeiden: Immer direkt auf das finale Ziel"
        ]}
      />
    </div>
  );
};
