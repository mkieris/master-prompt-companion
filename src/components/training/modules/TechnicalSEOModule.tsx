import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { 
  Server, Gauge, Smartphone, Shield, FileCode, Globe, 
  CheckCircle2, XCircle, AlertTriangle, Zap, Clock
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const TechnicalSEOModule = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Technische SEO – Das Fundament
          </CardTitle>
          <CardDescription>
            Ohne technisches Fundament kein Ranking – egal wie gut der Content ist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-700">Technische Fehler = Unsichtbar bei Google</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Wenn Google Ihre Seite nicht crawlen oder indexieren kann, existiert sie für die Suchmaschine nicht.
                  <strong className="text-foreground"> Technische SEO ist die Grundvoraussetzung!</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Die 3 Säulen */}
          <h3 className="text-lg font-semibold">Die 3 Säulen der Technischen SEO</h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Crawlability</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Kann Google Ihre Seiten finden und durchsuchen?
                </p>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />robots.txt korrekt</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />XML-Sitemap vorhanden</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Keine Crawl-Fehler</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Interne Verlinkung</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileCode className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Indexability</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Werden Ihre Seiten in den Index aufgenommen?
                </p>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Kein noindex wo nicht nötig</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Canonical Tags korrekt</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Keine Duplicate Content</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Qualitativ hochwertig</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Performance</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Wie schnell und benutzerfreundlich ist Ihre Seite?
                </p>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Core Web Vitals grün</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Mobile-optimiert</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />HTTPS aktiv</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Schnelle Ladezeiten</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Core Web Vitals */}
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="cwv" className="border rounded-lg bg-gradient-to-r from-green-500/5 to-transparent px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Gauge className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Core Web Vitals (CWV)</span>
                  <Badge className="bg-green-500 ml-2">Ranking-Faktor</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <p className="text-muted-foreground text-sm">
                  Core Web Vitals sind Googles Metriken für Nutzererfahrung und ein direkter Ranking-Faktor.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-green-500/10">LCP</Badge>
                    </div>
                    <h5 className="font-medium text-sm">Largest Contentful Paint</h5>
                    <p className="text-xs text-muted-foreground mt-1">Ladezeit des größten Elements</p>
                    <p className="text-xs font-medium text-green-600 mt-2">Ziel: &lt; 2,5 Sekunden</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-amber-500/10">INP</Badge>
                    </div>
                    <h5 className="font-medium text-sm">Interaction to Next Paint</h5>
                    <p className="text-xs text-muted-foreground mt-1">Reaktionszeit bei Interaktion</p>
                    <p className="text-xs font-medium text-green-600 mt-2">Ziel: &lt; 200ms</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-blue-500/10">CLS</Badge>
                    </div>
                    <h5 className="font-medium text-sm">Cumulative Layout Shift</h5>
                    <p className="text-xs text-muted-foreground mt-1">Visuelle Stabilität</p>
                    <p className="text-xs font-medium text-green-600 mt-2">Ziel: &lt; 0,1</p>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <span className="text-sm font-medium">💡 Tool-Tipp:</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    Prüfen Sie Ihre CWV mit PageSpeed Insights (pagespeed.web.dev) oder der Google Search Console.
                  </span>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mobile" className="border rounded-lg bg-gradient-to-r from-blue-500/5 to-transparent px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Mobile-First Indexierung</span>
                  <Badge className="bg-blue-500 ml-2">Standard seit 2021</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <p className="text-muted-foreground text-sm">
                  Google crawlt und indexiert primär die mobile Version Ihrer Website. Die Desktop-Version ist sekundär.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-background rounded-lg border border-green-500/30">
                    <h5 className="font-medium text-sm text-green-700 mb-2">✓ So machen Sie es richtig</h5>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Responsive Design verwenden</li>
                      <li>• Gleicher Content auf Mobile & Desktop</li>
                      <li>• Touch-freundliche Elemente (48x48px min.)</li>
                      <li>• Lesbare Schriftgrößen (16px min.)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-background rounded-lg border border-red-500/30">
                    <h5 className="font-medium text-sm text-red-700 mb-2">✗ Das sollten Sie vermeiden</h5>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Content nur auf Desktop anzeigen</li>
                      <li>• Pop-ups die den Inhalt verdecken</li>
                      <li>• Horizontales Scrollen erzwingen</li>
                      <li>• Flash oder veraltete Technologien</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="https" className="border rounded-lg bg-gradient-to-r from-purple-500/5 to-transparent px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">HTTPS & Sicherheit</span>
                  <Badge className="bg-purple-500 ml-2">Pflicht</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <p className="text-muted-foreground text-sm">
                  HTTPS ist seit 2014 ein Ranking-Signal und heute absolute Pflicht. Ohne SSL-Zertifikat zeigt Chrome eine Warnung.
                </p>
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <h5 className="font-medium text-sm mb-2">HTTPS-Checkliste:</h5>
                  <ul className="text-xs space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Gültiges SSL-Zertifikat installiert</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />301-Redirect von HTTP zu HTTPS</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Alle Ressourcen über HTTPS laden (kein Mixed Content)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />HSTS-Header aktiviert</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <BestPracticeCard
            title="Technische SEO Basics"
            dos={[
              "XML-Sitemap erstellen und einreichen",
              "robots.txt korrekt konfigurieren",
              "Core Web Vitals optimieren",
              "Mobile-First Design",
              "HTTPS überall",
              "Saubere URL-Struktur"
            ]}
            donts={[
              "Wichtige Seiten mit noindex blockieren",
              "Duplicate Content ohne Canonical",
              "Langsame Server-Antwortzeiten",
              "Broken Links ignorieren",
              "JavaScript-Abhängigkeit für Content"
            ]}
            proTip="Nutzen Sie die Google Search Console – sie zeigt Ihnen genau, welche technischen Probleme Google auf Ihrer Seite findet."
          />

          <QuizQuestion
            question="Was bedeutet 'Mobile-First Indexierung'?"
            options={[
              { id: "a", text: "Mobile Nutzer bekommen bessere Rankings", isCorrect: false, explanation: "Es geht nicht um die Nutzer, sondern um das Crawling." },
              { id: "b", text: "Google crawlt und indexiert primär die mobile Version", isCorrect: true, explanation: "Richtig! Die mobile Version ist die Hauptversion für Google." },
              { id: "c", text: "Man braucht eine separate mobile Website", isCorrect: false, explanation: "Responsive Design ist der Standard – keine separate Seite nötig." },
              { id: "d", text: "Die Desktop-Version wird nicht mehr indexiert", isCorrect: false, explanation: "Sie wird weiterhin berücksichtigt, ist aber sekundär." }
            ]}
          />

          <KeyTakeaway
            points={[
              "Technische SEO ist die Grundvoraussetzung für Rankings",
              "Core Web Vitals: LCP < 2,5s, INP < 200ms, CLS < 0,1",
              "Mobile-First: Google bewertet primär die mobile Version",
              "HTTPS ist Pflicht – ohne SSL kein Vertrauen",
              "Google Search Console ist Ihr wichtigstes Diagnose-Tool"
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};
