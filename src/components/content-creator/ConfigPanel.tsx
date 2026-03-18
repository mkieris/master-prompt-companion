import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Settings2,
  Target,
  Zap,
  Crown,
  Plus,
  X,
  Globe,
  Building2,
  Shield,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  List,
  FileText,
  Circle,
  ArrowRight,
  LayoutTemplate,
  Users,
  Type,
  Brain
} from "lucide-react";
import type { ContentConfig } from "@/pages/ContentCreator";
import type { SerpResult, DomainKnowledge, Outline, ResearchUrl } from "./types";

interface ConfigPanelProps {
  config: ContentConfig;
  onConfigChange: (updates: Partial<ContentConfig>) => void;
  serpResult?: SerpResult;
  serpLoading: boolean;
  onSerpAnalyze: () => void;
  domainKnowledge?: DomainKnowledge;
  onGenerate: () => void;
  isGenerating: boolean;
  onGenerateOutline?: () => void;
  isGeneratingOutline?: boolean;
  outline?: Outline | null;
  onClearOutline?: () => void;
  // Research URLs
  researchUrls?: ResearchUrl[];
  onAddResearchUrl?: (url: string) => void;
  onRemoveResearchUrl?: (index: number) => void;
  onCrawlResearchUrl?: (index: number) => void;
}

export const ConfigPanel = ({
  config,
  onConfigChange,
  serpResult,
  serpLoading,
  onSerpAnalyze,
  domainKnowledge,
  onGenerate,
  isGenerating,
  onGenerateOutline,
  isGeneratingOutline,
  outline,
  onClearOutline,
  researchUrls = [],
  onAddResearchUrl,
  onRemoveResearchUrl,
  onCrawlResearchUrl,
}: ConfigPanelProps) => {
  const [keywordInput, setKeywordInput] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [researchUrlInput, setResearchUrlInput] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'keyword' | 'settings' | 'advanced'>('keyword');

  const handleAddResearchUrl = () => {
    if (researchUrlInput.trim() && researchUrls.length < 3 && onAddResearchUrl) {
      onAddResearchUrl(researchUrlInput.trim());
      setResearchUrlInput("");
    }
  };

  // Calculate workflow progress
  const workflowProgress = useMemo(() => {
    let steps = {
      keyword: false,
      serp: false,
      outline: false,
      ready: false,
    };

    if (config.focusKeyword.trim().length > 2) steps.keyword = true;
    if (serpResult) steps.serp = true;
    if (outline) steps.outline = true;
    if (steps.keyword && steps.serp) steps.ready = true;

    const completed = Object.values(steps).filter(Boolean).length;
    return { steps, progress: (completed / 4) * 100 };
  }, [config.focusKeyword, serpResult, outline]);

  const addSecondaryKeyword = () => {
    if (keywordInput.trim() && !config.secondaryKeywords.includes(keywordInput.trim())) {
      onConfigChange({
        secondaryKeywords: [...config.secondaryKeywords, keywordInput.trim()],
      });
      setKeywordInput("");
    }
  };

  const removeSecondaryKeyword = (keyword: string) => {
    onConfigChange({
      secondaryKeywords: config.secondaryKeywords.filter(k => k !== keyword),
    });
  };

  const addQuestion = () => {
    if (questionInput.trim() && !config.wQuestions.includes(questionInput.trim())) {
      onConfigChange({
        wQuestions: [...config.wQuestions, questionInput.trim()],
      });
      setQuestionInput("");
    }
  };

  const removeQuestion = (question: string) => {
    onConfigChange({
      wQuestions: config.wQuestions.filter(q => q !== question),
    });
  };

  const addSerpKeywords = () => {
    if (!serpResult) return;
    const newKeywords = [
      ...serpResult.serpTerms.mustHave,
      ...serpResult.serpTerms.shouldHave.slice(0, 5),
    ].filter((k: string) => !config.secondaryKeywords.includes(k));

    onConfigChange({
      secondaryKeywords: [...config.secondaryKeywords, ...newKeywords],
    });
  };

  const addSerpQuestions = () => {
    if (!serpResult) return;
    const newQuestions = serpResult.questions.peopleAlsoAsk
      .slice(0, 5)
      .filter((q: string) => !config.wQuestions.includes(q));

    onConfigChange({
      wQuestions: [...config.wQuestions, ...newQuestions],
    });
  };

  // Workflow step component
  const WorkflowStep = ({
    step,
    label,
    isComplete,
    isActive,
    onClick
  }: {
    step: number;
    label: string;
    isComplete: boolean;
    isActive: boolean;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 text-xs transition-all ${
        isActive ? 'text-primary font-medium' :
        isComplete ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
      } ${onClick ? 'hover:text-primary cursor-pointer' : ''}`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
        isComplete ? 'bg-green-500 text-white' :
        isActive ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
        'bg-muted text-muted-foreground'
      }`}>
        {isComplete ? <CheckCircle2 className="h-3 w-3" /> : step}
      </div>
      <span>{label}</span>
    </button>
  );

  return (
    <Card className="w-full max-w-full flex-shrink-0 flex flex-col h-full overflow-hidden border-r-0 rounded-r-none">
      {/* Header with Workflow Progress */}
      <CardHeader className="pb-2 border-b bg-muted/30">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Konfiguration
          </span>
          <Badge variant={workflowProgress.progress >= 75 ? "default" : "secondary"} className="text-xs">
            {Math.round(workflowProgress.progress)}% bereit
          </Badge>
        </CardTitle>

        {/* Workflow Steps Indicator */}
        <div className="flex items-center justify-between pt-3 pb-1">
          <WorkflowStep
            step={1}
            label="Keyword"
            isComplete={workflowProgress.steps.keyword}
            isActive={activeSection === 'keyword' && !workflowProgress.steps.keyword}
            onClick={() => setActiveSection('keyword')}
          />
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <WorkflowStep
            step={2}
            label="SERP"
            isComplete={workflowProgress.steps.serp}
            isActive={workflowProgress.steps.keyword && !workflowProgress.steps.serp}
          />
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <WorkflowStep
            step={3}
            label="Outline"
            isComplete={workflowProgress.steps.outline}
            isActive={workflowProgress.steps.serp && !workflowProgress.steps.outline}
          />
        </div>
        <Progress value={workflowProgress.progress} className="h-1 mt-1" />
      </CardHeader>

      <ScrollArea className="flex-1 w-full">
        <CardContent className="p-4 space-y-4 overflow-hidden">
          {/* Domain Knowledge Badge - Compact */}
          {domainKnowledge && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-2.5 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-green-700 dark:text-green-400 truncate">
                  {domainKnowledge.company_name}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {domainKnowledge.managementInfo ? 'Brand Voice + Management-Info' : 'Brand Voice aktiv'}
                </p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto flex-shrink-0" />
            </div>
          )}

          {/* Research URLs - NEW */}
          {onAddResearchUrl && (
            <div className="space-y-2 overflow-hidden">
              <Label className="text-xs flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                Research URLs (max. 3)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">
                        Crawle bis zu 3 URLs (z.B. Produktseiten, Pressemitteilungen)
                        um deren Inhalte in den generierten Text einzubeziehen.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>

              {/* URL Input */}
              {researchUrls.length < 3 && (
                <div className="flex gap-1.5 min-w-0">
                  <Input
                    value={researchUrlInput}
                    onChange={(e) => setResearchUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResearchUrl())}
                    placeholder="https://example.com/page"
                    className="flex-1 h-8 text-xs min-w-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddResearchUrl}
                    className="h-8 w-8"
                    disabled={!researchUrlInput.trim()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* URL List */}
              {researchUrls.length > 0 && (
                <div className="space-y-1.5 overflow-hidden">
                  {researchUrls.map((researchUrl, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-[11px] rounded-lg p-2 border min-w-0 overflow-hidden ${
                        researchUrl.status === 'completed'
                          ? 'bg-green-500/10 border-green-500/30'
                          : researchUrl.status === 'error'
                          ? 'bg-red-500/10 border-red-500/30'
                          : researchUrl.status === 'crawling'
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      {/* Status Icon */}
                      {researchUrl.status === 'crawling' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 flex-shrink-0" />
                      ) : researchUrl.status === 'completed' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      ) : researchUrl.status === 'error' ? (
                        <X className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}

                      {/* URL & Title */}
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">
                          {researchUrl.title || new URL(researchUrl.url).hostname}
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {researchUrl.url}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {researchUrl.status === 'pending' && onCrawlResearchUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onCrawlResearchUrl(index)}
                            className="h-6 w-6"
                          >
                            <Search className="h-3 w-3" />
                          </Button>
                        )}
                        {onRemoveResearchUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveResearchUrl(index)}
                            className="h-6 w-6 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Crawled Content Summary */}
              {researchUrls.some(r => r.status === 'completed') && (
                <div className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {researchUrls.filter(r => r.status === 'completed').length} URL(s) gecrawlt - wird in Content integriert
                </div>
              )}
            </div>
          )}

          {/* Focus Keyword with SERP - Enhanced */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="focusKeyword" className="flex items-center gap-2 text-sm font-medium">
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-primary" />
                </div>
                Fokus-Keyword
              </Label>
              {config.focusKeyword.trim() && (
                <Badge variant="outline" className="text-[10px]">
                  {config.focusKeyword.length} Zeichen
                </Badge>
              )}
            </div>
            <div className="relative">
              <Input
                id="focusKeyword"
                value={config.focusKeyword}
                onChange={(e) => onConfigChange({ focusKeyword: e.target.value })}
                placeholder="z.B. Kinesio Tape"
                className="pr-10 h-11 text-base font-medium"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onSerpAnalyze}
                      disabled={serpLoading || !config.focusKeyword.trim()}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    >
                      {serpLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium">SERP-Analyse starten</p>
                    <p className="text-xs text-muted-foreground">
                      Analysiert Top 10 Google-Ergebnisse und extrahiert wichtige Begriffe.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {/* SERP Loading State */}
            {serpLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Analysiere Google SERPs...</span>
              </div>
            )}

            {/* SERP Results - Enhanced */}
            {serpResult && (
              <div className="bg-gradient-to-b from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-blue-500/10 border-b border-blue-500/20">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    SERP Intelligence
                  </span>
                  <Badge className="text-[10px] bg-blue-600">
                    {serpResult.serpTerms.all.length} Begriffe
                  </Badge>
                </div>

                <div className="p-3 space-y-3">
                  {/* Must-Have Terms */}
                  {serpResult.serpTerms.mustHave.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-red-600 dark:text-red-400">
                          Pflicht-Begriffe
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({serpResult.serpTerms.mustHave.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {serpResult.serpTerms.mustHave.slice(0, 6).map((term: string) => (
                          <Badge
                            key={term}
                            variant="outline"
                            className="text-[10px] cursor-pointer border-red-300 dark:border-red-700 hover:bg-red-500/10 transition-colors"
                            onClick={() => {
                              if (!config.secondaryKeywords.includes(term)) {
                                onConfigChange({
                                  secondaryKeywords: [...config.secondaryKeywords, term],
                                });
                              }
                            }}
                          >
                            <Plus className="h-2 w-2 mr-0.5 text-red-500" />
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Should-Have Terms */}
                  {serpResult.serpTerms.shouldHave.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
                          Empfohlen
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({serpResult.serpTerms.shouldHave.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {serpResult.serpTerms.shouldHave.slice(0, 5).map((term: string) => (
                          <Badge
                            key={term}
                            variant="outline"
                            className="text-[10px] cursor-pointer border-amber-300 dark:border-amber-700 hover:bg-amber-500/10 transition-colors"
                            onClick={() => {
                              if (!config.secondaryKeywords.includes(term)) {
                                onConfigChange({
                                  secondaryKeywords: [...config.secondaryKeywords, term],
                                });
                              }
                            }}
                          >
                            <Plus className="h-2 w-2 mr-0.5 text-amber-500" />
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <Separator className="bg-blue-200/50 dark:bg-blue-800/50" />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-6 px-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                      onClick={addSerpKeywords}
                    >
                      <Plus className="h-2.5 w-2.5 mr-1" />
                      Alle hinzufugen
                    </Button>
                    {serpResult.questions?.peopleAlsoAsk?.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-6 px-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                        onClick={addSerpQuestions}
                      >
                        <HelpCircle className="h-2.5 w-2.5 mr-1" />
                        PAA Fragen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Content Settings - Grouped */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
              <span className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                Content-Einstellungen
              </span>
              <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* Page Type - Visual Cards */}
              <div className="space-y-2">
                <Label className="text-xs">Seitentyp</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'product', label: 'Produkt', icon: '🛍️' },
                    { value: 'category', label: 'Kategorie', icon: '📁' },
                    { value: 'guide', label: 'Ratgeber', icon: '📖' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => onConfigChange({ pageType: type.value as any })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-center ${
                        config.pageType === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-[10px] font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Count - Slider Style */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Textlange</Label>
                  <Badge variant="outline" className="text-[10px]">
                    {config.wordCount} Worter
                  </Badge>
                </div>
                <Select
                  value={config.wordCount}
                  onValueChange={(value) => onConfigChange({ wordCount: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">Kurz (ca. 500)</SelectItem>
                    <SelectItem value="800">Kompakt (ca. 800)</SelectItem>
                    <SelectItem value="1000">Mittel (ca. 1000)</SelectItem>
                    <SelectItem value="1500">Standard (ca. 1500)</SelectItem>
                    <SelectItem value="2000">Umfangreich (ca. 2000)</SelectItem>
                    <SelectItem value="3000">Ausfuhrlich (ca. 3000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Secondary Keywords */}
              <div className="space-y-2">
                <Label className="text-xs">Sekundare Keywords</Label>
                <div className="flex gap-1.5">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSecondaryKeyword())}
                    placeholder="Keyword hinzufugen"
                    className="flex-1 h-8 text-xs"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addSecondaryKeyword} className="h-8 w-8">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {config.secondaryKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {config.secondaryKeywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-[10px] pr-1 h-5">
                        {keyword}
                        <button
                          onClick={() => removeSecondaryKeyword(keyword)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Audience & Tone - Grouped */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Zielgruppe & Tonalitat
              </span>
              <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* Target Audience - Visual */}
              <div className="space-y-2">
                <Label className="text-xs">Zielgruppe</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'b2b', label: 'B2B', desc: 'Geschaftskunden' },
                    { value: 'b2c', label: 'B2C', desc: 'Endkunden' },
                    { value: 'mixed', label: 'Mixed', desc: 'Beide' },
                  ].map((audience) => (
                    <button
                      key={audience.value}
                      type="button"
                      onClick={() => onConfigChange({ targetAudience: audience.value as any })}
                      className={`p-2 rounded-lg border-2 transition-all text-center ${
                        config.targetAudience === audience.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xs font-bold block">{audience.label}</span>
                      <span className="text-[9px] text-muted-foreground">{audience.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form of Address */}
              <div className="space-y-2">
                <Label className="text-xs">Anredeform</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'du', label: 'Du (informell)' },
                    { value: 'sie', label: 'Sie (formell)' },
                  ].map((form) => (
                    <button
                      key={form.value}
                      type="button"
                      onClick={() => onConfigChange({ formOfAddress: form.value as any })}
                      className={`flex-1 p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                        config.formOfAddress === form.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {form.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tonality */}
              <div className="space-y-2">
                <Label className="text-xs">Tonalitat</Label>
                <Select
                  value={config.tonality}
                  onValueChange={(value) => onConfigChange({ tonality: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expert-mix">Expertenmix (70/20/10)</SelectItem>
                    <SelectItem value="consultant-mix">Beratermix (40/40/20)</SelectItem>
                    <SelectItem value="storytelling-mix">Storytelling-Mix (30/30/40)</SelectItem>
                    <SelectItem value="conversion-mix">Conversion-Mix (20/60/20)</SelectItem>
                    <SelectItem value="balanced-mix">Balanced-Mix (33/33/33)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* AI Settings - Grouped (Default OPEN for visibility) */}
          <Collapsible defaultOpen={true}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
              <span className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                AI-Einstellungen
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-green-500 text-green-600">v12</Badge>
              </span>
              <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* AI Model - Visual Cards */}
              <div className="space-y-2">
                <Label className="text-xs">AI-Modell</Label>
                <div className="space-y-1.5">
                  {[
                    { value: 'gemini-flash', label: 'Gemini Flash', desc: 'Schnell & kosteneffizient', icon: Zap, color: 'text-yellow-500', badge: null },
                    { value: 'gemini-pro', label: 'Gemini Pro', desc: 'Bessere Qualitat', icon: Sparkles, color: 'text-blue-500', badge: null },
                    { value: 'claude-sonnet', label: 'Claude Sonnet', desc: 'Premium Qualitat', icon: Crown, color: 'text-purple-500', badge: 'PRO' },
                  ].map((model) => (
                    <button
                      key={model.value}
                      type="button"
                      onClick={() => onConfigChange({ aiModel: model.value as any })}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all ${
                        config.aiModel === model.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <model.icon className={`h-4 w-4 ${model.color}`} />
                      <div className="flex-1 text-left">
                        <span className="text-xs font-medium block">{model.label}</span>
                        <span className="text-[10px] text-muted-foreground">{model.desc}</span>
                      </div>
                      {model.badge && (
                        <Badge variant="default" className="text-[9px] h-4 px-1.5">
                          {model.badge}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Version */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2">
                  Prompt-Version
                  <Badge variant="default" className="text-[9px] h-4 px-1.5 bg-green-600">Healthcare</Badge>
                </Label>
                <Select
                  value={config.promptVersion}
                  onValueChange={(value) => onConfigChange({ promptVersion: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v13-priority-prompt">v13: Priority Prompt (P1/P2/P3)</SelectItem>
                    <SelectItem value="v12-healthcare-master">v12: Healthcare Master (Legacy)</SelectItem>
                    <SelectItem value="v11-surfer-style">v11: Surfer-Style</SelectItem>
                    <SelectItem value="v10-geo-optimized">v10: GEO-Optimized</SelectItem>
                    <SelectItem value="v9-master">v9: Master (Alt)</SelectItem>
                    <SelectItem value="v8-natural-seo">v8: Naturlich SEO</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  v13 = klare Prioritaten P1/P2/P3
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Advanced Settings */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                Erweiterte Optionen
              </span>
              <ChevronRight className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* W-Questions */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  W-Fragen fur FAQ
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                    placeholder="Frage hinzufugen"
                    className="flex-1 h-8 text-xs"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addQuestion} className="h-8 w-8">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {config.wQuestions.length > 0 && (
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {config.wQuestions.map((question) => (
                      <div key={question} className="flex items-center justify-between text-[10px] bg-muted/50 rounded px-2 py-1.5">
                        <span className="truncate flex-1">{question}</span>
                        <button onClick={() => removeQuestion(question)} className="ml-2 hover:text-destructive">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Structure Options */}
              <div className="space-y-2">
                <Label className="text-xs">Struktur-Elemente</Label>
                <div className="flex gap-2">
                  <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    config.includeFAQ ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}>
                    <Checkbox
                      id="includeFAQ"
                      checked={config.includeFAQ}
                      onCheckedChange={(checked) => onConfigChange({ includeFAQ: checked as boolean })}
                    />
                    <span className="text-xs">FAQ-Bereich</span>
                  </label>
                </div>
              </div>

              {/* Compliance - Healthcare Specific */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Compliance (Healthcare)
                </Label>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2 space-y-2">
                  {[
                    { id: 'mdr', label: 'MDR/MPDG', desc: 'Medizinprodukte-Verordnung' },
                    { id: 'hwg', label: 'HWG', desc: 'Heilmittelwerbegesetz' },
                    { id: 'studies', label: 'Studien', desc: 'Wissenschaftliche Belege' },
                  ].map((item) => (
                    <label key={item.id} className="flex items-start gap-2 cursor-pointer group">
                      <Checkbox
                        id={item.id}
                        checked={config.complianceChecks[item.id as keyof typeof config.complianceChecks]}
                        onCheckedChange={(checked) =>
                          onConfigChange({
                            complianceChecks: { ...config.complianceChecks, [item.id]: checked as boolean },
                          })
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-medium group-hover:text-primary transition-colors">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground block">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </ScrollArea>

      {/* Outline Section - Enhanced */}
      {outline && (
        <div className="p-3 border-t bg-gradient-to-b from-purple-500/5 to-transparent">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-purple-500/10 border-b border-purple-500/20">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <List className="h-3.5 w-3.5" />
                Gliederung erstellt
              </span>
              {onClearOutline && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] px-2 text-purple-600 hover:text-purple-800 hover:bg-purple-500/20"
                  onClick={onClearOutline}
                >
                  <X className="h-2.5 w-2.5 mr-1" />
                  Verwerfen
                </Button>
              )}
            </div>

            <div className="p-3 space-y-2">
              {/* H1 */}
              <div className="text-sm font-semibold text-foreground leading-tight">
                {outline.h1}
              </div>

              {/* Sections - Collapsible Preview */}
              <div className="space-y-1 text-[11px] max-h-32 overflow-y-auto">
                {outline.sections.slice(0, 4).map((section, idx) => (
                  <div key={idx} className="pl-2 border-l-2 border-purple-300 dark:border-purple-600 py-0.5">
                    <div className="font-medium text-foreground/90">{section.h2}</div>
                  </div>
                ))}
                {outline.sections.length > 4 && (
                  <div className="text-[10px] text-muted-foreground pl-2">
                    +{outline.sections.length - 4} weitere Abschnitte
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 pt-1 border-t border-purple-200/50 dark:border-purple-800/50">
                <span className="text-[10px] text-muted-foreground">
                  {outline.sections.length} Abschnitte
                </span>
                {outline.faqs && outline.faqs.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {outline.faqs.length} FAQs
                  </span>
                )}
                {outline.estimatedWordCount && (
                  <span className="text-[10px] text-muted-foreground">
                    ~{outline.estimatedWordCount} Worter
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Buttons - Enhanced CTA */}
      <div className="p-3 border-t bg-muted/30 space-y-2">
        {/* Outline Button - only show if no outline yet */}
        {!outline && onGenerateOutline && (
          <Button
            onClick={onGenerateOutline}
            disabled={isGeneratingOutline || !config.focusKeyword.trim()}
            variant="outline"
            className="w-full h-9 text-sm"
          >
            {isGeneratingOutline ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Erstelle Gliederung...
              </>
            ) : (
              <>
                <List className="mr-2 h-4 w-4" />
                Erst Gliederung erstellen (optional)
              </>
            )}
          </Button>
        )}

        {/* Generate Content Button - Primary CTA */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !config.focusKeyword.trim()}
          className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generiere Content...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              {outline ? "Content generieren" : "SEO-Content erstellen"}
            </>
          )}
        </Button>

        {/* Ready State Indicator */}
        {!isGenerating && config.focusKeyword.trim() && (
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            {serpResult && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            <span>
              {serpResult
                ? `SERP-Daten bereit (${serpResult.serpTerms.all.length} Begriffe)`
                : 'SERP-Analyse wird automatisch gestartet'}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
