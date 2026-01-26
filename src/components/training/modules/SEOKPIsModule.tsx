import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import {
  BarChart3, TrendingUp, Target, Eye, MousePointer,
  Clock, Users, DollarSign, Search, FileText, AlertTriangle
} from "lucide-react";

export const SEOKPIsModule = () => {
  return (
    <div className="space-y-6">
      {/* Einführung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            SEO KPIs & Reporting
          </CardTitle>
          <CardDescription>
            Die richtigen Metriken messen und aussagekräftige Reports erstellen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              "What gets measured gets managed." – Ohne klare KPIs können Sie den Erfolg Ihrer SEO-Maßnahmen
              nicht bewerten. Aber <strong>nicht alle Metriken sind gleich wichtig</strong>.
            </p>
          </div>

          {/* KPI Kategorien */}
          <h3 className="font-semibold text-lg">Die wichtigsten SEO-KPIs</h3>

          <div className="grid gap-4">
            {/* Sichtbarkeit */}
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  Sichtbarkeits-KPIs
                  <Badge className="bg-blue-500">Reichweite</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      name: "Impressionen",
                      source: "GSC",
                      desc: "Wie oft Ihre Seiten in den SERPs erscheinen",
                      importance: "Hoch"
                    },
                    {
                      name: "Rankings",
                      source: "GSC/Tools",
                      desc: "Positionen für wichtige Keywords",
                      importance: "Hoch"
                    },
                    {
                      name: "Sichtbarkeitsindex",
                      source: "Sistrix/SEMrush",
                      desc: "Gesamtsichtbarkeit im Vergleich zur Konkurrenz",
                      importance: "Mittel"
                    },
                    {
                      name: "Indexierte Seiten",
                      source: "GSC",
                      desc: "Wie viele Seiten Google indexiert hat",
                      importance: "Mittel"
                    }
                  ].map((kpi) => (
                    <div key={kpi.name} className="p-3 bg-background rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{kpi.name}</span>
                        <Badge variant="outline" className="text-xs">{kpi.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{kpi.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Traffic */}
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Traffic-KPIs
                  <Badge className="bg-green-500">Besucher</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      name: "Organischer Traffic",
                      source: "GA4",
                      desc: "Besucher über unbezahlte Suche",
                      importance: "Sehr hoch"
                    },
                    {
                      name: "Klicks",
                      source: "GSC",
                      desc: "Tatsächliche Klicks aus den SERPs",
                      importance: "Sehr hoch"
                    },
                    {
                      name: "Neue Nutzer",
                      source: "GA4",
                      desc: "Erstbesucher über organische Suche",
                      importance: "Hoch"
                    },
                    {
                      name: "Traffic nach Landing Page",
                      source: "GA4",
                      desc: "Welche Seiten bringen Traffic",
                      importance: "Hoch"
                    }
                  ].map((kpi) => (
                    <div key={kpi.name} className="p-3 bg-background rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{kpi.name}</span>
                        <Badge variant="outline" className="text-xs">{kpi.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{kpi.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engagement */}
            <Card className="bg-purple-500/5 border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MousePointer className="h-5 w-5 text-purple-500" />
                  Engagement-KPIs
                  <Badge className="bg-purple-500">Qualität</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      name: "CTR (Click-Through-Rate)",
                      source: "GSC",
                      desc: "Klicks / Impressionen",
                      importance: "Hoch"
                    },
                    {
                      name: "Engagement Rate",
                      source: "GA4",
                      desc: "Anteil engagierter Sessions",
                      importance: "Mittel"
                    },
                    {
                      name: "Avg. Session Duration",
                      source: "GA4",
                      desc: "Durchschnittliche Verweildauer",
                      importance: "Mittel"
                    },
                    {
                      name: "Pages per Session",
                      source: "GA4",
                      desc: "Seiten pro Besuch",
                      importance: "Mittel"
                    }
                  ].map((kpi) => (
                    <div key={kpi.name} className="p-3 bg-background rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{kpi.name}</span>
                        <Badge variant="outline" className="text-xs">{kpi.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{kpi.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Conversions */}
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  Conversion-KPIs
                  <Badge className="bg-amber-500">Business Impact</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      name: "Organische Conversions",
                      source: "GA4",
                      desc: "Zielvorhaben aus organischem Traffic",
                      importance: "Sehr hoch"
                    },
                    {
                      name: "Conversion Rate",
                      source: "GA4",
                      desc: "Conversions / Sessions",
                      importance: "Sehr hoch"
                    },
                    {
                      name: "Umsatz (organisch)",
                      source: "GA4/CRM",
                      desc: "Umsatz durch organischen Traffic",
                      importance: "Sehr hoch"
                    },
                    {
                      name: "Leads (organisch)",
                      source: "GA4/CRM",
                      desc: "Leads aus organischer Suche",
                      importance: "Sehr hoch"
                    }
                  ].map((kpi) => (
                    <div key={kpi.name} className="p-3 bg-background rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{kpi.name}</span>
                        <Badge variant="outline" className="text-xs">{kpi.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{kpi.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* KPI Priorisierung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            KPIs nach Geschäftsziel priorisieren
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">E-Commerce</h4>
                <ol className="text-xs space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</span>
                    Umsatz (organisch)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</span>
                    Organischer Traffic
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">3</span>
                    Conversion Rate
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-muted-foreground text-background text-xs flex items-center justify-center">4</span>
                    Rankings (Produktkeywords)
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Lead Generation</h4>
                <ol className="text-xs space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</span>
                    Organische Leads
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</span>
                    Conversion Rate
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">3</span>
                    Organischer Traffic
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-muted-foreground text-background text-xs flex items-center justify-center">4</span>
                    Rankings (Service-Keywords)
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Publisher / Content</h4>
                <ol className="text-xs space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</span>
                    Organischer Traffic
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</span>
                    Pageviews
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">3</span>
                    Verweildauer
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-muted-foreground text-background text-xs flex items-center justify-center">4</span>
                    Newsletter-Signups
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Reporting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            SEO-Report erstellen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Report-Struktur (monatlich)</h4>
            <ol className="text-sm space-y-2">
              <li><strong>1. Executive Summary</strong> - Die wichtigsten Erkenntnisse in 2-3 Sätzen</li>
              <li><strong>2. KPI-Übersicht</strong> - Aktuelle Werte vs. Vormonat/Vorjahr</li>
              <li><strong>3. Traffic-Analyse</strong> - Organischer Traffic, Top-Seiten, Trends</li>
              <li><strong>4. Ranking-Entwicklung</strong> - Wichtige Keywords, Gewinner/Verlierer</li>
              <li><strong>5. Durchgeführte Maßnahmen</strong> - Was wurde gemacht</li>
              <li><strong>6. Geplante Maßnahmen</strong> - Was kommt als nächstes</li>
            </ol>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm text-green-700 mb-2">Gute Reports:</h4>
                <ul className="text-xs space-y-1">
                  <li>• Fokus auf Business-Impact (Conversions, Umsatz)</li>
                  <li>• Vergleiche (vs. Vormonat, Vorjahr)</li>
                  <li>• Klare Visualisierungen</li>
                  <li>• Konkrete Empfehlungen</li>
                  <li>• Executive Summary für Stakeholder</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm text-red-700 mb-2">Schlechte Reports:</h4>
                <ul className="text-xs space-y-1">
                  <li>• Nur "Vanity Metrics" (Impressionen ohne Kontext)</li>
                  <li>• Keine Vergleichswerte</li>
                  <li>• Zu technisch für die Zielgruppe</li>
                  <li>• Keine Handlungsempfehlungen</li>
                  <li>• Zu lang ohne klare Struktur</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Vanity Metrics Warnung */}
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Vorsicht vor "Vanity Metrics"
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manche Metriken sehen beeindruckend aus, sagen aber wenig über den tatsächlichen Erfolg aus:
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                metric: "Impressionen",
                problem: "Hohe Impressionen bei Position 50 bringen nichts",
                better: "Besser: Impressionen für Top-10 Rankings"
              },
              {
                metric: "Backlink-Anzahl",
                problem: "1000 Spam-Links sind wertlos",
                better: "Besser: Anzahl verlinkender Domains, Domain Rating"
              },
              {
                metric: "Indexierte Seiten",
                problem: "Mehr ist nicht immer besser (Thin Content)",
                better: "Besser: Seiten mit Traffic"
              }
            ].map((item) => (
              <Card key={item.metric} className="bg-background">
                <CardContent className="p-4">
                  <h5 className="font-semibold text-sm mb-2">{item.metric}</h5>
                  <p className="text-xs text-red-700 mb-2">Problem: {item.problem}</p>
                  <p className="text-xs text-green-700">{item.better}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <BestPracticeCard
        title="SEO KPIs & Reporting"
        dos={[
          "Business-KPIs priorisieren (Conversions, Umsatz)",
          "Immer Vergleichswerte zeigen (vs. Vormonat/Vorjahr)",
          "Report an die Zielgruppe anpassen",
          "Konkrete Empfehlungen geben",
          "Trends statt Einzelwerte analysieren",
          "Automatisierte Dashboards nutzen (Looker Studio)"
        ]}
        donts={[
          "Nur Vanity Metrics reporten",
          "Zu viele KPIs gleichzeitig tracken",
          "Ohne Kontext reporten",
          "Technische Details für C-Level",
          "Monatliche Schwankungen überbewerten",
          "Korrelation mit Kausalität verwechseln"
        ]}
        proTip="Erstellen Sie ein automatisiertes Dashboard in Looker Studio (ehemals Data Studio) mit GSC und GA4 Daten. Das spart Zeit und ermöglicht Echtzeit-Monitoring."
      />

      <QuizQuestion
        question="Was ist der wichtigste KPI für ein E-Commerce-Unternehmen?"
        options={[
          { id: "a", text: "Impressionen in der Google Suche", isCorrect: false, explanation: "Impressionen sind eine Vanity Metric ohne direkten Business-Impact." },
          { id: "b", text: "Anzahl der Backlinks", isCorrect: false, explanation: "Backlinks sind ein Mittel zum Zweck, kein Geschäftsziel." },
          { id: "c", text: "Organischer Umsatz / Conversions", isCorrect: true, explanation: "Richtig! Der Umsatz ist das, was letztendlich zählt. SEO muss zum Geschäftserfolg beitragen." },
          { id: "d", text: "Domain Authority", isCorrect: false, explanation: "DA ist eine Metrik von Drittanbietern, kein echter Google-Ranking-Faktor." }
        ]}
      />

      <KeyTakeaway
        points={[
          "Business-KPIs (Conversions, Umsatz) sind wichtiger als Traffic-Metriken",
          "Immer Vergleichswerte zeigen: vs. Vormonat, Vorjahr",
          "Vanity Metrics vermeiden (hohe Impressionen ohne Rankings)",
          "Reports an die Zielgruppe anpassen (C-Level vs. SEO-Team)",
          "Automatisierte Dashboards sparen Zeit und ermöglichen Echtzeit-Monitoring"
        ]}
      />
    </div>
  );
};
