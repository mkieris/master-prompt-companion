import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FormData {
  pageType: "category" | "product";
  targetAudience: "endCustomers" | "physiotherapists";
  formOfAddress: "du" | "sie" | "neutral";
  focusKeyword: string;
  secondaryKeywords: string[];
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
  productComparisonEnabled: boolean;
  autoDetectProducts: boolean;
  productList: string;
}

interface SEOGeneratorFormProps {
  onGenerate: (data: FormData) => void;
  isLoading: boolean;
  initialData?: FormData | null;
  projectId?: string | null;
}

export const SEOGeneratorForm = ({ onGenerate, isLoading, initialData, projectId }: SEOGeneratorFormProps) => {
  const { toast } = useToast();
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeMode, setScrapeMode] = useState<"single" | "multi">("single");
  const [formData, setFormData] = useState<FormData>(initialData || {
    pageType: "product",
    targetAudience: "endCustomers",
    formOfAddress: "du",
    focusKeyword: "",
    secondaryKeywords: [],
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
    productComparisonEnabled: false,
    autoDetectProducts: false,
    productList: "",
  });

  const [keywordInput, setKeywordInput] = useState("");

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

  const handleScrapeWebsite = async () => {
    if (!formData.manufacturerWebsite.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie zuerst eine Hersteller-Website ein",
        variant: "destructive",
      });
      return;
    }

    setIsScraping(true);
    try {
      const startTime = Date.now();
      
      if (scrapeMode === "multi") {
        toast({
          title: "Multi-Page Crawling gestartet",
          description: "Dies kann 1-3 Minuten dauern. Bitte warten...",
        });
      }

      const { data, error } = await supabase.functions.invoke("scrape-website", {
        body: { 
          url: formData.manufacturerWebsite,
          mode: scrapeMode 
        },
      });

      if (error) {
        throw error;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      // Fill in the scraped data into the form
      let infoText = "";
      
      if (scrapeMode === "multi" && data.pageCount) {
        infoText = `=== MULTI-PAGE CRAWL: ${data.pageCount} Seiten analysiert ===\n\n`;
        infoText += `Gescrapte URLs:\n${data.crawledUrls?.slice(0, 10).join("\n") || "N/A"}\n${data.crawledUrls?.length > 10 ? `... und ${data.crawledUrls.length - 10} weitere` : ""}\n\n`;
      } else {
        infoText = `Titel: ${data.title || "N/A"}\n\nBeschreibung: ${data.description || "N/A"}\n\n`;
      }
      
      infoText += `Inhalt:\n${data.content?.substring(0, 3000) || ""}`;
      
      setFormData({
        ...formData,
        manufacturerInfo: infoText,
      });

      toast({
        title: "Erfolgreich",
        description: scrapeMode === "multi" 
          ? `${data.pageCount} Seiten in ${duration}s analysiert` 
          : `Website in ${duration}s analysiert`,
      });
    } catch (error) {
      console.error("Error scraping website:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Analysieren der Website",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.focusKeyword.trim()) {
      return;
    }
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 h-full overflow-y-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">SEO-Textgenerator</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Erstellen Sie hochwertige SEO-Texte mit Compliance-Check
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Seitentyp</Label>
          <RadioGroup
            value={formData.pageType}
            onValueChange={(value: "category" | "product") =>
              setFormData({ ...formData, pageType: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="category" id="category" />
              <Label htmlFor="category" className="cursor-pointer">
                Kategorie
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="product" id="product" />
              <Label htmlFor="product" className="cursor-pointer">
                Produkt
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="mb-2 block">Zielgruppe</Label>
          <RadioGroup
            value={formData.targetAudience}
            onValueChange={(value: "endCustomers" | "physiotherapists") =>
              setFormData({ ...formData, targetAudience: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="endCustomers" id="endCustomers" />
              <Label htmlFor="endCustomers" className="cursor-pointer">
                Endkundenorientiert
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="physiotherapists" id="physiotherapists" />
              <Label htmlFor="physiotherapists" className="cursor-pointer">
                Physiotherapeuten-orientiert
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="mb-2 block">Anrede</Label>
          <RadioGroup
            value={formData.formOfAddress}
            onValueChange={(value: "du" | "sie" | "neutral") =>
              setFormData({ ...formData, formOfAddress: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="du" id="du" />
              <Label htmlFor="du" className="cursor-pointer">
                Du (persönlich)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sie" id="sie" />
              <Label htmlFor="sie" className="cursor-pointer">
                Sie (förmlich)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="neutral" id="neutral" />
              <Label htmlFor="neutral" className="cursor-pointer">
                Neutral (keine direkte Anrede)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="focusKeyword">Fokus-Keyword *</Label>
          <Input
            id="focusKeyword"
            value={formData.focusKeyword}
            onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
            placeholder="z.B. Physiotherapie Hilfsmittel"
            required
          />
        </div>

        <div>
          <Label htmlFor="secondaryKeywords">Sekundär-Keywords (optional)</Label>
          <div className="flex gap-2 mb-2">
            <Input
              id="secondaryKeywords"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
              placeholder="Keyword eingeben und Enter drücken"
            />
            <Button type="button" onClick={handleAddKeyword} variant="secondary" size="sm">
              Hinzufügen
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.secondaryKeywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="gap-1">
                {keyword}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="manufacturerName">Herstellername (optional)</Label>
          <Input
            id="manufacturerName"
            value={formData.manufacturerName}
            onChange={(e) => setFormData({ ...formData, manufacturerName: e.target.value })}
            placeholder="z.B. MediCorp"
          />
        </div>

        <div>
          <Label htmlFor="manufacturerWebsite">Hersteller-Website (optional)</Label>
          
          {/* Scrape Mode Selection */}
          <div className="mb-2 p-3 bg-muted/50 rounded-md">
            <Label className="text-sm font-medium mb-2 block">Scraping-Modus</Label>
            <RadioGroup
              value={scrapeMode}
              onValueChange={(value: "single" | "multi") => setScrapeMode(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="cursor-pointer font-normal">
                  Nur diese Seite (schnell)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multi" id="multi" />
                <Label htmlFor="multi" className="cursor-pointer font-normal">
                  Gesamte Website (bis zu 50 Seiten, 1-3 Min)
                </Label>
              </div>
            </RadioGroup>
            {scrapeMode === "multi" && (
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ Multi-Page Crawling analysiert alle Unterseiten und kann mehrere Minuten dauern. 
                Impressum, Datenschutz und Checkout-Seiten werden automatisch ausgeschlossen.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              id="manufacturerWebsite"
              type="url"
              value={formData.manufacturerWebsite}
              onChange={(e) => setFormData({ ...formData, manufacturerWebsite: e.target.value })}
              placeholder="https://example.com"
            />
            <Button
              type="button"
              onClick={handleScrapeWebsite}
              disabled={isScraping || !formData.manufacturerWebsite.trim()}
              variant="secondary"
              size="icon"
              title={scrapeMode === "single" ? "Seite analysieren" : "Website crawlen"}
            >
              {isScraping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="manufacturerInfo">Herstellerinfos (Rohtext, optional)</Label>
          <Textarea
            id="manufacturerInfo"
            value={formData.manufacturerInfo}
            onChange={(e) => setFormData({ ...formData, manufacturerInfo: e.target.value })}
            placeholder="Technische Daten, Spezifikationen..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="additionalInfo">Eigene Zusatzinfos / USPs (optional)</Label>
          <Textarea
            id="additionalInfo"
            value={formData.additionalInfo}
            onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
            placeholder="Besonderheiten, Alleinstellungsmerkmale..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="pageGoal">Ziel der Seite</Label>
          <Select value={formData.pageGoal} onValueChange={(value) => setFormData({ ...formData, pageGoal: value })}>
            <SelectTrigger id="pageGoal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inform">Informieren</SelectItem>
              <SelectItem value="advise">Beraten</SelectItem>
              <SelectItem value="preparePurchase">Kaufen vorbereiten</SelectItem>
              <SelectItem value="triggerPurchase">Kauf auslösen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contentLength">Länge</Label>
          <Select
            value={formData.contentLength}
            onValueChange={(value) => setFormData({ ...formData, contentLength: value })}
          >
            <SelectTrigger id="contentLength">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Kurz (~300-500 Wörter)</SelectItem>
              <SelectItem value="medium">Mittel (~700-1000 Wörter)</SelectItem>
              <SelectItem value="long">Lang (1200+ Wörter)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tone">Sprache/Tonalität</Label>
          <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
            <SelectTrigger id="tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="factual">Sachlich</SelectItem>
              <SelectItem value="advisory">Beratend</SelectItem>
              <SelectItem value="sales">Verkaufsorientiert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="internalLinks">Interne Linkziele (optional)</Label>
          <Textarea
            id="internalLinks"
            value={formData.internalLinks}
            onChange={(e) => setFormData({ ...formData, internalLinks: e.target.value })}
            placeholder="Eine URL pro Zeile"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="faqInputs">FAQ-Inputs (optional)</Label>
          <Textarea
            id="faqInputs"
            value={formData.faqInputs}
            onChange={(e) => setFormData({ ...formData, faqInputs: e.target.value })}
            placeholder="Eine Frage pro Zeile"
            rows={3}
          />
        </div>

        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="complianceCheck"
              checked={formData.complianceCheck}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, complianceCheck: checked as boolean })
              }
            />
            <Label htmlFor="complianceCheck" className="cursor-pointer font-semibold">
              Rechts- & Evidenz-Check aktivieren
            </Label>
          </div>
          
          {formData.complianceCheck && (
            <div className="ml-6 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="checkMDR"
                  checked={formData.checkMDR}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, checkMDR: checked as boolean })
                  }
                />
                <Label htmlFor="checkMDR" className="cursor-pointer">
                  MDR/MPDG-Konformität
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="checkHWG"
                  checked={formData.checkHWG}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, checkHWG: checked as boolean })
                  }
                />
                <Label htmlFor="checkHWG" className="cursor-pointer">
                  HWG-Check (Heilaussagen)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="checkStudies"
                  checked={formData.checkStudies}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, checkStudies: checked as boolean })
                  }
                />
                <Label htmlFor="checkStudies" className="cursor-pointer">
                  Studienprüfung (Evidenz & Zitierhinweise)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Kein Rechtsrat. Ergebnisse sind Hinweise – finale Prüfung durch Rechtsabteilung/Compliance.
              </p>
            </div>
          )}
        </div>

        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="productComparison"
              checked={formData.productComparisonEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, productComparisonEnabled: checked as boolean })
              }
            />
            <Label htmlFor="productComparison" className="cursor-pointer font-semibold">
              Produktvergleich & Kaufberatung erstellen
            </Label>
          </div>
          
          {formData.productComparisonEnabled && (
            <div className="ml-6 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoDetectProducts"
                  checked={formData.autoDetectProducts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autoDetectProducts: checked as boolean })
                  }
                />
                <Label htmlFor="autoDetectProducts" className="cursor-pointer">
                  Produkte automatisch erkennen
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.autoDetectProducts 
                  ? "Das System findet automatisch relevante Produkte basierend auf dem Fokus-Keyword und erstellt eine Kaufberatung."
                  : "Geben Sie die verfügbaren Produkte manuell ein, um eine detaillierte Kaufberatung zu erhalten."}
              </p>
              
              {!formData.autoDetectProducts && (
                <>
                  <Label htmlFor="productList" className="text-sm">
                    Verfügbare Produkte (ein Produkt pro Zeile)
                  </Label>
                  <Textarea
                    id="productList"
                    value={formData.productList}
                    onChange={(e) => setFormData({ ...formData, productList: e.target.value })}
                    placeholder="z.B.:&#10;Bluetens Classic - TENS für Einsteiger, 4 Programme, €89&#10;Bluetens Pro - Premium TENS, 20 Programme + App, €149&#10;Bluetens Sport - Für Sportler, 12 Programme, €119"
                    rows={5}
                    className="font-mono text-sm"
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isLoading || !formData.focusKeyword.trim()} className="w-full">
        {isLoading ? "Generiere..." : "SEO-Text generieren"}
      </Button>
    </form>
  );
};
