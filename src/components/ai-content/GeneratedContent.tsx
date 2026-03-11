import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Copy, Check, FileText, Download, RefreshCw, 
  FileDown, Code, BarChart3, AlertTriangle, CheckCircle2,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { sanitizeHtml } from "@/lib/sanitize";

interface GeneratedContentProps {
  content: {
    metaTitle?: string;
    metaDescription?: string;
    mainContent?: string;
    faq?: { question: string; answer: string }[];
  };
  focusKeyword?: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onQuickChange?: (changes: QuickChangeOptions) => void;
}

interface QuickChangeOptions {
  tonality?: string;
  formOfAddress?: string;
  wordCount?: string;
  keywordDensity?: string;
  includeFAQ?: boolean;
  addExamples?: boolean;
}

interface SEOAnalysis {
  score: number;
  wordCount: number;
  keywordDensity: number;
  readabilityScore: number;
  issues: { type: 'error' | 'warning' | 'success'; message: string }[];
  metaTitleLength: number;
  metaDescLength: number;
  headingCount: { h1: number; h2: number; h3: number };
}

const GeneratedContent = ({ 
  content, 
  focusKeyword = "",
  onRegenerate, 
  isRegenerating,
  onQuickChange 
}: GeneratedContentProps) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeQuickChanges, setActiveQuickChanges] = useState<QuickChangeOptions>({});
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  // SEO Analysis - computed from content
  const seoAnalysis = useMemo<SEOAnalysis>(() => {
    const text = content.mainContent || "";
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Keyword density calculation
    const keywordLower = focusKeyword.toLowerCase();
    const keywordCount = keywordLower ? 
      (text.toLowerCase().match(new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 0;
    const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
    
    // Simple readability score (Flesch-Kincaid approximation for German)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
    const avgSyllables = 2.1; // German average
    const readabilityScore = Math.max(0, Math.min(100, 
      180 - (avgWordsPerSentence * 1.0) - (avgSyllables * 58.5)
    ));
    
    // Heading analysis
    const h1Count = (text.match(/^# [^#]/gm) || []).length;
    const h2Count = (text.match(/^## [^#]/gm) || []).length;
    const h3Count = (text.match(/^### /gm) || []).length;
    
    // Meta lengths
    const metaTitleLength = content.metaTitle?.length || 0;
    const metaDescLength = content.metaDescription?.length || 0;
    
    // Issues analysis
    const issues: SEOAnalysis['issues'] = [];
    
    // Meta Title checks
    if (metaTitleLength === 0) {
      issues.push({ type: 'error', message: 'Meta-Title fehlt' });
    } else if (metaTitleLength < 30) {
      issues.push({ type: 'warning', message: `Meta-Title zu kurz (${metaTitleLength}/60 Zeichen)` });
    } else if (metaTitleLength > 60) {
      issues.push({ type: 'warning', message: `Meta-Title zu lang (${metaTitleLength}/60 Zeichen)` });
    } else {
      issues.push({ type: 'success', message: `Meta-Title optimal (${metaTitleLength}/60 Zeichen)` });
    }
    
    // Meta Description checks
    if (metaDescLength === 0) {
      issues.push({ type: 'error', message: 'Meta-Description fehlt' });
    } else if (metaDescLength < 120) {
      issues.push({ type: 'warning', message: `Meta-Description zu kurz (${metaDescLength}/160 Zeichen)` });
    } else if (metaDescLength > 160) {
      issues.push({ type: 'warning', message: `Meta-Description zu lang (${metaDescLength}/160 Zeichen)` });
    } else {
      issues.push({ type: 'success', message: `Meta-Description optimal (${metaDescLength}/160 Zeichen)` });
    }
    
    // Keyword checks
    if (focusKeyword) {
      const titleHasKeyword = content.metaTitle?.toLowerCase().includes(keywordLower);
      const descHasKeyword = content.metaDescription?.toLowerCase().includes(keywordLower);
      const firstParagraph = text.slice(0, 500).toLowerCase();
      const introHasKeyword = firstParagraph.includes(keywordLower);
      
      if (!titleHasKeyword) {
        issues.push({ type: 'error', message: 'Fokus-Keyword nicht im Meta-Title' });
      } else {
        issues.push({ type: 'success', message: 'Fokus-Keyword im Meta-Title ✓' });
      }
      
      if (!descHasKeyword) {
        issues.push({ type: 'warning', message: 'Fokus-Keyword nicht in Meta-Description' });
      }
      
      if (!introHasKeyword) {
        issues.push({ type: 'warning', message: 'Fokus-Keyword nicht in ersten 100 Wörtern' });
      } else {
        issues.push({ type: 'success', message: 'Fokus-Keyword in Einleitung ✓' });
      }
      
      if (keywordDensity < 0.5) {
        issues.push({ type: 'warning', message: `Keyword-Dichte niedrig (${keywordDensity.toFixed(1)}%)` });
      } else if (keywordDensity > 3) {
        issues.push({ type: 'warning', message: `Keyword-Dichte zu hoch (${keywordDensity.toFixed(1)}%) - Gefahr von Keyword-Stuffing` });
      } else {
        issues.push({ type: 'success', message: `Keyword-Dichte optimal (${keywordDensity.toFixed(1)}%)` });
      }
    }
    
    // Content structure checks
    if (h2Count < 2) {
      issues.push({ type: 'warning', message: 'Zu wenige H2-Überschriften für gute Struktur' });
    } else {
      issues.push({ type: 'success', message: `${h2Count} H2-Überschriften für gute Struktur ✓` });
    }
    
    if (wordCount < 300) {
      issues.push({ type: 'error', message: `Text zu kurz (${wordCount} Wörter) - min. 300 empfohlen` });
    } else if (wordCount < 600) {
      issues.push({ type: 'warning', message: `Text könnte länger sein (${wordCount} Wörter)` });
    } else {
      issues.push({ type: 'success', message: `Gute Textlänge (${wordCount} Wörter) ✓` });
    }
    
    // Calculate overall score
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const successCount = issues.filter(i => i.type === 'success').length;
    const totalChecks = issues.length;
    const score = Math.round(((successCount * 2 + (totalChecks - errorCount - warningCount)) / (totalChecks * 2)) * 100);
    
    return {
      score: Math.min(100, Math.max(0, score)),
      wordCount,
      keywordDensity,
      readabilityScore,
      issues,
      metaTitleLength,
      metaDescLength,
      headingCount: { h1: h1Count, h2: h2Count, h3: h3Count }
    };
  }, [content, focusKeyword]);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Kopiert!",
      description: "Der Text wurde in die Zwischenablage kopiert.",
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAll = async () => {
    const fullText = `
Meta-Title: ${content.metaTitle || ""}

Meta-Description: ${content.metaDescription || ""}

${content.mainContent || ""}

${content.faq?.length ? `FAQ:\n${content.faq.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}` : ""}
    `.trim();
    
    await navigator.clipboard.writeText(fullText);
    toast({
      title: "Alles kopiert!",
      description: "Der gesamte Content wurde kopiert.",
    });
  };

  const downloadAsText = () => {
    const fullText = `
Meta-Title: ${content.metaTitle || ""}

Meta-Description: ${content.metaDescription || ""}

${content.mainContent || ""}

${content.faq?.length ? `FAQ:\n${content.faq.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}` : ""}
    `.trim();

    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seo-content.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsDocx = async () => {
    try {
      const children: any[] = [];
      
      // Add Meta Title
      if (content.metaTitle) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "Meta-Title:", bold: true })],
          }),
          new Paragraph({
            children: [new TextRun(content.metaTitle)],
            spacing: { after: 200 },
          })
        );
      }
      
      // Add Meta Description
      if (content.metaDescription) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "Meta-Description:", bold: true })],
          }),
          new Paragraph({
            children: [new TextRun(content.metaDescription)],
            spacing: { after: 400 },
          })
        );
      }
      
      // Parse and add main content
      if (content.mainContent) {
        const lines = content.mainContent.split('\n');
        for (const line of lines) {
          if (line.startsWith('# ')) {
            children.push(new Paragraph({
              text: line.replace('# ', ''),
              heading: HeadingLevel.HEADING_1,
            }));
          } else if (line.startsWith('## ')) {
            children.push(new Paragraph({
              text: line.replace('## ', ''),
              heading: HeadingLevel.HEADING_2,
            }));
          } else if (line.startsWith('### ')) {
            children.push(new Paragraph({
              text: line.replace('### ', ''),
              heading: HeadingLevel.HEADING_3,
            }));
          } else if (line.startsWith('- ')) {
            children.push(new Paragraph({
              text: line.replace('- ', '• '),
            }));
          } else if (line.trim()) {
            // Handle bold text
            const parts = line.split(/\*\*(.*?)\*\*/g);
            const textRuns: TextRun[] = [];
            parts.forEach((part, index) => {
              if (index % 2 === 1) {
                textRuns.push(new TextRun({ text: part, bold: true }));
              } else if (part) {
                textRuns.push(new TextRun(part));
              }
            });
            if (textRuns.length > 0) {
              children.push(new Paragraph({ children: textRuns }));
            }
          } else {
            children.push(new Paragraph({ text: '' }));
          }
        }
      }
      
      // Add FAQ section
      if (content.faq?.length) {
        children.push(
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'FAQ - Häufig gestellte Fragen',
            heading: HeadingLevel.HEADING_2,
          })
        );
        
        for (const faq of content.faq) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: faq.question, bold: true })],
              spacing: { before: 200 },
            }),
            new Paragraph({
              children: [new TextRun(faq.answer)],
              spacing: { after: 200 },
            })
          );
        }
      }
      
      const doc = new Document({
        sections: [{ children }],
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, "seo-content.docx");
      
      toast({
        title: "Download gestartet",
        description: "Word-Dokument wird heruntergeladen.",
      });
    } catch (error) {
      console.error('Error creating DOCX:', error);
      toast({
        title: "Fehler",
        description: "Word-Dokument konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const copySchemaJson = async () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": content.metaTitle,
      "description": content.metaDescription,
      "articleBody": content.mainContent?.replace(/[#*\-]/g, '').substring(0, 500),
    };
    
    if (content.faq?.length) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": content.faq.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      };
      
      await navigator.clipboard.writeText(JSON.stringify([schema, faqSchema], null, 2));
    } else {
      await navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    }
    
    toast({
      title: "Schema.org JSON-LD kopiert!",
      description: "Fügen Sie es in den <head> Ihrer Seite ein.",
    });
  };

  const applyQuickChanges = async () => {
    if (!onQuickChange || Object.keys(activeQuickChanges).length === 0) return;
    
    setIsApplyingChanges(true);
    try {
      await onQuickChange(activeQuickChanges);
      setActiveQuickChanges({});
      toast({
        title: "Änderungen angewendet",
        description: "Der Content wurde angepasst.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Änderungen konnten nicht angewendet werden.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingChanges(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!content.mainContent) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      {/* Header with SEO Score */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Generierter SEO-Content</h3>
            <Badge variant="outline" className={getScoreColor(seoAnalysis.score)}>
              SEO-Score: {seoAnalysis.score}%
            </Badge>
          </div>
          <div className="flex gap-2">
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
                Neu generieren
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{seoAnalysis.wordCount}</div>
            <div className="text-xs text-muted-foreground">Wörter</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{seoAnalysis.keywordDensity.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Keyword-Dichte</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{seoAnalysis.headingCount.h2}</div>
            <div className="text-xs text-muted-foreground">H2-Überschriften</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{content.faq?.length || 0}</div>
            <div className="text-xs text-muted-foreground">FAQs</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent px-4">
          <TabsTrigger value="content">Hauptinhalt</TabsTrigger>
          <TabsTrigger value="meta">Meta-Tags</TabsTrigger>
          {content.faq?.length ? <TabsTrigger value="faq">FAQ</TabsTrigger> : null}
          <TabsTrigger value="seo">
            <BarChart3 className="h-4 w-4 mr-1" />
            SEO-Analyse
          </TabsTrigger>
          <TabsTrigger value="export">
            <FileDown className="h-4 w-4 mr-1" />
            Export
          </TabsTrigger>
          {onQuickChange && (
            <TabsTrigger value="quick">
              <Sparkles className="h-4 w-4 mr-1" />
              Quick Changes
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="content" className="p-4">
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(content.mainContent || "", "content")}>
              {copiedField === "content" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtml(
                    content.mainContent
                      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
                      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>')
                      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n\n/g, '</p><p class="my-3">')
                      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
                  )
                }}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="meta" className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Meta-Title</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(content.metaTitle || "", "title")}
              >
                {copiedField === "title" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{content.metaTitle}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress 
                  value={Math.min(100, (seoAnalysis.metaTitleLength / 60) * 100)} 
                  className="h-1 flex-1" 
                />
                <span className={`text-xs ${seoAnalysis.metaTitleLength > 60 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {seoAnalysis.metaTitleLength}/60
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Meta-Description</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(content.metaDescription || "", "desc")}
              >
                {copiedField === "desc" ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{content.metaDescription}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress 
                  value={Math.min(100, (seoAnalysis.metaDescLength / 160) * 100)} 
                  className="h-1 flex-1" 
                />
                <span className={`text-xs ${seoAnalysis.metaDescLength > 160 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {seoAnalysis.metaDescLength}/160
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {content.faq?.length ? (
          <TabsContent value="faq" className="p-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {content.faq.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium text-primary mb-2">{item.question}</h4>
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ) : null}

        <TabsContent value="seo" className="p-4">
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className={`text-4xl font-bold ${getScoreColor(seoAnalysis.score)}`}>
                {seoAnalysis.score}
              </div>
              <div>
                <div className="font-medium">SEO-Score</div>
                <div className="text-sm text-muted-foreground">
                  {seoAnalysis.score >= 80 ? 'Ausgezeichnet' : 
                   seoAnalysis.score >= 60 ? 'Gut - Optimierungspotential' : 
                   'Verbesserungsbedarf'}
                </div>
              </div>
              <Progress value={seoAnalysis.score} className={`flex-1 h-3 ${getScoreBg(seoAnalysis.score)}`} />
            </div>

            {/* Issues List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {seoAnalysis.issues.map((issue, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start gap-2 p-3 rounded-lg ${
                      issue.type === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                      issue.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                      'bg-green-500/10 border border-green-500/20'
                    }`}
                  >
                    {issue.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />}
                    {issue.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                    {issue.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />}
                    <span className="text-sm">{issue.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="export" className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={copyAll}>
              <Copy className="h-6 w-6 mb-2" />
              <span>Alles kopieren</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={downloadAsText}>
              <Download className="h-6 w-6 mb-2" />
              <span>Als .txt</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={downloadAsDocx}>
              <FileDown className="h-6 w-6 mb-2" />
              <span>Als Word (.docx)</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={copySchemaJson}>
              <Code className="h-6 w-6 mb-2" />
              <span>Schema.org JSON-LD</span>
            </Button>
          </div>
        </TabsContent>

        {onQuickChange && (
          <TabsContent value="quick" className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Passe den generierten Content schnell an, ohne neu zu generieren:
              </p>
              
              {/* Tonality */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tonalität ändern</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'expert-mix', label: 'Expertenmix' },
                    { value: 'consultant-mix', label: 'Beratermix' },
                    { value: 'storytelling-mix', label: 'Storytelling' },
                    { value: 'conversion-mix', label: 'Conversion' },
                    { value: 'balanced-mix', label: 'Balanced' },
                  ].map(opt => (
                    <Button
                      key={opt.value}
                      variant={activeQuickChanges.tonality === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveQuickChanges(prev => ({
                        ...prev,
                        tonality: prev.tonality === opt.value ? undefined : opt.value
                      }))}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Form of Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Anredeform</label>
                <div className="flex gap-2">
                  <Button
                    variant={activeQuickChanges.formOfAddress === 'du' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveQuickChanges(prev => ({
                      ...prev,
                      formOfAddress: prev.formOfAddress === 'du' ? undefined : 'du'
                    }))}
                  >
                    Du-Form
                  </Button>
                  <Button
                    variant={activeQuickChanges.formOfAddress === 'sie' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveQuickChanges(prev => ({
                      ...prev,
                      formOfAddress: prev.formOfAddress === 'sie' ? undefined : 'sie'
                    }))}
                  >
                    Sie-Form
                  </Button>
                </div>
              </div>

              {/* Keyword Density */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Keyword-Dichte</label>
                <div className="flex gap-2">
                  {[
                    { value: 'minimal', label: 'Minimal (0.5-1%)' },
                    { value: 'normal', label: 'Normal (1-2%)' },
                    { value: 'high', label: 'Hoch (2-3%)' },
                  ].map(opt => (
                    <Button
                      key={opt.value}
                      variant={activeQuickChanges.keywordDensity === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveQuickChanges(prev => ({
                        ...prev,
                        keywordDensity: prev.keywordDensity === opt.value ? undefined : opt.value
                      }))}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Zusätzliche Optionen</label>
                <div className="flex gap-2">
                  <Button
                    variant={activeQuickChanges.includeFAQ === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveQuickChanges(prev => ({
                      ...prev,
                      includeFAQ: prev.includeFAQ === true ? undefined : true
                    }))}
                  >
                    + FAQ hinzufügen
                  </Button>
                  <Button
                    variant={activeQuickChanges.addExamples === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveQuickChanges(prev => ({
                      ...prev,
                      addExamples: prev.addExamples === true ? undefined : true
                    }))}
                  >
                    + Anwendungsbeispiele
                  </Button>
                </div>
              </div>

              {/* Apply Button */}
              {Object.keys(activeQuickChanges).length > 0 && (
                <Button 
                  className="w-full" 
                  onClick={applyQuickChanges}
                  disabled={isApplyingChanges}
                >
                  {isApplyingChanges ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Wird angewendet...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Änderungen anwenden
                    </>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
};

export default GeneratedContent;