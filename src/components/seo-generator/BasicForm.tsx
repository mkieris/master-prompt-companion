import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormSection } from "./FormSection";
import { X, Globe, Loader2, Sparkles, Target, Users, FileText, Settings, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BasicFormData {
  pageType: "category" | "product";
  targetAudience: "endCustomers" | "physiotherapists";
  formOfAddress: "du" | "sie" | "neutral";
  focusKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string[];
  keywordDensity: "minimal" | "normal" | "high";
  wQuestions: string[];
  manufacturerName: string;
  manufacturerWebsite: string;
  manufacturerInfo: string;
  additionalInfo: string;
  pageGoal: string;
  contentLength: string;
  tone: string;
  internalLinks: string;
  faqInputs: string;
  complianceCheck: boolean;
  checkMDR: boolean;
  checkHWG: boolean;
  checkStudies: boolean;
}

interface BasicFormProps {
  onGenerate: (data: BasicFormData) => void;
  isLoading: boolean;
}

export const BasicForm = ({ onGenerate, isLoading }: BasicFormProps) => {
  const { toast } = useToast();
  const [isScraping, setIsScraping] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [wQuestionInput, setWQuestionInput] = useState("");
  const [formData, setFormData] = useState<BasicFormData>({
    pageType: "product",
    targetAudience: "endCustomers",
    formOfAddress: "du",
    focusKeyword: "",
    secondaryKeywords: [],
    searchIntent: [],
    keywordDensity: "normal",
    wQuestions: [],
    manufacturerName: "",
    manufacturerWebsite: "",
    manufacturerInfo: "",
    additionalInfo: "",
    pageGoal: "inform",
    contentLength: "medium",
    tone: "advisory",
    internalLinks: "",
    faqInputs: "",
    complianceCheck: false,
    checkMDR: false,
    checkHWG: false,
    checkStudies: false,
  });

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !formData.secondaryKeywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        secondaryKeywords: [...formData.secondaryKeywords, keywordInput.trim()],
      });
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      secondaryKeywords: formData.secondaryKeywords.filter((k) => k !== keyword),
    });
  };

  const handleAddWQuestion = () => {
    if (wQuestionInput.trim() && !formData.wQuestions.includes(wQuestionInput.trim())) {
      setFormData({
        ...formData,
        wQuestions: [...formData.wQuestions, wQuestionInput.trim()],
      });
      setWQuestionInput("");
    }
  };

  const handleRemoveWQuestion = (question: string) => {
    setFormData({
      ...formData,
      wQuestions: formData.wQuestions.filter((q) => q !== question),
    });
  };

  const toggleSearchIntent = (intent: string) => {
    const current = formData.searchIntent;
    if (current.includes(intent)) {
      setFormData({ ...formData, searchIntent: current.filter((i) => i !== intent) });
    } else {
      setFormData({ ...formData, searchIntent: [...current, intent] });
    }
  };

  const handleScrapeWebsite = async () => {
    if (!formData.manufacturerWebsite.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie zuerst eine Website ein",
        variant: "destructive",
      });
      return;
    }

    setIsScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-website", {
        body: { url: formData.manufacturerWebsite, mode: "single" },
      });

      if (error) throw error;

      setFormData({
        ...formData,
        manufacturerInfo: `Titel: ${data.title || "N/A"}\n\nBeschreibung: ${data.description || "N/A"}\n\nInhalt:\n${data.content?.substring(0, 2000) || ""}`,
      });

      toast({
        title: "Erfolgreich",
        description: "Website wurde analysiert",
      });
    } catch (error) {
      console.error("Scraping error:", error);
      toast({
        title: "Fehler",
        description: "Website konnte nicht analysiert werden",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.focusKeyword.trim()) {
      toast({
        title: "Fokus-Keyword erforderlich",
        description: "Bitte geben Sie ein Fokus-Keyword ein",
        variant: "destructive",
      });
      return;
    }
    onGenerate(formData);
  };

  // Check section completeness
  const isKeywordsComplete = !!formData.focusKeyword.trim();
  const isContentComplete = !!formData.pageType && !!formData.contentLength && !!formData.tone;
  const isAudienceComplete = !!formData.targetAudience && !!formData.formOfAddress;

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {/* Section 1: Keywords */}
          <FormSection
            title="Keywords & SEO"
            description="Haupt- und Nebenkeywords definieren"
            stepNumber={1}
            isComplete={isKeywordsComplete}
            defaultOpen={true}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="focusKeyword" className="text-sm font-medium">
                  Fokus-Keyword *
                </Label>
                <Input
                  id="focusKeyword"
                  value={formData.focusKeyword}
                  onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                  placeholder="z.B. Physiotherapie Hilfsmittel"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Sekundär-Keywords</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Keyword + Enter"
                  />
                  <Button type="button" onClick={handleAddKeyword} variant="outline" size="sm">
                    +
                  </Button>
                </div>
                {formData.secondaryKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.secondaryKeywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-1 hover:text-destructive rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Suchintention */}
              <div>
                <Label className="text-sm font-medium">Suchintention</Label>
                <p className="text-xs text-muted-foreground mb-2">Welche Absicht hat der Nutzer? (mehrfach möglich)</p>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {[
                    { value: "know", label: "Know", desc: "Infos suchen" },
                    { value: "do", label: "Do", desc: "Aktion ausführen" },
                    { value: "buy", label: "Buy", desc: "Kaufen/vergleichen" },
                    { value: "go", label: "Go", desc: "Zur Seite navigieren" },
                    { value: "visit", label: "Visit", desc: "Vor Ort besuchen" },
                  ].map((intent) => (
                    <label
                      key={intent.value}
                      className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                        formData.searchIntent.includes(intent.value)
                          ? "border-primary bg-primary/10"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={formData.searchIntent.includes(intent.value)}
                        onCheckedChange={() => toggleSearchIntent(intent.value)}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-sm">{intent.label}</span>
                        <p className="text-xs text-muted-foreground">{intent.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Keyword-Dichte */}
              <div>
                <Label className="text-sm font-medium">Keyword-Dichte</Label>
                <Select
                  value={formData.keywordDensity}
                  onValueChange={(value: "minimal" | "normal" | "high") =>
                    setFormData({ ...formData, keywordDensity: value })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">
                      <div className="flex flex-col">
                        <span>Minimal (0.5-1%)</span>
                        <span className="text-xs text-muted-foreground">Sehr natürlich, wenige Keywords</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="normal">
                      <div className="flex flex-col">
                        <span>Normal (1-2%)</span>
                        <span className="text-xs text-muted-foreground">Empfohlen, gute Balance</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex flex-col">
                        <span>Hoch (2-3%)</span>
                        <span className="text-xs text-muted-foreground">Stärker optimiert</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* W-Fragen */}
              <div>
                <Label className="text-sm font-medium">W-Fragen (SEO-relevant)</Label>
                <p className="text-xs text-muted-foreground mb-1.5">Fragen, die im Text beantwortet werden sollen</p>
                <div className="flex gap-2">
                  <Input
                    value={wQuestionInput}
                    onChange={(e) => setWQuestionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddWQuestion())}
                    placeholder="z.B. Was ist...? Wie funktioniert...?"
                  />
                  <Button type="button" onClick={handleAddWQuestion} variant="outline" size="sm">
                    +
                  </Button>
                </div>
                {formData.wQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.wQuestions.map((question) => (
                      <Badge key={question} variant="outline" className="gap-1 pr-1 bg-blue-500/10 border-blue-500/30">
                        {question}
                        <button
                          type="button"
                          onClick={() => handleRemoveWQuestion(question)}
                          className="ml-1 hover:text-destructive rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </FormSection>

          {/* Section 2: Zielgruppe */}
          <FormSection
            title="Zielgruppe & Ansprache"
            description="Für wen ist der Text?"
            stepNumber={2}
            isComplete={isAudienceComplete}
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Zielgruppe</Label>
                <RadioGroup
                  value={formData.targetAudience}
                  onValueChange={(value: "endCustomers" | "physiotherapists") =>
                    setFormData({ ...formData, targetAudience: value })
                  }
                  className="mt-2 space-y-2"
                >
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="endCustomers" />
                    <div>
                      <span className="font-medium">Endkunden (B2C)</span>
                      <p className="text-xs text-muted-foreground">Verbraucher, Patienten</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="physiotherapists" />
                    <div>
                      <span className="font-medium">Fachpublikum (B2B)</span>
                      <p className="text-xs text-muted-foreground">Ärzte, Therapeuten, Fachkräfte</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">Anrede</Label>
                <RadioGroup
                  value={formData.formOfAddress}
                  onValueChange={(value: "du" | "sie" | "neutral") =>
                    setFormData({ ...formData, formOfAddress: value })
                  }
                  className="mt-2 flex gap-2"
                >
                  <label className="flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="du" />
                    <span>Du</span>
                  </label>
                  <label className="flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="sie" />
                    <span>Sie</span>
                  </label>
                  <label className="flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="neutral" />
                    <span>Neutral</span>
                  </label>
                </RadioGroup>
              </div>
            </div>
          </FormSection>

          {/* Section 3: Content Settings */}
          <FormSection
            title="Content-Einstellungen"
            description="Länge, Stil und Seitentyp"
            stepNumber={3}
            isComplete={isContentComplete}
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Seitentyp</Label>
                  <Select 
                    value={formData.pageType} 
                    onValueChange={(value: "category" | "product") => setFormData({ ...formData, pageType: value })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Produktseite</SelectItem>
                      <SelectItem value="category">Kategorieseite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Textlänge</Label>
                  <Select 
                    value={formData.contentLength} 
                    onValueChange={(value) => setFormData({ ...formData, contentLength: value })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Kurz (~400 Wörter)</SelectItem>
                      <SelectItem value="medium">Mittel (~800 Wörter)</SelectItem>
                      <SelectItem value="long">Lang (~1200 Wörter)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Tonalität</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factual">Sachlich & Informativ</SelectItem>
                    <SelectItem value="advisory">Beratend & Hilfsbereit</SelectItem>
                    <SelectItem value="sales">Verkaufsorientiert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Seitenziel</Label>
                <Select value={formData.pageGoal} onValueChange={(value) => setFormData({ ...formData, pageGoal: value })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inform">Informieren</SelectItem>
                    <SelectItem value="advise">Beraten</SelectItem>
                    <SelectItem value="preparePurchase">Kaufentscheidung vorbereiten</SelectItem>
                    <SelectItem value="triggerPurchase">Kauf auslösen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FormSection>

          {/* Section 4: Quellen */}
          <FormSection
            title="Quellen & Recherche"
            description="Website-Daten automatisch laden"
            stepNumber={4}
            isComplete={!!formData.manufacturerInfo}
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Hersteller / Marke</Label>
                <Input
                  value={formData.manufacturerName}
                  onChange={(e) => setFormData({ ...formData, manufacturerName: e.target.value })}
                  placeholder="z.B. MediCorp"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Website analysieren</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    type="url"
                    value={formData.manufacturerWebsite}
                    onChange={(e) => setFormData({ ...formData, manufacturerWebsite: e.target.value })}
                    placeholder="https://example.com"
                  />
                  <Button
                    type="button"
                    onClick={handleScrapeWebsite}
                    disabled={isScraping}
                    variant="outline"
                    size="icon"
                  >
                    {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Recherche-Daten / Infos</Label>
                <Textarea
                  value={formData.manufacturerInfo}
                  onChange={(e) => setFormData({ ...formData, manufacturerInfo: e.target.value })}
                  placeholder="Technische Daten, Spezifikationen, USPs..."
                  rows={4}
                  className="mt-1.5"
                />
              </div>
            </div>
          </FormSection>

          {/* Section 5: Compliance */}
          <FormSection
            title="Compliance-Checks"
            description="Für regulierte Branchen"
            stepNumber={5}
            isComplete={formData.checkMDR || formData.checkHWG || formData.checkStudies}
            defaultOpen={false}
          >
            <Card className="p-4 bg-warning/5 border-warning/20">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Aktivieren Sie diese Optionen für Medizintechnik und Healthcare
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.checkMDR}
                      onCheckedChange={(checked) => setFormData({ ...formData, checkMDR: checked as boolean })}
                    />
                    <span className="text-sm">MDR/MPDG-Konformität</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.checkHWG}
                      onCheckedChange={(checked) => setFormData({ ...formData, checkHWG: checked as boolean })}
                    />
                    <span className="text-sm">HWG-Konformität</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.checkStudies}
                      onCheckedChange={(checked) => setFormData({ ...formData, checkStudies: checked as boolean })}
                    />
                    <span className="text-sm">Studienbasierte Aussagen prüfen</span>
                  </label>
                </div>
              </div>
            </Card>
          </FormSection>
        </div>
      </ScrollArea>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-card">
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-semibold"
          disabled={isLoading || !formData.focusKeyword.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generiere...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              SEO-Text generieren
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
