import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SloganVariant {
  text: string;
  explanation: string;
  framework: string;
}

interface GeneratedSlogans {
  variants: SloganVariant[];
  recommendations: string;
}

const SloganCreator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scrapeMode, setScrapeMode] = useState<"single" | "multi">("single");
  const [formData, setFormData] = useState({
    productService: "",
    targetAudience: "",
    usp: "",
    type: "slogan",
    framework: "aida",
    tone: "emotional",
    platform: "allgemein",
    additionalInfo: "",
  });
  const [generatedSlogans, setGeneratedSlogans] = useState<GeneratedSlogans | null>(null);

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      toast.error("Bitte gib eine Website-URL ein");
      return;
    }

    setIsCrawling(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-website", {
        body: { url: websiteUrl, mode: scrapeMode },
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        const analysis = data.analysis;
        
        // Auto-fill form fields
        if (analysis.companyName && !formData.productService) {
          setFormData(prev => ({ ...prev, productService: analysis.companyName }));
        }
        
        // Build additional info from crawled data
        let additionalInfo = "";
        if (analysis.companyName) additionalInfo += `Marke: ${analysis.companyName}\n`;
        if (analysis.industry) additionalInfo += `Branche: ${analysis.industry}\n`;
        if (analysis.uniqueSellingPoints?.length > 0) {
          additionalInfo += `USPs: ${analysis.uniqueSellingPoints.join(", ")}\n`;
        }
        if (analysis.mainProducts?.length > 0) {
          additionalInfo += `Produkte/Services: ${analysis.mainProducts.join(", ")}\n`;
        }
        if (analysis.brandVoice) additionalInfo += `Brand Voice: ${analysis.brandVoice}\n`;
        if (analysis.targetAudience && !formData.targetAudience) {
          setFormData(prev => ({ ...prev, targetAudience: analysis.targetAudience }));
        }
        
        setFormData(prev => ({ ...prev, additionalInfo: additionalInfo.trim() }));
        
        toast.success("Website erfolgreich analysiert!");
      } else {
        toast.error("Website-Analyse fehlgeschlagen");
      }
    } catch (error) {
      console.error("Error analyzing website:", error);
      toast.error("Fehler beim Analysieren der Website");
    } finally {
      setIsCrawling(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.productService || !formData.targetAudience) {
      toast.error("Bitte fülle mindestens Produkt/Service und Zielgruppe aus");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-slogans", {
        body: formData,
      });

      if (error) throw error;

      setGeneratedSlogans(data);
      toast.success("Slogans erfolgreich generiert!");
    } catch (error) {
      console.error("Error generating slogans:", error);
      toast.error("Fehler beim Generieren der Slogans");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Slogan & Headline Creator
        </h1>
        <p className="text-muted-foreground">
          Erstelle überzeugende Slogans, Headlines und Claims für deine Marke und Social Media Kampagnen
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Eingabe
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="productService">Produkt / Service *</Label>
              <Input
                id="productService"
                placeholder="z.B. Fitness-App für Berufstätige"
                value={formData.productService}
                onChange={(e) => setFormData({ ...formData, productService: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="targetAudience">Zielgruppe *</Label>
              <Input
                id="targetAudience"
                placeholder="z.B. 25-40 Jahre, urban, gesundheitsbewusst"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="usp">Alleinstellungsmerkmal (USP)</Label>
              <Input
                id="usp"
                placeholder="z.B. Nur 15 Minuten Training pro Tag"
                value={formData.usp}
                onChange={(e) => setFormData({ ...formData, usp: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="type">Art</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slogan">Slogan</SelectItem>
                  <SelectItem value="tagline">Tagline</SelectItem>
                  <SelectItem value="headline">Headline</SelectItem>
                  <SelectItem value="subline">Subline</SelectItem>
                  <SelectItem value="claim">Claim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="framework">Framework</Label>
              <Select value={formData.framework} onValueChange={(value) => setFormData({ ...formData, framework: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aida">AIDA (Attention, Interest, Desire, Action)</SelectItem>
                  <SelectItem value="pas">PAS (Problem, Agitate, Solution)</SelectItem>
                  <SelectItem value="4us">4 U's (Useful, Urgent, Unique, Ultra-specific)</SelectItem>
                  <SelectItem value="fab">FAB (Features, Advantages, Benefits)</SelectItem>
                  <SelectItem value="power">Power Words</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tone">Tonalität</Label>
              <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emotional">Emotional</SelectItem>
                  <SelectItem value="rational">Rational</SelectItem>
                  <SelectItem value="provocative">Provokativ</SelectItem>
                  <SelectItem value="humorous">Humorvoll</SelectItem>
                  <SelectItem value="luxury">Luxuriös</SelectItem>
                  <SelectItem value="authentic">Authentisch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="platform">Plattform</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allgemein">Allgemein</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="print">Print / Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website analysieren (optional)</Label>
              <RadioGroup
                value={scrapeMode}
                onValueChange={(value: "single" | "multi") => setScrapeMode(value)}
                className="flex gap-4 mb-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="slogan-scrape-single" />
                  <Label htmlFor="slogan-scrape-single" className="text-sm cursor-pointer">Einzelseite (1 Credit)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multi" id="slogan-scrape-multi" />
                  <Label htmlFor="slogan-scrape-multi" className="text-sm cursor-pointer">Multi-Page (bis 10)</Label>
                </div>
              </RadioGroup>
              <div className="flex gap-2">
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://deine-website.de"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAnalyzeWebsite}
                  disabled={isCrawling || !websiteUrl}
                >
                  {isCrawling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Analysieren
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Wir extrahieren automatisch Markeninformationen, USPs und Brand Voice
              </p>
            </div>

            <div>
              <Label htmlFor="additionalInfo">Zusätzliche Infos</Label>
              <Textarea
                id="additionalInfo"
                placeholder="z.B. Markenname, bestehende Claims, No-Gos, wichtige Keywords..."
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                rows={5}
              />
            </div>

            <Button onClick={handleGenerate} disabled={isLoading} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generiere Slogans...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Slogans generieren
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Output Area */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Generierte Slogans</h2>

          {!generatedSlogans && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              Fülle das Formular aus und generiere deine ersten Slogans
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">AI erstellt kreative Varianten...</p>
            </div>
          )}

          {generatedSlogans && !isLoading && (
            <div className="space-y-6">
              {generatedSlogans.variants.map((variant, index) => (
                <div key={index} className="border-l-4 border-primary pl-4 py-2">
                  <div className="font-semibold text-lg mb-1">{variant.text}</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Framework:</span> {variant.framework}
                  </div>
                  <div className="text-sm text-muted-foreground">{variant.explanation}</div>
                </div>
              ))}

              {generatedSlogans.recommendations && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Empfehlungen:</h3>
                  <p className="text-sm text-muted-foreground">{generatedSlogans.recommendations}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SloganCreator;
