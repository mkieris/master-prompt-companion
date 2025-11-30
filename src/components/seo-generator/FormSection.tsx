import { ReactNode, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  isComplete?: boolean;
  stepNumber?: number;
}

export const FormSection = ({ 
  title, 
  description, 
  icon, 
  children, 
  defaultOpen = true,
  isComplete,
  stepNumber
}: FormSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200",
      isComplete && "border-success/50"
    )}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {stepNumber && (
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              isComplete 
                ? "bg-success text-success-foreground" 
                : "bg-primary/10 text-primary"
            )}>
              {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
          )}
          {icon && !stepNumber && (
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <div className="text-left">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <Badge variant="secondary" className="bg-success/10 text-success border-0">
              Fertig
            </Badge>
          )}
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>
      
      <div className={cn(
        "grid transition-all duration-200",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="p-4 pt-0 border-t border-border">
            {children}
          </div>
        </div>
      </div>
    </Card>
  );
};
