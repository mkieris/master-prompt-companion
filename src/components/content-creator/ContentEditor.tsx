import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Sparkles,
  FileText,
  Eye,
  Edit3,
  Copy,
  Download,
  Save,
  RefreshCw,
  Check,
  Code,
  MessageSquare,
  Wand2,
  Search,
  Globe,
  PenLine,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeHtml } from "@/lib/sanitize";

interface ContentEditorProps {
  content: string;
  title: string;
  metaDescription: string;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onMetaChange: (meta: string) => void;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  onRefine: (prompt: string) => void;
  isRefining: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  hasContent: boolean;
}

export const ContentEditor = ({
  content,
  title,
  metaDescription,
  onContentChange,
  onTitleChange,
  onMetaChange,
  isEditing,
  onEditingChange,
  onRefine,
  isRefining,
  isGenerating,
  onGenerate,
  hasContent,
}: ContentEditorProps) => {
  const { toast } = useToast();
  const [refinePrompt, setRefinePrompt] = useState("");
  const [activeTab, setActiveTab] = useState("preview");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

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
  <title>${title}</title>
  <meta name="description" content="${metaDescription}">
</head>
<body>
  ${content}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title?.replace(/[^a-zA-Z0-9]/g, '-') || 'seo-content'}.html`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportiert!",
      description: "HTML-Datei wurde heruntergeladen.",
    });
  };

  const handleRefine = () => {
    if (!refinePrompt.trim()) return;
    onRefine(refinePrompt);
    setRefinePrompt("");
  };

  // Empty state - Modern onboarding design
  if (!hasContent && !isGenerating) {
    return (
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Hero Section */}
          <div className="text-center space-y-6 max-w-lg">
            {/* Animated Icon */}
            <div className="relative mx-auto w-fit">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                <PenLine className="h-12 w-12 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">SEO-Content erstellen</h2>
              <p className="text-muted-foreground">
                Erstelle hochwertige, SEO-optimierte Texte mit KI-Unterstutzung
              </p>
            </div>

            {/* Workflow Steps - Modern Cards */}
            <div className="flex items-center justify-center gap-3 pt-4">
              {[
                { icon: Target, label: 'Keyword', desc: 'Fokus definieren' },
                { icon: Search, label: 'SERP', desc: 'Automatisch analysiert' },
                { icon: Sparkles, label: 'Generieren', desc: 'KI erstellt Content' },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                      <step.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium block">{step.label}</span>
                      <span className="text-[10px] text-muted-foreground">{step.desc}</span>
                    </div>
                  </div>
                  {idx < 2 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 mt-[-20px]" />
                  )}
                </div>
              ))}
            </div>

            {/* Quick Start Hint */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50 mt-6">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium">Schnellstart</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gib links ein Fokus-Keyword ein. Die SERP-Analyse startet automatisch und du kannst sofort Content generieren.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Loading state - Enhanced with progress simulation
  if (isGenerating) {
    return (
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            {/* Animated Loading */}
            <div className="relative mx-auto w-fit">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse" />
              <div className="absolute -inset-4 rounded-3xl border-2 border-primary/20 animate-ping opacity-75" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Content wird generiert...</h3>
              <p className="text-sm text-muted-foreground">
                KI analysiert SERP-Daten und erstellt SEO-optimierten Content
              </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3 w-full max-w-xs mx-auto">
              {[
                { label: 'SERP-Daten analysieren', done: true },
                { label: 'Content-Struktur erstellen', done: true },
                { label: 'SEO-optimierten Text generieren', done: false },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                    step.done ? 'bg-green-500' : 'bg-primary/20'
                  }`}>
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    )}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground animate-pulse">
              Dies kann 15-30 Sekunden dauern...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <CardHeader className="pb-2 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditingChange(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Vorschau
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-1" />
                  Bearbeiten
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(stripHtml(content), 'Content')}
            >
              {copiedSection === 'Content' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={exportAsHtml}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 grid w-auto grid-cols-4">
          <TabsTrigger value="preview" className="text-xs">
            <Eye className="h-3.5 w-3.5 mr-1" />
            Vorschau
          </TabsTrigger>
          <TabsTrigger value="meta" className="text-xs">
            <Code className="h-3.5 w-3.5 mr-1" />
            Meta
          </TabsTrigger>
          <TabsTrigger value="html" className="text-xs">
            <Code className="h-3.5 w-3.5 mr-1" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="refine" className="text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Anpassen
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="preview" className="mt-0">
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Content hier bearbeiten..."
              />
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {/* Detect if content is HTML or Markdown */}
                {content?.trim().startsWith('<') ? (
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '') }} />
                ) : (
                  <ReactMarkdown>{content || ''}</ReactMarkdown>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="meta" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label>Title Tag</Label>
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="SEO Title..."
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Zeichen: {title.length}/60</span>
                {title.length > 60 && (
                  <Badge variant="destructive" className="text-xs">Zu lang</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea
                value={metaDescription}
                onChange={(e) => onMetaChange(e.target.value)}
                placeholder="Meta Description..."
                rows={3}
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Zeichen: {metaDescription.length}/155</span>
                {metaDescription.length > 155 && (
                  <Badge variant="destructive" className="text-xs">Zu lang</Badge>
                )}
              </div>
            </div>

            {/* SERP Preview */}
            <div className="space-y-2">
              <Label>Google Vorschau</Label>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                <div className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer">
                  {title || 'Titel eingeben...'}
                </div>
                <div className="text-green-700 dark:text-green-500 text-sm">
                  www.example.com
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {metaDescription || 'Meta Description eingeben...'}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="html" className="mt-0">
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="min-h-[500px] font-mono text-xs"
              placeholder="HTML Content..."
            />
          </TabsContent>

          <TabsContent value="refine" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label>Anpassung beschreiben</Label>
              <Textarea
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder="z.B. 'Mache den Text formeller', 'Füge mehr technische Details hinzu', 'Kürze die Einleitung'"
                rows={4}
              />
            </div>

            <Button
              onClick={handleRefine}
              disabled={isRefining || !refinePrompt.trim()}
              className="w-full"
            >
              {isRefining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird überarbeitet...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Text anpassen
                </>
              )}
            </Button>

            {/* Quick Refinements */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Schnellanpassungen</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Formeller machen',
                  'Informeller machen',
                  'Mehr Details',
                  'Kürzer fassen',
                  'Mehr CTAs',
                  'Weniger Fachbegriffe',
                ].map((quick) => (
                  <Button
                    key={quick}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setRefinePrompt(quick)}
                  >
                    {quick}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
};
