import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, PenTool, Eye, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseCriteria {
  id: string;
  label: string;
  check: (text: string) => boolean;
  tip: string;
}

interface InteractiveExerciseProps {
  title: string;
  description: string;
  task: string;
  placeholder?: string;
  criteria: ExerciseCriteria[];
  sampleSolution?: string;
  onComplete?: () => void;
}

export const InteractiveExercise = ({ 
  title, 
  description, 
  task, 
  placeholder,
  criteria,
  sampleSolution,
  onComplete 
}: InteractiveExerciseProps) => {
  const [text, setText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const results = criteria.map(c => ({
    ...c,
    passed: c.check(text)
  }));

  const passedCount = results.filter(r => r.passed).length;
  const allPassed = passedCount === criteria.length;

  const handleCheck = () => {
    setShowResults(true);
    if (allPassed) {
      onComplete?.();
    }
  };

  const handleReset = () => {
    setText("");
    setShowResults(false);
    setShowSolution(false);
  };

  return (
    <Card className="border-2 border-dashed border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            <PenTool className="h-3 w-3 mr-1" />
            Übung
          </Badge>
          {showResults && (
            <Badge variant={allPassed ? "default" : "secondary"} className={allPassed ? "bg-green-500" : ""}>
              {passedCount}/{criteria.length} Kriterien erfüllt
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg border">
          <h4 className="font-medium text-sm mb-2">📝 Aufgabe:</h4>
          <p className="text-sm text-muted-foreground">{task}</p>
        </div>

        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setShowResults(false);
          }}
          placeholder={placeholder || "Schreiben Sie hier Ihren Text..."}
          className="min-h-[150px] resize-y"
        />

        {showResults && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Auswertung:</h4>
            {results.map((result) => (
              <div
                key={result.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  result.passed 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-amber-500/10 border-amber-500/30"
                )}
              >
                <CheckCircle2 className={cn(
                  "h-4 w-4 shrink-0 mt-0.5",
                  result.passed ? "text-green-500" : "text-amber-500"
                )} />
                <div className="flex-1">
                  <span className={cn(
                    "text-sm font-medium",
                    result.passed ? "text-green-700" : "text-amber-700"
                  )}>
                    {result.label}
                  </span>
                  {!result.passed && (
                    <p className="text-xs text-amber-600 mt-1">💡 {result.tip}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showSolution && sampleSolution && (
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Musterlösung:</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{sampleSolution}</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleCheck} disabled={!text.trim()} className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            Auswerten
          </Button>
          {sampleSolution && (
            <Button 
              variant="outline" 
              onClick={() => setShowSolution(!showSolution)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {showSolution ? "Lösung ausblenden" : "Musterlösung"}
            </Button>
          )}
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
