import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContentEditorProps {
  projectId: string;
  sectionTitle: string;
  sectionContent: string;
  formData: any;
  onUpdate: (newContent: string) => void;
  onClose: () => void;
}

export const ContentEditor = ({ 
  projectId, 
  sectionTitle, 
  sectionContent, 
  formData,
  onUpdate,
  onClose 
}: ContentEditorProps) => {
  const [content, setContent] = useState(sectionContent);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-section', {
        body: {
          sectionTitle,
          currentContent: content,
          formData
        }
      });

      if (error) throw error;
      
      if (data.regeneratedContent) {
        setContent(data.regeneratedContent);
        toast.success('Abschnitt neu generiert');
      }
    } catch (error) {
      console.error('Error regenerating section:', error);
      toast.error('Fehler beim Neu-Generieren');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    onUpdate(content);
    toast.success('Änderungen gespeichert');
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Abschnitt bearbeiten: {sectionTitle}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[300px] font-mono text-sm"
        />
        <div className="flex gap-2">
          <Button 
            onClick={handleRegenerate} 
            disabled={isRegenerating}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            Neu generieren
          </Button>
          <Button 
            onClick={handleSave}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
