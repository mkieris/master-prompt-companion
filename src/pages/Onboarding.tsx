import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Globe, ArrowRight, Sparkles } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useOrganization } from "@/hooks/useOrganization";

interface OnboardingProps {
  session: Session | null;
}

const Onboarding = ({ session }: OnboardingProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createOrganization } = useOrganization(session);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    website: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte gib einen Firmennamen ein.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const result = await createOrganization(formData.companyName, formData.website);

    if (result.error) {
      toast({
        title: "Fehler",
        description: result.error,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Willkommen!",
      description: `${formData.companyName} wurde erfolgreich erstellt.`,
    });

    navigate("/dashboard");
  };

  if (!session) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">Willkommen bei SEO Toolbox</CardTitle>
              <CardDescription className="text-base mt-2">
                Erstelle dein Unternehmensprofil, um zu starten
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Firmenname
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="z.B. Muster GmbH"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website (optional)
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.beispiel.de"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="h-12"
                    />
                    <p className="text-xs text-muted-foreground">
                      Die Website wird später für das Domain Learning verwendet
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base"
                    disabled={isLoading || !formData.companyName.trim()}
                  >
                    {isLoading ? (
                      "Wird erstellt..."
                    ) : (
                      <>
                        Unternehmen erstellen
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Du kannst später weitere Teammitglieder einladen
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
