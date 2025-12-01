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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PanelLeftClose, PanelLeft } from "lucide-react";
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
  promptVersion?: string;
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
  maxParagraphLength: string;
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
  const [allVariants, setAllVariants] = useState<any[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  
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
    promptVersion: 'v1-kompakt-seo',
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
      
      console.log('Raw response from edge function:', JSON.stringify(data).substring(0, 300));

      setGenerationProgress(100);
      
      // Handle both variant and single content responses
      if (data.variants && Array.isArray(data.variants)) {
        const validVariants = data.variants.filter((v: any) => v && v.seoText && v.seoText.length > 0);
        console.log('Received', data.variants.length, 'variants,', validVariants.length, 'valid');
        console.info('Received variants:', validVariants.length);
        
        if (validVariants.length === 0) {
          throw new Error('Keine gültigen Content-Varianten generiert');
        }
        
        setAllVariants(validVariants);
        setSelectedVariantIndex(0);
        
        toast({
          title: "Erfolg!",
          description: `${validVariants.length} Content-Varianten generiert`,
        });
      } else if (data.seoText) {
        console.log('Received single content, wrapping in array');
        setAllVariants([data]);
        setSelectedVariantIndex(0);
        
        toast({
          title: "Erfolgreich",
          description: "SEO-Inhalt wurde generiert",
        });
      } else {
        throw new Error('Ungültige Antwortstruktur vom Server');
      }
      
      setTimeout(() => {
        setCurrentStep(4);
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 500);
      
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Fehler beim Generieren des Inhalts",
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
          existingContent: getCurrentVariant(),
        },
      });

      if (error) throw error;
      
      // Update the current variant with refined content
      const updatedVariants = [...allVariants];
      updatedVariants[selectedVariantIndex] = data;
      setAllVariants(updatedVariants);
      
      toast({ title: "Erfolgreich", description: "Text wurde überarbeitet" });
    } catch (error) {
      console.error("Refinement error:", error);
      toast({ title: "Fehler", description: "Fehler beim Überarbeiten", variant: "destructive" });
    } finally {
      setIsRefining(false);
    }
  };

  const handleSectionRefine = async (options: { prompt: string; section: string; sectionLabel?: string }) => {
    setIsRefining(true);
    try {
      let refinementPrompt = options.prompt;
      
      // Add section-specific context to the prompt
      if (options.section !== 'full') {
        const sectionContext = options.sectionLabel || options.section;
        refinementPrompt = `WICHTIG: Überarbeite NUR den folgenden Abschnitt: "${sectionContext}". Lasse alle anderen Teile des Textes UNVERÄNDERT.\n\nAnweisung für den Abschnitt: ${options.prompt}`;
      }

      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...formData,
          refinementPrompt: refinementPrompt,
          refinementSection: options.section,
          existingContent: getCurrentVariant(),
        },
      });

      if (error) throw error;
      
      // Update the current variant
      const updatedVariants = [...allVariants];
      updatedVariants[selectedVariantIndex] = data;
      setAllVariants(updatedVariants);
      
      toast({ 
        title: "Erfolgreich", 
        description: options.section === 'full' 
          ? "Text wurde überarbeitet" 
          : `"${options.sectionLabel}" wurde überarbeitet`
      });
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
          existingContent: getCurrentVariant(),
        },
      });

      if (error) throw error;
      
      // Update the current variant
      const updatedVariants = [...allVariants];
      updatedVariants[selectedVariantIndex] = data;
      setAllVariants(updatedVariants);
      
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
          existingContent: getCurrentVariant(),
        },
      });

      if (error) throw error;
      
      // Update the current variant
      const updatedVariants = [...allVariants];
      updatedVariants[selectedVariantIndex] = data;
      setAllVariants(updatedVariants);
      
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

  const handleVariantSelect = (index: number) => {
    console.log('Variant selected:', index, 'Total variants:', allVariants.length);
    if (index >= 0 && index < allVariants.length) {
      setSelectedVariantIndex(index);
      console.log('Selected variant content preview:', allVariants[index]?.seoText?.substring(0, 100));
    } else {
      console.error('Invalid variant index:', index, 'Available:', allVariants.length);
    }
  };

  const getCurrentVariant = () => {
    if (allVariants.length === 0) {
      console.warn('No variants available');
      return null;
    }
    const variant = allVariants[selectedVariantIndex] || allVariants[0];
    console.log('Getting current variant, index:', selectedVariantIndex, 'Has content:', !!variant?.seoText);
    return variant;
  };

  const handleStepClick = (step: number) => {
    // Only allow going back or to current step
    if (step <= currentStep) {
      // Don't allow going to step 4 or 5 without content
      if ((step === 4 || step === 5) && allVariants.length === 0) {
        return;
      }
      setCurrentStep(step);
    }
  };

  const completedSteps = [
    formData.mainTopic ? 1 : 0,
    formData.targetAudience && formData.formOfAddress ? 2 : 0,
    formData.focusKeyword ? 3 : 0,
    allVariants.length > 0 ? 4 : 0,
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
        <div className="flex gap-6 h-[calc(100vh-220px)]">
          {/* Collapse Toggle Button - visible when panel is collapsed */}
          {isPanelCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPanelCollapsed(false)}
              className="flex-shrink-0 h-[calc(100vh-220px)] px-2 hover:bg-muted border-r-0 rounded-r-none"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Form Panel - Collapsible */}
          <Card 
            className={`overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
              isPanelCollapsed 
                ? 'w-0 min-w-0 opacity-0 p-0 border-0' 
                : 'w-full lg:w-1/2 lg:min-w-[400px] lg:max-w-[600px]'
            }`}
          >
            {!isPanelCollapsed && (
              <>
                <div className="flex items-center justify-between p-3 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Formular</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPanelCollapsed(true)}
                    className="h-8 px-2"
                  >
                    <PanelLeftClose className="h-4 w-4 mr-2" />
                    Einklappen
                  </Button>
                </div>
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
                          maxParagraphLength: formData.maxParagraphLength,
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
                        generatedContent={allVariants.length > 1 ? { variants: allVariants, selectedVariant: selectedVariantIndex } : allVariants[0]}
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
                          pageType: formData.pageType
                        }}
                        onSelectVariant={handleVariantSelect}
                        formData={formData}
                      />
                    )}

            {currentStep === 5 && (
              <Step5AfterCheck
                generatedContent={getCurrentVariant()}
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
                onRefine={handleSectionRefine}
                isRegenerating={isRegenerating}
                isRefining={isRefining}
              />
            )}
                  </div>
                </ScrollArea>
              </>
            )}
          </Card>

          {/* Output Panel - Expands when form is collapsed */}
          <div className={`h-full transition-all duration-300 ease-in-out ${
            isPanelCollapsed ? 'flex-1' : 'flex-1 lg:flex-1'
          }`}>
            {/* Show expand button when collapsed */}
            {isPanelCollapsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPanelCollapsed(false)}
                className="absolute left-4 top-4 z-10"
              >
                <PanelLeft className="h-4 w-4 mr-2" />
                Formular anzeigen
              </Button>
            )}
            <OutputPanel 
              content={getCurrentVariant()} 
              isLoading={isGenerating}
              onContentUpdate={(updatedContent) => {
                const updatedVariants = [...allVariants];
                updatedVariants[selectedVariantIndex] = updatedContent;
                setAllVariants(updatedVariants);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProVersion;
