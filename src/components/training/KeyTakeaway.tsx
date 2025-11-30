import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface KeyTakeawayProps {
  points: string[];
  title?: string;
}

export const KeyTakeaway = ({ points, title = "Key Takeaways" }: KeyTakeawayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = points.map((p, i) => `${i + 1}. ${p}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Kopiert!",
      description: "Die Key Takeaways wurden in die Zwischenablage kopiert.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-amber-800">{title}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy}
            className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <ol className="space-y-2">
          {points.map((point, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-amber-900">{point}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};
