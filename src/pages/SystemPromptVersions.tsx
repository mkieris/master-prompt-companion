import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, BookOpen, Calendar, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface SystemPromptVersion {
  id: string;
  version_key: string;
  version_name: string;
  version_description: string;
  system_prompt: string;
  created_at: string;
  is_active: boolean;
  usage_count: number;
  average_rating: number;
  metadata: any;
}

export default function SystemPromptVersions() {
  const [versions, setVersions] = useState<SystemPromptVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('system_prompt_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Load error:', error);
      toast({
        title: "Fehler",
        description: "System Prompts konnten nicht geladen werden",
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
          <BookOpen className="h-8 w-8 text-primary" />
          System Prompt Versionen
        </h1>
        <p className="text-muted-foreground mt-2">
          Alle System Prompt Versionen in der Datenbank
        </p>
      </div>

      <div className="grid gap-4">
        {versions.map((version) => (
          <Card key={version.id} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{version.version_name}</h3>
                    {version.is_active && (
                      <Badge variant="default">Aktiv</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{version.version_description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(version.created_at), { 
                        addSuffix: true, 
                        locale: de 
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {version.usage_count || 0} Verwendungen
                    </div>
                    {version.average_rating && (
                      <div className="flex items-center gap-1">
                        ⭐ Ø {version.average_rating.toFixed(1)}/5
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Prompt Content */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">System Prompt:</h4>
                <ScrollArea className="h-64 w-full rounded border p-4 bg-muted/30">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {version.system_prompt}
                  </pre>
                </ScrollArea>
              </div>

              {/* Metadata */}
              {version.metadata && Object.keys(version.metadata).length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">Metadaten:</h4>
                  <div className="flex gap-2">
                    {version.metadata.category && (
                      <Badge variant="outline">Kategorie: {version.metadata.category}</Badge>
                    )}
                    {version.metadata.focus && (
                      <Badge variant="outline">Fokus: {version.metadata.focus}</Badge>
                    )}
                    {version.metadata.complexity && (
                      <Badge variant="outline">Komplexität: {version.metadata.complexity}</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
