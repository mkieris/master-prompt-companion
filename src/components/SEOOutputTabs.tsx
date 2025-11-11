import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, AlertTriangle, Edit2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ContentEditor } from "@/components/ContentEditor";
import { AIDetectionScore } from "@/components/AIDetectionScore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GeneratedContent {
  seoText: string;
  faq: Array<{ question: string; answer: string }>;
  title: string;
  metaDescription: string;
  internalLinks: Array<{ url: string; anchorText: string }>;
  technicalHints: string;
  productPageBlocks?: {
    introText: string;
    tags: string[];
    contentBlocks: Array<{
      heading: string;
      imagePosition: "left" | "right";
      imageAlt: string;
      content: string;
    }>;
    comparisonBlocks: Array<{
      title: string;
      content: string;
    }>;
  };
  eeatScore?: {
    experience: number;
    expertise: number;
    authoritativeness: number;
    trustworthiness: number;
    overall: number;
    improvements: string[];
  };
  qualityReport?: {
    status: "green" | "yellow" | "red";
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
  productComparison?: string;
}

interface SEOOutputTabsProps {
  content: GeneratedContent | null;
  projectId?: string | null;
  formData?: any;
}

export const SEOOutputTabs = ({ content, projectId, formData }: SEOOutputTabsProps) => {
  const [editingSection, setEditingSection] = useState<{ title: string; content: string } | null>(null);
  const [localContent, setLocalContent] = useState(content);
  const [aiDetectionResult, setAiDetectionResult] = useState<any>(null);
  const [isCheckingAI, setIsCheckingAI] = useState(false);

  // Update local content when content prop changes
  if (content && content !== localContent) {
    setLocalContent(content);
  }

  // Run AI detection check when content is available
  useEffect(() => {
    if (localContent?.seoText && !aiDetectionResult) {
      checkAIDetection(localContent.seoText);
    }
  }, [localContent?.seoText]);

  const checkAIDetection = async (text: string) => {
    setIsCheckingAI(true);
    try {
      // Extract text without HTML tags
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const plainText = doc.body.textContent || '';

      const { data, error } = await supabase.functions.invoke('ai-detection-check', {
        body: { text: plainText }
      });

      if (error) throw error;
      setAiDetectionResult(data);
    } catch (error) {
      console.error('Error checking AI detection:', error);
      toast.error('Fehler beim KI-Check');
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleEditSection = (title: string, content: string) => {
    setEditingSection({ title, content });
  };

  const handleUpdateSection = async (sectionTitle: string, newContent: string) => {
    if (!projectId || !localContent) {
      return;
    }

    // Update local state
    const parser = new DOMParser();
    const doc = parser.parseFromString(localContent.seoText, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5');
    
    let updatedHTML = localContent.seoText;
    headings.forEach((heading) => {
      if (heading.textContent?.includes(sectionTitle)) {
        let currentElement = heading.nextElementSibling;
        let contentToReplace = '';
        
        while (currentElement && !currentElement.matches('h1, h2, h3, h4, h5')) {
          contentToReplace += currentElement.outerHTML;
          currentElement = currentElement.nextElementSibling;
        }
        
        if (contentToReplace) {
          updatedHTML = updatedHTML.replace(contentToReplace, `<p>${newContent}</p>`);
        }
      }
    });

    const newLocalContent = { ...localContent, seoText: updatedHTML };
    setLocalContent(newLocalContent);

    // Save to database
    try {
      const { error } = await supabase
        .from('seo_projects')
        .update({ 
          generated_content: newLocalContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating project:', error);
    }

    setEditingSection(null);
  };
  if (!content) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Kein Inhalt generiert</p>
          <p className="text-sm">Füllen Sie das Formular aus und klicken Sie auf "SEO-Text generieren"</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: "green" | "yellow" | "red") => {
    switch (status) {
      case "green":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "yellow":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "red":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getSeverityBadge = (severity: "high" | "medium" | "low") => {
    const variants = {
      high: "destructive",
      medium: "warning" as any,
      low: "secondary",
    };
    return <Badge variant={variants[severity]}>{severity === "high" ? "Hoch" : severity === "medium" ? "Mittel" : "Niedrig"}</Badge>;
  };

  return (
    <Tabs defaultValue="text" className="h-full flex flex-col">
      <TabsList className={`grid w-full ${content?.productPageBlocks ? 'grid-cols-8' : content?.productComparison ? 'grid-cols-7' : 'grid-cols-6'}`}>
        <TabsTrigger value="text">SEO-Text</TabsTrigger>
        <TabsTrigger value="ai-check">KI-Check</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
        <TabsTrigger value="meta">Title & Meta</TabsTrigger>
        <TabsTrigger value="links">Links</TabsTrigger>
        <TabsTrigger value="quality">Qualität</TabsTrigger>
        {content?.productPageBlocks && (
          <TabsTrigger value="blocks">Blöcke</TabsTrigger>
        )}
        {content?.productComparison && (
          <TabsTrigger value="products">Produkte</TabsTrigger>
        )}
      </TabsList>

      <div className="flex-1 overflow-y-auto p-6">
        <TabsContent value="text" className="mt-0">
          {editingSection && projectId && localContent && (
            <div className="mb-4">
              <ContentEditor
                projectId={projectId}
                sectionTitle={editingSection.title}
                sectionContent={editingSection.content}
                formData={formData}
                onUpdate={(newContent) => handleUpdateSection(editingSection.title, newContent)}
                onClose={() => setEditingSection(null)}
              />
            </div>
          )}
          
          <Card className="p-6">
            <div className="prose prose-sm max-w-none">
              {(() => {
                if (!localContent) return null;
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(localContent.seoText, 'text/html');
                const elements = Array.from(doc.body.children);
                
                return elements.map((element, index) => {
                  const isHeading = element.matches('h1, h2, h3, h4, h5');
                  
                  if (isHeading && projectId) {
                    const headingText = element.textContent || '';
                    let sectionContent = '';
                    let nextElement = element.nextElementSibling;
                    
                    while (nextElement && !nextElement.matches('h1, h2, h3, h4, h5')) {
                      sectionContent += nextElement.textContent + '\n';
                      nextElement = nextElement.nextElementSibling;
                    }
                    
                    return (
                      <div key={index} className="relative group">
                        <div dangerouslySetInnerHTML={{ __html: element.outerHTML }} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditSection(headingText, sectionContent)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Bearbeiten
                        </Button>
                      </div>
                    );
                  }
                  
                  return <div key={index} dangerouslySetInnerHTML={{ __html: element.outerHTML }} />;
                });
              })()}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ai-check" className="mt-0">
          {isCheckingAI ? (
            <Card className="p-6">
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Analysiere Text auf KI-Muster...</p>
              </div>
            </Card>
          ) : aiDetectionResult ? (
            <AIDetectionScore 
              score={aiDetectionResult.score}
              status={aiDetectionResult.status}
              findings={aiDetectionResult.findings}
              stats={aiDetectionResult.stats}
            />
          ) : (
            <Card className="p-6">
              <p className="text-muted-foreground">KI-Check wird geladen...</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="faq" className="mt-0">
          <Card className="p-6 space-y-4">
            {content.faq.map((item, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-semibold text-foreground">{item.question}</h3>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="meta" className="mt-0">
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Title Tag</h3>
              <p className="text-sm text-foreground">{content.title}</p>
              <p className="text-xs text-muted-foreground mt-1">Länge: {content.title.length} Zeichen</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Meta Description</h3>
              <p className="text-sm text-foreground">{content.metaDescription}</p>
              <p className="text-xs text-muted-foreground mt-1">Länge: {content.metaDescription.length} Zeichen</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Technik-Hinweise</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{content.technicalHints}</div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="links" className="mt-0">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Interne Links</h3>
            <div className="space-y-3">
              {content.internalLinks.map((link, index) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <p className="text-sm font-medium text-foreground">{link.anchorText}</p>
                  <p className="text-xs text-muted-foreground">{link.url}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="mt-0">
          <div className="space-y-4">
            {content.eeatScore && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  E-E-A-T Score (Google Quality Framework)
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Experience (Erfahrung)</p>
                    <div className="flex items-center gap-2">
                      <Progress value={content.eeatScore.experience * 10} className="h-2" />
                      <span className="text-sm font-medium">{content.eeatScore.experience}/10</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expertise (Fachwissen)</p>
                    <div className="flex items-center gap-2">
                      <Progress value={content.eeatScore.expertise * 10} className="h-2" />
                      <span className="text-sm font-medium">{content.eeatScore.expertise}/10</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Authoritativeness (Autorität)</p>
                    <div className="flex items-center gap-2">
                      <Progress value={content.eeatScore.authoritativeness * 10} className="h-2" />
                      <span className="text-sm font-medium">{content.eeatScore.authoritativeness}/10</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trustworthiness (Vertrauen)</p>
                    <div className="flex items-center gap-2">
                      <Progress value={content.eeatScore.trustworthiness * 10} className="h-2" />
                      <span className="text-sm font-medium">{content.eeatScore.trustworthiness}/10</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">Gesamt-Score</p>
                    <span className="text-2xl font-bold">{content.eeatScore.overall}/10</span>
                  </div>
                  <Progress value={content.eeatScore.overall * 10} className="h-3" />
                </div>
                {content.eeatScore.improvements.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-semibold">Verbesserungsvorschläge:</h4>
                    <ul className="space-y-1">
                      {content.eeatScore.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">→</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {content.qualityReport && (
              <>
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusIcon(content.qualityReport.status)}
                    <h3 className="font-semibold text-lg">
                      Compliance-Status:{" "}
                      {content.qualityReport.status === "green"
                        ? "Konform"
                        : content.qualityReport.status === "yellow"
                        ? "Unklar"
                        : "Verstöße"}
                    </h3>
                  </div>

                  {content.qualityReport.flags.length > 0 && (
                    <div className="space-y-4">
                      {content.qualityReport.flags.map((flag, index) => (
                        <div key={index} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {flag.type === "mdr" ? "MDR/MPDG" : flag.type === "hwg" ? "HWG" : "Studien"}
                              </Badge>
                              {getSeverityBadge(flag.severity)}
                            </div>
                          </div>
                          <h4 className="font-medium mb-2 text-foreground">Problem</h4>
                          <p className="text-sm text-muted-foreground mb-3">{flag.issue}</p>
                          <h4 className="font-medium mb-2 text-foreground">Empfohlene Umformulierung</h4>
                          <p className="text-sm text-success bg-success/10 p-3 rounded">{flag.rewrite}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {content.qualityReport.evidenceTable && content.qualityReport.evidenceTable.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-4">Evidenz-Tabelle</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-2 text-left">Studie</th>
                              <th className="p-2 text-left">Typ</th>
                              <th className="p-2 text-left">Population</th>
                              <th className="p-2 text-left">Outcome</th>
                              <th className="p-2 text-left">Effekt</th>
                              <th className="p-2 text-left">Einschränkungen</th>
                              <th className="p-2 text-left">Quelle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {content.qualityReport.evidenceTable.map((row, index) => (
                              <tr key={index} className="border-b border-border">
                                <td className="p-2">{row.study}</td>
                                <td className="p-2">{row.type}</td>
                                <td className="p-2">{row.population}</td>
                                <td className="p-2">{row.outcome}</td>
                                <td className="p-2">{row.effect}</td>
                                <td className="p-2">{row.limitations}</td>
                                <td className="p-2">{row.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="p-6 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    <strong>Hinweis:</strong> Werbeaussagen müssen mit Zweckbestimmung übereinstimmen; finale
                    juristische Prüfung empfohlen.
                  </p>
                </Card>
              </>
            )}

            {!content.qualityReport && !content.eeatScore && (
              <Card className="p-6">
                <p className="text-muted-foreground">
                  Qualitäts-Checks sind deaktiviert. Aktivieren Sie den Compliance-Check im Formular für detaillierte Analysen.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="blocks" className="mt-0">
          {content?.productPageBlocks && (
            <div className="space-y-6">
              {/* Einführungstext */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3">Einführungstext</h3>
                <p className="text-sm text-foreground mb-4">{content.productPageBlocks.introText}</p>
                
                {content.productPageBlocks.tags.length > 0 && (
                  <>
                    <h4 className="font-semibold text-sm mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {content.productPageBlocks.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              {/* Content-Blöcke */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Content-Blöcke</h3>
                {content.productPageBlocks.contentBlocks.map((block, index) => (
                  <Card key={index} className="p-6">
                    <div className={`grid md:grid-cols-2 gap-6 ${block.imagePosition === 'right' ? 'md:grid-flow-dense' : ''}`}>
                      <div className={block.imagePosition === 'right' ? 'md:col-start-2' : ''}>
                        <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">[Bild: {block.imageAlt}]</span>
                        </div>
                      </div>
                      <div className={block.imagePosition === 'right' ? 'md:col-start-1 md:row-start-1' : ''}>
                        <h4 className="font-semibold text-base mb-3">{block.heading}</h4>
                        <div className="text-sm text-muted-foreground whitespace-pre-line">{block.content}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Gegenüberstellungs-Blöcke */}
              {content.productPageBlocks.comparisonBlocks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Gegenüberstellung</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {content.productPageBlocks.comparisonBlocks.map((block, index) => (
                      <Card key={index} className="p-6">
                        <h4 className="font-semibold text-base mb-3">{block.title}</h4>
                        <div className="text-sm text-muted-foreground whitespace-pre-line">{block.content}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {content?.productComparison && (
          <TabsContent value="products" className="mt-0">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Produktvergleich & Kaufberatung</h3>
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: content.productComparison }}
              />
            </Card>
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
};
