import { useState } from "react";
import { Step1InfoGathering } from "./ProSteps/Step1InfoGathering";
import { Step2TargetAudience } from "./ProSteps/Step2TargetAudience";
import { Step3TextStructure } from "./ProSteps/Step3TextStructure";
import { Step4Preview } from "./ProSteps/Step4Preview";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export type PageType = 'product' | 'category' | 'guide';

export interface FormData {
  // Step 1
  pageType: PageType;
  brandName: string; // Was: manufacturerName - jetzt flexibler Name
  websiteUrl: string; // Was: manufacturerWebsite
  mainTopic: string; // Was: productName - jetzt flexibler (Produkt/Kategorie/Thema)
  referenceUrls: string[]; // Was: productUrls - jetzt flexibler
  additionalInfo: string;
  briefingFiles: string[];
  competitorUrls: string[];
  competitorData: string;
  // Step 2
  targetAudience: string;
  formOfAddress: string;
  language: string;
  tonality: string;
  // Step 3
  focusKeyword: string;
  secondaryKeywords: string[];
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

interface SEOGeneratorFormProps {
  onGenerate: (data: FormData) => void;
  isLoading: boolean;
}

export const SEOGeneratorFormPro = ({ onGenerate, isLoading }: SEOGeneratorFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
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
    language: "",
    tonality: "",
    focusKeyword: "",
    secondaryKeywords: [],
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
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { toast } = useToast();

  const updateFormData = (data: Partial<FormData>) => {
    setFormData({ ...formData, ...data });
  };

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate progress for better UX
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
      
      toast({
        title: "Erfolgreich",
        description: "Text wurde überarbeitet",
      });
    } catch (error) {
      console.error("Refinement error:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Überarbeiten",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleQuickChange = async (changes: any) => {
    setIsRefining(true);
    try {
      // Update form data with changes
      const updatedFormData = {
        ...formData,
        ...changes,
      };
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
      
      toast({
        title: "Erfolgreich",
        description: "Änderungen wurden übernommen",
      });
    } catch (error) {
      console.error("Quick change error:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Übernehmen der Änderungen",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleFinish = () => {
    onGenerate(formData);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === currentStep
                ? "bg-primary text-primary-foreground"
                : step < currentStep
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step}
          </div>
          {step < 4 && (
            <div
              className={`w-12 h-0.5 ${
                step < currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-6">
        {renderStepIndicator()}
        
        {isGenerating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="p-8 max-w-md w-full mx-4">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-semibold">SEO-Content wird generiert...</h3>
                  <p className="text-sm text-muted-foreground">
                    Dies kann 30-60 Sekunden dauern. Bitte warten Sie.
                  </p>
                </div>
                <div className="space-y-2">
                  <Progress value={generationProgress} />
                  <p className="text-xs text-center text-muted-foreground">
                    {Math.round(generationProgress)}% abgeschlossen
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

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
            onFinish={handleFinish}
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
      </Card>
    </div>
  );
};
