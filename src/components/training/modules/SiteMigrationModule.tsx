import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { ModuleChecklist } from "@/components/training/ModuleChecklist";
import {
  ArrowRightLeft, AlertTriangle, CheckCircle2, XCircle,
  Clock, FileText, Link2, Globe, Server, TrendingDown, TrendingUp
} from "lucide-react";

export const SiteMigrationModule = () => {
  return (
    <div className="space-y-6">
      {/* Einführung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Site Migration & Relaunch
          </CardTitle>
          <CardDescription>
            So migrieren Sie Ihre Website ohne Ranking-Verluste
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 mb-1">Warnung: Migrationen sind riskant!</p>
                <p className="text-sm text-muted-foreground">
                  Falsch durchgeführte Migrationen können zu <strong>massiven Ranking-Verlusten</strong> führen.
                  Planen Sie sorgfältig und testen Sie gründlich, bevor Sie live gehen.
                </p>
              </div>
            </div>
          </div>

          {/* Arten von Migrationen */}
          <h3 className="font-semibold text-lg">Arten von Website-Migrationen</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Domain-Wechsel",
                desc: "alte-domain.de → neue-domain.de",
                risk: "Sehr hoch",
                color: "red",
                examples: ["Rebranding", "Firmennamenänderung", "Neue TLD"]
              },
              {
                title: "Protokoll-Wechsel",
                desc: "HTTP → HTTPS",
                risk: "Mittel",
                color: "amber",
                examples: ["SSL-Implementierung", "Sicherheits-Upgrade"]
              },
              {
                title: "URL-Struktur",
                desc: "/produkte/123 → /produkte/schuhe/nike-air",
                risk: "Hoch",
                color: "orange",
                examples: ["Sprechende URLs", "Neue Kategorien"]
              },
              {
                title: "Plattform-Wechsel",
                desc: "WordPress → Shopify",
                risk: "Hoch",
                color: "orange",
                examples: ["CMS-Wechsel", "Shop-System-Wechsel"]
              },
              {
                title: "Design-Relaunch",
                desc: "Neues Design, gleiche URLs",
                risk: "Niedrig",
                color: "green",
                examples: ["Redesign", "UX-Verbesserung"]
              },
              {
                title: "Zusammenführung",
                desc: "Mehrere Domains → Eine Domain",
                risk: "Sehr hoch",
                color: "red",
                examples: ["Konsolidierung", "Übernahme"]
              }
            ].map((migration) => (
              <Card key={migration.title} className={`bg-${migration.color}-500/5 border-${migration.color}-500/20`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{migration.title}</h4>
                    <Badge className={`bg-${migration.color}-500`}>Risiko: {migration.risk}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{migration.desc}</p>
                  <p className="text-xs"><strong>Beispiele:</strong> {migration.examples.join(", ")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Migration Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Migrations-Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vor der Migration */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Badge className="bg-blue-500">Phase 1</Badge>
              Vor der Migration (2-4 Wochen vorher)
            </h4>
            <div className="space-y-2">
              {[
                { task: "Vollständiges Crawling der alten Website", tool: "Screaming Frog" },
                { task: "Alle URLs exportieren und dokumentieren", tool: "Excel/Sheets" },
                { task: "Backlinks analysieren und dokumentieren", tool: "Ahrefs/GSC" },
                { task: "Rankings dokumentieren", tool: "SEMrush/Sistrix" },
                { task: "Traffic-Baseline festhalten", tool: "Google Analytics" },
                { task: "Redirect-Mapping erstellen", tool: "Excel/Sheets" },
                { task: "Staging-Umgebung aufsetzen", tool: "Dev-Server" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">{item.task}</span>
                  <Badge variant="outline" className="text-xs">{item.tool}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Während der Migration */}
          <div className="border-l-4 border-amber-500 pl-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Badge className="bg-amber-500">Phase 2</Badge>
              Während der Migration (Launch-Tag)
            </h4>
            <div className="space-y-2">
              {[
                "Alle 301-Redirects implementieren",
                "Neue Sitemap erstellen und einreichen",
                "robots.txt aktualisieren",
                "Canonical Tags prüfen",
                "Interne Verlinkung auf neue URLs umstellen",
                "Google Search Console: Adressänderung (bei Domain-Wechsel)",
                "Analytics-Tracking prüfen"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nach der Migration */}
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Badge className="bg-green-500">Phase 3</Badge>
              Nach der Migration (1-4 Wochen danach)
            </h4>
            <div className="space-y-2">
              {[
                "Täglich GSC Indexierung prüfen",
                "404-Fehler identifizieren und fixen",
                "Redirect-Chains auflösen",
                "Rankings monitoren (Schwankungen sind normal!)",
                "Traffic-Entwicklung verfolgen",
                "Interne Links auf alte URLs finden und korrigieren",
                "Backlink-Profile prüfen"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redirect Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-purple-500" />
            Redirect-Mapping erstellen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Das Redirect-Mapping ist das wichtigste Dokument bei einer Migration. Jede alte URL muss auf eine passende neue URL zeigen.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Alte URL</th>
                  <th className="p-3 text-left">Neue URL</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Priorität</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { old: "/produkte/schuhe/", new: "/shop/schuhe/", status: "301", priority: "Hoch" },
                  { old: "/blog/seo-tipps/", new: "/ratgeber/seo-tipps/", status: "301", priority: "Hoch" },
                  { old: "/ueber-uns/", new: "/unternehmen/", status: "301", priority: "Mittel" },
                  { old: "/alte-aktion/", new: "/shop/", status: "301", priority: "Niedrig" },
                ].map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3"><code className="text-xs bg-red-500/10 px-2 py-1 rounded">{row.old}</code></td>
                    <td className="p-3"><code className="text-xs bg-green-500/10 px-2 py-1 rounded">{row.new}</code></td>
                    <td className="p-3"><Badge variant="outline">{row.status}</Badge></td>
                    <td className="p-3"><Badge variant="outline">{row.priority}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <h5 className="font-semibold text-sm text-green-700 mb-2">Gutes Mapping:</h5>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Alte Produktseite → Neue Produktseite</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Alte Kategorie → Neue Kategorie</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Inhaltlich passend</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <h5 className="font-semibold text-sm text-red-700 mb-2">Schlechtes Mapping:</h5>
                <ul className="text-xs space-y-1">
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />Alle alten URLs → Startseite</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />Produktseite → Kategorie</li>
                  <li className="flex items-center gap-2"><XCircle className="h-3 w-3 text-red-500" />Inhaltlich nicht passend</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Was nach Migration normal ist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-amber-500" />
            Was nach einer Migration normal ist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
            <p className="text-sm">
              <strong>Wichtig:</strong> Ranking-Schwankungen nach einer Migration sind normal und kein Grund zur Panik!
              Google braucht Zeit, um die Änderungen zu verarbeiten.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                Normal (kein Grund zur Panik)
              </h4>
              <ul className="text-xs space-y-2">
                <li>• Ranking-Schwankungen in den ersten 2-4 Wochen</li>
                <li>• Temporärer Traffic-Rückgang (10-20%)</li>
                <li>• Impressionen sinken kurzzeitig</li>
                <li>• Alte URLs erscheinen noch in den SERPs</li>
              </ul>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Warnsignale (Handlungsbedarf)
              </h4>
              <ul className="text-xs space-y-2">
                <li>• Rankings fallen nach 4+ Wochen weiter</li>
                <li>• Traffic-Rückgang über 50%</li>
                <li>• Viele 404-Fehler in GSC</li>
                <li>• Seiten werden de-indexiert</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkliste */}
      <ModuleChecklist
        moduleId="site-migration"
        title="Site Migration Checkliste"
        description="Vollständige Checkliste für eine erfolgreiche Migration"
        items={[
          { id: "mig1", text: "Vollständiges Crawling der alten Seite", tip: "Screaming Frog oder Sitebulb nutzen" },
          { id: "mig2", text: "Alle URLs dokumentiert", tip: "Export als Excel/CSV" },
          { id: "mig3", text: "Backlink-Profil gesichert", tip: "Ahrefs/SEMrush Export" },
          { id: "mig4", text: "Rankings dokumentiert (Baseline)", tip: "Wichtige Keywords tracken" },
          { id: "mig5", text: "Redirect-Mapping erstellt", tip: "Alte URL → Neue URL" },
          { id: "mig6", text: "301-Redirects implementiert", tip: "Alle URLs abgedeckt?" },
          { id: "mig7", text: "Neue Sitemap erstellt", tip: "Nur neue, indexierbare URLs" },
          { id: "mig8", text: "Sitemap in GSC eingereicht", tip: "Alte Sitemap löschen" },
          { id: "mig9", text: "robots.txt aktualisiert", tip: "Keine wichtigen Seiten blockiert?" },
          { id: "mig10", text: "Canonical Tags geprüft", tip: "Zeigen auf neue URLs?" },
          { id: "mig11", text: "Interne Links aktualisiert", tip: "Keine Links zu alten URLs" },
          { id: "mig12", text: "GSC Adressänderung (bei Domain-Wechsel)", tip: "Unter Einstellungen" },
          { id: "mig13", text: "Tägliches Monitoring eingerichtet", tip: "GSC, Rankings, Traffic" },
          { id: "mig14", text: "404-Fehler gefixet", tip: "GSC Abdeckungsbericht" }
        ]}
      />

      <BestPracticeCard
        title="Site Migration"
        dos={[
          "Gründlich planen (2-4 Wochen Vorlauf)",
          "Vollständiges Redirect-Mapping erstellen",
          "Alle 301-Redirects vor Launch testen",
          "Baseline-Daten dokumentieren",
          "Nach Launch täglich monitoren",
          "Bei Domain-Wechsel: GSC Adressänderung nutzen"
        ]}
        donts={[
          "Ohne Plan migrieren",
          "Alle URLs auf die Startseite redirecten",
          "Redirects vergessen",
          "Nach Launch nicht monitoren",
          "Bei Schwankungen panisch reagieren",
          "Alte Domain sofort abschalten"
        ]}
        proTip="Halten Sie die alte Domain nach einem Domain-Wechsel mindestens 6-12 Monate aktiv mit aktiven Redirects. Google braucht Zeit!"
      />

      <QuizQuestion
        question="Was ist das wichtigste Dokument bei einer Website-Migration?"
        options={[
          { id: "a", text: "Die neue Sitemap", isCorrect: false, explanation: "Wichtig, aber nicht das Wichtigste." },
          { id: "b", text: "Das Redirect-Mapping", isCorrect: true, explanation: "Richtig! Ohne korrektes Redirect-Mapping verlieren Sie Rankings und Traffic." },
          { id: "c", text: "Die robots.txt", isCorrect: false, explanation: "Muss aktualisiert werden, ist aber nicht das Wichtigste." },
          { id: "d", text: "Der Projektplan", isCorrect: false, explanation: "Wichtig für die Organisation, aber nicht für SEO." }
        ]}
      />

      <KeyTakeaway
        points={[
          "Migrationen sind riskant – gründliche Planung ist essentiell",
          "Redirect-Mapping ist das wichtigste Dokument",
          "301-Redirects für jede alte URL auf die passende neue URL",
          "Nach Launch täglich GSC und Rankings monitoren",
          "Ranking-Schwankungen in den ersten Wochen sind normal"
        ]}
      />
    </div>
  );
};
