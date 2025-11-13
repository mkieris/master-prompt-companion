import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEOGeneratorForm, FormData } from "@/components/SEOGeneratorForm";
import { SEOOutputTabs, GeneratedContent } from "@/components/SEOOutputTabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface IndexProps {
  session: Session | null;
}

const Index = ({ session }: IndexProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!session) {
    return null;
  }

  const handleGenerate = async (formData: FormData) => {
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">SEO Content Generator</h1>
              <p className="text-sm text-muted-foreground">
                Professionelle SEO-Texte mit Compliance-Check für medizinische Produkte
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-140px)]">
          <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col">
            <SEOGeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">Generiere hochwertigen SEO-Content...</p>
                </div>
              </div>
            ) : (
              <SEOOutputTabs content={generatedContent} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
