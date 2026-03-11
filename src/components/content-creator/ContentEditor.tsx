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

  // Empty state
  if (!hasContent && !isGenerating) {
    return (
      <Card className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <FileText className="h-10 w-10 text-primary/60" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Bereit zur Content-Erstellung</h3>
            <p className="text-muted-foreground">
              Konfigurieren Sie Ihr Keyword und die Einstellungen links, dann klicken Sie auf "Content generieren".
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">1</Badge>
              Fokus-Keyword eingeben
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">2</Badge>
              SERP-Analyse durchführen (automatisch)
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">3</Badge>
              3 Varianten generieren lassen
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <Card className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="relative mx-auto w-fit">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="absolute -inset-2 rounded-full bg-primary/10 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Generiere 3 Content-Varianten...</h3>
            <p className="text-sm text-muted-foreground">
              KI analysiert SERP-Daten und erstellt optimierten Content
            </p>
          </div>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span>Variante A: Strukturiert</span>
            <span>Variante B: Nutzenorientiert</span>
            <span>Variante C: Emotional</span>
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
