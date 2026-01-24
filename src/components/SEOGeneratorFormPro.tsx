import { useState } from "react";
import { Step1InfoGathering } from "./ProSteps/Step1InfoGathering";
import { Step2TargetAudience } from "./ProSteps/Step2TargetAudience";
import { Step3TextStructure } from "./ProSteps/Step3TextStructure";
import { Step4Preview } from "./ProSteps/Step4Preview";
import { Step5AfterCheck } from "./ProSteps/Step5AfterCheck";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Loader2, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDemoData } from "@/lib/demoData";

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
  promptVersion?: string;
  // Step 2
  targetAudience: string;
  formOfAddress: string;
  language: string;
  tonality: string;
  // Step 3
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
  maxParagraphLength: string;
  headingStructure: string;
  includeIntro: boolean;
  includeFAQ: boolean;
  pageGoal: string;
  aiModel?: 'gemini-flash' | 'gemini-pro' | 'claude-sonnet';
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
    promptVersion: "v1-kompakt-seo",
    targetAudience: "",
    formOfAddress: "",
    language: "",
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
    maxParagraphLength: "300",
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
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get the currently selected content (handles both variants and single content)
  const getSelectedContent = () => {
    if (!generatedContent) return null;
    if (generatedContent.variants && Array.isArray(generatedContent.variants)) {
      return generatedContent.variants[selectedVariantIndex] || generatedContent.variants[0];
    }
    return generatedContent;
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData({ ...formData, ...data });
  };

  const loadDemoData = () => {
    const demoData = getDemoData('default');
    setFormData(demoData);
    toast({
      title: "Demo-Daten geladen",
      description: "Alle Formularfelder wurden mit Test-Daten befüllt",
    });
  };

  const handleGenerateContent = async () => {
    // Validation vor Generierung
    if (!formData.focusKeyword?.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie ein Fokus-Keyword ein",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 1000);

    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: formData,
      });

      if (error) {
        console.error('Generation error:', error);
        throw new Error(error.message || 'Fehler beim Generieren des Inhalts');
      }

      if (!data) {
        throw new Error('Keine Daten vom Server erhalten');
      }

      setGenerationProgress(100);
      setGeneratedContent(data);
      setSelectedVariantIndex(0); // Reset to first variant
      
      // AUTO-SAVE: Save to database after successful generation
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_organization_id')
          .eq('id', user?.id)
          .single();

        if (user && profile?.current_organization_id) {
          const projectData = {
            title: formData.mainTopic || formData.focusKeyword || 'Unbenanntes Projekt',
            page_type: formData.pageType,
            focus_keyword: formData.focusKeyword,
            form_data: formData as any,
            generated_content: data as any,
            organization_id: profile.current_organization_id,
            created_by: user.id,
            status: 'completed',
            description: formData.additionalInfo?.substring(0, 500) || null
          };

          const { data: insertData, error: saveError } = await supabase
            .from('content_projects')
            .insert([projectData])
            .select()
            .single();

          if (saveError) {
            console.error('Save error:', saveError);
          } else {
            console.log('✅ Content auto-saved to database');
            if (insertData?.id) {
              setSavedProjectId(insertData.id);
            }
          }
        }
      } catch (saveErr) {
        console.error('Auto-save failed:', saveErr);
      }
      
      setTimeout(() => {
        setCurrentStep(4);
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 500);
      
      const variantCount = data?.variants?.length || 1;
      toast({
        title: "Erfolgreich",
        description: `${variantCount} SEO-Inhalt${variantCount > 1 ? '-Varianten wurden' : ' wurde'} generiert & gespeichert`,
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
      const currentContent = getSelectedContent();
      
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...formData,
          refinementPrompt: prompt,
          existingContent: currentContent,
        },
      });

      if (error) throw error;

      // Update the selected variant or set as single content
      if (generatedContent?.variants) {
        const newVariants = [...generatedContent.variants];
        newVariants[selectedVariantIndex] = data;
        setGeneratedContent({ ...generatedContent, variants: newVariants });
      } else {
        setGeneratedContent(data);
      }
      
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
      const updatedFormData = {
        ...formData,
        ...changes,
      };
      setFormData(updatedFormData);

      const currentContent = getSelectedContent();

      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...updatedFormData,
          quickChange: true,
          existingContent: currentContent,
        },
      });

      if (error) throw error;

      // Update the selected variant or set as single content
      if (generatedContent?.variants) {
        const newVariants = [...generatedContent.variants];
        newVariants[selectedVariantIndex] = data;
        setGeneratedContent({ ...generatedContent, variants: newVariants });
      } else {
        setGeneratedContent(data);
      }
      
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

  const handleRegenerateWithImprovements = async () => {
    setIsRegenerating(true);
    try {
      const currentContent = getSelectedContent();
      
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...formData,
          refinementPrompt: `Bitte überarbeite den Text basierend auf folgenden SEO Best Practices:
            - Stärkere E-E-A-T Signale (Experience, Expertise, Authoritativeness, Trustworthiness)
            - Mehr nutzerorientierte Sprache (People-First Content nach John Mueller)
            - Optimale Keyword-Platzierung (H1, erste 100 Wörter)
            - Kürzere Sätze (max. 20 Wörter im Durchschnitt)
            - Weniger Passiv-Konstruktionen
            - Mehr konkrete Beispiele und Mehrwert`,
          existingContent: currentContent,
        },
      });

      if (error) throw error;

      // Update the selected variant or set as single content
      if (generatedContent?.variants) {
        const newVariants = [...generatedContent.variants];
        newVariants[selectedVariantIndex] = data;
        setGeneratedContent({ ...generatedContent, variants: newVariants });
      } else {
        setGeneratedContent(data);
      }
      
      toast({
        title: "Erfolgreich",
        description: "Text wurde mit SEO-Verbesserungen regeneriert",
      });
    } catch (error) {
      console.error("Regeneration error:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Regenerieren",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center justify-center gap-2 flex-1">
        {[1, 2, 3, 4, 5].map((step) => (
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
            {step < 5 && (
              <div
                className={`w-8 h-0.5 ${
                  step < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      {currentStep < 4 && (
        <Button
          variant="outline"
          size="sm"
          onClick={loadDemoData}
          className="ml-4 gap-2"
        >
          <TestTube className="h-4 w-4" />
          Test-Modus
        </Button>
      )}
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
                  <h3 className="text-lg font-semibold">3 kreative Varianten werden generiert...</h3>
                  <p className="text-sm text-muted-foreground">
                    Die KI erstellt 3 eigenständige Umsetzungen. Dies kann 60-90 Sekunden dauern.
                  </p>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-xs px-2 py-1 bg-primary/10 rounded">📋 A: Strukturiert & Umfassend</span>
                    <span className="text-xs px-2 py-1 bg-primary/10 rounded">🎯 B: Nutzenorientiert & Überzeugend</span>
                    <span className="text-xs px-2 py-1 bg-primary/10 rounded">💫 C: Emotional & Authentisch</span>
                  </div>
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
              promptVersion: formData.promptVersion,
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
              maxParagraphLength: formData.maxParagraphLength || "300",
              headingStructure: formData.headingStructure,
              includeIntro: formData.includeIntro,
              includeFAQ: formData.includeFAQ,
              pageGoal: formData.pageGoal,
              aiModel: formData.aiModel || "gemini-pro",
              complianceChecks: formData.complianceChecks,
            }}
            onUpdate={updateFormData}
            onNext={handleGenerateContent}
            onBack={() => setCurrentStep(2)}
            formOfAddress={formData.formOfAddress}
            targetAudience={formData.targetAudience}
            tonality={formData.tonality}
            promptVersion={formData.promptVersion}
            pageType={formData.pageType}
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
              promptVersion: formData.promptVersion,
              focusKeyword: formData.focusKeyword,
              pageType: formData.pageType,
            }}
            onSelectVariant={setSelectedVariantIndex}
            projectId={savedProjectId || undefined}
            formData={formData}
          />
        )}

        {currentStep === 5 && (
          <Step5AfterCheck
            generatedContent={getSelectedContent()}
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
            isRegenerating={isRegenerating}
          />
        )}
      </Card>
    </div>
  );
};
