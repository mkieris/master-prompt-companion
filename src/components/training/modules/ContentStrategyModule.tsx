import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { 
  Layers, Target, RefreshCw, Trash2, GitMerge, CheckCircle2, AlertTriangle
} from "lucide-react";

export const ContentStrategyModule = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Content-Strategie
          </CardTitle>
          <CardDescription>
            Von der Planung über die Erstellung bis zur kontinuierlichen Optimierung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Themencluster */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Themencluster & Topical Authority
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ein Themencluster ist eine Gruppe von Inhalten, die ein Hauptthema umfassend abdecken. 
                Google belohnt Websites, die <strong>Topical Authority</strong> (thematische Autorität) aufbauen.
              </p>
              
              <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-3">Aufbau eines Themenclusters:</h4>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-primary text-primary-foreground rounded-lg font-semibold text-center">
                    Pillar Page (Hauptseite)<br/>
                    <span className="text-xs font-normal">z.B. "Der ultimative SEO-Guide"</span>
                  </div>
                  <div className="h-4 w-px bg-primary" />
                  <div className="grid grid-cols-3 gap-2">
                    {["Keyword-Recherche", "OnPage-SEO", "Linkbuilding", "Technical SEO", "Local SEO", "Content-SEO"].map((topic) => (
                      <div key={topic} className="p-2 bg-muted text-center rounded text-xs">
                        {topic}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Cluster-Seiten verlinken auf die Pillar Page und umgekehrt → stärkt alle Seiten
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>💡 Tipp:</strong> Decken Sie ein Thema umfassend ab, bevor Sie zum nächsten wechseln. 
                  "Jack of all trades, master of none" funktioniert bei SEO nicht!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content-Audit */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                Content-Audit & Re-Optimierung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Bestehende Inhalte zu optimieren bringt oft schnellere Ergebnisse als neue Inhalte zu erstellen.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 bg-background rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">🔍 Im Audit prüfen:</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Traffic-Entwicklung (GSC)</li>
                    <li>• Ranking-Positionen</li>
                    <li>• Aktualität der Informationen</li>
                    <li>• Conversion-Rate</li>
                    <li>• Backlinks & Shares</li>
                  </ul>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">📋 Entscheidungsmatrix:</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Top-Performer → Weiter optimieren</li>
                    <li className="flex items-center gap-2"><RefreshCw className="h-3 w-3 text-blue-500" />Underperformer → Re-optimieren</li>
                    <li className="flex items-center gap-2"><GitMerge className="h-3 w-3 text-purple-500" />Ähnliche Seiten → Zusammenführen</li>
                    <li className="flex items-center gap-2"><Trash2 className="h-3 w-3 text-red-500" />Kein Traffic/Wert → Löschen</li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
                <h5 className="font-medium text-sm text-green-700 mb-2">Quick Wins bei der Re-Optimierung:</h5>
                <ul className="text-xs space-y-1">
                  <li>1. Seiten auf Position 5-20 identifizieren (niedrig hängende Früchte)</li>
                  <li>2. Content aktualisieren & erweitern</li>
                  <li>3. Interne Verlinkung stärken</li>
                  <li>4. Meta-Tags optimieren für höhere CTR</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Content-Zusammenführung */}
          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-purple-500" />
                Content-Konsolidierung (Zusammenführung)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Mehrere schwache Seiten zum gleichen Thema kannibalisieren sich gegenseitig. 
                Zusammenführen stärkt das Ranking!
              </p>

              <div className="p-4 bg-background rounded-lg border">
                <h5 className="font-medium text-sm mb-3">Wann zusammenführen?</h5>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Mehrere Seiten ranken für das gleiche Keyword (Keyword-Kannibalisierung)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Ähnliche Seiten mit jeweils wenig Traffic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Veraltete Seiten mit Backlinks</span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                <p className="text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Wichtig:</strong> Bei Zusammenführungen immer 301-Redirects von den alten URLs zur neuen Seite einrichten, 
                    um Link-Equity und Nutzer weiterzuleiten!
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <BestPracticeCard
            title="Content-Strategie"
            dos={[
              "Themencluster aufbauen für Topical Authority",
              "Regelmäßige Content-Audits durchführen",
              "Underperformer re-optimieren statt nur neu erstellen",
              "Content-Kalender für konsistente Veröffentlichung",
              "Performance mit GSC & Analytics tracken"
            ]}
            donts={[
              "Viele Themen oberflächlich behandeln",
              "Keyword-Kannibalisierung ignorieren",
              "Alte Inhalte ungeprüft lassen",
              "Ohne Keyword-Recherche Content erstellen",
              "Content erstellen und dann vergessen"
            ]}
            proTip="80/20-Regel: 80% der Ergebnisse kommen oft von 20% der Seiten. Identifizieren und stärken Sie diese Top-Performer!"
          />

          <QuizQuestion
            question="Was ist Keyword-Kannibalisierung?"
            options={[
              { id: "a", text: "Wenn ein Keyword zu oft im Text vorkommt", isCorrect: false, explanation: "Das wäre Keyword-Stuffing, nicht Kannibalisierung." },
              { id: "b", text: "Wenn mehrere eigene Seiten für das gleiche Keyword konkurrieren", isCorrect: true, explanation: "Richtig! Die Seiten 'fressen' sich gegenseitig die Rankings weg." },
              { id: "c", text: "Wenn die Konkurrenz Ihr Keyword kopiert", isCorrect: false, explanation: "Das ist normale Konkurrenz, keine Kannibalisierung." },
              { id: "d", text: "Wenn ein Keyword nicht mehr gesucht wird", isCorrect: false, explanation: "Das wäre ein veraltetes Keyword, keine Kannibalisierung." }
            ]}
          />

          <KeyTakeaway
            points={[
              "Themencluster aufbauen: Pillar Page + Cluster-Seiten",
              "Topical Authority: Ein Thema umfassend abdecken",
              "Content-Audit: Mindestens 1x pro Jahr alle Inhalte prüfen",
              "Re-Optimierung bringt oft schnellere Ergebnisse als Neuerstellen",
              "Keyword-Kannibalisierung durch Zusammenführung lösen"
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};
