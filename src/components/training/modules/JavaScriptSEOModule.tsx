import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import {
  Code, AlertTriangle, CheckCircle2, XCircle, Zap,
  Eye, Server, Clock, Globe, FileCode
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const JavaScriptSEOModule = () => {
  return (
    <div className="space-y-6">
      {/* Einführung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            JavaScript SEO
          </CardTitle>
          <CardDescription>
            Wie Google JavaScript verarbeitet und wie Sie JS-basierte Websites optimieren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-700 mb-1">Warum ist JavaScript SEO wichtig?</p>
                <p className="text-sm text-muted-foreground">
                  Moderne Websites (React, Vue, Angular) rendern Inhalte oft mit JavaScript.
                  Google kann JS ausführen, aber es gibt <strong>Verzögerungen und Einschränkungen</strong>.
                  Ohne Optimierung können wichtige Inhalte nicht oder verzögert indexiert werden.
                </p>
              </div>
            </div>
          </div>

          {/* Wie Google JS verarbeitet */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Wie Google JavaScript verarbeitet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {[
                  { step: "1", title: "Crawling", desc: "HTML wird heruntergeladen", icon: Globe, time: "Sofort" },
                  { step: "2", title: "Indexierung", desc: "Initialer HTML-Content", icon: FileCode, time: "Schnell" },
                  { step: "3", title: "Rendering", desc: "JS wird ausgeführt", icon: Code, time: "Verzögert!" },
                  { step: "4", title: "Re-Indexierung", desc: "Gerenderter Content", icon: Eye, time: "Tage/Wochen" },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center gap-2">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
                        {item.step}
                      </div>
                      <item.icon className="h-5 w-5 mx-auto text-primary mb-1" />
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                      <Badge variant="outline" className={`mt-1 text-xs ${item.time === "Verzögert!" ? "bg-red-500/10 text-red-700" : ""}`}>
                        {item.time}
                      </Badge>
                    </div>
                    {index < 3 && <span className="text-2xl text-muted-foreground hidden sm:block">→</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-red-500/10 rounded-lg">
                <p className="text-sm text-center">
                  <strong>Das Problem:</strong> Zwischen Schritt 2 und 4 können <strong>Tage bis Wochen</strong> vergehen!
                  In dieser Zeit ist Ihr JS-Content möglicherweise nicht indexiert.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Rendering-Strategien */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-500" />
            Rendering-Strategien im Vergleich
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {[
              {
                name: "Client-Side Rendering (CSR)",
                desc: "JavaScript rendert im Browser des Nutzers",
                seo: "Problematisch",
                color: "red",
                pros: ["Schnelle initiale Ladezeit", "Interaktiv nach Laden"],
                cons: ["Google muss JS ausführen", "Verzögerte Indexierung", "Crawl-Budget-Verschwendung"]
              },
              {
                name: "Server-Side Rendering (SSR)",
                desc: "Server liefert fertiges HTML aus",
                seo: "Optimal",
                color: "green",
                pros: ["Sofort indexierbarer Content", "Kein JS für Google nötig", "Schnellere Indexierung"],
                cons: ["Höhere Server-Last", "Komplexere Infrastruktur"]
              },
              {
                name: "Static Site Generation (SSG)",
                desc: "HTML wird beim Build erstellt",
                seo: "Optimal",
                color: "green",
                pros: ["Schnellste Ladezeit", "Perfekt indexierbar", "Günstig zu hosten"],
                cons: ["Nicht für dynamische Inhalte", "Rebuild bei Änderungen"]
              },
              {
                name: "Hybrid / ISR",
                desc: "Kombination aus SSR und SSG",
                seo: "Sehr gut",
                color: "blue",
                pros: ["Flexibel", "Gute SEO", "Skalierbar"],
                cons: ["Komplexe Architektur"]
              }
            ].map((strategy) => (
              <Card key={strategy.name} className={`bg-${strategy.color}-500/5 border-${strategy.color}-500/20`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{strategy.name}</h4>
                      <p className="text-sm text-muted-foreground">{strategy.desc}</p>
                    </div>
                    <Badge className={`bg-${strategy.color}-500`}>SEO: {strategy.seo}</Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">Vorteile:</p>
                      <ul className="text-xs space-y-1">
                        {strategy.pros.map((pro, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />{pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-700 mb-1">Nachteile:</p>
                      <ul className="text-xs space-y-1">
                        {strategy.cons.map((con, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />{con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Häufige JS-SEO Probleme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Häufige JavaScript SEO Probleme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="content" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Content nicht im initialen HTML</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Wenn wichtiger Content erst durch JavaScript geladen wird, sieht Google möglicherweise eine leere Seite.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <p className="text-xs font-medium text-red-700 mb-1">Problem:</p>
                    <code className="text-xs">&lt;div id="content"&gt;&lt;/div&gt;</code>
                    <p className="text-xs text-muted-foreground mt-1">Content wird erst per JS eingefügt</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <p className="text-xs font-medium text-green-700 mb-1">Lösung:</p>
                    <p className="text-xs">SSR/SSG nutzen oder Pre-Rendering implementieren</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="links" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">JavaScript-basierte Links</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Links, die per JavaScript funktionieren, werden möglicherweise nicht gecrawlt.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <p className="text-xs font-medium text-red-700 mb-2">Schlecht:</p>
                    <code className="text-xs block">&lt;a onclick="navigate('/seite')"&gt;</code>
                    <code className="text-xs block mt-1">&lt;div @click="goTo('/seite')"&gt;</code>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <p className="text-xs font-medium text-green-700 mb-2">Gut:</p>
                    <code className="text-xs block">&lt;a href="/seite"&gt;</code>
                    <p className="text-xs text-muted-foreground mt-1">Immer echte href-Attribute verwenden!</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lazy" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Lazy Loading von Content</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Infinite Scroll und Lazy Loading können dazu führen, dass Content nicht indexiert wird.
                </p>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-xs font-medium text-amber-700 mb-2">Lösung:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Paginierung zusätzlich zu Infinite Scroll anbieten</li>
                    <li>• Wichtigen Content im initialen HTML laden</li>
                    <li>• Intersection Observer mit Fallback verwenden</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="meta" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">Meta-Tags per JavaScript</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Title und Meta-Description sollten im initialen HTML sein, nicht erst per JS eingefügt.
                </p>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xs font-medium text-green-700 mb-2">Best Practice:</p>
                  <ul className="text-xs space-y-1">
                    <li>• SSR für Meta-Tags verwenden</li>
                    <li>• Bei React: react-helmet-async oder Next.js Head</li>
                    <li>• Bei Vue: vue-meta oder Nuxt Head</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-500" />
            JavaScript SEO testen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Google Search Console</h4>
                <ol className="text-xs space-y-2">
                  <li>1. URL-Prüfung → URL eingeben</li>
                  <li>2. "Getestete Seite ansehen" klicken</li>
                  <li>3. Vergleichen: HTML vs. Gerendertes HTML</li>
                  <li>4. Screenshot prüfen</li>
                </ol>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Chrome DevTools</h4>
                <ol className="text-xs space-y-2">
                  <li>1. F12 → Network Tab</li>
                  <li>2. JavaScript deaktivieren</li>
                  <li>3. Seite neu laden</li>
                  <li>4. Prüfen: Ist wichtiger Content sichtbar?</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <h4 className="font-semibold text-sm mb-2">Quick Test: View Source vs. Inspect</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Rechtsklick → "Seitenquelltext anzeigen"</strong> zeigt das initiale HTML (was Google zuerst sieht).
              <strong> "Untersuchen"</strong> zeigt das gerenderte DOM nach JS-Ausführung.
              Wenn wichtiger Content nur in "Untersuchen" sichtbar ist, haben Sie ein JS-SEO-Problem!
            </p>
          </div>
        </CardContent>
      </Card>

      <BestPracticeCard
        title="JavaScript SEO"
        dos={[
          "Server-Side Rendering (SSR) oder Static Site Generation (SSG) nutzen",
          "Wichtigen Content im initialen HTML ausliefern",
          "Echte <a href> Links verwenden",
          "Meta-Tags serverseitig rendern",
          "Mit GSC URL-Prüfung testen",
          "JavaScript deaktiviert testen (View Source)"
        ]}
        donts={[
          "Nur auf Client-Side Rendering setzen",
          "Links nur per onclick/JavaScript",
          "Wichtigen Content lazy loaden ohne Fallback",
          "robots.txt JS/CSS blockieren",
          "Infinite Scroll ohne Paginierung",
          "Meta-Tags erst per JS einfügen"
        ]}
        proTip="Frameworks wie Next.js (React), Nuxt (Vue) oder SvelteKit bieten SSR/SSG out-of-the-box und lösen die meisten JS-SEO-Probleme automatisch."
      />

      <QuizQuestion
        question="Warum ist Client-Side Rendering (CSR) problematisch für SEO?"
        options={[
          { id: "a", text: "Google kann kein JavaScript ausführen", isCorrect: false, explanation: "Google kann JavaScript ausführen, aber mit Verzögerung." },
          { id: "b", text: "Die Indexierung des JS-Contents ist verzögert", isCorrect: true, explanation: "Richtig! Zwischen dem ersten Crawl und dem Rendering können Tage bis Wochen vergehen." },
          { id: "c", text: "CSR-Seiten werden nie indexiert", isCorrect: false, explanation: "Sie werden indexiert, aber möglicherweise verzögert oder unvollständig." },
          { id: "d", text: "CSR ist langsamer als SSR", isCorrect: false, explanation: "CSR kann initial schneller sein, das ist aber nicht das SEO-Problem." }
        ]}
      />

      <KeyTakeaway
        points={[
          "Google kann JavaScript ausführen, aber mit signifikanter Verzögerung",
          "SSR oder SSG sind die SEO-freundlichsten Rendering-Methoden",
          "Wichtiger Content muss im initialen HTML sein",
          "Immer echte <a href> Links verwenden, keine JS-only Navigation",
          "Mit GSC URL-Prüfung und View Source testen"
        ]}
      />
    </div>
  );
};
