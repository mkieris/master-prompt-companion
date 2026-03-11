import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface ContentCreatorProps {
  session: Session | null;
}

export interface ContentConfig {
  // Basic Info
  pageType: 'product' | 'category' | 'guide';
  brandName: string;
  mainTopic: string;

  // Keywords
  focusKeyword: string;
  secondaryKeywords: string[];

  // Audience & Tone
  targetAudience: 'b2b' | 'b2c' | 'mixed';
  formOfAddress: 'du' | 'sie';
  tonality: string;

  // Structure
  wordCount: string;
  includeIntro: boolean;
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

export interface GeneratedContent {
  seoText: string;
  title: string;
  metaDescription: string;
  faq?: Array<{ question: string; answer: string }>;
}

const defaultConfig: ContentConfig = {
  pageType: 'product',
  brandName: '',
  mainTopic: '',
  focusKeyword: '',
  secondaryKeywords: [],
  targetAudience: 'b2c',
  formOfAddress: 'du',
  tonality: 'balanced-mix',
  wordCount: '1500',
  includeIntro: true,
  includeFAQ: true,
  wQuestions: [],
  searchIntent: ['know', 'buy'],
  keywordDensity: 'normal',
  complianceChecks: {
    mdr: false,
    hwg: false,
    studies: false,
  },
  aiModel: 'gemini-flash',
  promptVersion: 'v9-master',
};

const ContentCreator = ({ session }: ContentCreatorProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrg } = useOrganization(session);
  const { analyze: analyzeSERP, isLoading: serpLoading, result: serpResult } = useSerpAnalysis();

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
  const [domainKnowledge, setDomainKnowledge] = useState<any>(null);

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
      .select('*')
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

    const result = await analyzeSERP(config.focusKeyword);
    if (result) {
      toast({
        title: "SERP-Analyse abgeschlossen",
        description: `${result.serpTerms.all.length} relevante Begriffe gefunden`,
      });
    }
  };

  const updateConfig = useCallback((updates: Partial<ContentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

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
    if (!config.focusKeyword.trim()) {
      toast({
        title: "Fokus-Keyword fehlt",
        description: "Bitte geben Sie ein Fokus-Keyword ein",
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
          // Include outline if available (for structured generation)
          outline: outline || null,
          // Legacy field for backwards compatibility
          additionalInfo: config.domainKnowledge?.ai_summary || '',
        },
      });

      if (error) throw error;

      // Handle response - use first variant if variants exist, otherwise use direct data
      const content = data.variants?.[0] || data;

      if (content?.seoText) {
        setEditedContent(content.seoText);
        setEditedTitle(content.title || '');
        setEditedMeta(content.metaDescription || '');

        toast({
          title: "Content generiert!",
          description: "SEO-optimierter Text wurde erstellt",
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
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

  // Calculate content score
  const contentScore = useMemo(() => {
    if (!editedContent) return 0;

    let score = 0;
    const text = editedContent.toLowerCase();
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    // Word count score (0-20)
    const targetWords = parseInt(config.wordCount) || 1500;
    const wordRatio = Math.min(wordCount / targetWords, 1.2);
    score += Math.round(wordRatio * 20);

    // Keyword presence (0-25)
    if (config.focusKeyword) {
      const keywordCount = (text.match(new RegExp(config.focusKeyword.toLowerCase(), 'g')) || []).length;
      const keywordDensity = (keywordCount / wordCount) * 100;
      if (keywordDensity >= 0.5 && keywordDensity <= 2.5) {
        score += 25;
      } else if (keywordDensity > 0) {
        score += 15;
      }
    }

    // SERP terms (0-30)
    if (config.serpTerms) {
      const mustHaveFound = config.serpTerms.mustHave.filter(t => text.includes(t.toLowerCase())).length;
      const shouldHaveFound = config.serpTerms.shouldHave.filter(t => text.includes(t.toLowerCase())).length;
      score += Math.round((mustHaveFound / Math.max(config.serpTerms.mustHave.length, 1)) * 20);
      score += Math.round((shouldHaveFound / Math.max(config.serpTerms.shouldHave.length, 1)) * 10);
    }

    // Structure score (0-15)
    const h1Count = (editedContent.match(/<h1/g) || []).length;
    const h2Count = (editedContent.match(/<h2/g) || []).length;
    if (h1Count === 1) score += 5;
    if (h2Count >= 3) score += 10;

    // Meta presence (0-10)
    if (editedTitle && editedTitle.length >= 30 && editedTitle.length <= 60) score += 5;
    if (editedMeta && editedMeta.length >= 120 && editedMeta.length <= 155) score += 5;

    return Math.min(score, 100);
  }, [editedContent, editedTitle, editedMeta, config]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Content Creator</h1>
            </div>
            {currentOrg && (
              <Badge variant="outline" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                {currentOrg.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {domainKnowledge && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                Brand Knowledge geladen
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(!isConfigOpen)}>
              {isConfigOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <div className="flex gap-4 h-[calc(100vh-120px)]">

          {/* LEFT: Config Panel */}
          {isConfigOpen && (
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
            />
          )}

          {/* CENTER: Content Editor */}
          <div className="flex-1 flex flex-col min-w-0">
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
            />
          </div>

          {/* RIGHT: Score Panel */}
          <ContentScorePanel
            score={contentScore}
            content={editedContent}
            title={editedTitle}
            metaDescription={editedMeta}
            config={config}
            serpResult={serpResult}
          />
        </div>
      </main>
    </div>
  );
};

export default ContentCreator;
