import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface GeneratorHeaderProps {
  variant: "basic" | "pro";
  onSwitchVariant?: () => void;
}

export const GeneratorHeader = ({ variant, onSwitchVariant }: GeneratorHeaderProps) => {
  const navigate = useNavigate();
  const isBasic = variant === "basic";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                {isBasic ? (
                  <Zap className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground">
                    SEO Content Generator
                  </h1>
                  <Badge 
                    variant={isBasic ? "secondary" : "default"}
                    className={isBasic ? "" : "bg-gradient-to-r from-primary to-accent border-0"}
                  >
                    {isBasic ? "BASIC" : "PRO"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {isBasic 
                    ? "Schnelle SEO-Texte mit einem Klick" 
                    : "Erweiterte Features mit Research & Compliance"
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isBasic ? "default" : "outline"}
              size="sm"
              onClick={() => navigate(isBasic ? "/pro" : "/basic")}
              className="hidden sm:flex"
            >
              {isBasic ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Zur Pro-Version
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Zur Basic-Version
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
