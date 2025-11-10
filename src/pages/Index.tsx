import { useState } from "react";
import { FormData } from "@/components/SEOGeneratorForm";
import { GeneratedContent } from "@/components/SEOOutputTabs";
import { KeywordResearch } from "@/components/KeywordResearch";
import { CompetitorAnalysis } from "@/components/CompetitorAnalysis";
import { ProjectList } from "@/components/ProjectList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SEOGeneratorForm } from "@/components/SEOGeneratorForm";
import { SEOOutputTabs } from "@/components/SEOOutputTabs";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (data: FormData) => {
    setIsLoading(true);
    setFormData(data);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-seo-content", {
        body: data,
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

      // Save to database
      const projectData = {
        title: `${data.focusKeyword} - ${data.pageType === 'product' ? 'Produktseite' : 'Kategorieseite'}`,
        page_type: data.pageType,
        focus_keyword: data.focusKeyword,
        form_data: data as any,
        generated_content: result as any
      };

      if (currentProjectId) {
        const { error: updateError } = await supabase
          .from('seo_projects')
          .update(projectData)
          .eq('id', currentProjectId);
        
        if (updateError) throw updateError;
        toast({
          title: "Erfolgreich",
          description: "Projekt aktualisiert",
        });
      } else {
        const { data: newProject, error: insertError } = await supabase
          .from('seo_projects')
          .insert(projectData)
          .select()
          .single();
        
        if (insertError) throw insertError;
        setCurrentProjectId(newProject.id);
        toast({
          title: "Erfolgreich",
          description: "Projekt gespeichert",
        });
      }

      setGeneratedContent(result);
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

  const handleLoadProject = (project: any) => {
    setFormData(project.form_data);
    setGeneratedContent(project.generated_content);
    setCurrentProjectId(project.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">SEO Content Generator</h1>
          <p className="text-sm text-muted-foreground">
            Professionelle SEO-Texte mit Compliance-Check für medizinische Produkte
          </p>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-140px)]">
          <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col">
            <Tabs defaultValue="generator" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
                <TabsTrigger value="projects">Projekte</TabsTrigger>
                <TabsTrigger value="research">Keywords</TabsTrigger>
                <TabsTrigger value="competitors">Wettbewerb</TabsTrigger>
                <TabsTrigger value="generator">Generator</TabsTrigger>
              </TabsList>
              
              <TabsContent value="projects" className="flex-1 overflow-hidden mt-0">
                <div className="p-6 h-full overflow-y-auto">
                  <ProjectList onLoadProject={handleLoadProject} />
                </div>
              </TabsContent>
              
              <TabsContent value="research" className="flex-1 overflow-hidden mt-0">
                <KeywordResearch />
              </TabsContent>
              
              <TabsContent value="competitors" className="flex-1 overflow-hidden mt-0">
                <CompetitorAnalysis />
              </TabsContent>
              
              <TabsContent value="generator" className="flex-1 overflow-hidden mt-0">
                <SEOGeneratorForm 
                  onGenerate={handleGenerate} 
                  isLoading={isLoading}
                  initialData={formData}
                  projectId={currentProjectId}
                />
              </TabsContent>
            </Tabs>
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
              <SEOOutputTabs 
                content={generatedContent} 
                projectId={currentProjectId}
                formData={formData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
