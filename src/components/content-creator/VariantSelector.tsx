import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import type { GeneratedContent } from "@/pages/ContentCreator";

interface VariantSelectorProps {
  variants: GeneratedContent[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const variantInfo = [
  {
    name: "Variante A",
    description: "Sachlich & Strukturiert",
    icon: "A",
    color: "bg-blue-500",
  },
  {
    name: "Variante B",
    description: "Nutzenorientiert & Aktivierend",
    icon: "B",
    color: "bg-green-500",
  },
  {
    name: "Variante C",
    description: "Nahbar & Authentisch",
    icon: "C",
    color: "bg-purple-500",
  },
];

export const VariantSelector = ({
  variants,
  selectedIndex,
  onSelect,
}: VariantSelectorProps) => {
  if (variants.length <= 1) return null;

  return (
    <Card className="mb-4 p-3 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">3 Varianten generiert</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {variantInfo[selectedIndex]?.description}
        </Badge>
      </div>

      <Tabs
        value={String(selectedIndex)}
        onValueChange={(v) => onSelect(Number(v))}
      >
        <TabsList className="grid w-full grid-cols-3">
          {variantInfo.slice(0, variants.length).map((info, idx) => (
            <TabsTrigger
              key={idx}
              value={String(idx)}
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span
                className={`w-5 h-5 rounded-full ${info.color} text-white text-xs flex items-center justify-center font-bold`}
              >
                {info.icon}
              </span>
              <span className="hidden sm:inline text-sm">{info.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-2 text-xs text-muted-foreground text-center">
        Klicken Sie auf eine Variante, um sie im Editor zu bearbeiten
      </div>
    </Card>
  );
};
