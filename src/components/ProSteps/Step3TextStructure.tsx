import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Step3Data {
  focusKeyword: string;
  secondaryKeywords: string[];
  contentStructure: string;
  wordCount: string;
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

interface Step3Props {
  data: Step3Data;
  onUpdate: (data: Partial<Step3Data>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3TextStructure = ({ data, onUpdate, onNext, onBack }: Step3Props) => {
  const [keywordInput, setKeywordInput] = useState("");

  const addKeyword = () => {
    if (keywordInput.trim() && !data.secondaryKeywords.includes(keywordInput.trim())) {
      onUpdate({ secondaryKeywords: [...data.secondaryKeywords, keywordInput.trim()] });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    onUpdate({ secondaryKeywords: data.secondaryKeywords.filter(k => k !== keyword) });
  };

  const canProceed = data.focusKeyword && data.contentStructure && data.wordCount && data.headingStructure;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Schritt 3: Text-Struktur</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Definieren Sie den Aufbau und die Struktur des gewünschten Textes
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="focusKeyword">Fokus-Keyword *</Label>
          <Input
            id="focusKeyword"
            value={data.focusKeyword}
            onChange={(e) => onUpdate({ focusKeyword: e.target.value })}
            placeholder="Hauptkeyword für SEO"
          />
        </div>

        <div>
          <Label htmlFor="secondaryKeywords">Sekundäre Keywords</Label>
          <div className="flex gap-2 mb-2">
            <Input
              id="secondaryKeywords"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              placeholder="Keyword eingeben und Enter drücken"
            />
            <Button type="button" onClick={addKeyword} variant="outline">
              Hinzufügen
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.secondaryKeywords.map((keyword) => (
              <Badge key={keyword} variant="secondary">
                {keyword}
                <button onClick={() => removeKeyword(keyword)} className="ml-2">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label>Text-Struktur *</Label>
          <RadioGroup value={data.contentStructure} onValueChange={(value) => onUpdate({ contentStructure: value })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="short-intro" id="short-intro" />
              <Label htmlFor="short-intro">Kurzer Einstieg + Hauptteil</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="blocks" id="blocks" />
              <Label htmlFor="blocks">Block-Struktur mit gleichmäßigen Abschnitten</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tabs" id="tabs" />
              <Label htmlFor="tabs">Tab-Struktur (verschiedene Themen)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pyramid" id="pyramid" />
              <Label htmlFor="pyramid">Pyramiden-Struktur (wichtigste Info zuerst)</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="wordCount">Umfang *</Label>
          <Select value={data.wordCount} onValueChange={(value) => onUpdate({ wordCount: value })}>
            <SelectTrigger id="wordCount">
              <SelectValue placeholder="Textlänge wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="500">Kurz (ca. 500 Wörter)</SelectItem>
              <SelectItem value="1000">Mittel (ca. 1000 Wörter)</SelectItem>
              <SelectItem value="1500">Standard (ca. 1500 Wörter)</SelectItem>
              <SelectItem value="2000">Umfangreich (ca. 2000 Wörter)</SelectItem>
              <SelectItem value="3000">Ausführlich (ca. 3000+ Wörter)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="headingStructure">Überschriften-Struktur *</Label>
          <Select value={data.headingStructure} onValueChange={(value) => onUpdate({ headingStructure: value })}>
            <SelectTrigger id="headingStructure">
              <SelectValue placeholder="Struktur wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h2-only">Nur H2 (flache Struktur)</SelectItem>
              <SelectItem value="h2-h3">H2 + H3 (zweistufig)</SelectItem>
              <SelectItem value="h2-h3-h4">H2 + H3 + H4 (dreistufig)</SelectItem>
              <SelectItem value="full">Vollständig (H2 bis H5)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeIntro"
              checked={data.includeIntro}
              onCheckedChange={(checked) => onUpdate({ includeIntro: checked as boolean })}
            />
            <Label htmlFor="includeIntro">Einleitung einbeziehen</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeFAQ"
              checked={data.includeFAQ}
              onCheckedChange={(checked) => onUpdate({ includeFAQ: checked as boolean })}
            />
            <Label htmlFor="includeFAQ">FAQ-Sektion hinzufügen</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="pageGoal">Seitenziel / Call-to-Action</Label>
          <Textarea
            id="pageGoal"
            value={data.pageGoal}
            onChange={(e) => onUpdate({ pageGoal: e.target.value })}
            placeholder="Was soll der Leser tun? (z.B. Kontakt aufnehmen, Produkt kaufen, informieren)"
            rows={3}
          />
        </div>

        <div>
          <Label>Compliance-Prüfungen</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mdr"
                checked={data.complianceChecks.mdr}
                onCheckedChange={(checked) => onUpdate({
                  complianceChecks: { ...data.complianceChecks, mdr: checked as boolean }
                })}
              />
              <Label htmlFor="mdr">MDR-Konformität prüfen</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hwg"
                checked={data.complianceChecks.hwg}
                onCheckedChange={(checked) => onUpdate({
                  complianceChecks: { ...data.complianceChecks, hwg: checked as boolean }
                })}
              />
              <Label htmlFor="hwg">HWG-Konformität prüfen</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="studies"
                checked={data.complianceChecks.studies}
                onCheckedChange={(checked) => onUpdate({
                  complianceChecks: { ...data.complianceChecks, studies: checked as boolean }
                })}
              />
              <Label htmlFor="studies">Studien-Anforderungen prüfen</Label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Zurück
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Text generieren
        </Button>
      </div>
    </div>
  );
};
