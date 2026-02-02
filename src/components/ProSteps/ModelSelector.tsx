import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Crown } from "lucide-react";

export type AIModel = 'gemini-flash' | 'gemini-pro' | 'claude-sonnet';

interface ModelConfig {
  id: AIModel;
  name: string;
  description: string;
  costPer1kWords: number; // in cents
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
}

export const AI_MODELS: ModelConfig[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Schnell & günstig – ideal für Bulk-Content',
    costPer1kWords: 0.7, // ~0.7 Cent pro 1000 Wörter
    icon: <Zap className="h-4 w-4 text-yellow-500" />,
    badge: 'Standard',
    badgeVariant: 'secondary',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Bessere Struktur & SEO-Optimierung',
    costPer1kWords: 2.5, // ~2.5 Cent pro 1000 Wörter
    icon: <Sparkles className="h-4 w-4 text-blue-500" />,
  },
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Beste Qualität – menschlichster Schreibstil',
    costPer1kWords: 5, // ~5 Cent pro 1000 Wörter
    icon: <Crown className="h-4 w-4 text-purple-500" />,
    badge: 'Premium',
    badgeVariant: 'default',
  },
];

// Cost estimation based on word count
export function estimateCost(model: AIModel, wordCount: string, variants: number = 3): {
  perVariant: number;
  total: number;
  formatted: string;
} {
  const modelConfig = AI_MODELS.find(m => m.id === model);
  if (!modelConfig) return { perVariant: 0, total: 0, formatted: '0 Cent' };

  const words = parseInt(wordCount) || 1000;
  const costPerVariant = (words / 1000) * modelConfig.costPer1kWords;
  const totalCost = costPerVariant * variants;

  return {
    perVariant: costPerVariant,
    total: totalCost,
    formatted: totalCost < 1
      ? `~${(totalCost * 100).toFixed(1)} Cent`
      : `~${totalCost.toFixed(2)} Cent`,
  };
}

interface ModelSelectorProps {
  value: AIModel;
  onChange: (model: AIModel) => void;
  wordCount?: string;
  showCostEstimate?: boolean;
}

export const ModelSelector = ({
  value,
  onChange,
  wordCount = '1000',
  showCostEstimate = true
}: ModelSelectorProps) => {
  const selectedModel = AI_MODELS.find(m => m.id === value) || AI_MODELS[0];
  const costEstimate = estimateCost(value, wordCount, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">🤖 KI-Modell</Label>
        {showCostEstimate && (
          <span className="text-xs text-muted-foreground">
            Geschätzte Kosten (3 Varianten): <strong>{costEstimate.formatted}</strong>
          </span>
        )}
      </div>

      <Select value={value} onValueChange={(v) => onChange(v as AIModel)}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              {selectedModel.icon}
              <span>{selectedModel.name}</span>
              {selectedModel.badge && (
                <Badge variant={selectedModel.badgeVariant} className="ml-2 text-[10px]">
                  {selectedModel.badge}
                </Badge>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {AI_MODELS.map((model) => {
            const modelCost = estimateCost(model.id, wordCount, 3);
            return (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2">
                    {model.icon}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.name}</span>
                        {model.badge && (
                          <Badge variant={model.badgeVariant} className="text-[10px]">
                            {model.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {modelCost.formatted}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Model comparison hint */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
        {value === 'gemini-flash' && (
          <span>⚡ <strong>Gemini Flash</strong>: Schnellste Option, ideal für Produkttexte und Kategorieseiten.</span>
        )}
        {value === 'gemini-pro' && (
          <span>✨ <strong>Gemini Pro</strong>: Bessere Tiefe und Struktur, gut für umfangreiche Guides.</span>
        )}
        {value === 'claude-sonnet' && (
          <span>👑 <strong>Claude Sonnet</strong>: Menschlichster Schreibstil, ideal für Blog-Artikel und hochwertige Landingpages.</span>
        )}
      </div>
    </div>
  );
};
