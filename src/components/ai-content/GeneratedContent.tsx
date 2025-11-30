import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, FileText, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeneratedContentProps {
  content: {
    metaTitle?: string;
    metaDescription?: string;
    mainContent?: string;
    faq?: { question: string; answer: string }[];
  };
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const GeneratedContent = ({ content, onRegenerate, isRegenerating }: GeneratedContentProps) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  if (!content.mainContent) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Generierter SEO-Content</h3>
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
          <Button variant="outline" size="sm" onClick={copyAll}>
            <Copy className="h-4 w-4 mr-2" />
            Alles kopieren
          </Button>
          <Button variant="outline" size="sm" onClick={downloadAsText}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent px-4">
          <TabsTrigger value="content">Hauptinhalt</TabsTrigger>
          <TabsTrigger value="meta">Meta-Tags</TabsTrigger>
          {content.faq?.length ? <TabsTrigger value="faq">FAQ</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="content" className="p-4">
          <ScrollArea className="h-[400px]">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: content.mainContent
                    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '</p><p class="my-3">')
                    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
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
              <p className="text-xs text-muted-foreground mt-1">
                {content.metaTitle?.length || 0}/60 Zeichen
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {content.metaDescription?.length || 0}/160 Zeichen
              </p>
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
      </Tabs>
    </Card>
  );
};

export default GeneratedContent;
