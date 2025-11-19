import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Step2Data {
  targetAudience: string;
  formOfAddress: string;
  language: string;
  tonality: string;
}

interface Step2Props {
  data: Step2Data;
  onUpdate: (data: Partial<Step2Data>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2TargetAudience = ({ data, onUpdate, onNext, onBack }: Step2Props) => {
  const canProceed = data.targetAudience && data.formOfAddress && data.language && data.tonality;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Schritt 2: Zielgruppe & Ansprache</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Definieren Sie Ihre Zielgruppe und die gewünschte Kommunikationsweise
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Zielgruppe *</Label>
          <RadioGroup value={data.targetAudience} onValueChange={(value) => onUpdate({ targetAudience: value })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b2b" id="b2b" />
              <Label htmlFor="b2b">B2B (Fachpublikum)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="b2c" id="b2c" />
              <Label htmlFor="b2c">B2C (Endverbraucher)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mixed" id="mixed" />
              <Label htmlFor="mixed">Gemischt</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label>Anredeform *</Label>
          <RadioGroup value={data.formOfAddress} onValueChange={(value) => onUpdate({ formOfAddress: value })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="du" id="du" />
              <Label htmlFor="du">Du</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sie" id="sie" />
              <Label htmlFor="sie">Sie</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="language">Sprache *</Label>
          <Select value={data.language} onValueChange={(value) => onUpdate({ language: value })}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Sprache wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="en">Englisch</SelectItem>
              <SelectItem value="fr">Französisch</SelectItem>
              <SelectItem value="es">Spanisch</SelectItem>
              <SelectItem value="it">Italienisch</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tonality">Tonalität *</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Perfekte Mischung aus Fachwissen, Storytelling und Lösungsorientierung
          </p>
          <Select value={data.tonality} onValueChange={(value) => onUpdate({ tonality: value })}>
            <SelectTrigger id="tonality">
              <SelectValue placeholder="Tonalität wählen" />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              <SelectItem value="expert-mix">
                <div className="flex flex-col gap-1 py-1">
                  <span className="font-semibold">Expertenmix</span>
                  <span className="text-xs text-muted-foreground">70% Fachwissen • 20% Lösung • 10% Story</span>
                  <span className="text-xs">Für B2B-Entscheider & wissenschaftliche Produkte</span>
                </div>
              </SelectItem>
              
              <SelectItem value="consultant-mix">
                <div className="flex flex-col gap-1 py-1">
                  <span className="font-semibold">Beratermix</span>
                  <span className="text-xs text-muted-foreground">40% Fachwissen • 40% Lösung • 20% Story</span>
                  <span className="text-xs">Für Vergleichsphase & Problem-aware Käufer</span>
                </div>
              </SelectItem>
              
              <SelectItem value="storytelling-mix">
                <div className="flex flex-col gap-1 py-1">
                  <span className="font-semibold">Storytelling-Mix</span>
                  <span className="text-xs text-muted-foreground">30% Fachwissen • 30% Lösung • 40% Story</span>
                  <span className="text-xs">Für emotional getriebene Käufe & Lifestyle-Produkte</span>
                </div>
              </SelectItem>
              
              <SelectItem value="conversion-mix">
                <div className="flex flex-col gap-1 py-1">
                  <span className="font-semibold">Conversion-Mix</span>
                  <span className="text-xs text-muted-foreground">20% Fachwissen • 60% Lösung • 20% Story</span>
                  <span className="text-xs">Für Produktseiten & klare Problemlösungen</span>
                </div>
              </SelectItem>
              
              <SelectItem value="balanced-mix">
                <div className="flex flex-col gap-1 py-1">
                  <span className="font-semibold">Balanced-Mix</span>
                  <span className="text-xs text-muted-foreground">33% Fachwissen • 33% Lösung • 33% Story</span>
                  <span className="text-xs">Für ganzheitliche Landingpages & Kategorie-Seiten</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Zurück
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Weiter zu Schritt 3
        </Button>
      </div>
    </div>
  );
};
