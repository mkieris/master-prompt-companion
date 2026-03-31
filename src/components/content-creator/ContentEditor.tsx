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

export interface PromptInfo {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  promptVersion: string;
  maxTokens: number;
  temperature: number;
}

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
  promptInfo?: PromptInfo | null;
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
  promptInfo,
}: ContentEditorProps) => {
  const getRenderableContent = (rawContent: string) => {
    if (!rawContent) return '';

    const trimmed = rawContent.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('```json')) {
      return rawContent;
    }

    try {
      const cleaned = trimmed.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      const parsed = JSON.parse(cleaned);
      const extracted = parsed?.variants?.[0] || parsed?.content || parsed;
      const seoText = extracted?.seoText || extracted?.content?.seoText;
      return typeof seoText === 'string' && seoText.trim() ? seoText : rawContent;
    } catch {
      return rawContent;
    }
  };

  const renderableContent = getRenderableContent(content);
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
    <Card className="h-full flex flex-col overflow-hidden border-x-0 rounded-none">
      {/* Enhanced Header */}
      <CardHeader className="pb-0 border-b flex-shrink-0 bg-muted/30">
        <div className="flex items-center justify-between pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <span>Content Editor</span>
            {content && (
              <Badge variant="secondary" className="text-[10px] ml-2">
                {content.split(/\s+/).filter(w => w.length > 0).length} Worter
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => onEditingChange(!isEditing)}
              className="h-8 text-xs"
            >
              {isEditing ? (
                <>
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Vorschau
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  Bearbeiten
                </>
              )}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(stripHtml(content), 'Content')}
              className="h-8 w-8"
            >
              {copiedSection === 'Content' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={exportAsHtml} className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-10 p-1 bg-muted/50 rounded-t-lg rounded-b-none border-b-0">
            <TabsTrigger value="preview" className="flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Vorschau
            </TabsTrigger>
            <TabsTrigger value="meta" className="flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              Meta & SEO
            </TabsTrigger>
            <TabsTrigger value="html" className="flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Code className="h-3.5 w-3.5 mr-1.5" />
              HTML
            </TabsTrigger>
            <TabsTrigger value="refine" className="flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              KI-Anpassung
            </TabsTrigger>
            <TabsTrigger value="prompt" className="flex-1 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Prompt
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">

        <ScrollArea className="flex-1 h-full">
          <div className="p-4 pb-8">
            <TabsContent value="preview" className="mt-0">
              {isEditing ? (
                <Textarea
                  value={content}
                  onChange={(e) => onContentChange(e.target.value)}
                  className="min-h-[500px] font-mono text-sm border-2 focus:border-primary"
                  placeholder="Content hier bearbeiten..."
                />
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-li:my-1">
                  {renderableContent?.trim().startsWith('<') ? (
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderableContent) }} />
                  ) : (
                    <ReactMarkdown>{renderableContent || ''}</ReactMarkdown>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="meta" className="mt-0 space-y-6">
              {/* Title Tag - Enhanced */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <span>Title Tag</span>
                    {title.length >= 30 && title.length <= 60 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : title.length > 0 ? (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    ) : null}
                  </Label>
                  <span className={`text-xs font-mono ${
                    title.length > 60 ? 'text-red-500' :
                    title.length >= 30 ? 'text-green-500' : 'text-muted-foreground'
                  }`}>
                    {title.length} / 60
                  </span>
                </div>
                <Input
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="SEO Title eingeben..."
                  className="h-11 text-base"
                />
                <Progress
                  value={Math.min((title.length / 60) * 100, 100)}
                  className={`h-1.5 ${title.length > 60 ? '[&>div]:bg-red-500' : ''}`}
                />
              </div>

              {/* Meta Description - Enhanced */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <span>Meta Description</span>
                    {metaDescription.length >= 120 && metaDescription.length <= 155 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : metaDescription.length > 0 ? (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    ) : null}
                  </Label>
                  <span className={`text-xs font-mono ${
                    metaDescription.length > 155 ? 'text-red-500' :
                    metaDescription.length >= 120 ? 'text-green-500' : 'text-muted-foreground'
                  }`}>
                    {metaDescription.length} / 155
                  </span>
                </div>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => onMetaChange(e.target.value)}
                  placeholder="Meta Description eingeben..."
                  rows={3}
                  className="resize-none"
                />
                <Progress
                  value={Math.min((metaDescription.length / 155) * 100, 100)}
                  className={`h-1.5 ${metaDescription.length > 155 ? '[&>div]:bg-red-500' : ''}`}
                />
              </div>

              {/* Google SERP Preview - Enhanced */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Google Suchergebnis-Vorschau
                </Label>
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border-2 shadow-sm">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>www.example.com</span>
                    <span>{'>'}</span>
                    <span>...</span>
                  </div>
                  {/* Title */}
                  <div className="text-blue-600 dark:text-blue-400 text-lg font-medium hover:underline cursor-pointer leading-tight">
                    {title || 'Titel hier eingeben...'}
                  </div>
                  {/* Description */}
                  <div className="text-gray-600 dark:text-gray-400 text-sm mt-1 leading-snug">
                    {metaDescription || 'Meta Description hier eingeben - diese wird in den Google Suchergebnissen angezeigt...'}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="html" className="mt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">HTML-Quellcode</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => copyToClipboard(content, 'HTML')}
                  >
                    {copiedSection === 'HTML' ? (
                      <Check className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Kopieren
                  </Button>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => onContentChange(e.target.value)}
                  className="min-h-[500px] font-mono text-xs bg-zinc-950 text-zinc-100 dark:bg-zinc-900 border-zinc-800"
                  placeholder="HTML Content..."
                />
              </div>
            </TabsContent>

            <TabsContent value="refine" className="mt-0 space-y-6">
              {/* AI Refinement - Enhanced */}
              <div className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-xl border border-purple-500/20 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Wand2 className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">KI-Anpassung</Label>
                    <p className="text-xs text-muted-foreground">Beschreibe, wie der Text verbessert werden soll</p>
                  </div>
                </div>

                <Textarea
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="z.B. 'Mache den Text formeller', 'Fuge mehr technische Details hinzu', 'Kurze die Einleitung'"
                  rows={4}
                  className="resize-none border-purple-500/30 focus:border-purple-500"
                />

                <Button
                  onClick={handleRefine}
                  disabled={isRefining || !refinePrompt.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      KI arbeitet...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Text mit KI anpassen
                    </>
                  )}
                </Button>
              </div>

              {/* Quick Refinements - Enhanced */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Schnellanpassungen</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Formeller', icon: '👔' },
                    { label: 'Lockerer', icon: '😊' },
                    { label: 'Mehr Details', icon: '📝' },
                    { label: 'Kurzer fassen', icon: '✂️' },
                    { label: 'Mehr CTAs', icon: '🎯' },
                    { label: 'Einfacher', icon: '💡' },
                  ].map((quick) => (
                    <Button
                      key={quick.label}
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 justify-start"
                      onClick={() => setRefinePrompt(quick.label + ' machen')}
                    >
                      <span className="mr-2">{quick.icon}</span>
                      {quick.label}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Prompt Debug Tab */}
            <TabsContent value="prompt" className="mt-0 space-y-4">
              {promptInfo ? (
                <>
                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Model: {promptInfo.model}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Version: {promptInfo.promptVersion}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Max Tokens: {promptInfo.maxTokens}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Temp: {promptInfo.temperature}
                    </Badge>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        System Prompt
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => copyToClipboard(promptInfo.systemPrompt, 'System Prompt')}
                      >
                        {copiedSection === 'System Prompt' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg border p-3 max-h-[300px] overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                        {promptInfo.systemPrompt}
                      </pre>
                    </div>
                  </div>

                  {/* User Prompt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        User Prompt
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => copyToClipboard(promptInfo.userPrompt, 'User Prompt')}
                      >
                        {copiedSection === 'User Prompt' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg border p-3 max-h-[300px] overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                        {promptInfo.userPrompt}
                      </pre>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">Noch kein Prompt vorhanden</p>
                  <p className="text-xs mt-1">Generiere einen Text, um den Prompt zu sehen</p>
                </div>
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </Card>
  );
};
