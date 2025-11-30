import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  Check, 
  Download, 
  FileText, 
  MessageSquare, 
  Tag, 
  Link as LinkIcon, 
  Shield,
  Loader2,
  FileDown,
  Code,
  Pencil,
  Save,
  X,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EEATScore {
  score: number;
  status: "green" | "yellow" | "red" | string;
  notes: string;
}

interface JohnMuellerCheck {
  passed: boolean;
  note: string;
}

interface HeadingLevel {
  count: number;
  hasKeyword?: boolean;
  length?: number;
  position?: string;
  keywordVariations?: number;
  avgSectionLength?: number;
  longTailKeywords?: number;
  status: "green" | "yellow" | "red" | string;
  seoRelevance: string;
  issues: string[];
}

interface EvergreenCheck {
  value: number;
  target: string;
  status: "green" | "yellow" | "red" | string;
}

interface GuidelineReference {
  guideline: string;
  source: string;
  url: string;
  section?: string;
  quote?: string;
  finding?: string;
  recommendation?: string;
}

interface GuidelineValidation {
  overallScore: number;
  googleEEAT: {
    experience: EEATScore;
    expertise: EEATScore;
    authority: EEATScore;
    trust: EEATScore;
  };
  johnMuellerChecks: {
    peopleFirst: JohnMuellerCheck;
    uniqueValue: JohnMuellerCheck;
    noKeywordStuffing: JohnMuellerCheck;
    comprehensiveContent: JohnMuellerCheck;
  };
  headingStructure: {
    h1: HeadingLevel;
    h2: HeadingLevel;
    h3: HeadingLevel;
    h4: HeadingLevel;
    hierarchyValid: boolean;
    hierarchyIssues: string[];
    rankingSummary: string;
  };
  evergreenMediaChecks: {
    avgSentenceLength: EvergreenCheck;
    passiveVoicePercent: EvergreenCheck;
    maxParagraphLength: EvergreenCheck;
    readabilityScore: EvergreenCheck;
    issues: string[];
  };
  references: GuidelineReference[];
}

export interface GeneratedContent {
  seoText: string;
  faq: Array<{ question: string; answer: string }>;
  title: string;
  metaDescription: string;
  internalLinks: Array<{ url: string; anchorText: string }>;
  technicalHints: string;
  qualityReport?: {
    status: "green" | "yellow" | "red" | string;
    flags: Array<{
      type: "mdr" | "hwg" | "study";
      severity: "high" | "medium" | "low";
      issue: string;
      rewrite: string;
    }>;
    evidenceTable?: Array<{
      study: string;
      type: string;
      population: string;
      outcome: string;
      effect: string;
      limitations: string;
      source: string;
    }>;
  };
  guidelineValidation?: GuidelineValidation;
}

interface OutputPanelProps {
  content: GeneratedContent | null;
  isLoading?: boolean;
  onContentUpdate?: (content: GeneratedContent) => void;
}

export const OutputPanel = ({ content, isLoading, onContentUpdate }: OutputPanelProps) => {
  const { toast } = useToast();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedMetaDescription, setEditedMetaDescription] = useState("");

  const startEditing = () => {
    if (!content) return;
    // Convert HTML to plain text for editing, preserving structure
    setEditedText(content.seoText || "");
    setEditedTitle(content.title || "");
    setEditedMetaDescription(content.metaDescription || "");
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (!content || !onContentUpdate) return;
    onContentUpdate({
      ...content,
      seoText: editedText,
      title: editedTitle,
      metaDescription: editedMetaDescription,
    });
    setIsEditing(false);
    toast({
      title: "Gespeichert",
      description: "Ihre Änderungen wurden übernommen.",
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedText("");
    setEditedTitle("");
    setEditedMetaDescription("");
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      toast({
        title: "Kopiert!",
        description: `${section} wurde in die Zwischenablage kopiert.`,
      });
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Kopieren fehlgeschlagen",
        variant: "destructive",
      });
    }
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const exportAsHtml = () => {
    if (!content) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${content.title}</title>
  <meta name="description" content="${content.metaDescription}">
</head>
<body>
  ${content.seoText}
  
  ${content.faq?.length ? `
  <section class="faq">
    <h2>Häufig gestellte Fragen</h2>
    ${content.faq.map(faq => `
    <div class="faq-item">
      <h3>${faq.question}</h3>
      <p>${faq.answer}</p>
    </div>
    `).join('')}
  </section>
  ` : ''}
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'seo-content'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportiert!",
      description: "HTML-Datei wurde heruntergeladen.",
    });
  };

  const CopyButton = ({ text, section }: { text: string; section: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, section)}
      className="h-8 px-2"
    >
      {copiedSection === section ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="absolute -inset-2 rounded-full bg-primary/10 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Generiere SEO-Content...</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              KI analysiert Ihre Eingaben und erstellt optimierten Content
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Kein Inhalt generiert</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Füllen Sie das Formular aus und klicken Sie auf "Generieren"
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const statusColors = {
    green: "bg-success/20 text-success border-success/30",
    yellow: "bg-warning/20 text-warning border-warning/30",
    red: "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generierter Content
          </CardTitle>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={cancelEditing}>
                  <X className="h-4 w-4 mr-2" />
                  Abbrechen
                </Button>
                <Button size="sm" onClick={saveEdits}>
                  <Save className="h-4 w-4 mr-2" />
                  Speichern
                </Button>
              </>
            ) : (
              <>
                {onContentUpdate && (
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={exportAsHtml}>
                  <FileDown className="h-4 w-4 mr-2" />
                  HTML
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <Tabs defaultValue="text" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 grid grid-cols-6 h-auto p-1">
          <TabsTrigger value="text" className="text-xs py-2">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Text
          </TabsTrigger>
          <TabsTrigger value="faq" className="text-xs py-2">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="meta" className="text-xs py-2">
            <Tag className="h-3.5 w-3.5 mr-1.5" />
            Meta
          </TabsTrigger>
          <TabsTrigger value="links" className="text-xs py-2">
            <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
            Links
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="text-xs py-2">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Guidelines
          </TabsTrigger>
          <TabsTrigger value="quality" className="text-xs py-2">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Check
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="text" className="mt-0 space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg border border-dashed border-primary/30">
                  <p className="text-xs text-muted-foreground mb-2">
                    Bearbeiten Sie den HTML-Text direkt. Überschriften nutzen &lt;h2&gt;, Absätze &lt;p&gt;, Listen &lt;ul&gt;&lt;li&gt;
                  </p>
                </div>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="SEO-Text hier bearbeiten..."
                />
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <CopyButton text={stripHtml(content.seoText)} section="SEO-Text" />
                </div>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: content.seoText || '' }} 
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="faq" className="mt-0 space-y-4">
            <div className="flex justify-end">
              <CopyButton 
                text={content.faq?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n') || ''} 
                section="FAQ" 
              />
            </div>
            {content.faq?.map((item, index) => (
              <Card key={index} className="p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0">F{index + 1}</Badge>
                  {item.question}
                </h4>
                <p className="text-sm text-muted-foreground pl-8">{item.answer}</p>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="meta" className="mt-0 space-y-4">
            <Card className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-foreground">Title Tag</h4>
                {!isEditing && <CopyButton text={content.title || ''} section="Title" />}
              </div>
              {isEditing ? (
                <Textarea
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-sm"
                  rows={2}
                />
              ) : (
                <p className="text-sm text-foreground bg-muted p-2 rounded">{content.title}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {(isEditing ? editedTitle : content.title)?.length || 0}/60 Zeichen 
                {((isEditing ? editedTitle : content.title)?.length || 0) > 60 && <Badge variant="destructive" className="ml-2 text-xs">Zu lang</Badge>}
              </p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-foreground">Meta Description</h4>
                {!isEditing && <CopyButton text={content.metaDescription || ''} section="Meta Description" />}
              </div>
              {isEditing ? (
                <Textarea
                  value={editedMetaDescription}
                  onChange={(e) => setEditedMetaDescription(e.target.value)}
                  className="text-sm"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-foreground bg-muted p-2 rounded">{content.metaDescription}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {(isEditing ? editedMetaDescription : content.metaDescription)?.length || 0}/155 Zeichen
                {((isEditing ? editedMetaDescription : content.metaDescription)?.length || 0) > 155 && <Badge variant="destructive" className="ml-2 text-xs">Zu lang</Badge>}
              </p>
            </Card>

            {content.technicalHints && (
              <Card className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Technische Hinweise
                  </h4>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded">
                  {typeof content.technicalHints === 'string' 
                    ? content.technicalHints 
                    : JSON.stringify(content.technicalHints, null, 2)}
                </pre>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="links" className="mt-0 space-y-4">
            <h4 className="font-semibold text-foreground">Interne Link-Empfehlungen</h4>
            {content.internalLinks?.map((link, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{link.anchorText}</p>
                    <p className="text-xs text-muted-foreground mt-1">{link.url}</p>
                  </div>
                  <CopyButton 
                    text={`<a href="${link.url}">${link.anchorText}</a>`} 
                    section={`Link ${index + 1}`} 
                  />
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="guidelines" className="mt-0 space-y-4">
            {content.guidelineValidation ? (
              <>
                {/* Overall Score */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Guideline-Validierung
                    </h4>
                    <Badge variant={content.guidelineValidation.overallScore >= 80 ? "default" : content.guidelineValidation.overallScore >= 60 ? "secondary" : "destructive"}>
                      {content.guidelineValidation.overallScore}/100
                    </Badge>
                  </div>
                  <Progress value={content.guidelineValidation.overallScore} className="h-2" />
                </Card>

                {/* E-E-A-T Scores */}
                <Card className="p-4">
                  <h4 className="font-semibold text-foreground mb-3">Google E-E-A-T Framework</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(content.guidelineValidation.googleEEAT).map(([key, value]) => (
                      <div key={key} className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{key}</span>
                          <Badge variant={value.status === "green" ? "default" : value.status === "yellow" ? "secondary" : "destructive"} className="text-xs">
                            {value.score}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{value.notes}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Heading Structure */}
                <Card className="p-4">
                  <h4 className="font-semibold text-foreground mb-3">H1-H5 Struktur & Ranking-Relevanz</h4>
                  <div className="space-y-2">
                    {["h1", "h2", "h3", "h4"].map((heading) => {
                      const h = content.guidelineValidation?.headingStructure[heading as keyof typeof content.guidelineValidation.headingStructure] as HeadingLevel | undefined;
                      if (!h) return null;
                      return (
                        <div key={heading} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="uppercase">{heading}</Badge>
                            <span className="text-sm">{h.seoRelevance}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Anzahl: {h.count}</span>
                            {h.status === "green" ? <CheckCircle2 className="h-4 w-4 text-success" /> : h.status === "yellow" ? <AlertTriangle className="h-4 w-4 text-warning" /> : <XCircle className="h-4 w-4 text-destructive" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {content.guidelineValidation.headingStructure.rankingSummary && (
                    <p className="text-sm text-muted-foreground mt-3 p-2 bg-muted/50 rounded">{content.guidelineValidation.headingStructure.rankingSummary}</p>
                  )}
                </Card>

                {/* References */}
                <Card className="p-4">
                  <h4 className="font-semibold text-foreground mb-3">Quellen & Referenzen</h4>
                  <div className="space-y-2">
                    {content.guidelineValidation.references?.map((ref, idx) => (
                      <a key={idx} href={ref.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 bg-muted/50 rounded hover:bg-muted transition-colors">
                        <div>
                          <p className="text-sm font-medium">{ref.guideline}</p>
                          <p className="text-xs text-muted-foreground">{ref.source}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-4 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Guideline-Validierung wird beim nächsten Generieren erstellt</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quality" className="mt-0 space-y-4">
            {content.qualityReport ? (
              <>
                <Card className={`p-4 border ${statusColors[content.qualityReport.status]}`}>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span className="font-semibold">
                      Compliance-Status: {
                        content.qualityReport.status === "green" ? "Konform" :
                        content.qualityReport.status === "yellow" ? "Prüfung empfohlen" :
                        "Verstöße gefunden"
                      }
                    </span>
                  </div>
                </Card>

                {content.qualityReport.flags?.map((flag, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {flag.type === "mdr" ? "MDR/MPDG" : flag.type === "hwg" ? "HWG" : "Studien"}
                      </Badge>
                      <Badge variant={flag.severity === "high" ? "destructive" : flag.severity === "medium" ? "secondary" : "outline"}>
                        {flag.severity === "high" ? "Hoch" : flag.severity === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-2">{flag.issue}</p>
                    <div className="bg-success/10 p-3 rounded text-sm">
                      <span className="font-medium text-success">Empfehlung:</span>
                      <p className="text-foreground mt-1">{flag.rewrite}</p>
                    </div>
                  </Card>
                ))}
              </>
            ) : (
              <Card className="p-4 text-center text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Kein Compliance-Check durchgeführt</p>
                <p className="text-xs mt-1">Aktivieren Sie die Compliance-Optionen im Formular</p>
              </Card>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
};
