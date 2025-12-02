import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, Calendar, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface UserPromptTemplate {
  id: string;
  version_key: string;
  version_name: string;
  version_description: string;
  prompt_template: string;
  created_at: string;
  is_active: boolean;
  metadata: any;
}

export default function UserPromptVersions() {
  const [templates, setTemplates] = useState<UserPromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('user_prompt_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Load error:', error);
      toast({
        title: "Fehler",
        description: "User Prompt Templates konnten nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          User Prompt Templates
        </h1>
        <p className="text-muted-foreground mt-2">
          Alle User Prompt Template Versionen in der Datenbank
        </p>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{template.version_name}</h3>
                    {template.is_active && (
                      <Badge variant="default">Aktiv</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{template.version_description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(template.created_at), { 
                        addSuffix: true, 
                        locale: de 
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompt Template Content */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Prompt Template:</h4>
                <ScrollArea className="h-64 w-full rounded border p-4 bg-muted/30">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {template.prompt_template}
                  </pre>
                </ScrollArea>
              </div>

              {/* Metadata */}
              {template.metadata && Object.keys(template.metadata).length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">Metadaten:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {template.metadata.category && (
                      <Badge variant="outline">Kategorie: {template.metadata.category}</Badge>
                    )}
                    {template.metadata.complexity && (
                      <Badge variant="outline">Komplexität: {template.metadata.complexity}</Badge>
                    )}
                    {template.metadata.focus && (
                      <Badge variant="outline">Fokus: {template.metadata.focus}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Platzhalter Info */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Verfügbare Platzhalter:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <code className="bg-muted px-2 py-1 rounded">{'{'}brandName{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}mainTopic{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}additionalInfo{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}focusKeyword{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}secondaryKeywords{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}targetAudience{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}formOfAddress{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}tonality{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}wordCount{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}maxParagraphLength{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}includeFAQ{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}wQuestions{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}competitorData{'}'}</code>
                  <code className="bg-muted px-2 py-1 rounded">{'{'}briefingContent{'}'}</code>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
