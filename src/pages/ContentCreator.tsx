import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { calculateContentScore } from "@/utils/content-score";
import { useDebug } from "@/contexts/DebugContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateContentConfig } from "@/lib/validation";
import { extractGeneratedContentFields } from "@/lib/extractGeneratedContent";
import { useOrganization } from "@/hooks/useOrganization";
import { useSerpAnalysis } from "@/hooks/useSerpAnalysis";
import { useDebounce } from "@/hooks/useDebounce";
import type { Session } from "@supabase/supabase-js";
import {
  Loader2,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Settings2,
  FileText,
  BarChart3,
  Copy,
  Download,
  Save,
  Wand2,
  Globe,
  Target,
  Zap,
  Crown,
  RefreshCw,
  Plus,
  X,
  Eye,
  Edit3,
  PanelLeftClose,
  PanelLeft,
  HelpCircle,
  TrendingUp,
  Building2,
  Shield
} from "lucide-react";
import { ContentScorePanel } from "@/components/content-creator/ContentScorePanel";
import { ConfigPanel } from "@/components/content-creator/ConfigPanel";
import { ContentEditor } from "@/components/content-creator/ContentEditor";
import { ComplianceBanner } from "@/components/content-creator/ComplianceBanner";
import type { ResearchUrl } from "@/components/content-creator/types";

interface ContentCreatorProps {
  session: Session | null;
}

export interface ContentConfig {
  // Basic Info
  pageType: 'product' | 'category' | 'guide';
  brandName: string;

  // Keywords
  focusKeyword: string;
  secondaryKeywords: string[];

  // Audience & Tone
  targetAudience: 'b2b' | 'b2c' | 'mixed';
  formOfAddress: 'du' | 'sie';
  tonality: string;

  // Structure
  wordCount: string;
  includeFAQ: boolean;
  wQuestions: string[];

  // SEO
  searchIntent: string[];
  keywordDensity: string;

  // Compliance
  complianceChecks: {
    mdr: boolean;
    hwg: boolean;
    studies: boolean;
  };

  // AI Settings
  aiModel: 'gemini-flash' | 'gemini-pro' | 'claude-sonnet';
  promptVersion: string;

  // SERP Data (auto-populated)
  serpContext?: string;
  serpTerms?: {
    mustHave: string[];
    shouldHave: string[];
    niceToHave: string[];
  };

  // Domain Knowledge (auto-loaded)
  domainKnowledge?: {
    company_name?: string;
    brand_voice?: string;
    unique_selling_points?: string[];
    ai_summary?: string;
  };
}

export interface ComplianceFinding {
  text: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  explanation: string;
  suggestion: string;
}

export interface ComplianceInfo {
  status: 'passed' | 'warning' | 'failed';
  score: number;
  hwg_status: 'passed' | 'warning' | 'failed';
  mdr_status: 'passed' | 'warning' | 'failed';
  findings: ComplianceFinding[];
  medical_claims: Array<{
    claim_text: string;
    claim_type: string;
    severity: string;
    suggestion: string;
  }>;
  critical_count: number;
  warning_count: number;
}

export interface GeneratedContent {
  seoText: string;
  title: string;
  metaDescription: string;
  faq?: Array<{ question: string; answer: string }>;
  compliance?: ComplianceInfo | null;
}

const defaultConfig: ContentConfig = {
  pageType: 'product',
  brandName: '',
  focusKeyword: '',
  secondaryKeywords: [],
  targetAudience: 'b2c',
  formOfAddress: 'du',
  tonality: 'consultant-mix',  // Default: Beratend
  wordCount: '1500',
  includeFAQ: true,
  wQuestions: [],
  searchIntent: ['know', 'buy'],
  keywordDensity: 'normal',
  complianceChecks: {
    mdr: true,  // Default ON für Healthcare
    hwg: true,  // Default ON für Healthcare
    studies: false,
  },
  aiModel: 'claude-sonnet',
  promptVersion: 'v13-priority-prompt',  // P1/P2/P3 Priority Prompt
};

const ContentCreator = ({ session }: ContentCreatorProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrg } = useOrganization(session);
  const { analyze: analyzeSERP, isLoading: serpLoading, result: serpResult } = useSerpAnalysis();
  const { log } = useDebug();

  // State
  const [config, setConfig] = useState<ContentConfig>(defaultConfig);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [outline, setOutline] = useState<any>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [editedMeta, setEditedMeta] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [domainKnowledge, setDomainKnowledge] = useState<any>(null);
  const [complianceInfo, setComplianceInfo] = useState<ComplianceInfo | null>(null);
  const [promptInfo, setPromptInfo] = useState<import("@/components/content-creator/ContentEditor").PromptInfo | null>(null);
  const [researchUrls, setResearchUrls] = useState<ResearchUrl[]>([]);

  // Debounce keyword for auto SERP
  const debouncedKeyword = useDebounce(config.focusKeyword, 1500);

  // Redirect if not authenticated
  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  // Load domain knowledge on org change
  useEffect(() => {
    if (currentOrg) {
      loadDomainKnowledge();
    }
  }, [currentOrg]);

  // Auto-trigger SERP analysis when keyword changes
  useEffect(() => {
    if (debouncedKeyword && debouncedKeyword.length > 2 && !serpResult) {
      handleSerpAnalysis();
    }
  }, [debouncedKeyword]);

  // Update config with SERP results
  useEffect(() => {
    if (serpResult) {
      setConfig(prev => ({
        ...prev,
        serpContext: serpResult.promptContext,
        serpTerms: serpResult.serpTerms,
      }));
    }
  }, [serpResult]);

  const loadDomainKnowledge = async () => {
    if (!currentOrg) return;

    const { data } = await supabase
      .from('domain_knowledge')
      .select('organization_id, crawl_status, company_name, brand_voice, unique_selling_points, ai_summary')
      .eq('organization_id', currentOrg.id)
      .eq('crawl_status', 'completed')
      .maybeSingle();

    if (data) {
      setDomainKnowledge(data);
      setConfig(prev => ({
        ...prev,
        domainKnowledge: {
          company_name: data.company_name,
          brand_voice: data.brand_voice,
          unique_selling_points: Array.isArray(data.unique_selling_points) ? data.unique_selling_points as string[] : [],
          ai_summary: data.ai_summary,
        },
        brandName: prev.brandName || data.company_name || '',
      }));
    }
  };

  const handleSerpAnalysis = async () => {
    if (!config.focusKeyword.trim()) return;

    log('api', 'SERP Analysis gestartet', { keyword: config.focusKeyword });
    try {
      const result = await analyzeSERP(config.focusKeyword);
      if (result) {
        log('response', 'SERP Analysis erfolgreich', {
          termCount: result.serpTerms.all.length,
          mustHave: result.serpTerms.mustHave?.length,
          competitors: result.competitors?.length,
        });
        toast({
          title: "SERP-Analyse abgeschlossen",
          description: `${result.serpTerms.all.length} relevante Begriffe gefunden`,
        });
      } else {
        log('error', 'SERP Analysis: Kein Ergebnis', { keyword: config.focusKeyword });
      }
    } catch (err) {
      log('error', 'SERP Analysis fehlgeschlagen', {
        error: err instanceof Error ? err.message : String(err),
        keyword: config.focusKeyword,
      });
      throw err;
    }
  };

  const updateConfig = useCallback((updates: Partial<ContentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // ═══ RESEARCH URLs HANDLERS ═══
  const handleAddResearchUrl = (url: string) => {
    if (researchUrls.length >= 3) return;

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Check for duplicates
    if (researchUrls.some(r => r.url === normalizedUrl)) {
      toast({
        title: "URL bereits vorhanden",
        variant: "destructive",
      });
      return;
    }

    setResearchUrls(prev => [...prev, { url: normalizedUrl, status: 'pending' }]);
  };

  const handleRemoveResearchUrl = (index: number) => {
    setResearchUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleCrawlResearchUrl = async (index: number) => {
    const researchUrl = researchUrls[index];
    if (!researchUrl || researchUrl.status === 'crawling') return;

    // Update status to crawling
    setResearchUrls(prev => prev.map((r, i) =>
      i === index ? { ...r, status: 'crawling' as const } : r
    ));

    try {
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { url: researchUrl.url, mode: 'single' },
      });

      if (error) throw error;

      setResearchUrls(prev => prev.map((r, i) =>
        i === index ? {
          ...r,
          status: 'completed' as const,
          content: data.content?.substring(0, 5000) || data.summary || '',
          title: data.title || '',
        } : r
      ));

      toast({
        title: "URL gecrawlt",
        description: `Inhalte von "${data.title || researchUrl.url}" geladen`,
      });
    } catch (error) {
      console.error('Crawl error:', error);
      setResearchUrls(prev => prev.map((r, i) =>
        i === index ? {
          ...r,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Crawling fehlgeschlagen',
        } : r
      ));

      toast({
        title: "Crawling fehlgeschlagen",
        description: error instanceof Error ? error.message : "URL konnte nicht geladen werden",
        variant: "destructive",
      });
    }
  };

  const handleGenerateOutline = async () => {
    if (!config.focusKeyword.trim()) {
      toast({
        title: "Fokus-Keyword fehlt",
        description: "Bitte geben Sie ein Fokus-Keyword ein",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingOutline(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          mode: 'generate-outline',
          focusKeyword: config.focusKeyword,
          pageType: config.pageType,
          targetAudience: config.targetAudience,
          wordCount: config.wordCount,
          serpTermsStructured: config.serpTerms ? {
            mustHave: config.serpTerms.mustHave || [],
            shouldHave: config.serpTerms.shouldHave || [],
          } : null,
        },
      });

      if (error) throw error;

      if (data.outline) {
        setOutline(data.outline);
        toast({
          title: "Outline generiert!",
          description: "Struktur wurde erstellt. Prüfen Sie die Gliederung.",
        });
      }
    } catch (error) {
      console.error("Outline error:", error);
      toast({
        title: "Fehler",
        description: "Outline konnte nicht erstellt werden",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleGenerate = async () => {
    log('api', 'Content Generation gestartet', {
      model: config.aiModel,
      keyword: config.focusKeyword,
      promptVersion: config.promptVersion,
      wordCount: config.wordCount,
    });

    // Validate inputs before sending to API
    const validation = validateContentConfig({
      focusKeyword: config.focusKeyword,
      brandName: config.brandName,
      secondaryKeywords: config.secondaryKeywords,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast({
        title: "Eingabefehler",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...config,
          // Organization ID for analytics
          organizationId: currentOrg?.id || null,
          // Include SERP context (text summary)
          serpContext: config.serpContext,
          // Include structured SERP terms for weighted integration
          serpTermsStructured: config.serpTerms ? {
            mustHave: config.serpTerms.mustHave || [],
            shouldHave: config.serpTerms.shouldHave || [],
            niceToHave: config.serpTerms.niceToHave || [],
          } : null,
          // Include complete domain knowledge
          domainKnowledge: config.domainKnowledge ? {
            companyName: config.domainKnowledge.company_name || '',
            brandVoice: config.domainKnowledge.brand_voice || '',
            uniqueSellingPoints: config.domainKnowledge.unique_selling_points || [],
            aiSummary: config.domainKnowledge.ai_summary || '',
          } : null,
          // Include management info (CEO quotes, philosophy)
          managementInfo: domainKnowledge?.management_info || null,
          // Include crawled research content
          researchContent: researchUrls
            .filter(r => r.status === 'completed' && r.content)
            .map(r => ({
              url: r.url,
              title: r.title || '',
              content: r.content || '',
            })),
          // Include outline if available (for structured generation)
          outline: outline || null,
          // Legacy field for backwards compatibility
          additionalInfo: config.domainKnowledge?.ai_summary || '',
        },
      });

      if (error) {
        log('error', 'Edge Function Fehler', {
          message: error.message,
          name: error.name,
          context: error.context,
          status: error.status,
        });
        throw error;
      }

      log('response', 'Edge Function Antwort erhalten', {
        dataType: typeof data,
        hasData: !!data,
        keys: data ? Object.keys(data) : [],
        hasSeoText: !!data?.seoText,
        hasVariants: !!data?.variants,
        hasError: !!data?.error,
        rawError: data?.error,
        promptInfo: data?._prompts ? {
          model: data._prompts.model,
          promptVersion: data._prompts.promptVersion,
        } : 'nicht vorhanden',
      });

      const { parsed: parsedData, seoText, title, metaDescription } = extractGeneratedContentFields(data);
      const parsedResponse = (parsedData && typeof parsedData === 'object' ? parsedData : {}) as Record<string, any>;

      log('response', 'Content parsed', {
        hasSeoText: !!seoText,
        seoTextLength: seoText?.length,
        titleLength: title?.length,
        metaLength: metaDescription?.length,
        dataType: typeof data,
        parsedDataType: typeof parsedData,
        parsedDataKeys: parsedData ? Object.keys(parsedData) : [],
      });

      if (seoText) {
        setEditedContent(seoText);
        setEditedTitle(title);
        setEditedMeta(metaDescription);

        // Extract prompt debug info from response
        if (parsedResponse._prompts) {
          setPromptInfo(parsedResponse._prompts);
        }

        // Extract compliance data from response
        const compliance = parsedResponse.compliance || parsedResponse.content?.compliance || null;
        setComplianceInfo(compliance);

        if (compliance && compliance.status === 'failed') {
          toast({
            title: "Content generiert – Compliance-Probleme!",
            description: `${compliance.critical_count} kritische Verstöße gefunden (Score: ${compliance.score}/100)`,
            variant: "destructive",
          });
        } else if (compliance && compliance.status === 'warning') {
          toast({
            title: "Content generiert – Hinweise beachten",
            description: `${compliance.warning_count} Warnungen (Compliance-Score: ${compliance.score}/100)`,
          });
        } else {
          toast({
            title: "Content generiert!",
            description: compliance ? `Compliance-Score: ${compliance.score}/100` : "SEO-optimierter Text wurde erstellt",
          });
        }
      } else {
        // Fallback: if we got data but no seoText, log for debugging
        console.error('No seoText found in response:', parsedData);
        toast({
          title: "Warnung",
          description: "Content generiert, aber Format unerwartet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
      log('error', 'Content Generation fehlgeschlagen', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      });
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Generierung fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (prompt: string) => {
    if (!editedContent || !prompt.trim()) return;

    setIsRefining(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          ...config,
          refinementPrompt: prompt,
          existingContent: {
            seoText: editedContent,
            title: editedTitle,
            metaDescription: editedMeta,
          },
        },
      });

      if (error) throw error;

      if (data.seoText) {
        setEditedContent(data.seoText);
        setEditedTitle(data.title || editedTitle);
        setEditedMeta(data.metaDescription || editedMeta);

        toast({
          title: "Text überarbeitet",
          description: "Änderungen wurden übernommen",
        });
      }
    } catch (error) {
      console.error("Refinement error:", error);
      toast({
        title: "Fehler",
        description: "Überarbeitung fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  };

  // Save project to database
  const handleSave = async () => {
    if (!editedContent || !session?.user?.id || !currentOrg) {
      toast({
        title: "Speichern nicht möglich",
        description: "Kein Content vorhanden oder nicht eingeloggt",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const projectData = {
        created_by: session.user.id,
        organization_id: currentOrg.id,
        title: editedTitle || config.focusKeyword || 'Unbenanntes Projekt',
        focus_keyword: config.focusKeyword,
        page_type: config.pageType,
        form_data: {
          ...config,
          serpContext: config.serpContext,
          serpTerms: config.serpTerms,
        },
        generated_content: {
          seoText: editedContent,
          title: editedTitle,
          metaDescription: editedMeta,
        },
        seo_score: contentScore,
        status: 'draft',
      };

      const { error } = await supabase
        .from('content_projects')
        .insert(projectData as any);

      if (error) throw error;

      toast({
        title: "Gespeichert",
        description: "Projekt wurde erfolgreich gespeichert",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Fehler beim Speichern",
        description: "Projekt konnte nicht gespeichert werden",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate content score using extracted utility
  const contentScore = useMemo(() => {
    return calculateContentScore({
      content: editedContent,
      title: editedTitle,
      metaDescription: editedMeta,
      focusKeyword: config.focusKeyword,
      targetWordCount: parseInt(config.wordCount) || 1500,
      serpTerms: config.serpTerms,
    }).total;
  }, [editedContent, editedTitle, editedMeta, config]);

  if (!session) return null;

  return (
    <TooltipProvider>
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Modernized */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 flex-shrink-0">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold leading-none">Content Creator</h1>
                <span className="text-[10px] text-muted-foreground">SEO-optimierte Texte erstellen</span>
              </div>
            </div>
            {currentOrg && (
              <Badge variant="outline" className="text-[10px] ml-2">
                <Building2 className="h-3 w-3 mr-1" />
                {currentOrg.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status Badges */}
            {domainKnowledge && (
              <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Brand Knowledge
              </Badge>
            )}
            {serpResult && (
              <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                SERP aktiv
              </Badge>
            )}

            {/* Save Button */}
            {editedContent && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !editedContent}
                    className="h-8 px-3 gap-1.5"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span className="text-xs">Speichern</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Projekt speichern
                </TooltipContent>
              </Tooltip>
            )}

            {/* Toggle Config Panel */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="h-8 w-8 p-0"
                >
                  {isConfigOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isConfigOpen ? 'Konfiguration ausblenden' : 'Konfiguration einblenden'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Main Content - Resizable Panels */}
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* LEFT: Config Panel */}
          {isConfigOpen && (
            <>
              <ResizablePanel
                defaultSize={22}
                minSize={18}
                maxSize={30}
                className="min-w-[280px] overflow-hidden"
              >
                <ConfigPanel
                  config={config}
                  onConfigChange={updateConfig}
                  serpResult={serpResult}
                  serpLoading={serpLoading}
                  onSerpAnalyze={handleSerpAnalysis}
                  domainKnowledge={domainKnowledge}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  onGenerateOutline={handleGenerateOutline}
                  isGeneratingOutline={isGeneratingOutline}
                  outline={outline}
                  onClearOutline={() => setOutline(null)}
                  researchUrls={researchUrls}
                  onAddResearchUrl={handleAddResearchUrl}
                  onRemoveResearchUrl={handleRemoveResearchUrl}
                  onCrawlResearchUrl={handleCrawlResearchUrl}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* CENTER: Content Editor */}
          <ResizablePanel defaultSize={isConfigOpen ? 56 : 78} minSize={40}>
            {complianceInfo && (
              <ComplianceBanner compliance={complianceInfo} />
            )}
            <ContentEditor
              content={editedContent}
              title={editedTitle}
              metaDescription={editedMeta}
              onContentChange={setEditedContent}
              onTitleChange={setEditedTitle}
              onMetaChange={setEditedMeta}
              isEditing={isEditing}
              onEditingChange={setIsEditing}
              onRefine={handleRefine}
              isRefining={isRefining}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              hasContent={!!editedContent}
              promptInfo={promptInfo}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* RIGHT: Score Panel */}
          <ResizablePanel defaultSize={22} minSize={18} maxSize={30} className="min-w-[260px]">
            <ContentScorePanel
              score={contentScore}
              content={editedContent}
              title={editedTitle}
              metaDescription={editedMeta}
              config={config}
              serpResult={serpResult}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
    </TooltipProvider>
  );
};

export default ContentCreator;
