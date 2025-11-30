import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GeneratorHeader } from "@/components/seo-generator/GeneratorHeader";
import { ProStepIndicator } from "@/components/seo-generator/ProStepIndicator";
import { OutputPanel, GeneratedContent } from "@/components/seo-generator/OutputPanel";
import { Step1InfoGathering } from "@/components/ProSteps/Step1InfoGathering";
import { Step2TargetAudience } from "@/components/ProSteps/Step2TargetAudience";
import { Step3TextStructure } from "@/components/ProSteps/Step3TextStructure";
import { Step4Preview } from "@/components/ProSteps/Step4Preview";
import { Step5AfterCheck } from "@/components/ProSteps/Step5AfterCheck";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export type PageType = 'product' | 'category' | 'guide';

export interface FormData {
  pageType: PageType;
  brandName: string;
  websiteUrl: string;
  mainTopic: string;
  referenceUrls: string[];
  additionalInfo: string;
  briefingFiles: string[];
  competitorUrls: string[];
  competitorData: string;
  targetAudience: string;
  formOfAddress: string;
  language: string;
  tonality: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string[];
  keywordDensity: string;
  wQuestions: string[];
  contentStructure: string;
  contentLayout: string;
  imageTextBlocks: number;
  includeTabs: boolean;
  wordCount: string;
  headingStructure: string;
  includeIntro: boolean;
  includeFAQ: boolean;
  pageGoal: string;
  complianceChecks: {
    mdr: boolean;
    hwg: boolean;
    studies: boolean;
  };
}

interface ProVersionProps {
  session: Session | null;
}

const STEPS = [
  { id: 1, title: "Informationen", shortTitle: "Info" },
  { id: 2, title: "Zielgruppe", shortTitle: "Ziel" },
  { id: 3, title: "Struktur", shortTitle: "Struktur" },
  { id: 4, title: "Vorschau", shortTitle: "Preview" },
  { id: 5, title: "SEO-Check", shortTitle: "Check" },
];

const ProVersion = ({ session }: ProVersionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    pageType: 'product',
    brandName: "",
    websiteUrl: "",
    mainTopic: "",
    referenceUrls: [],
    additionalInfo: "",
    briefingFiles: [],
    competitorUrls: [],
    competitorData: "",
    targetAudience: "",
    formOfAddress: "",
    language: "de",
    tonality: "",
    focusKeyword: "",
    secondaryKeywords: [],
    searchIntent: [],
    keywordDensity: "normal",
    wQuestions: [],
    contentStructure: "",
    contentLayout: "",
    imageTextBlocks: 0,
    includeTabs: false,
    wordCount: "",
    headingStructure: "",
    includeIntro: true,
    includeFAQ: true,
    pageGoal: "",
    complianceChecks: {
      mdr: false,
      hwg: false,
      studies: false,
    },
  });

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  const updateFormData = (data: Partial<FormData>) => {
    setFormData({ ...formData, ...data });
  };

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 800);

    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: formData,
      });

      if (error) throw error;

      setGenerationProgress(100);
      setGeneratedContent(data);
      
      setTimeout(() => {
        setCurrentStep(4);
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 500);
      
      toast({
        title: "Erfolgreich",
        description: "SEO-Inhalt wurde generiert",
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Generieren des Inhalts",
        variant: "destructive",
      });
      setIsGenerating(false);
      setGenerationProgress(0);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleRefineContent = async (prompt: string) => {
    setIsRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...formData,
          refinementPrompt: prompt,
          existingContent: generatedContent,
        },
      });

      if (error) throw error;
      setGeneratedContent(data);
      toast({ title: "Erfolgreich", description: "Text wurde überarbeitet" });
    } catch (error) {
      console.error("Refinement error:", error);
      toast({ title: "Fehler", description: "Fehler beim Überarbeiten", variant: "destructive" });
    } finally {
      setIsRefining(false);
    }
  };

  const handleQuickChange = async (changes: any) => {
    setIsRefining(true);
    try {
      const updatedFormData = { ...formData, ...changes };
      setFormData(updatedFormData);

      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...updatedFormData,
          quickChange: true,
          existingContent: generatedContent,
        },
      });

      if (error) throw error;
      setGeneratedContent(data);
      toast({ title: "Erfolgreich", description: "Änderungen wurden übernommen" });
    } catch (error) {
      console.error("Quick change error:", error);
      toast({ title: "Fehler", description: "Fehler beim Übernehmen der Änderungen", variant: "destructive" });
    } finally {
      setIsRefining(false);
    }
  };

  const handleRegenerateWithImprovements = async () => {
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...formData,
          refinementPrompt: `Bitte überarbeite den Text basierend auf SEO Best Practices:
            - Stärkere E-E-A-T Signale
            - Mehr nutzerorientierte Sprache
            - Optimale Keyword-Platzierung
            - Kürzere Sätze (max. 20 Wörter)
            - Weniger Passiv-Konstruktionen
            - Mehr konkrete Beispiele`,
          existingContent: generatedContent,
        },
      });

      if (error) throw error;
      setGeneratedContent(data);
      toast({ title: "Erfolgreich", description: "Text wurde mit SEO-Verbesserungen regeneriert" });
    } catch (error) {
      console.error("Regeneration error:", error);
      toast({ title: "Fehler", description: "Fehler beim Regenerieren", variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFinish = () => {
    toast({ title: "Fertig!", description: "Content wurde erfolgreich erstellt" });
    // Could save to projects here
  };

  const handleStepClick = (step: number) => {
    // Only allow going back or to current step
    if (step <= currentStep) {
      // Don't allow going to step 4 or 5 without content
      if ((step === 4 || step === 5) && !generatedContent) {
        return;
      }
      setCurrentStep(step);
    }
  };

  const completedSteps = [
    formData.mainTopic ? 1 : 0,
    formData.targetAudience && formData.formOfAddress ? 2 : 0,
    formData.focusKeyword ? 3 : 0,
    generatedContent ? 4 : 0,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GeneratorHeader variant="pro" />

      {/* Step Indicator */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <ProStepIndicator 
            steps={STEPS} 
            currentStep={currentStep} 
            onStepClick={handleStepClick}
            completedSteps={completedSteps}
          />
        </div>
      </div>

      {/* Generation Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="p-8 max-w-md w-full mx-4 text-center">
            <div className="space-y-6">
              <div className="relative mx-auto w-fit">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div className="absolute -inset-2 rounded-full bg-primary/10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">SEO-Content wird generiert...</h3>
                <p className="text-sm text-muted-foreground">
                  {generationProgress < 30 && "Analysiere Eingaben..."}
                  {generationProgress >= 30 && generationProgress < 60 && "Recherchiere relevante Informationen..."}
                  {generationProgress >= 60 && generationProgress < 90 && "Erstelle optimierten Content..."}
                  {generationProgress >= 90 && "Fast fertig..."}
                </p>
              </div>
              <div className="space-y-2">
                <Progress value={generationProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(generationProgress)}% abgeschlossen
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-220px)]">
          {/* Form Panel */}
          <Card className="overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6">
                {currentStep === 1 && (
                  <Step1InfoGathering
                    data={{
                      pageType: formData.pageType,
                      brandName: formData.brandName,
                      websiteUrl: formData.websiteUrl,
                      mainTopic: formData.mainTopic,
                      referenceUrls: formData.referenceUrls,
                      additionalInfo: formData.additionalInfo,
                      briefingFiles: formData.briefingFiles,
                      competitorUrls: formData.competitorUrls,
                      competitorData: formData.competitorData,
                    }}
                    onUpdate={updateFormData}
                    onNext={() => setCurrentStep(2)}
                  />
                )}

                {currentStep === 2 && (
                  <Step2TargetAudience
                    data={{
                      targetAudience: formData.targetAudience,
                      formOfAddress: formData.formOfAddress,
                      language: formData.language,
                      tonality: formData.tonality,
                    }}
                    onUpdate={updateFormData}
                    onNext={() => setCurrentStep(3)}
                    onBack={() => setCurrentStep(1)}
                  />
                )}

                {currentStep === 3 && (
                  <Step3TextStructure
                    data={{
                      focusKeyword: formData.focusKeyword,
                      secondaryKeywords: formData.secondaryKeywords,
                      searchIntent: formData.searchIntent,
                      keywordDensity: formData.keywordDensity,
                      wQuestions: formData.wQuestions,
                      contentStructure: formData.contentStructure,
                      contentLayout: formData.contentLayout,
                      imageTextBlocks: formData.imageTextBlocks,
                      includeTabs: formData.includeTabs,
                      wordCount: formData.wordCount,
                      headingStructure: formData.headingStructure,
                      includeIntro: formData.includeIntro,
                      includeFAQ: formData.includeFAQ,
                      pageGoal: formData.pageGoal,
                      complianceChecks: formData.complianceChecks,
                    }}
                    onUpdate={updateFormData}
                    onNext={handleGenerateContent}
                    onBack={() => setCurrentStep(2)}
                  />
                )}

                {currentStep === 4 && (
                  <Step4Preview
                    generatedContent={generatedContent}
                    onRefine={handleRefineContent}
                    onQuickChange={handleQuickChange}
                    onBack={() => setCurrentStep(3)}
                    onNext={() => setCurrentStep(5)}
                    isRefining={isRefining}
                    currentFormData={{
                      tonality: formData.tonality,
                      formOfAddress: formData.formOfAddress,
                      wordCount: formData.wordCount,
                      includeFAQ: formData.includeFAQ,
                      targetAudience: formData.targetAudience,
                    }}
                  />
                )}

                {currentStep === 5 && (
                  <Step5AfterCheck
                    generatedContent={generatedContent}
                    formData={{
                      focusKeyword: formData.focusKeyword,
                      secondaryKeywords: formData.secondaryKeywords,
                      pageType: formData.pageType,
                      targetAudience: formData.targetAudience,
                      wordCount: formData.wordCount,
                    }}
                    onBack={() => setCurrentStep(4)}
                    onFinish={handleFinish}
                    onRegenerate={handleRegenerateWithImprovements}
                    onRefine={handleRefineContent}
                    isRegenerating={isRegenerating}
                    isRefining={isRefining}
                  />
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Output Panel */}
          <div className="h-full">
            <OutputPanel 
              content={generatedContent} 
              isLoading={isGenerating} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProVersion;
