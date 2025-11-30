import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, HelpCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuizQuestionProps {
  question: string;
  options: QuizOption[];
  hint?: string;
  onComplete?: (isCorrect: boolean) => void;
}

export const QuizQuestion = ({ question, options, hint, onComplete }: QuizQuestionProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSelect = (optionId: string) => {
    if (showResult) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    setShowResult(true);
    const isCorrect = options.find(o => o.id === selectedOption)?.isCorrect || false;
    onComplete?.(isCorrect);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setShowResult(false);
    setShowHint(false);
  };

  const selectedOptionData = options.find(o => o.id === selectedOption);
  const isCorrect = selectedOptionData?.isCorrect;

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <HelpCircle className="h-3 w-3 mr-1" />
            Quiz
          </Badge>
          {showResult && (
            <Badge variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-green-500" : ""}>
              {isCorrect ? "Richtig!" : "Nicht ganz..."}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg mt-2">{question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const showCorrectness = showResult;
          
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={showResult}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-all",
                !showResult && isSelected && "border-primary bg-primary/10",
                !showResult && !isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
                showResult && option.isCorrect && "border-green-500 bg-green-500/10",
                showResult && isSelected && !option.isCorrect && "border-red-500 bg-red-500/10",
                showResult && "cursor-default"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                  !showResult && isSelected && "border-primary bg-primary text-primary-foreground",
                  !showResult && !isSelected && "border-muted-foreground",
                  showResult && option.isCorrect && "border-green-500 bg-green-500 text-white",
                  showResult && isSelected && !option.isCorrect && "border-red-500 bg-red-500 text-white"
                )}>
                  {showResult && option.isCorrect && <CheckCircle2 className="h-4 w-4" />}
                  {showResult && isSelected && !option.isCorrect && <XCircle className="h-4 w-4" />}
                  {!showResult && isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                </div>
                <div className="flex-1">
                  <span className={cn(
                    "text-sm",
                    showResult && option.isCorrect && "text-green-700 font-medium",
                    showResult && isSelected && !option.isCorrect && "text-red-700"
                  )}>
                    {option.text}
                  </span>
                  {showResult && isSelected && option.explanation && (
                    <p className={cn(
                      "text-xs mt-2 p-2 rounded",
                      option.isCorrect ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"
                    )}>
                      {option.explanation}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {hint && !showResult && (
          <div className="pt-2">
            {!showHint ? (
              <Button variant="ghost" size="sm" onClick={() => setShowHint(true)} className="text-muted-foreground">
                <Lightbulb className="h-4 w-4 mr-1" />
                Hinweis anzeigen
              </Button>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">{hint}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!selectedOption} className="flex-1">
              Antwort prüfen
            </Button>
          ) : (
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Nochmal versuchen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
