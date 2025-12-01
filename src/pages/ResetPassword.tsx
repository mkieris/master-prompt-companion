import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    // Listen for auth state changes - important for recovery flow
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event, "Session:", !!session);
        
        if (event === "PASSWORD_RECOVERY") {
          // User clicked on the recovery link - they can now set a new password
          setHasValidSession(true);
          setIsCheckingSession(false);
        } else if (event === "SIGNED_IN" && session) {
          // Check if this is a recovery session by looking at the URL or event
          setHasValidSession(true);
          setIsCheckingSession(false);
        } else if (event === "USER_UPDATED") {
          // Password was successfully updated
          setIsSuccess(true);
        }
      }
    );

    // Also check the current session after a short delay to allow token processing
    const checkSession = async () => {
      // Give Supabase client time to process any URL tokens
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setHasValidSession(true);
      } else {
        // No session found - check if there's a hash in the URL (recovery link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");
        
        if (accessToken && type === "recovery") {
          // There's a recovery token in the URL, Supabase should process it
          // Wait a bit more for the auth state change
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            setHasValidSession(true);
          } else {
            // Still no session - the link might be expired
            toast({
              title: "Link abgelaufen",
              description: "Der Link zum Zurücksetzen des Passworts ist abgelaufen. Bitte fordern Sie einen neuen an.",
              variant: "destructive",
            });
            navigate("/auth");
            return;
          }
        } else {
          // No recovery token and no session - redirect to auth
          toast({
            title: "Ungültiger Zugriff",
            description: "Bitte fordern Sie einen neuen Link zum Zurücksetzen des Passworts an.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }
      }
      
      setIsCheckingSession(false);
    };
    
    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Fehler",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          title: "Fehler",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Passwort aktualisiert",
          description: "Ihr Passwort wurde erfolgreich geändert.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Link wird überprüft...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Passwort geändert!</h2>
            <p className="text-muted-foreground text-center mb-6">
              Ihr Passwort wurde erfolgreich aktualisiert.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password reset form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Neues Passwort setzen</CardTitle>
          <CardDescription>
            Geben Sie Ihr neues Passwort ein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Neues Passwort</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Mindestens 6 Zeichen. Sonderzeichen und Zahlen sind erlaubt.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Passwort bestätigen</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Passwort speichern
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
