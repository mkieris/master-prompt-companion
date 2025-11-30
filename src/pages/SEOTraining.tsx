import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useOrganization } from "@/hooks/useOrganization";
import { 
  BookOpen, 
  Target, 
  FileText, 
  Search, 
  Layout,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Star,
  Lightbulb,
  GraduationCap,
  Quote,
  ListChecks,
  Shield,
  Zap,
  Users,
  BarChart3,
  Link as LinkIcon,
  MessageSquare,
  Type
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Session } from "@supabase/supabase-js";

interface SEOTrainingProps {
  session: Session | null;
}

const SEOTraining = ({ session }: SEOTrainingProps) => {
  const [activeModule, setActiveModule] = useState("eeat");
  const { currentOrg, organizations, userRole, switchOrganization } = useOrganization(session);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        currentOrg={currentOrg}
        organizations={organizations}
        onSwitchOrg={switchOrganization}
        userRole={userRole}
      />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">SEO-Content Schulung</h1>
                <p className="text-muted-foreground">Komplettes Wissen für optimierte SEO-Texte</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3" /> Google E-E-A-T 2024/2025
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Quote className="h-3 w-3" /> John Mueller Quotes
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Evergreen Media
              </Badge>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="eeat" className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto gap-1 p-1 bg-muted/50">
              <TabsTrigger value="eeat" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Shield className="h-3.5 w-3.5 mr-1" />
                E-E-A-T
              </TabsTrigger>
              <TabsTrigger value="helpful" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-3.5 w-3.5 mr-1" />
                Helpful Content
              </TabsTrigger>
              <TabsTrigger value="headings" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Type className="h-3.5 w-3.5 mr-1" />
                H1-H5
              </TabsTrigger>
              <TabsTrigger value="keywords" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Search className="h-3.5 w-3.5 mr-1" />
                Keywords
              </TabsTrigger>
              <TabsTrigger value="structure" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Layout className="h-3.5 w-3.5 mr-1" />
                Textaufbau
              </TabsTrigger>
              <TabsTrigger value="readability" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="h-3.5 w-3.5 mr-1" />
                Lesbarkeit
              </TabsTrigger>
              <TabsTrigger value="checklist" className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ListChecks className="h-3.5 w-3.5 mr-1" />
                Checkliste
              </TabsTrigger>
            </TabsList>

            {/* E-E-A-T Module */}
            <TabsContent value="eeat" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Google E-E-A-T Framework (2024/2025)
                  </CardTitle>
                  <CardDescription>
                    <a href="https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf" 
                       target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      Quelle: Google Search Quality Rater Guidelines
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    Jeder Text MUSS diese vier Qualitätskriterien erfüllen. E-E-A-T ist kein direkter Ranking-Faktor, 
                    aber beeinflusst, wie Google die Qualität Ihrer Seite bewertet.
                  </p>

                  {/* Experience */}
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-500/5 to-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="text-blue-500">E</span>xperience (Erfahrung)
                      </h3>
                      <Badge className="bg-blue-500">Ranking-Faktor: HOCH</Badge>
                    </div>
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-muted-foreground mb-3">
                      "Does the content creator have first-hand experience with the topic?"
                      <span className="block text-xs mt-1 not-italic">— Google Quality Rater Guidelines, Section 3.4</span>
                    </blockquote>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" /> So geht's richtig:
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Zeige praktische, echte Erfahrung mit dem Thema</li>
                          <li>• Nutze konkrete Anwendungsbeispiele aus der Praxis</li>
                          <li>• Schreibe aus der Perspektive eines Experten</li>
                          <li>• Sei spezifisch und authentisch</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" /> Fehler vermeiden:
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Generische Aussagen ohne Tiefe</li>
                          <li>• Offensichtlich recherchierte statt erlebte Inhalte</li>
                          <li>• Fehlende praktische Beispiele</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Expertise */}
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-green-500/5 to-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="text-green-500">E</span>xpertise (Fachwissen)
                      </h3>
                      <Badge className="bg-green-500">Ranking-Faktor: HOCH bei YMYL</Badge>
                    </div>
                    <blockquote className="border-l-4 border-green-500 pl-4 italic text-muted-foreground mb-3">
                      "Does the content creator have the necessary knowledge or skill?"
                      <span className="block text-xs mt-1 not-italic">— Google Quality Rater Guidelines, Section 3.2</span>
                    </blockquote>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" /> So geht's richtig:
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Korrekter Einsatz von Fachbegriffen</li>
                          <li>• Referenzen auf Studien, Standards, Normen</li>
                          <li>• Technisch korrekte Aussagen</li>
                          <li>• Erwähne Qualifikationen & Zertifizierungen</li>
                        </ul>
                      </div>
                      <div className="bg-amber-500/10 p-3 rounded">
                        <h4 className="font-medium flex items-center gap-1 text-amber-600 text-sm mb-2">
                          <AlertTriangle className="h-4 w-4" /> YMYL-Hinweis
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Bei "Your Money or Your Life"-Themen (Gesundheit, Finanzen, Recht) ist Expertise besonders kritisch!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Authoritativeness */}
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-500/5 to-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="text-purple-500">A</span>uthoritativeness (Autorität)
                      </h3>
                      <Badge className="bg-purple-500">Ranking-Faktor: MITTEL-HOCH</Badge>
                    </div>
                    <blockquote className="border-l-4 border-purple-500 pl-4 italic text-muted-foreground mb-3">
                      "Is the content creator or website known as a go-to source?"
                      <span className="block text-xs mt-1 not-italic">— Google Quality Rater Guidelines, Section 3.3</span>
                    </blockquote>
                    <ul className="space-y-1 text-sm">
                      <li>• Positioniere den Anbieter als vertrauenswürdige Quelle</li>
                      <li>• Erwähne Auszeichnungen, Marktführerschaft, Erfahrung</li>
                      <li>• Verweise auf Branchenstandards und Best Practices</li>
                      <li>• Zeige Backlinks von anderen autoritativen Quellen</li>
                    </ul>
                  </div>

                  {/* Trustworthiness */}
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-red-500/5 to-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="text-red-500">T</span>rustworthiness (Vertrauen)
                      </h3>
                      <Badge className="bg-red-500">Ranking-Faktor: SEHR HOCH ⚠️</Badge>
                    </div>
                    <blockquote className="border-l-4 border-red-500 pl-4 italic text-muted-foreground mb-3">
                      "Is the page accurate, honest, safe, and reliable?"
                      <span className="block text-xs mt-1 not-italic">— Google Quality Rater Guidelines, Section 3.1 "Most Important"</span>
                    </blockquote>
                    <div className="bg-red-500/10 p-3 rounded mb-3">
                      <p className="text-sm font-medium text-red-700">
                        ⚠️ Trust ist der WICHTIGSTE E-E-A-T-Faktor laut Google!
                      </p>
                    </div>
                    <ul className="space-y-1 text-sm">
                      <li>• Sei transparent und ehrlich</li>
                      <li>• Keine übertriebenen Versprechen</li>
                      <li>• Erwähne Garantien, Zertifizierungen, Prüfsiegel</li>
                      <li>• Bei YMYL-Themen: Extra vorsichtig mit Heilversprechen</li>
                      <li>• Impressum, Datenschutz, Kontaktdaten vollständig</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Helpful Content Module */}
            <TabsContent value="helpful" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    John Mueller's Helpful Content Guidelines
                  </CardTitle>
                  <CardDescription>
                    <a href="https://developers.google.com/search/docs/appearance/helpful-content-system" 
                       target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      Quelle: Google Search Central, Helpful Content System
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* People-First Content */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      People-First Content (Kern-Prinzip)
                    </h3>
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4 bg-muted/50 p-3 rounded-r">
                      "Ask yourself: Would someone visiting your page leave feeling they've learned enough about a topic to help achieve their goal?"
                      <span className="block text-xs mt-2 not-italic font-medium">— John Mueller, Google Search Advocate</span>
                    </blockquote>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" /> ✅ MACHE:
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Fokussiere auf den NUTZEN für den Leser</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Beantworte die Fragen, die der Suchende wirklich hat</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Biete einzigartigen Mehrwert</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>Schaffe Vertrauen durch Kompetenz</span>
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" /> ❌ VERMEIDE:
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span>Texte nur für Suchmaschinen-Rankings</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span>Zusammengefasste Inhalte ohne eigene Perspektive</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span>Künstlich aufgeblähte Texte ohne Mehrwert</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <span>Keyword-Stuffing oder unnatürliche Formulierungen</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Content Length */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Content-Länge</h3>
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4 bg-muted/50 p-3 rounded-r">
                      "There's no ideal word count. The right length is whatever fully covers the topic without fluff."
                      <span className="block text-xs mt-2 not-italic">— John Mueller, Reddit AMA, February 2024</span>
                    </blockquote>
                    <div className="bg-blue-500/10 p-3 rounded">
                      <p className="text-sm">
                        <strong>Merke:</strong> Word Count ist KEIN Ranking-Faktor! 
                        Fokussiere dich darauf, die Frage des Nutzers vollständig zu beantworten – nicht mehr und nicht weniger.
                      </p>
                    </div>
                  </div>

                  {/* Self-Assessment Questions */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Selbst-Check: Ist mein Content "helpful"?</h3>
                    <div className="space-y-2">
                      {[
                        "Bietet der Inhalt originelle Informationen, Berichte, Recherchen oder Analysen?",
                        "Bietet der Inhalt eine substanzielle, vollständige oder umfassende Beschreibung des Themas?",
                        "Bietet der Inhalt aufschlussreiche Analysen oder interessante Informationen, die über das Offensichtliche hinausgehen?",
                        "Wenn der Inhalt auf anderen Quellen basiert, fügt er erheblichen Mehrwert hinzu?",
                        "Bietet die Überschrift eine hilfreiche Zusammenfassung des Inhalts?",
                        "Würden Sie die Seite bookmarken, mit Freunden teilen oder empfehlen?",
                        "Würde dieser Inhalt in einem Magazin oder Buch veröffentlicht werden?"
                      ].map((question, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                          <span className="text-primary font-bold">{idx + 1}.</span>
                          <span className="text-sm">{question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Headings Module */}
            <TabsContent value="headings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-primary" />
                    H1-H5 Best Practice Guide
                  </CardTitle>
                  <CardDescription>
                    Quellen: Ahrefs H-Tag Study 2024, Backlinko On-Page SEO Guide, John Mueller Statements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Ranking Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-semibold">Heading</th>
                          <th className="text-left p-3 font-semibold">SEO-Relevanz</th>
                          <th className="text-left p-3 font-semibold">Keyword-Empfehlung</th>
                          <th className="text-left p-3 font-semibold">Max. pro Seite</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3 font-medium">H1</td>
                          <td className="p-3"><Badge className="bg-red-500">★★★★★ KRITISCH</Badge></td>
                          <td className="p-3">Fokus-KW am Anfang</td>
                          <td className="p-3 font-bold text-red-600">1</td>
                        </tr>
                        <tr className="border-t bg-muted/30">
                          <td className="p-3 font-medium">H2</td>
                          <td className="p-3"><Badge className="bg-orange-500">★★★★☆ SEHR HOCH</Badge></td>
                          <td className="p-3">Fokus + LSI Keywords</td>
                          <td className="p-3">3-6</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 font-medium">H3</td>
                          <td className="p-3"><Badge className="bg-amber-500">★★★☆☆ MITTEL</Badge></td>
                          <td className="p-3">Long-Tail Keywords</td>
                          <td className="p-3">Nach Bedarf</td>
                        </tr>
                        <tr className="border-t bg-muted/30">
                          <td className="p-3 font-medium">H4</td>
                          <td className="p-3"><Badge variant="secondary">★★☆☆☆ MODERAT</Badge></td>
                          <td className="p-3">Optional</td>
                          <td className="p-3">Nach Bedarf</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3 font-medium">H5/H6</td>
                          <td className="p-3"><Badge variant="outline">★☆☆☆☆ GERING</Badge></td>
                          <td className="p-3">Nicht nötig</td>
                          <td className="p-3 text-muted-foreground">Vermeiden</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* H1 Details */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="h1">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500">H1</Badge>
                          Hauptüberschrift - KRITISCH für Rankings
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground bg-muted/50 p-3 rounded-r">
                          "The H1 is important. Use it to tell users what the page is about."
                          <span className="block text-xs mt-2 not-italic">— John Mueller, Google SEO Office Hours 2024</span>
                        </blockquote>
                        
                        <div className="bg-green-500/10 p-3 rounded">
                          <p className="text-sm font-medium text-green-700 mb-2">📊 Ahrefs Studie:</p>
                          <p className="text-sm">96,8% der Top-10-Ergebnisse haben genau EINE H1. Seiten mit H1 ranken durchschnittlich 2 Positionen höher.</p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Best Practices:</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• <strong>NUR EINE H1</strong> pro Seite</li>
                            <li>• Fokus-Keyword möglichst am <strong>ANFANG</strong></li>
                            <li>• Max. <strong>60-70 Zeichen</strong> (Google schneidet bei ~70 ab)</li>
                            <li>• Nutzenorientiert formulieren</li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Beispiel-Templates:</h4>
                          <div className="bg-muted p-3 rounded space-y-2 text-sm font-mono">
                            <p><strong>Produktseite:</strong> [Produktname] – [Hauptnutzen in 3-5 Wörtern]</p>
                            <p><strong>Kategorieseite:</strong> [Kategorie]: [Nutzenversprechen oder Überblick]</p>
                            <p><strong>Ratgeber:</strong> [Fokus-Keyword] – [Was der Leser lernt/erhält]</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="h2">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-500">H2</Badge>
                          Hauptabschnitte - Ideal für Featured Snippets
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground bg-muted/50 p-3 rounded-r">
                          "H2s help break up content and make it scannable for users."
                          <span className="block text-xs mt-2 not-italic">— John Mueller</span>
                        </blockquote>

                        <div className="bg-blue-500/10 p-3 rounded">
                          <p className="text-sm font-medium text-blue-700 mb-2">📊 Backlinko Studie:</p>
                          <p className="text-sm">Seiten mit 2-4 H2s performen am besten für Featured Snippets. H2 als Frage formulieren erhöht die Chance um 24%.</p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">H2-Struktur Template:</h4>
                          <ol className="space-y-1 text-sm list-decimal list-inside">
                            <li>Was ist [Thema]? <span className="text-muted-foreground">(Know-Intent)</span></li>
                            <li>Vorteile/Nutzen von [Thema] <span className="text-muted-foreground">(Buy-Intent)</span></li>
                            <li>[Thema] im Vergleich/Auswahl <span className="text-muted-foreground">(Comparison)</span></li>
                            <li>Anwendung/Verwendung <span className="text-muted-foreground">(Do-Intent)</span></li>
                            <li>FAQ zu [Thema]</li>
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="hierarchy">
                      <AccordionTrigger className="text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          Hierarchie-Regeln (KRITISCH!)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <div className="bg-red-500/10 p-4 rounded border border-red-500/30">
                          <h4 className="font-semibold text-red-700 mb-2">⚠️ Reihenfolge IMMER einhalten:</h4>
                          <p className="text-sm mb-3">H1 → H2 → H3 → H4 (keine Level überspringen!)</p>
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <strong>FALSCH:</strong> H1 → H3 (H2 fehlt)
                            </p>
                            <p className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <strong>RICHTIG:</strong> H1 → H2 → H3
                            </p>
                          </div>
                        </div>

                        <div className="bg-muted p-3 rounded">
                          <h4 className="font-medium mb-2">Beispiel einer korrekten Struktur:</h4>
                          <pre className="text-sm text-muted-foreground">
{`H1: Produktname – Hauptnutzen
  H2: Was ist [Produkt] und wie funktioniert es?
    H3: Technologie und Funktionsweise
    H3: Hauptvorteile auf einen Blick
  H2: Varianten und Modelle
    H3: Modell A – Für Anwendung X
    H3: Modell B – Für Anwendung Y
  H2: Anwendungsbereiche
  H2: FAQ`}
                          </pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Keywords Module */}
            <TabsContent value="keywords" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Keyword-Strategie & Suchintention
                  </CardTitle>
                  <CardDescription>
                    Quelle: Google Search Central, Ahrefs SEO Research 2024
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Fokus-Keyword Rules */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Fokus-Keyword Platzierung</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm">In H1 (möglichst am Anfang)</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm">In den ersten 100 Wörtern</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm">1-2x in H2/H3 Überschriften</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm">Im Title Tag & Meta Description</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-muted rounded">
                          <h4 className="font-medium mb-2">Keyword-Dichte</h4>
                          <p className="text-sm text-muted-foreground mb-2">Empfohlen: 1-3% (max. 5%)</p>
                          <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-1/4"></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Natürliche Integration ist wichtiger als exakte %!</p>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded border border-red-500/30">
                          <p className="text-sm font-medium text-red-700">⚠️ KEIN Keyword-Stuffing!</p>
                          <p className="text-xs text-muted-foreground">Verwende Synonyme und Variationen</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search Intent */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Suchintention verstehen</h3>
                    <p className="text-muted-foreground mb-4">
                      Richte deinen Text an der erkannten Suchintention aus – das ist entscheidend für Rankings!
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { type: "Do", desc: "Handlung/Aktion", example: '"Produkt kaufen", "Download"', color: "bg-blue-500" },
                        { type: "Know", desc: "Information suchen", example: '"Was ist X?", "Wie funktioniert Y?"', color: "bg-green-500" },
                        { type: "Know Simple", desc: "Punktuelle Info", example: "Oft direkt in SERPs beantwortet", color: "bg-emerald-500" },
                        { type: "Go", desc: "Navigation", example: "Zu bestimmter Seite/Marke", color: "bg-purple-500" },
                        { type: "Buy", desc: "Kaufabsicht", example: "Modelle vergleichen", color: "bg-orange-500" },
                        { type: "Visit", desc: "Standortbezogen", example: '"in meiner Nähe"', color: "bg-pink-500" },
                      ].map((intent) => (
                        <div key={intent.type} className="p-3 border rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={intent.color}>{intent.type}</Badge>
                          </div>
                          <p className="text-sm font-medium">{intent.desc}</p>
                          <p className="text-xs text-muted-foreground">{intent.example}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Structure Module */}
            <TabsContent value="structure" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5 text-primary" />
                    Textaufbau & Struktur
                  </CardTitle>
                  <CardDescription>
                    Quelle: Backlinko "Bucket Brigade", Evergreen Media, Nielsen Norman Group
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Intro */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Intro/Teaser (erste 2-3 Zeilen)
                    </h3>
                    <div className="space-y-3">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Beginne mit einem <strong>starken Hook</strong> (Frage, überraschende Aussage, Szenario)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Fokus-Keyword MUSS in den <strong>ersten 100 Wörtern</strong> erscheinen</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Wecke Emotionen: Zeige Probleme auf und deute Lösungen an</span>
                        </li>
                      </ul>
                      <div className="grid md:grid-cols-2 gap-3 mt-4">
                        <div className="p-3 bg-red-500/10 rounded">
                          <p className="text-sm font-medium text-red-700 mb-1">❌ Schlecht:</p>
                          <p className="text-sm text-muted-foreground">"Hier erfahren Sie alles über X..."</p>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded">
                          <p className="text-sm font-medium text-green-700 mb-1">✅ Gut:</p>
                          <p className="text-sm text-muted-foreground">"Wünschen Sie sich mehr Beweglichkeit im Alltag?"</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Text Rules */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Haupttext-Regeln</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-3 bg-muted rounded">
                          <p className="font-medium">Ein Absatz = Ein Gedanke</p>
                          <p className="text-sm text-muted-foreground">Max. 3-4 Sätze pro Absatz</p>
                        </div>
                        <div className="p-3 bg-muted rounded">
                          <p className="font-medium">Abschnittslänge</p>
                          <p className="text-sm text-muted-foreground">Max. 200-300 Wörter pro H2</p>
                        </div>
                        <div className="p-3 bg-muted rounded">
                          <p className="font-medium">Inverted Pyramid</p>
                          <p className="text-sm text-muted-foreground">Wichtige Inhalte zuerst!</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Stilregeln:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• <strong>AKTIVSÄTZE</strong> statt Passiv</li>
                          <li>• <strong>Konkrete Beispiele</strong>: "Reduziert um 70%" statt "wirksam"</li>
                          <li>• <strong>Visuelle Sprache</strong>: Beschreibe Erfahrungen</li>
                          <li>• Fachbegriffe <strong>erklären</strong></li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Formatting Elements */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Leserfreundliche Elemente</h3>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="p-3 border rounded">
                        <p className="font-medium mb-1">📋 Bullet Points</p>
                        <p className="text-xs text-muted-foreground">Min. 2-3 Listen pro Text</p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="font-medium mb-1">📊 Tabellen</p>
                        <p className="text-xs text-muted-foreground">Für Vergleiche & Daten</p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="font-medium mb-1">**Fett**</p>
                        <p className="text-xs text-muted-foreground">Wichtige Begriffe (sparsam!)</p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="font-medium mb-1">💡 Infoboxen</p>
                        <p className="text-xs text-muted-foreground">Für Tipps & Hinweise</p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="font-medium mb-1">🔗 Interne Links</p>
                        <p className="text-xs text-muted-foreground">Sprechende Ankertexte!</p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="font-medium mb-1">❓ FAQ</p>
                        <p className="text-xs text-muted-foreground">3-6 relevante Fragen</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Readability Module */}
            <TabsContent value="readability" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Lesbarkeit (Evergreen Media Best Practices)
                  </CardTitle>
                  <CardDescription>
                    <a href="https://www.evergreenmedia.at/ratgeber/" 
                       target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      Quelle: Evergreen Media Ratgeber
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Metrics */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-primary">60+</p>
                      <p className="text-sm font-medium">Flesch-Index</p>
                      <p className="text-xs text-muted-foreground">Für allgemeine Texte</p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-primary">15-20</p>
                      <p className="text-sm font-medium">Wörter pro Satz</p>
                      <p className="text-xs text-muted-foreground">Durchschnitt</p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-primary">&lt;15%</p>
                      <p className="text-sm font-medium">Passiv-Anteil</p>
                      <p className="text-xs text-muted-foreground">Max. erlaubt</p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-primary">3-4</p>
                      <p className="text-sm font-medium">Sätze pro Absatz</p>
                      <p className="text-xs text-muted-foreground">Ein Gedanke</p>
                    </div>
                  </div>

                  {/* Flesch Scale */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Flesch-Reading-Ease (Deutsch)</h3>
                    <div className="space-y-2">
                      {[
                        { range: "80-100", level: "Sehr leicht", grade: "5. Klasse", color: "bg-green-500" },
                        { range: "70-80", level: "Leicht", grade: "6. Klasse", color: "bg-green-400" },
                        { range: "60-70", level: "Mittel", grade: "7.-8. Klasse", color: "bg-amber-400" },
                        { range: "50-60", level: "Mittelschwer", grade: "9.-10. Klasse", color: "bg-amber-500" },
                        { range: "40-50", level: "Schwer", grade: "Oberstufe", color: "bg-orange-500" },
                        { range: "30-40", level: "Sehr schwer", grade: "Akademisch", color: "bg-red-400" },
                        { range: "0-30", level: "Extrem schwer", grade: "Wissenschaftlich", color: "bg-red-500" },
                      ].map((item) => (
                        <div key={item.range} className="flex items-center gap-3">
                          <Badge className={`${item.color} w-20`}>{item.range}</Badge>
                          <span className="text-sm font-medium w-32">{item.level}</span>
                          <span className="text-sm text-muted-foreground">{item.grade}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* German Fill Words */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-red-600">❌ Deutsche Füllwörter vermeiden</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "also", "eigentlich", "halt", "eben", "ja", "nun", "denn", "wohl", "mal", "schon",
                        "doch", "etwa", "einfach", "quasi", "sozusagen", "gewissermaßen", "irgendwie",
                        "praktisch", "grundsätzlich", "prinzipiell", "natürlich"
                      ].map((word) => (
                        <Badge key={word} variant="outline" className="text-red-600 border-red-300">{word}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Checklist Module */}
            <TabsContent value="checklist" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    SEO-Content Checkliste
                  </CardTitle>
                  <CardDescription>
                    Prüfe jeden Text gegen diese Liste vor der Veröffentlichung
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* DO */}
                  <div className="border rounded-lg p-4 bg-green-500/5">
                    <h3 className="text-lg font-semibold mb-4 text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      ✅ IMMER machen
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        "Genau EINE H1 mit Fokus-Keyword am Anfang",
                        "Fokus-Keyword in ersten 100 Wörtern",
                        "3-6 H2-Überschriften mit Keyword-Variationen",
                        "Heading-Hierarchie einhalten (H1→H2→H3)",
                        "Title Tag 50-60 Zeichen mit Keyword",
                        "Meta Description 150-160 Zeichen",
                        "Mindestens 2-3 Bullet-Listen",
                        "Interne Links mit sprechenden Ankertexten",
                        "FAQ-Sektion mit 3-6 Fragen",
                        "Aktive Sprache verwenden",
                        "Konkrete Beispiele und Zahlen nennen",
                        "E-E-A-T-Signale einbauen"
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-white/50 dark:bg-black/20 rounded">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DON'T */}
                  <div className="border rounded-lg p-4 bg-red-500/5">
                    <h3 className="text-lg font-semibold mb-4 text-red-700 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      ❌ NIEMALS machen
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        "Keyword-Stuffing (>5% Dichte)",
                        "Lange, verschachtelte Sätze (>20 Wörter)",
                        "Passivsätze ('wird verwendet' → 'verwenden Sie')",
                        "Nichtssagende Ankertexte ('hier', 'mehr')",
                        "Zu lange Absätze (>4 Sätze)",
                        "Füllwörter ('quasi', 'eigentlich', 'sozusagen')",
                        "Leere Versprechen ('hochwertig', 'innovativ' ohne Beleg)",
                        "Unpersönliche Sprache ('man', 'es wird')",
                        "Fachsprache ohne Erklärung",
                        "Heading-Level überspringen (H1→H3)",
                        "Mehrere H1 auf einer Seite",
                        "Texte nur für Suchmaschinen schreiben"
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 bg-white/50 dark:bg-black/20 rounded">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Reference */}
                  <div className="border rounded-lg p-4 bg-primary/5">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Quick Reference – Zahlen im Überblick
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-background rounded">
                        <p className="text-2xl font-bold text-primary">1</p>
                        <p className="text-xs text-muted-foreground">H1 pro Seite</p>
                      </div>
                      <div className="p-3 bg-background rounded">
                        <p className="text-2xl font-bold text-primary">3-6</p>
                        <p className="text-xs text-muted-foreground">H2 Abschnitte</p>
                      </div>
                      <div className="p-3 bg-background rounded">
                        <p className="text-2xl font-bold text-primary">60</p>
                        <p className="text-xs text-muted-foreground">Title-Zeichen</p>
                      </div>
                      <div className="p-3 bg-background rounded">
                        <p className="text-2xl font-bold text-primary">155</p>
                        <p className="text-xs text-muted-foreground">Meta-Zeichen</p>
                      </div>
                      <div className="p-3 bg-background rounded">
                        <p className="text-2xl font-bold text-primary">100</p>
                        <p className="text-xs text-muted-foreground">Wörter bis Keyword</p>
                      </div>
                      <div className="p-3 bg-background rounded">
                        <p className="text-2xl font-bold text-primary">1-3%</p>
                        <p className="text-xs text-muted-foreground">Keyword-Dichte</p>
                      </div>
                      <div className="p-3 bg-background rounded">
                        <p className="text-2xl font-bold text-primary">15-20</p>
                        <p className="text-xs text-muted-foreground">Wörter/Satz</p>
                      </div>
                      <div className="p-3 bg-background rounded">
                        <p className="text-2xl font-bold text-primary">60+</p>
                        <p className="text-xs text-muted-foreground">Flesch-Score</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Sources Footer */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Primärquellen & Referenzen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a href="https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf" 
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 p-3 border rounded hover:bg-muted transition-colors">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Google Quality Rater Guidelines</p>
                    <p className="text-xs text-muted-foreground">E-E-A-T Framework 2024</p>
                  </div>
                </a>
                <a href="https://developers.google.com/search/docs/appearance/helpful-content-system" 
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 p-3 border rounded hover:bg-muted transition-colors">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Google Helpful Content System</p>
                    <p className="text-xs text-muted-foreground">Official Documentation</p>
                  </div>
                </a>
                <a href="https://www.evergreenmedia.at/ratgeber/" 
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 p-3 border rounded hover:bg-muted transition-colors">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Evergreen Media Ratgeber</p>
                    <p className="text-xs text-muted-foreground">Lesbarkeit & Best Practices</p>
                  </div>
                </a>
                <a href="https://ahrefs.com/blog/h1-tag/" 
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 p-3 border rounded hover:bg-muted transition-colors">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Ahrefs H-Tag Study 2024</p>
                    <p className="text-xs text-muted-foreground">Heading Best Practices</p>
                  </div>
                </a>
                <a href="https://backlinko.com/on-page-seo" 
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 p-3 border rounded hover:bg-muted transition-colors">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Backlinko On-Page SEO Guide</p>
                    <p className="text-xs text-muted-foreground">Comprehensive Guide</p>
                  </div>
                </a>
                <a href="https://developers.google.com/search/docs" 
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 p-3 border rounded hover:bg-muted transition-colors">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Google Search Central</p>
                    <p className="text-xs text-muted-foreground">Official SEO Documentation</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SEOTraining;
