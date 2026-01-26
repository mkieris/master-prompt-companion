import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { ModuleChecklist } from "@/components/training/ModuleChecklist";
import {
  ClipboardCheck, Search, Server, FileText, Link2, Gauge,
  AlertTriangle, CheckCircle2, XCircle, TrendingUp, Eye,
  BarChart3, Bug, Zap, Globe, Smartphone
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const SEOAuditModule = () => {
  return (
    <div className="space-y-6">
      {/* Einführung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Praktisches SEO-Audit
          </CardTitle>
          <CardDescription>
            Schritt-für-Schritt Anleitung für einen vollständigen SEO-Audit Ihrer Website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-2">Was ist ein SEO-Audit?</h3>
            <p className="text-muted-foreground text-sm">
              Ein SEO-Audit ist eine systematische Überprüfung aller SEO-relevanten Faktoren einer Website.
              Er identifiziert Probleme, Chancen und priorisiert Maßnahmen für bessere Rankings.
            </p>
          </div>

          {/* Audit Phasen Übersicht */}
          <div className="grid sm:grid-cols-5 gap-3">
            {[
              { phase: "1", title: "Crawling", icon: Bug, color: "blue" },
              { phase: "2", title: "Technisch", icon: Server, color: "purple" },
              { phase: "3", title: "OnPage", icon: FileText, color: "green" },
              { phase: "4", title: "Content", icon: Eye, color: "orange" },
              { phase: "5", title: "OffPage", icon: Link2, color: "red" },
            ].map((item) => (
              <Card key={item.phase} className={`bg-${item.color}-500/5 border-${item.color}-500/20`}>
                <CardContent className="p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center mx-auto mb-2">
                    {item.phase}
                  </div>
                  <item.icon className={`h-5 w-5 text-${item.color}-500 mx-auto mb-1`} />
                  <span className="text-xs font-medium">{item.title}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Phase 1: Crawling & Indexierung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-blue-500" />
            Phase 1: Crawling & Indexierung
            <Badge className="bg-blue-500">Grundlage</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Zuerst prüfen wir, ob Google Ihre Seiten überhaupt finden und indexieren kann.
          </p>

          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="gsc" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">1.1 Google Search Console prüfen</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Indexierung prüfen:</h5>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Seiten &gt; Indexierung &gt; Übersicht</li>
                      <li>• Wie viele Seiten sind indexiert?</li>
                      <li>• Wie viele sind nicht indexiert (und warum)?</li>
                      <li>• Gibt es "Entdeckt - nicht indexiert" Seiten?</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Probleme identifizieren:</h5>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• "Durch robots.txt blockiert"</li>
                      <li>• "Noindex-Tag erkannt"</li>
                      <li>• "Weitergeleitet"</li>
                      <li>• "404-Fehler"</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                  <p className="text-xs">
                    <strong>Action:</strong> Exportieren Sie die Liste nicht-indexierter Seiten und kategorisieren Sie die Gründe.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="robots" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">1.2 robots.txt analysieren</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Prüfen Sie: <code className="bg-muted px-2 py-1 rounded">ihredomain.de/robots.txt</code>
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <h5 className="font-medium text-sm text-green-700 mb-2">Prüfen auf:</h5>
                    <ul className="text-xs space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Sitemap-Verweis vorhanden</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Wichtige Seiten nicht blockiert</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Admin/Login-Bereiche blockiert</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <h5 className="font-medium text-sm text-red-700 mb-2">Häufige Fehler:</h5>
                    <ul className="text-xs space-y-1">
                      <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />Disallow: / (alles blockiert!)</li>
                      <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />CSS/JS-Dateien blockiert</li>
                      <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />Wichtige Kategorien blockiert</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sitemap" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">1.3 XML-Sitemap prüfen</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Prüfen Sie: <code className="bg-muted px-2 py-1 rounded">ihredomain.de/sitemap.xml</code>
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Sitemap existiert und ist erreichbar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Enthält nur indexierbare URLs (200 Status, kein noindex)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Sitemap ist in GSC eingereicht</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Keine 404er oder Redirects in der Sitemap</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Phase 2: Technisches SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-500" />
            Phase 2: Technisches SEO
            <Badge className="bg-purple-500">Performance</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="cwv" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">2.1 Core Web Vitals prüfen</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tool: <strong>PageSpeed Insights</strong> (pagespeed.web.dev)
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-background rounded-lg border">
                    <Badge variant="outline" className="mb-2">LCP</Badge>
                    <p className="text-xs">Largest Contentful Paint</p>
                    <p className="text-sm font-semibold text-green-600 mt-1">Ziel: &lt; 2,5s</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <Badge variant="outline" className="mb-2">INP</Badge>
                    <p className="text-xs">Interaction to Next Paint</p>
                    <p className="text-sm font-semibold text-green-600 mt-1">Ziel: &lt; 200ms</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <Badge variant="outline" className="mb-2">CLS</Badge>
                    <p className="text-xs">Cumulative Layout Shift</p>
                    <p className="text-sm font-semibold text-green-600 mt-1">Ziel: &lt; 0,1</p>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
                  <p className="text-xs">
                    <strong>Tipp:</strong> Prüfen Sie sowohl Mobile als auch Desktop. Mobile ist wichtiger (Mobile-First Index).
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mobile" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">2.2 Mobile-Friendliness</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Responsive Design implementiert</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Viewport Meta-Tag vorhanden</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Tap-Targets min. 48x48px</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Kein horizontales Scrollen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Schriftgröße min. 16px</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="https" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">2.3 HTTPS & Sicherheit</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-3">
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Gültiges SSL-Zertifikat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>301-Redirect von HTTP zu HTTPS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Kein Mixed Content (HTTP-Ressourcen auf HTTPS-Seite)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>HSTS-Header aktiviert</span>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Phase 3: OnPage SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            Phase 3: OnPage SEO
            <Badge className="bg-green-500">Content-Basis</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tool-Empfehlung: <strong>Screaming Frog SEO Spider</strong> (kostenlos bis 500 URLs)
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Title Tags prüfen:</h4>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Fehlende Titles
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Duplicate Titles
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Zu lang (&gt;60 Zeichen)
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Zu kurz (&lt;30 Zeichen)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Meta Descriptions prüfen:</h4>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Fehlende Descriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Duplicate Descriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Zu lang (&gt;160 Zeichen)
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Ohne Call-to-Action
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Überschriften prüfen:</h4>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Fehlende H1
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Mehrere H1 pro Seite
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    H1 ohne Keyword
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Gebrochene Hierarchie
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Bilder prüfen:</h4>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Fehlende Alt-Texte
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Zu große Dateien (&gt;200KB)
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Nicht-beschreibende Dateinamen
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Kein WebP-Format
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Phase 4: Content Audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-orange-500" />
            Phase 4: Content Audit
            <Badge className="bg-orange-500">Qualität</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/20">
            <h4 className="font-semibold mb-3">Content-Performance Matrix</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <h5 className="font-medium text-sm text-green-700">Top-Performer</h5>
                <p className="text-xs text-muted-foreground mt-1">Viel Traffic, gute Rankings</p>
                <p className="text-xs font-medium mt-2">Aktion: Weiter optimieren, Featured Snippets anstreben</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <h5 className="font-medium text-sm text-blue-700">Underperformer</h5>
                <p className="text-xs text-muted-foreground mt-1">Position 5-20, wenig Klicks</p>
                <p className="text-xs font-medium mt-2">Aktion: Content erweitern, CTR optimieren</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <h5 className="font-medium text-sm text-amber-700">Kannibalisierung</h5>
                <p className="text-xs text-muted-foreground mt-1">Mehrere Seiten für gleiche Keywords</p>
                <p className="text-xs font-medium mt-2">Aktion: Zusammenführen + 301 Redirect</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                <h5 className="font-medium text-sm text-red-700">Dead Content</h5>
                <p className="text-xs text-muted-foreground mt-1">Kein Traffic, keine Backlinks</p>
                <p className="text-xs font-medium mt-2">Aktion: Löschen oder komplett überarbeiten</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
            <p className="text-sm">
              <strong>GSC Quick Win:</strong> Filtern Sie nach Seiten mit Position 5-20 und vielen Impressionen.
              Diese "Low Hanging Fruits" können mit kleinen Optimierungen schnell nach oben klettern.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Phase 5: OffPage & Backlinks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-red-500" />
            Phase 5: OffPage & Backlinks
            <Badge className="bg-red-500">Autorität</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tools: <strong>Ahrefs, SEMrush, Moz</strong> (kostenpflichtig) oder <strong>Google Search Console</strong> (kostenlos, limitiert)
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Backlink-Profil analysieren:</h4>
                <ul className="text-xs space-y-2">
                  <li>• Gesamtzahl der Backlinks</li>
                  <li>• Anzahl verlinkender Domains</li>
                  <li>• Domain Authority / Domain Rating</li>
                  <li>• DoFollow vs. NoFollow Verhältnis</li>
                  <li>• Ankertext-Verteilung</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Toxische Links identifizieren:</h4>
                <ul className="text-xs space-y-2">
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />Links von Spam-Seiten</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />Unnatürliche Ankertexte</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />Links von irrelevanten Seiten</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />PBN-Links (Private Blog Networks)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Audit Checkliste */}
      <ModuleChecklist
        moduleId="seo-audit"
        title="SEO-Audit Checkliste"
        description="Vollständige Checkliste für Ihren SEO-Audit"
        items={[
          { id: "audit1", text: "GSC Indexierungsstatus geprüft", tip: "Seiten > Indexierung in der Search Console" },
          { id: "audit2", text: "robots.txt analysiert", tip: "Keine wichtigen Seiten blockiert?" },
          { id: "audit3", text: "XML-Sitemap validiert", tip: "Nur 200er URLs, keine Redirects" },
          { id: "audit4", text: "Core Web Vitals gemessen", tip: "PageSpeed Insights für Mobile & Desktop" },
          { id: "audit5", text: "Mobile-Friendliness getestet", tip: "Responsive, Touch-Targets, Schriftgröße" },
          { id: "audit6", text: "HTTPS & SSL geprüft", tip: "Kein Mixed Content, 301 von HTTP" },
          { id: "audit7", text: "Title Tags analysiert", tip: "Screaming Frog oder Sitebulb" },
          { id: "audit8", text: "Meta Descriptions geprüft", tip: "Unique, richtige Länge, CTA" },
          { id: "audit9", text: "H1-Struktur validiert", tip: "Nur eine H1 pro Seite" },
          { id: "audit10", text: "Bilder-SEO geprüft", tip: "Alt-Texte, Dateigröße, Dateinamen" },
          { id: "audit11", text: "Content-Performance analysiert", tip: "GSC Daten exportieren und analysieren" },
          { id: "audit12", text: "Keyword-Kannibalisierung geprüft", tip: "Mehrere Seiten für gleiche Keywords?" },
          { id: "audit13", text: "Backlink-Profil analysiert", tip: "Qualität, Quantität, toxische Links" },
          { id: "audit14", text: "Interne Verlinkung geprüft", tip: "Verwaiste Seiten, Link-Verteilung" },
          { id: "audit15", text: "Maßnahmen priorisiert", tip: "Impact vs. Aufwand Matrix erstellen" }
        ]}
      />

      <BestPracticeCard
        title="SEO-Audit Durchführung"
        dos={[
          "Systematisch von Crawling bis OffPage vorgehen",
          "Tools kombinieren (GSC + Screaming Frog + PageSpeed)",
          "Findings dokumentieren und priorisieren",
          "Quick Wins zuerst umsetzen",
          "Regelmäßig wiederholen (mindestens quartalsweise)"
        ]}
        donts={[
          "Nur auf ein Tool verlassen",
          "Technische Fehler ignorieren",
          "Alles gleichzeitig ändern wollen",
          "Audit ohne Maßnahmenplan",
          "Ergebnisse nicht tracken"
        ]}
        proTip="Erstellen Sie eine Priorisierungsmatrix: Ordnen Sie Maßnahmen nach Impact (hoch/mittel/niedrig) und Aufwand (hoch/mittel/niedrig). Starten Sie mit High-Impact/Low-Effort Tasks."
      />

      <QuizQuestion
        question="Was sollte der erste Schritt bei einem SEO-Audit sein?"
        options={[
          { id: "a", text: "Backlinks analysieren", isCorrect: false, explanation: "Backlinks sind wichtig, aber zuerst muss die technische Basis stimmen." },
          { id: "b", text: "Content bewerten", isCorrect: false, explanation: "Content-Audit kommt nach der technischen Analyse." },
          { id: "c", text: "Crawling & Indexierung prüfen", isCorrect: true, explanation: "Richtig! Wenn Google die Seiten nicht crawlen/indexieren kann, sind alle anderen Optimierungen wertlos." },
          { id: "d", text: "Keywords recherchieren", isCorrect: false, explanation: "Keyword-Recherche ist für neue Inhalte wichtig, aber nicht der erste Audit-Schritt." }
        ]}
      />

      <KeyTakeaway
        points={[
          "SEO-Audit: Systematisch von Crawling über Technik zu Content und OffPage",
          "Google Search Console ist das wichtigste kostenlose Audit-Tool",
          "Screaming Frog für detaillierte OnPage-Analyse nutzen",
          "Quick Wins priorisieren: Position 5-20 Seiten mit wenig Aufwand verbessern",
          "Audit regelmäßig wiederholen und Fortschritt tracken"
        ]}
      />
    </div>
  );
};
