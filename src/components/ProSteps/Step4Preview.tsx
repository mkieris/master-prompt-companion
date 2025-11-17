import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

interface Step4Props {
  generatedContent: any;
  onRefine: (prompt: string) => Promise<void>;
  onBack: () => void;
  onFinish: () => void;
  isRefining: boolean;
}

export const Step4Preview = ({ generatedContent, onRefine, onBack, onFinish, isRefining }: Step4Props) => {
  const [refinePrompt, setRefinePrompt] = useState("");

  const handleRefine = async () => {
    if (!refinePrompt.trim()) return;
    await onRefine(refinePrompt);
    setRefinePrompt("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Schritt 4: Vorschau & Überarbeitung</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Überprüfen Sie den generierten Text und passen Sie ihn bei Bedarf an
        </p>
      </div>

      {generatedContent ? (
        <div className="space-y-4">
          <Card className="p-4 max-h-[500px] overflow-y-auto">
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-2">{generatedContent.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{generatedContent.metaDescription}</p>
              <div className="whitespace-pre-wrap">{generatedContent.text}</div>
            </div>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="refinePrompt">Text überarbeiten</Label>
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
        <Button onClick={onFinish}>
          Fertigstellen
        </Button>
      </div>
    </div>
  );
};
