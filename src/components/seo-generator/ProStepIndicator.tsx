import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  shortTitle: string;
}

interface ProStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  completedSteps?: number[];
}

export const ProStepIndicator = ({ 
  steps, 
  currentStep, 
  onStepClick,
  completedSteps = []
}: ProStepIndicatorProps) => {
  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id) || step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = onStepClick && (isCompleted || step.id <= currentStep);

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 group transition-all",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-default"
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    isCompleted && "bg-success text-success-foreground",
                    isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <div className="hidden lg:block text-left">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                </div>
              </button>
              
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 bg-muted rounded">
                  <div 
                    className={cn(
                      "h-full bg-primary rounded transition-all duration-300",
                      isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex items-center justify-between px-2">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id) || step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center gap-1",
                isCurrent && "scale-110"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  isCompleted && "bg-success text-success-foreground",
                  isCurrent && !isCompleted && "bg-primary text-primary-foreground",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.shortTitle}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
