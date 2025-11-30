import { Card, CardContent } from "@/components/ui/card";
import { Brain, Lightbulb, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MemoryBoxProps {
  title: string;
  mnemonic?: string;
  mnemonicExplanation?: string;
  keyPoints: string[];
  visualHook?: string;
}

export const MemoryBox = ({ title, mnemonic, mnemonicExplanation, keyPoints, visualHook }: MemoryBoxProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = `${title}\n${mnemonic ? `Eselsbrücke: ${mnemonic}\n` : ""}${keyPoints.map(p => `• ${p}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("In die Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-primary/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">🧠 {title}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8 px-2">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          {mnemonic && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-amber-700 text-sm">Eselsbrücke</span>
              </div>
              <p className="font-bold text-lg">{mnemonic}</p>
              {mnemonicExplanation && (
                <p className="text-sm text-muted-foreground mt-1">{mnemonicExplanation}</p>
              )}
            </div>
          )}

          {visualHook && (
            <div className="text-center py-2 text-3xl">{visualHook}</div>
          )}

          <div className="space-y-2">
            {keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-background/60 rounded-lg">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-medium">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
