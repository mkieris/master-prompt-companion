import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { 
  TrendingUp, AlertTriangle, History, CheckCircle2, 
  XCircle, Zap, RefreshCw
} from "lucide-react";

export const RankingFactorsModule = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Google Ranking-Faktoren & Updates
          </CardTitle>
          <CardDescription>
            Die wichtigsten Faktoren und wie Google Updates Ihre Rankings beeinflussen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Top Ranking-Faktoren */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Die Top 10 Ranking-Faktoren 2024/2025</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { factor: "Hilfreicher, hochwertiger Content", importance: 95, note: "Helpful Content System" },
                { factor: "Backlinks (Qualität > Quantität)", importance: 90, note: "PageRank lebt weiter" },
                { factor: "Search Intent Match", importance: 88, note: "Content muss zur Absicht passen" },
                { factor: "E-E-A-T Signale", importance: 85, note: "Expertise, Experience, Authority, Trust" },
                { factor: "Core Web Vitals", importance: 75, note: "LCP, INP, CLS" },
                { factor: "Mobile-Friendliness", importance: 70, note: "Mobile-First Indexierung" },
                { factor: "Interne Verlinkung", importance: 65, note: "Link-Equity Verteilung" },
                { factor: "Keyword-Optimierung", importance: 60, note: "Natürliche Integration" },
                { factor: "HTTPS", importance: 55, note: "Sicherheit als Basis" },
                { factor: "User Signals", importance: 50, note: "CTR, Verweildauer (indirekt)" },
              ].map((item, i) => (
                <div key={item.factor} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.factor}</span>
                      <span className="text-xs text-muted-foreground">{item.note}</span>
                    </div>
                    <Progress value={item.importance} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Wichtige Google Updates */}
          <h3 className="text-lg font-semibold">Wichtige Google Updates verstehen</h3>
          
          <div className="space-y-3">
            {[
              {
                name: "Helpful Content Update",
                year: "2022-2024",
                impact: "Hoch",
                desc: "Bestraft Inhalte, die primär für Rankings statt für Menschen erstellt wurden.",
                action: "People-First Content erstellen, echten Mehrwert bieten"
              },
              {
                name: "Core Updates",
                year: "Mehrmals/Jahr",
                impact: "Sehr hoch",
                desc: "Breite Algorithmus-Änderungen, die die Relevanzbewertung verbessern sollen.",
                action: "Fokus auf Qualität, E-E-A-T stärken, nichts Spezifisches zu 'fixen'"
              },
              {
                name: "Spam Updates",
                year: "Regelmäßig",
                impact: "Hoch (für Spammer)",
                desc: "Bekämpft Black-Hat-SEO wie Link-Spam, Cloaking, Auto-Generated Content.",
                action: "Nur White-Hat-Methoden verwenden, Qualität vor Quantität"
              },
              {
                name: "Page Experience Update",
                year: "2021",
                impact: "Mittel",
                desc: "Core Web Vitals wurden ein Ranking-Faktor.",
                action: "CWV optimieren: LCP < 2.5s, INP < 200ms, CLS < 0.1"
              },
              {
                name: "Product Reviews Update",
                year: "2021-2023",
                impact: "Hoch (für Reviews)",
                desc: "Belohnt tiefgehende Produktbewertungen mit echtem Test-Wissen.",
                action: "Produkte wirklich testen, Originalbilder, Vor-/Nachteile nennen"
              },
            ].map((update) => (
              <Card key={update.name} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{update.name}</span>
                      <Badge variant="outline" className="text-xs">{update.year}</Badge>
                    </div>
                    <Badge variant={update.impact === "Sehr hoch" || update.impact === "Hoch" ? "destructive" : "secondary"}>
                      Impact: {update.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{update.desc}</p>
                  <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                    <span><strong>Maßnahme:</strong> {update.action}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Was tun bei Ranking-Verlust */}
          <Card className="bg-red-500/5 border-red-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Was tun bei Ranking-Verlusten?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <span className="font-medium">Ruhe bewahren</span>
                    <p className="text-xs text-muted-foreground">Rankings schwanken natürlich. Abwarten, ob es sich stabilisiert.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <span className="font-medium">Update prüfen</span>
                    <p className="text-xs text-muted-foreground">War gerade ein Google Update? Prüfen Sie SEO-News und den Google Status.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <span className="font-medium">GSC prüfen</span>
                    <p className="text-xs text-muted-foreground">Manuelle Maßnahmen? Sicherheitsprobleme? Indexierungsfehler?</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">4</span>
                  <div>
                    <span className="font-medium">Content analysieren</span>
                    <p className="text-xs text-muted-foreground">Entspricht der Content noch dem Search Intent? Ist er aktuell?</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">5</span>
                  <div>
                    <span className="font-medium">Wettbewerb prüfen</span>
                    <p className="text-xs text-muted-foreground">Hat die Konkurrenz besseren Content veröffentlicht?</p>
                  </div>
                </li>
              </ol>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>💡 Wichtig:</strong> Bei Core Updates gibt es oft kein spezifisches "Fix". 
                  Google verbessert allgemein die Relevanzbewertung. Fokussieren Sie sich auf langfristige Qualität!
                </p>
              </div>
            </CardContent>
          </Card>

          <QuizQuestion
            question="Was ist der wichtigste Ranking-Faktor laut Google?"
            options={[
              { id: "a", text: "Die Anzahl der Backlinks", isCorrect: false, explanation: "Backlinks sind wichtig, aber Qualität zählt mehr als Quantität." },
              { id: "b", text: "Hilfreicher, hochwertiger Content", isCorrect: true, explanation: "Richtig! Google sagt klar: 'Create helpful, reliable, people-first content.'" },
              { id: "c", text: "Die Ladegeschwindigkeit", isCorrect: false, explanation: "Wichtig für UX, aber nicht der wichtigste Faktor." },
              { id: "d", text: "Keywords im Domain-Namen", isCorrect: false, explanation: "Hat kaum noch Einfluss auf Rankings." }
            ]}
          />

          <KeyTakeaway
            points={[
              "Hilfreicher Content ist der wichtigste Ranking-Faktor",
              "Backlinks bleiben ein Top-3-Faktor (Qualität vor Quantität)",
              "Core Updates verbessern die Relevanzbewertung allgemein",
              "Bei Ranking-Verlusten: Ruhe bewahren, analysieren, verbessern",
              "Langfristige Qualität schlägt kurzfristige Tricks"
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};
