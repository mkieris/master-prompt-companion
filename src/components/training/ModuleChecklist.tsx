import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Download, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ChecklistItem {
  id: string;
  text: string;
  tip?: string;
}

interface ModuleChecklistProps {
  moduleId: string;
  title: string;
  items: ChecklistItem[];
  description?: string;
}

export const ModuleChecklist = ({ moduleId, title, items, description }: ModuleChecklistProps) => {
  const storageKey = `seo-checklist-${moduleId}`;
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setCheckedItems(JSON.parse(saved));
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checkedItems));
  }, [checkedItems, storageKey]);

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const resetChecklist = () => {
    setCheckedItems([]);
    localStorage.removeItem(storageKey);
  };

  const downloadChecklist = () => {
    const text = `${title}\n${"=".repeat(title.length)}\n\n${items.map(item => 
      `[ ] ${item.text}${item.tip ? `\n    💡 ${item.tip}` : ""}`
    ).join("\n\n")}`;
    
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkliste-${moduleId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progress = Math.round((checkedItems.length / items.length) * 100);

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-green-600" />
            ✅ {title}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={resetChecklist} className="h-8 px-2" title="Zurücksetzen">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadChecklist} className="h-8 px-2" title="Herunterladen">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-green-600">{progress}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <label 
            key={item.id} 
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
              checkedItems.includes(item.id) 
                ? "bg-green-500/20 border border-green-500/30" 
                : "bg-background/60 hover:bg-muted/50 border border-transparent"
            }`}
          >
            <Checkbox 
              checked={checkedItems.includes(item.id)}
              onCheckedChange={() => toggleItem(item.id)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <span className={`text-sm ${checkedItems.includes(item.id) ? "line-through text-muted-foreground" : ""}`}>
                {item.text}
              </span>
              {item.tip && !checkedItems.includes(item.id) && (
                <p className="text-xs text-muted-foreground mt-1">💡 {item.tip}</p>
              )}
            </div>
          </label>
        ))}
      </CardContent>
    </Card>
  );
};
