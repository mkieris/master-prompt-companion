import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
            index < currentStep
              ? "bg-primary/20 text-primary"
              : index === currentStep
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {index < currentStep ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <span className="w-4 text-center">{index + 1}</span>
          )}
          {step.label}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
