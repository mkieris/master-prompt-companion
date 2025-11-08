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
}

interface SEOGeneratorFormProps {
  onGenerate: (data: FormData) => void;
  isLoading: boolean;
}

export const SEOGeneratorForm = ({ onGenerate, isLoading }: SEOGeneratorFormProps) => {
  const { toast } = useToast();
  const [isScraping, setIsScraping] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    pageType: "product",
    targetAudience: "endCustomers",
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
      const { data, error } = await supabase.functions.invoke("scrape-website", {
        body: { url: formData.manufacturerWebsite },
      });

      if (error) {
        throw error;
      }

      // Fill in the scraped data into the form
      setFormData({
        ...formData,
        manufacturerInfo: `Titel: ${data.title || "N/A"}\n\nBeschreibung: ${data.description || "N/A"}\n\nInhalt:\n${data.content?.substring(0, 2000) || ""}`,
      });

      toast({
        title: "Erfolgreich",
        description: "Website-Daten wurden erfolgreich analysiert und eingefügt",
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
              title="Website analysieren"
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
      </div>

      <Button type="submit" disabled={isLoading || !formData.focusKeyword.trim()} className="w-full">
        {isLoading ? "Generiere..." : "SEO-Text generieren"}
      </Button>
    </form>
  );
};
