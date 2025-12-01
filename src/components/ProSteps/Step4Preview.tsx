import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Step4Props {
  generatedContent: any;
  onRefine: (prompt: string) => Promise<void>;
  onQuickChange: (changes: QuickChangeParams) => Promise<void>;
  onBack: () => void;
  onNext: () => void;
  isRefining: boolean;
  currentFormData: {
    tonality: string;
    formOfAddress: string;
    wordCount: string;
    includeFAQ: boolean;
    targetAudience: string;
  };
  onSelectVariant?: (index: number) => void;
}

export interface QuickChangeParams {
  tonality?: string;
  formOfAddress?: string;
  wordCount?: string;
  keywordDensity?: string;
  includeFAQ?: boolean;
  addExamples?: boolean;
}

const variantLabels = [
  { name: "Variante A", description: "Informativ & sachlich", icon: "📚" },
  { name: "Variante B", description: "Emotional & nutzerorientiert", icon: "💡" },
  { name: "Variante C", description: "Verkaufsorientiert", icon: "🎯" },
];

export const Step4Preview = ({ 
  generatedContent, 
  onRefine, 
  onQuickChange, 
  onBack, 
  onNext, 
  isRefining,
  currentFormData,
  onSelectVariant
}: Step4Props) => {
  const [refinePrompt, setRefinePrompt] = useState("");
  const [showQuickChanges, setShowQuickChanges] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quickChanges, setQuickChanges] = useState<QuickChangeParams>({
    tonality: currentFormData.tonality || 'balanced-mix',
    formOfAddress: currentFormData.formOfAddress || 'du',
    wordCount: currentFormData.wordCount || 'medium',
    keywordDensity: "normal",
    includeFAQ: currentFormData.includeFAQ ?? true,
    addExamples: false,
  });

  // Check if we have variants or single content
  const hasVariants = generatedContent?.variants && Array.isArray(generatedContent.variants);
  const variants = hasVariants ? generatedContent.variants : [generatedContent];
  const currentContent = variants[selectedVariant] || variants[0];

  const handleRefine = async () => {
    if (!refinePrompt.trim()) return;
    await onRefine(refinePrompt);
    setRefinePrompt("");
  };

  const handleQuickChange = async () => {
    await onQuickChange(quickChanges);
    setQuickChanges({
      tonality: quickChanges.tonality,
      formOfAddress: quickChanges.formOfAddress,
      wordCount: quickChanges.wordCount,
      keywordDensity: quickChanges.keywordDensity,
      includeFAQ: quickChanges.includeFAQ,
      addExamples: false,
    });
    setShowQuickChanges(false);
  };

  const handleVariantSelect = (index: number) => {
    setSelectedVariant(index);
    onSelectVariant?.(index);
  };

  const hasChanges = 
    quickChanges.tonality !== currentFormData.tonality ||
    quickChanges.formOfAddress !== currentFormData.formOfAddress ||
    quickChanges.wordCount !== currentFormData.wordCount ||
    quickChanges.keywordDensity !== "normal" ||
    quickChanges.includeFAQ !== currentFormData.includeFAQ ||
    quickChanges.addExamples === true;

  const renderContentPreview = (content: any) => (
    <div className="prose max-w-none">
      <h3 className="text-lg font-semibold mb-2">{content?.title || ''}</h3>
      <p className="text-sm text-muted-foreground mb-4">{content?.metaDescription || ''}</p>
      <div 
        className="whitespace-pre-wrap" 
        dangerouslySetInnerHTML={{ 
          __html: typeof content?.seoText === 'string' 
            ? content.seoText 
            : (typeof content?.text === 'string' ? content.text : '') 
        }} 
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Schritt 4: Vorschau & Überarbeitung</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {hasVariants 
            ? "Wählen Sie eine der 3 generierten Varianten aus und passen Sie sie bei Bedarf an"
            : "Überprüfen Sie den generierten Text und passen Sie ihn bei Bedarf an"}
        </p>
      </div>

      {currentContent ? (
        <div className="space-y-4">
          {/* Variant Selection */}
          {hasVariants && variants.length > 1 && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  3 Varianten wurden generiert
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Wählen Sie die Variante, die am besten zu Ihren Anforderungen passt
                </p>
              </div>
              
              <Tabs value={String(selectedVariant)} onValueChange={(v) => handleVariantSelect(Number(v))}>
                <TabsList className="grid w-full grid-cols-3">
                  {variantLabels.map((label, idx) => (
                    <TabsTrigger 
                      key={idx} 
                      value={String(idx)}
                      className="flex flex-col gap-0.5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <span className="text-sm font-medium">{label.icon} {label.name}</span>
                      <span className="text-xs opacity-80 hidden sm:inline">{label.description}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Ausgewählt: {variantLabels[selectedVariant].name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {variantLabels[selectedVariant].description}
                </span>
              </div>
            </Card>
          )}

          {/* Content Preview */}
          <Card className="p-4 max-h-[500px] overflow-y-auto">
            {renderContentPreview(currentContent)}
          </Card>

          {/* Quick Changes Section */}
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Schnelle Anpassungen</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickChanges(!showQuickChanges)}
              >
                {showQuickChanges ? "Verbergen" : "Anzeigen"}
              </Button>
            </div>

            {showQuickChanges && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tonalität */}
                  <div className="space-y-2">
                    <Label>Tonalität ändern</Label>
                    <Select 
                      value={quickChanges.tonality} 
                      onValueChange={(value) => setQuickChanges({ ...quickChanges, tonality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expert-mix">Expertenmix (70% Fach / 20% Lösung / 10% Story)</SelectItem>
                        <SelectItem value="consultant-mix">Beratermix (40% Fach / 40% Lösung / 20% Story)</SelectItem>
                        <SelectItem value="storytelling-mix">Storytelling-Mix (30% Fach / 30% Lösung / 40% Story)</SelectItem>
                        <SelectItem value="conversion-mix">Conversion-Mix (20% Fach / 60% Lösung / 20% Story)</SelectItem>
                        <SelectItem value="balanced-mix">Balanced-Mix (33% je)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Anredeform */}
                  <div className="space-y-2">
                    <Label>Anredeform</Label>
                    <RadioGroup 
                      value={quickChanges.formOfAddress} 
                      onValueChange={(value) => setQuickChanges({ ...quickChanges, formOfAddress: value })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="du" id="quick-du" />
                        <Label htmlFor="quick-du">Du</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sie" id="quick-sie" />
                        <Label htmlFor="quick-sie">Sie</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Wortanzahl */}
                  <div className="space-y-2">
                    <Label>Textlänge</Label>
                    <Select 
                      value={quickChanges.wordCount} 
                      onValueChange={(value) => setQuickChanges({ ...quickChanges, wordCount: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Kurz (300-500 Wörter)</SelectItem>
                        <SelectItem value="medium">Mittel (500-800 Wörter)</SelectItem>
                        <SelectItem value="long">Lang (800-1200 Wörter)</SelectItem>
                        <SelectItem value="very-long">Sehr lang (1200-1800 Wörter)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Keyword-Dichte */}
                  <div className="space-y-2">
                    <Label>Keyword-Dichte</Label>
                    <Select 
                      value={quickChanges.keywordDensity} 
                      onValueChange={(value) => setQuickChanges({ ...quickChanges, keywordDensity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal (0.5-1%)</SelectItem>
                        <SelectItem value="normal">Normal (1-2%)</SelectItem>
                        <SelectItem value="high">Hoch (2-3%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* FAQ Toggle */}
                  <div className="space-y-2 flex items-center justify-between">
                    <Label htmlFor="quick-faq">FAQ-Bereich</Label>
                    <Switch
                      id="quick-faq"
                      checked={quickChanges.includeFAQ}
                      onCheckedChange={(checked) => setQuickChanges({ ...quickChanges, includeFAQ: checked })}
                    />
                  </div>

                  {/* Anwendungsbeispiele Toggle */}
                  <div className="space-y-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quick-examples">Anwendungsbeispiele hinzufügen</Label>
                      <Switch
                        id="quick-examples"
                        checked={quickChanges.addExamples}
                        onCheckedChange={(checked) => setQuickChanges({ ...quickChanges, addExamples: checked })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      B2B: Praxisbeispiele • B2C: Alltagssituationen
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleQuickChange}
                  disabled={isRefining || !hasChanges}
                  className="w-full"
                  variant="default"
                >
                  {isRefining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird angepasst...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Änderungen übernehmen
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>

          <div className="space-y-2">
            <Label htmlFor="refinePrompt">Individuelle Anpassung (Freitext)</Label>
            <Textarea
              id="refinePrompt"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="Geben Sie an, wie der Text angepasst werden soll. z.B. 'Mache den Text formeller', 'Füge mehr technische Details hinzu', 'Kürze den Einleitungstext'"
              rows={4}
            />
            <Button
              onClick={handleRefine}
              disabled={isRefining || !refinePrompt.trim()}
              className="w-full"
              variant="secondary"
            >
              {isRefining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird überarbeitet...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Text überarbeiten
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Kein Inhalt verfügbar</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Zurück
        </Button>
        <Button onClick={onNext} className="gap-2">
          <Check className="h-4 w-4" />
          {hasVariants ? `${variantLabels[selectedVariant].name} übernehmen` : "Weiter zum SEO-Check"}
        </Button>
      </div>
    </div>
  );
};