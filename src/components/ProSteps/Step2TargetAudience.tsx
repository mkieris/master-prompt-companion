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
          <Select value={data.tonality} onValueChange={(value) => onUpdate({ tonality: value })}>
            <SelectTrigger id="tonality">
              <SelectValue placeholder="Tonalität wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professionell & Sachlich</SelectItem>
              <SelectItem value="friendly">Freundlich & Zugänglich</SelectItem>
              <SelectItem value="scientific">Wissenschaftlich & Präzise</SelectItem>
              <SelectItem value="empathetic">Empathisch & Verständnisvoll</SelectItem>
              <SelectItem value="authoritative">Autoritativ & Überzeugend</SelectItem>
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
