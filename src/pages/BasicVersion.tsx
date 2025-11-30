import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GeneratorHeader } from "@/components/seo-generator/GeneratorHeader";
import { BasicForm, BasicFormData } from "@/components/seo-generator/BasicForm";
import { OutputPanel, GeneratedContent } from "@/components/seo-generator/OutputPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";

interface BasicVersionProps {
  session: Session | null;
}

const BasicVersion = ({ session }: BasicVersionProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  const handleGenerate = async (formData: BasicFormData) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: formData,
      });

      if (error) {
        console.error("Error generating content:", error);
        toast({
          title: "Fehler",
          description: error.message || "Fehler beim Generieren des Inhalts",
          variant: "destructive",
        });
        return;
      }

      setGeneratedContent(data);
      toast({
        title: "Erfolgreich",
        description: "SEO-Inhalt wurde erfolgreich generiert",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GeneratorHeader variant="basic" />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
          {/* Form Panel */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
            <BasicForm onGenerate={handleGenerate} isLoading={isLoading} />
          </div>

          {/* Output Panel */}
          <div className="h-full">
            <OutputPanel content={generatedContent} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BasicVersion;
