import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Trophy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ModuleProgressProps {
  modules: Module[];
  activeModule: string;
  completedModules: string[];
  onModuleClick: (moduleId: string) => void;
}

export const ModuleProgress = ({ 
  modules, 
  activeModule, 
  completedModules, 
  onModuleClick 
}: ModuleProgressProps) => {
  const progress = Math.round((completedModules.length / modules.length) * 100);

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Module</CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedModules.length}/{modules.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
        {progress === 100 && (
          <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
            <Trophy className="h-4 w-4" />
            <span>Alle Module abgeschlossen!</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1 p-2">
        {modules.map((module) => {
          const Icon = module.icon;
          const isCompleted = completedModules.includes(module.id);
          const isActive = activeModule === module.id;

          return (
            <button
              key={module.id}
              onClick={() => onModuleClick(module.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-4 w-4 shrink-0" />
                {isCompleted && !isActive && (
                  <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500 bg-background rounded-full" />
                )}
              </div>
              <span className="flex-1">{module.label}</span>
              {isCompleted && isActive && (
                <CheckCircle2 className="h-4 w-4 text-green-300" />
              )}
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                isActive && "rotate-90"
              )} />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};
