import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { 
  Wrench, Search, BarChart3, Globe, CheckCircle2, 
  ExternalLink, Zap, Eye
} from "lucide-react";

export const SEOToolsModule = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            SEO-Tools
          </CardTitle>
          <CardDescription>
            Die wichtigsten kostenlosen und kostenpflichtigen Tools für Ihre SEO-Arbeit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Search Console */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-500" />
                  Google Search Console
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className="bg-green-500">Kostenlos</Badge>
                  <Badge className="bg-red-500">Pflicht</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Die Google Search Console (GSC) ist das wichtigste SEO-Tool überhaupt – und es ist kostenlos!
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 bg-background rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">📊 Was Sie sehen:</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Keywords, für die Sie ranken</li>
                    <li>• Klicks, Impressionen, CTR</li>
                    <li>• Durchschnittliche Position</li>
                    <li>• Indexierungsstatus</li>
                    <li>• Core Web Vitals</li>
                    <li>• Mobile Usability Probleme</li>
                  </ul>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">🛠️ Was Sie tun können:</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Sitemap einreichen</li>
                    <li>• URL zur Indexierung anmelden</li>
                    <li>• Crawling-Fehler beheben</li>
                    <li>• Sicherheitsprobleme erkennen</li>
                    <li>• Disavow-Links einreichen</li>
                    <li>• Strukturierte Daten testen</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>💡 Quick Win:</strong> Filtern Sie nach Seiten mit vielen Impressionen aber niedriger CTR 
                  → Meta-Title & Description optimieren für mehr Klicks!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Google Analytics */}
          <Card className="bg-green-500/5 border-green-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  Google Analytics 4
                </CardTitle>
                <Badge className="bg-green-500">Kostenlos</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                GA4 zeigt, was Nutzer auf Ihrer Website tun – wichtig für die Erfolgsmessung.
              </p>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { title: "Traffic", metrics: ["Nutzer", "Sessions", "Seitenaufrufe"] },
                  { title: "Verhalten", metrics: ["Verweildauer", "Absprungrate", "Scrolltiefe"] },
                  { title: "Conversions", metrics: ["Zielvorhaben", "Events", "E-Commerce"] },
                ].map((section) => (
                  <div key={section.title} className="p-3 bg-background rounded-lg border">
                    <h5 className="font-medium text-sm mb-2">{section.title}</h5>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {section.metrics.map((metric) => (
                        <li key={metric}>• {metric}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keyword-Tools */}
          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-500" />
                Keyword-Recherche Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { 
                    name: "Google Keyword Planner", 
                    type: "Kostenlos",
                    desc: "Suchvolumen & Keyword-Ideen (für Google Ads Nutzer)",
                    best: "Suchvolumen-Daten"
                  },
                  { 
                    name: "Ubersuggest", 
                    type: "Freemium",
                    desc: "Keyword-Ideen, Wettbewerb, Content-Ideen",
                    best: "Einstieg ohne Budget"
                  },
                  { 
                    name: "Ahrefs", 
                    type: "Ab $99/Monat",
                    desc: "Vollständige SEO-Suite mit Backlink-Analyse",
                    best: "Backlink-Analyse"
                  },
                  { 
                    name: "SEMrush", 
                    type: "Ab $119/Monat",
                    desc: "All-in-One Marketing-Plattform",
                    best: "Wettbewerbsanalyse"
                  },
                  { 
                    name: "Sistrix", 
                    type: "Ab €99/Monat",
                    desc: "Sichtbarkeitsindex, SERP-Analyse (DACH-Fokus)",
                    best: "Deutsche Daten"
                  },
                ].map((tool) => (
                  <div key={tool.name} className="p-3 bg-background rounded-lg border flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{tool.name}</span>
                        <Badge variant="outline" className="text-xs">{tool.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{tool.desc}</p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary shrink-0">
                      Stärke: {tool.best}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technische Tools */}
          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                Technische SEO-Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { 
                    name: "Screaming Frog SEO Spider", 
                    type: "Kostenlos bis 500 URLs",
                    use: "Website-Crawling, technische Fehler finden"
                  },
                  { 
                    name: "PageSpeed Insights", 
                    type: "Kostenlos",
                    use: "Core Web Vitals, Performance-Analyse"
                  },
                  { 
                    name: "Mobile-Friendly Test", 
                    type: "Kostenlos",
                    use: "Mobile-Optimierung prüfen"
                  },
                  { 
                    name: "Rich Results Test", 
                    type: "Kostenlos",
                    use: "Strukturierte Daten validieren"
                  },
                ].map((tool) => (
                  <div key={tool.name} className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{tool.name}</span>
                      <Badge variant="outline" className="text-xs">{tool.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{tool.use}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Empfohlenes Starter-Kit */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-3">🚀 Empfohlenes Starter-Kit (kostenlos)</h4>
            <div className="grid sm:grid-cols-4 gap-3">
              {[
                { name: "Google Search Console", icon: Search },
                { name: "Google Analytics 4", icon: BarChart3 },
                { name: "Screaming Frog", icon: Globe },
                { name: "PageSpeed Insights", icon: Zap },
              ].map((tool) => (
                <div key={tool.name} className="p-3 bg-background rounded-lg text-center">
                  <tool.icon className="h-6 w-6 mx-auto text-primary mb-2" />
                  <span className="text-xs font-medium">{tool.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Mit diesen 4 kostenlosen Tools können Sie 90% aller SEO-Aufgaben erledigen!
            </p>
          </div>

          <QuizQuestion
            question="Welches Google-Tool zeigt Ihnen, für welche Keywords Ihre Seite rankt?"
            options={[
              { id: "a", text: "Google Analytics", isCorrect: false, explanation: "GA4 zeigt Traffic-Daten, aber nicht die Keywords im Detail." },
              { id: "b", text: "Google Ads", isCorrect: false, explanation: "Google Ads ist für bezahlte Werbung, nicht für organische Rankings." },
              { id: "c", text: "Google Search Console", isCorrect: true, explanation: "Richtig! Die GSC zeigt alle Keywords, für die Sie organisch ranken." },
              { id: "d", text: "Google Trends", isCorrect: false, explanation: "Trends zeigt Suchtrends, aber nicht Ihre Rankings." }
            ]}
          />

          <KeyTakeaway
            points={[
              "Google Search Console ist das wichtigste SEO-Tool (und kostenlos!)",
              "GA4 für Nutzerverhalten und Conversion-Tracking",
              "Screaming Frog für technische Audits (kostenlos bis 500 URLs)",
              "PageSpeed Insights für Core Web Vitals",
              "Paid Tools (Ahrefs, SEMrush, Sistrix) lohnen sich für Profis"
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};
