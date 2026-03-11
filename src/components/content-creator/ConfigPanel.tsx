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

interface OutlineSection {
  h2: string;
  h3s?: string[];
}

interface Outline {
  h1: string;
  sections: OutlineSection[];
  faqs?: string[];
  estimatedWordCount?: number;
}

interface ConfigPanelProps {
  config: ContentConfig;
  onConfigChange: (updates: Partial<ContentConfig>) => void;
  serpResult?: any;
  serpLoading: boolean;
  onSerpAnalyze: () => void;
  domainKnowledge?: any;
  onGenerate: () => void;
  isGenerating: boolean;
  onGenerateOutline?: () => void;
  isGeneratingOutline?: boolean;
  outline?: Outline | null;
  onClearOutline?: () => void;
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
}: ConfigPanelProps) => {
  const [keywordInput, setKeywordInput] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'keyword' | 'settings' | 'advanced'>('keyword');

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

  return (
    <Card className="w-80 flex-shrink-0 flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Konfiguration
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-4 space-y-4">
          {/* Domain Knowledge Badge */}
          {domainKnowledge && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                <Building2 className="h-4 w-4" />
                {domainKnowledge.company_name}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Brand Voice & USPs automatisch geladen
              </p>
            </div>
          )}

          {/* Focus Keyword with SERP */}
          <div className="space-y-2">
            <Label htmlFor="focusKeyword" className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-primary" />
              Fokus-Keyword *
            </Label>
            <div className="flex gap-2">
              <Input
                id="focusKeyword"
                value={config.focusKeyword}
                onChange={(e) => onConfigChange({ focusKeyword: e.target.value })}
                placeholder="z.B. Kinesio Tape"
                className="flex-1"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onSerpAnalyze}
                      disabled={serpLoading || !config.focusKeyword.trim()}
                    >
                      {serpLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="font-medium">SERP-Analyse starten</p>
                    <p className="text-xs text-muted-foreground">
                      Analysiert die Top 10 Google-Ergebnisse für dein Keyword und extrahiert wichtige Begriffe, die dein Text enthalten sollte.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* SERP Results */}
            {serpResult && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    SERP-Analyse
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {serpResult.serpTerms.all.length} Begriffe
                  </Badge>
                </div>

                {/* Must-Have Terms */}
                {serpResult.serpTerms.mustHave.length > 0 && (
                  <div>
                    <span className="text-xs text-red-600 font-medium">Pflicht:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {serpResult.serpTerms.mustHave.slice(0, 5).map((term: string) => (
                        <Badge
                          key={term}
                          variant="destructive"
                          className="text-xs cursor-pointer"
                          onClick={() => {
                            if (!config.secondaryKeywords.includes(term)) {
                              onConfigChange({
                                secondaryKeywords: [...config.secondaryKeywords, term],
                              });
                            }
                          }}
                        >
                          <Plus className="h-2 w-2 mr-1" />
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Should-Have Terms */}
                {serpResult.serpTerms.shouldHave.length > 0 && (
                  <div>
                    <span className="text-xs text-yellow-600 font-medium">Empfohlen:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {serpResult.serpTerms.shouldHave.slice(0, 4).map((term: string) => (
                        <Badge
                          key={term}
                          variant="secondary"
                          className="text-xs cursor-pointer bg-yellow-500/20"
                          onClick={() => {
                            if (!config.secondaryKeywords.includes(term)) {
                              onConfigChange({
                                secondaryKeywords: [...config.secondaryKeywords, term],
                              });
                            }
                          }}
                        >
                          <Plus className="h-2 w-2 mr-1" />
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Add Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={addSerpKeywords}
                  >
                    + Alle Keywords
                  </Button>
                  {serpResult.questions.peopleAlsoAsk.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={addSerpQuestions}
                    >
                      + PAA Fragen
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Secondary Keywords */}
          <div className="space-y-2">
            <Label>Sekundäre Keywords</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSecondaryKeyword())}
                placeholder="Keyword hinzufügen"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addSecondaryKeyword}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {config.secondaryKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {config.secondaryKeywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="pr-1">
                    {keyword}
                    <button
                      onClick={() => removeSecondaryKeyword(keyword)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Page Type */}
          <div className="space-y-2">
            <Label>Seitentyp</Label>
            <Select
              value={config.pageType}
              onValueChange={(value) => onConfigChange({ pageType: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Produktseite</SelectItem>
                <SelectItem value="category">Kategorieseite</SelectItem>
                <SelectItem value="guide">Ratgeber / Blog</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label>Zielgruppe</Label>
            <RadioGroup
              value={config.targetAudience}
              onValueChange={(value) => onConfigChange({ targetAudience: value as any })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b2b" id="b2b" />
                <Label htmlFor="b2b" className="font-normal">B2B</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b2c" id="b2c" />
                <Label htmlFor="b2c" className="font-normal">B2C</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="font-normal">Mixed</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Tonality */}
          <div className="space-y-2">
            <Label>Tonalität</Label>
            <Select
              value={config.tonality}
              onValueChange={(value) => onConfigChange({ tonality: value })}
            >
              <SelectTrigger>
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

          {/* Form of Address */}
          <div className="space-y-2">
            <Label>Anredeform</Label>
            <RadioGroup
              value={config.formOfAddress}
              onValueChange={(value) => onConfigChange({ formOfAddress: value as any })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="du" id="du" />
                <Label htmlFor="du" className="font-normal">Du</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sie" id="sie" />
                <Label htmlFor="sie" className="font-normal">Sie</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Word Count */}
          <div className="space-y-2">
            <Label>Textlänge</Label>
            <Select
              value={config.wordCount}
              onValueChange={(value) => onConfigChange({ wordCount: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="500">Kurz (ca. 500 Wörter)</SelectItem>
                <SelectItem value="800">Kompakt (ca. 800 Wörter)</SelectItem>
                <SelectItem value="1000">Mittel (ca. 1000 Wörter)</SelectItem>
                <SelectItem value="1500">Standard (ca. 1500 Wörter)</SelectItem>
                <SelectItem value="2000">Umfangreich (ca. 2000 Wörter)</SelectItem>
                <SelectItem value="3000">Ausführlich (ca. 3000+ Wörter)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Model */}
          <div className="space-y-2">
            <Label>AI-Modell</Label>
            <Select
              value={config.aiModel}
              onValueChange={(value) => onConfigChange({ aiModel: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-flash">
                  <span className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    Gemini Flash (schnell)
                  </span>
                </SelectItem>
                <SelectItem value="gemini-pro">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    Gemini Pro (besser)
                  </span>
                </SelectItem>
                <SelectItem value="claude-sonnet">
                  <span className="flex items-center gap-2">
                    <Crown className="h-3 w-3 text-purple-500" />
                    Claude Sonnet (premium)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Version - WICHTIG für Qualität */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Prompt-Version
              <Badge variant="secondary" className="text-xs">Qualität</Badge>
            </Label>
            <Select
              value={config.promptVersion}
              onValueChange={(value) => onConfigChange({ promptVersion: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v9-master">
                  <span className="flex items-center gap-2">
                    ⭐ v9: Master (Standard)
                  </span>
                </SelectItem>
                <SelectItem value="v11-surfer-style">
                  <span className="flex items-center gap-2">
                    🎯 v11: Surfer-Style (NEU)
                  </span>
                </SelectItem>
                <SelectItem value="v10-geo-optimized">
                  <span className="flex items-center gap-2">
                    🚀 v10: GEO-Optimized
                  </span>
                </SelectItem>
                <SelectItem value="v8-natural-seo">
                  <span className="flex items-center gap-2">
                    🌿 v8: Natürlich SEO
                  </span>
                </SelectItem>
                <SelectItem value="v6-quality-auditor">
                  <span className="flex items-center gap-2">
                    📝 v6: Anti-Fluff
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              v9-master für beste Ergebnisse empfohlen
            </p>
          </div>

          {/* Advanced Settings */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                Erweiterte Einstellungen
                {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* W-Questions */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5" />
                  W-Fragen
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                    placeholder="Frage hinzufügen"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addQuestion}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {config.wQuestions.length > 0 && (
                  <div className="space-y-1">
                    {config.wQuestions.map((question) => (
                      <div key={question} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1">
                        <span className="truncate">{question}</span>
                        <button onClick={() => removeQuestion(question)} className="ml-2 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Include Options */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeIntro"
                    checked={config.includeIntro}
                    onCheckedChange={(checked) => onConfigChange({ includeIntro: checked as boolean })}
                  />
                  <Label htmlFor="includeIntro" className="font-normal">Einleitung</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeFAQ"
                    checked={config.includeFAQ}
                    onCheckedChange={(checked) => onConfigChange({ includeFAQ: checked as boolean })}
                  />
                  <Label htmlFor="includeFAQ" className="font-normal">FAQ-Bereich</Label>
                </div>
              </div>

              {/* Compliance */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Compliance
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mdr"
                      checked={config.complianceChecks.mdr}
                      onCheckedChange={(checked) =>
                        onConfigChange({
                          complianceChecks: { ...config.complianceChecks, mdr: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="mdr" className="font-normal text-sm">MDR/MPDG</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hwg"
                      checked={config.complianceChecks.hwg}
                      onCheckedChange={(checked) =>
                        onConfigChange({
                          complianceChecks: { ...config.complianceChecks, hwg: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="hwg" className="font-normal text-sm">HWG</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="studies"
                      checked={config.complianceChecks.studies}
                      onCheckedChange={(checked) =>
                        onConfigChange({
                          complianceChecks: { ...config.complianceChecks, studies: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="studies" className="font-normal text-sm">Studien prüfen</Label>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </ScrollArea>

      {/* Outline Section */}
      {outline && (
        <div className="p-4 border-t">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-700 dark:text-purple-400 flex items-center gap-1">
                <List className="h-3 w-3" />
                Gliederung
              </span>
              {onClearOutline && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={onClearOutline}
                >
                  <X className="h-3 w-3 mr-1" />
                  Verwerfen
                </Button>
              )}
            </div>

            {/* H1 */}
            <div className="text-sm font-semibold text-foreground">
              {outline.h1}
            </div>

            {/* Sections */}
            <div className="space-y-1 text-xs">
              {outline.sections.map((section, idx) => (
                <div key={idx} className="pl-2 border-l-2 border-purple-300 dark:border-purple-600">
                  <div className="font-medium">{section.h2}</div>
                  {section.h3s && section.h3s.length > 0 && (
                    <ul className="pl-3 text-muted-foreground">
                      {section.h3s.map((h3, h3Idx) => (
                        <li key={h3Idx}>• {h3}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* FAQs */}
            {outline.faqs && outline.faqs.length > 0 && (
              <div className="pt-1 border-t border-purple-200 dark:border-purple-700">
                <span className="text-xs text-muted-foreground">FAQs: {outline.faqs.length}</span>
              </div>
            )}

            {outline.estimatedWordCount && (
              <div className="text-xs text-muted-foreground">
                ~{outline.estimatedWordCount} Wörter geschätzt
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Buttons */}
      <div className="p-4 border-t space-y-2">
        {/* Outline Button - only show if no outline yet */}
        {!outline && onGenerateOutline && (
          <Button
            onClick={onGenerateOutline}
            disabled={isGeneratingOutline || !config.focusKeyword.trim()}
            variant="outline"
            className="w-full"
          >
            {isGeneratingOutline ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Erstelle Gliederung...
              </>
            ) : (
              <>
                <List className="mr-2 h-4 w-4" />
                Erst Gliederung erstellen
              </>
            )}
          </Button>
        )}

        {/* Generate Content Button */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !config.focusKeyword.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generiere SEO-Content...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {outline ? "Content aus Gliederung generieren" : "Content generieren"}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
