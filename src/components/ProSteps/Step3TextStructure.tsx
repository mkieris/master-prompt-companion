import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { validatePromptConsistency, type ValidationWarning } from "@/utils/promptValidation";
import { ValidationWarnings } from "@/components/ValidationWarnings";
import { ModelSelector, type AIModel } from "./ModelSelector";

interface Step3Data {
  focusKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string[];
  keywordDensity: string;
  wQuestions: string[];
  contentStructure: string;
  contentLayout: string;
  imageTextBlocks: number;
  includeTabs: boolean;
  wordCount: string;
  maxParagraphLength: string;
  headingStructure: string;
  includeIntro: boolean;
  includeFAQ: boolean;
  pageGoal: string;
  aiModel: AIModel;
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
  formOfAddress?: string;
  targetAudience?: string;
  tonality?: string;
  promptVersion?: string;
  pageType?: string;
}

export const Step3TextStructure = ({ data, onUpdate, onNext, onBack, formOfAddress, targetAudience, tonality, promptVersion, pageType }: Step3Props) => {
  const [keywordInput, setKeywordInput] = useState("");
  const [wQuestionInput, setWQuestionInput] = useState("");
  const [showLayoutPreview, setShowLayoutPreview] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);

  useEffect(() => {
    if (data.focusKeyword && tonality && targetAudience) {
      const warnings = validatePromptConsistency({
        promptVersion: promptVersion || 'v1-kompakt-seo',
        pageType: pageType || 'product',
        tonality: tonality,
        targetAudience: targetAudience,
        wordCount: data.wordCount,
        maxParagraphLength: data.maxParagraphLength || '300',
        includeFAQ: data.includeFAQ,
        keywordDensity: data.keywordDensity,
        complianceChecks: data.complianceChecks
      });
      setValidationWarnings(warnings);
    }
  }, [data.wordCount, data.maxParagraphLength, data.includeFAQ, data.keywordDensity, data.complianceChecks, tonality, targetAudience, promptVersion, pageType, data.focusKeyword]);

  const addWQuestion = () => {
    if (wQuestionInput.trim() && !data.wQuestions?.includes(wQuestionInput.trim())) {
      onUpdate({ wQuestions: [...(data.wQuestions || []), wQuestionInput.trim()] });
      setWQuestionInput("");
    }
  };

  const removeWQuestion = (question: string) => {
    onUpdate({ wQuestions: (data.wQuestions || []).filter(q => q !== question) });
  };

  const toggleSearchIntent = (intent: string) => {
    const current = data.searchIntent || [];
    if (current.includes(intent)) {
      onUpdate({ searchIntent: current.filter((i) => i !== intent) });
    } else {
      onUpdate({ searchIntent: [...current, intent] });
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !data.secondaryKeywords.includes(keywordInput.trim())) {
      onUpdate({ secondaryKeywords: [...data.secondaryKeywords, keywordInput.trim()] });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    onUpdate({ secondaryKeywords: data.secondaryKeywords.filter(k => k !== keyword) });
  };

  const canProceed = data.focusKeyword && data.wordCount && data.headingStructure;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Schritt 3: Text-Struktur</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Definieren Sie den Aufbau und die Struktur des gewünschten Textes
        </p>
      </div>

      <ValidationWarnings warnings={validationWarnings} />

      <div className="space-y-4">
        {/* Keywords */}
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

        {/* Suchintention */}
        <div>
          <Label className="text-base font-semibold">Suchintention</Label>
          <p className="text-xs text-muted-foreground mb-2">Welche Absicht hat der Nutzer bei der Suche? (mehrfach möglich)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { value: "know", label: "Know", desc: "Information suchen" },
              { value: "do", label: "Do", desc: "Aktion ausführen" },
              { value: "buy", label: "Buy", desc: "Kaufen/vergleichen" },
              { value: "go", label: "Go", desc: "Zu Seite navigieren" },
              { value: "visit", label: "Visit", desc: "Vor Ort besuchen" },
            ].map((intent) => (
              <label
                key={intent.value}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  (data.searchIntent || []).includes(intent.value)
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={(data.searchIntent || []).includes(intent.value)}
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
          <Label htmlFor="keywordDensity">Keyword-Dichte</Label>
          <p className="text-xs text-muted-foreground mb-2">Wie oft soll das Fokus-Keyword im Text vorkommen?</p>
          <Select value={data.keywordDensity || "normal"} onValueChange={(value) => onUpdate({ keywordDensity: value })}>
            <SelectTrigger id="keywordDensity">
              <SelectValue placeholder="Keyword-Dichte wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimal">Minimal (0.5-1%) - Sehr natürlich</SelectItem>
              <SelectItem value="normal">Normal (1-2%) - Empfohlen</SelectItem>
              <SelectItem value="high">Hoch (2-3%) - Stärker optimiert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KI-Modell Auswahl */}
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
          <ModelSelector
            value={data.aiModel || 'gemini-flash'}
            onChange={(model) => onUpdate({ aiModel: model })}
            wordCount={data.wordCount}
            showCostEstimate={true}
          />
        </div>

        {/* W-Fragen */}
        <div>
          <Label>W-Fragen (SEO-relevant)</Label>
          <p className="text-xs text-muted-foreground mb-2">Fragen, die im Text beantwortet werden sollen (Was, Wie, Warum...)</p>
          <div className="flex gap-2 mb-2">
            <Input
              value={wQuestionInput}
              onChange={(e) => setWQuestionInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addWQuestion())}
              placeholder="z.B. Was ist...? Wie funktioniert...?"
            />
            <Button type="button" onClick={addWQuestion} variant="outline">
              Hinzufügen
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(data.wQuestions || []).map((question) => (
              <Badge key={question} variant="outline" className="bg-blue-500/10 border-blue-500/30">
                {question}
                <button onClick={() => removeWQuestion(question)} className="ml-2">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Seitenlayout-Struktur */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Seitenlayout-Struktur</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLayoutPreview(!showLayoutPreview)}
            >
              <Info className="h-4 w-4 mr-1" />
              {showLayoutPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Einleitung/Kurzbeschreibung</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeIntro"
                  checked={data.includeIntro}
                  onCheckedChange={(checked) => onUpdate({ includeIntro: checked as boolean })}
                />
                <label htmlFor="includeIntro" className="text-sm cursor-pointer">
                  Einleitungstext am Anfang der Seite (empfohlen)
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Kurze Einführung, die das Thema vorstellt und den Leser einstimmt
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageTextBlocks">Text-Bild-Blöcke (abwechselnd links/rechts)</Label>
              <Select
                value={data.imageTextBlocks?.toString() || "0"}
                onValueChange={(value) => onUpdate({ imageTextBlocks: parseInt(value) })}
              >
                <SelectTrigger id="imageTextBlocks">
                  <SelectValue placeholder="Anzahl wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Keine Bild-Text-Blöcke</SelectItem>
                  <SelectItem value="2">2 Bild-Text-Blöcke</SelectItem>
                  <SelectItem value="3">3 Bild-Text-Blöcke</SelectItem>
                  <SelectItem value="4">4 Bild-Text-Blöcke</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Textblöcke mit Bildern, die abwechselnd links und rechts angeordnet sind (z.B. für Features, Vorteile)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tab-Struktur</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTabs"
                  checked={data.includeTabs}
                  onCheckedChange={(checked) => onUpdate({ includeTabs: checked as boolean })}
                />
                <label htmlFor="includeTabs" className="text-sm cursor-pointer">
                  Tabs für zusätzliche Informationen
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Organisiert Inhalte in Tabs (z.B. Technische Daten | Anwendung | Zubehör | Downloads)
              </p>
            </div>

            <div className="space-y-2">
              <Label>FAQ-Bereich</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFAQ"
                  checked={data.includeFAQ}
                  onCheckedChange={(checked) => onUpdate({ includeFAQ: checked as boolean })}
                />
                <label htmlFor="includeFAQ" className="text-sm cursor-pointer">
                  FAQ-Bereich am Ende der Seite
                </label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Häufig gestellte Fragen mit Antworten (gut für SEO und Nutzererfahrung)
              </p>
            </div>
          </div>

          {showLayoutPreview && (
            <Card className="p-4 bg-background mt-4">
              <h4 className="text-sm font-semibold mb-3">📐 Layout-Vorschau:</h4>
              <div className="space-y-2 text-xs">
                {data.includeIntro && (
                  <div className="p-3 bg-primary/10 rounded border border-primary/20">
                    <div className="font-semibold mb-1">📝 Einleitung</div>
                    <div className="text-muted-foreground">Einführender Text mit Fokus-Keyword</div>
                  </div>
                )}
                
                {data.imageTextBlocks > 0 && (
                  <div className="space-y-1">
                    <div className="font-semibold text-xs text-muted-foreground mb-1">
                      🖼️ Bild-Text-Blöcke:
                    </div>
                    {Array.from({ length: data.imageTextBlocks }).map((_, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded border flex items-center gap-2 ${
                          i % 2 === 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-green-500/10 border-green-500/20'
                        }`}
                      >
                        {i % 2 === 0 ? (
                          <>
                            <span>🖼️ Bild</span>
                            <span className="text-muted-foreground">→</span>
                            <span>📄 Text Block {i + 1}</span>
                          </>
                        ) : (
                          <>
                            <span>📄 Text Block {i + 1}</span>
                            <span className="text-muted-foreground">→</span>
                            <span>🖼️ Bild</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {data.includeTabs && (
                  <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                    <div className="font-semibold mb-1">📑 Tab-Bereich</div>
                    <div className="text-muted-foreground flex gap-2">
                      <span className="px-2 py-1 bg-background rounded text-[10px]">Technische Daten</span>
                      <span className="px-2 py-1 bg-background rounded text-[10px]">Anwendung</span>
                      <span className="px-2 py-1 bg-background rounded text-[10px]">Zubehör</span>
                    </div>
                  </div>
                )}

                {data.includeFAQ && (
                  <div className="p-3 bg-orange-500/10 rounded border border-orange-500/20">
                    <div className="font-semibold mb-1">❓ FAQ-Bereich</div>
                    <div className="text-muted-foreground">Häufig gestellte Fragen & Antworten</div>
                  </div>
                )}

                {!data.includeIntro && data.imageTextBlocks === 0 && !data.includeTabs && !data.includeFAQ && (
                  <div className="p-3 text-center text-muted-foreground">
                    Wählen Sie Layout-Elemente aus, um eine Vorschau zu sehen
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Zusätzliche Struktur-Hinweise */}
        <div className="space-y-2">
          <Label htmlFor="contentStructure">Zusätzliche Struktur-Hinweise (optional)</Label>
          <Textarea
            id="contentStructure"
            value={data.contentStructure}
            onChange={(e) => onUpdate({ contentStructure: e.target.value })}
            placeholder="Weitere spezifische Anforderungen an die Textstruktur, z.B. besondere Abschnitte, Hervorhebungen..."
            rows={2}
          />
        </div>

        {/* Textlänge */}
        <div>
          <Label htmlFor="wordCount">Textlänge *</Label>
          <Select value={data.wordCount} onValueChange={(value) => onUpdate({ wordCount: value })}>
            <SelectTrigger id="wordCount">
              <SelectValue placeholder="Textlänge wählen" />
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

        {/* Max. Absatzlänge */}
        <div>
          <Label htmlFor="maxParagraphLength">Max. Absatzlänge (Wörter pro Absatz)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Kürzere Absätze verbessern die Lesbarkeit (Evergreen Media Empfehlung: max. 300 Wörter)
          </p>
          <Select 
            value={data.maxParagraphLength || "300"} 
            onValueChange={(value) => onUpdate({ maxParagraphLength: value })}
          >
            <SelectTrigger id="maxParagraphLength">
              <SelectValue placeholder="Max. Absatzlänge wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="150">Kurz (max. 150 Wörter) - Sehr lesefreundlich</SelectItem>
              <SelectItem value="300">Standard (max. 300 Wörter) - Empfohlen</SelectItem>
              <SelectItem value="500">Lang (max. 500 Wörter) - Für Fachtexte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Überschriftenstruktur */}
        <div>
          <Label htmlFor="headingStructure">Überschriften-Struktur *</Label>
          <Select value={data.headingStructure} onValueChange={(value) => onUpdate({ headingStructure: value })}>
            <SelectTrigger id="headingStructure">
              <SelectValue placeholder="Struktur wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h2-only">Nur H2 (flache Struktur)</SelectItem>
              <SelectItem value="h2-h3">H2 + H3 (zweistufig, empfohlen)</SelectItem>
              <SelectItem value="h2-h3-h4">H2 + H3 + H4 (dreistufig)</SelectItem>
              <SelectItem value="full">Vollständig (H2 bis H5)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seitenziel */}
        <div>
          <Label htmlFor="pageGoal">Seitenziel / Call-to-Action</Label>
          <Textarea
            id="pageGoal"
            value={data.pageGoal}
            onChange={(e) => onUpdate({ pageGoal: e.target.value })}
            placeholder="Was soll der Leser tun? (z.B. Kontakt aufnehmen, Produkt kaufen, mehr erfahren, beraten lassen)"
            rows={2}
          />
        </div>

        {/* Compliance */}
        <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
          <Label className="text-base font-semibold">⚖️ Compliance-Prüfungen</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Aktivieren Sie Prüfungen für regulierte Branchen (Medizintechnik, Healthcare)
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mdr"
                checked={data.complianceChecks.mdr}
                onCheckedChange={(checked) => 
                  onUpdate({ 
                    complianceChecks: { ...data.complianceChecks, mdr: checked as boolean } 
                  })
                }
              />
              <Label htmlFor="mdr" className="font-normal cursor-pointer">
                MDR/MPDG-Konformität (Medizinprodukterecht)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hwg"
                checked={data.complianceChecks.hwg}
                onCheckedChange={(checked) => 
                  onUpdate({ 
                    complianceChecks: { ...data.complianceChecks, hwg: checked as boolean } 
                  })
                }
              />
              <Label htmlFor="hwg" className="font-normal cursor-pointer">
                HWG-Konformität (Heilmittelwerbegesetz)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="studies"
                checked={data.complianceChecks.studies}
                onCheckedChange={(checked) => 
                  onUpdate({ 
                    complianceChecks: { ...data.complianceChecks, studies: checked as boolean } 
                  })
                }
              />
              <Label htmlFor="studies" className="font-normal cursor-pointer">
                Studienbasierte Aussagen prüfen
              </Label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Zurück
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          {canProceed ? 'Weiter zu Schritt 4' : 'Bitte alle Pflichtfelder ausfüllen'}
        </Button>
      </div>
    </div>
  );
};
