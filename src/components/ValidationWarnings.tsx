import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ValidationWarning } from "@/utils/promptValidation";

interface ValidationWarningsProps {
  warnings: ValidationWarning[];
}

export function ValidationWarnings({ warnings }: ValidationWarningsProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (warnings.length === 0) return null;

  const visibleWarnings = warnings.filter((_, index) => !dismissed.has(index));

  if (visibleWarnings.length === 0) return null;

  const criticalWarnings = visibleWarnings.filter(w => w.severity === 'warning');
  const infoWarnings = visibleWarnings.filter(w => w.severity === 'info');

  return (
    <div className="space-y-3 mb-6">
      {/* Critical Warnings */}
      {criticalWarnings.map((warning, index) => (
        <Alert key={`warning-${index}`} variant="destructive" className="relative">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="pr-8">{warning.message}</AlertTitle>
          <AlertDescription className="mt-2 text-sm">
            <strong>Empfehlung:</strong> {warning.suggestion}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => setDismissed(new Set([...dismissed, warnings.indexOf(warning)]))}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}

      {/* Info Warnings */}
      {infoWarnings.map((warning, index) => (
        <Alert key={`info-${index}`} className="relative border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="pr-8 text-blue-900 dark:text-blue-100">{warning.message}</AlertTitle>
          <AlertDescription className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            <strong>Tipp:</strong> {warning.suggestion}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => setDismissed(new Set([...dismissed, warnings.indexOf(warning)]))}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
