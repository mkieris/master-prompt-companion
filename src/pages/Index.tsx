import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { 
  Search, 
  FileText, 
  Sparkles, 
  LogOut,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  LayoutDashboard,
  FolderKanban,
  Globe,
  Loader2
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface IndexProps {
  session: Session | null;
}

const Index = ({ session }: IndexProps) => {
  const navigate = useNavigate();
  const { needsOnboarding, isLoading } = useOrganization(session);

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  // Redirect to onboarding if user has no organization
  useEffect(() => {
    if (!isLoading && needsOnboarding && session) {
      navigate("/onboarding");
    }
  }, [isLoading, needsOnboarding, session, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!session) {
    return null;
  }

  // Show loading while checking organization status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Will redirect to onboarding
  if (needsOnboarding) {
    return null;
  }

  const tools = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Zentrale Übersicht',
      description: 'Verwalten Sie Ihre Organisation, Projekte und Domain-Wissen zentral an einem Ort.',
      icon: LayoutDashboard,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20 hover:border-orange-500/50',
      features: ['Organisations-Verwaltung', 'Projekt-Übersicht', 'Domain Learning', 'Content-Planer'],
      route: '/dashboard',
      badge: 'NEU',
    },
    {
      id: 'seo-check',
      title: 'SEO-Check',
      subtitle: 'Analyse & Audit',
      description: 'Umfassende SEO-Analyse für bestehende Seiten. Prüft Meta-Tags, Content-Qualität und technische SEO-Faktoren.',
      icon: Search,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20 hover:border-blue-500/50',
      features: ['Meta-Tag Analyse', 'Content-Bewertung', 'Lesbarkeit-Score', 'Technische Checks'],
      route: '/seo-check',
      badge: null,
    },
    {
      id: 'basic',
      title: 'Content Basic',
      subtitle: 'Schnell-Generator',
      description: 'Schnelle SEO-Texterstellung für einfache Anforderungen. Ideal für einzelne Produktseiten.',
      icon: Zap,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/50',
      features: ['Ein-Klick-Generierung', 'Keyword-Optimierung', 'FAQ & Meta-Tags', 'Copy-to-Clipboard'],
      route: '/basic',
      badge: null,
    },
    {
      id: 'pro',
      title: 'Content Pro',
      subtitle: 'Enterprise Generator',
      description: 'Professionelle SEO-Texterstellung mit 5-Schritt-Wizard, Competitor-Analyse und Compliance-Check.',
      icon: Sparkles,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20 hover:border-violet-500/50',
      features: ['5-Step Wizard', 'Competitor-Analyse', 'Compliance (MDR/HWG)', 'SEO After-Check'],
      route: '/pro',
      badge: 'PRO',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                <Target className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SEO Content Pro</h1>
                <p className="text-xs text-muted-foreground">Enterprise SEO-Plattform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="ghost" onClick={handleSignOut} size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            KI-gestützte SEO-Optimierung
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Professionelle <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">SEO-Tools</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Von der schnellen Content-Erstellung bis zum umfassenden Enterprise-Workflow – wählen Sie das passende Tool.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tools.map((tool) => (
              <Card 
                key={tool.id}
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 ${tool.borderColor} group`}
                onClick={() => navigate(tool.route)}
              >
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                {/* Badge */}
                {tool.badge && (
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${tool.color} text-white`}>
                      {tool.badge}
                    </span>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${tool.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <tool.icon 
                        className="h-7 w-7" 
                        style={{ 
                          color: tool.color.includes('blue') ? '#3b82f6' : 
                                 tool.color.includes('emerald') ? '#10b981' : 
                                 tool.color.includes('violet') ? '#8b5cf6' :
                                 '#f97316'
                        }} 
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {tool.title}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium">
                        {tool.subtitle}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-2">
                    {tool.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3.5 w-3.5 text-success flex-shrink-0" />
                        <span className="text-foreground/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full mt-2 group-hover:bg-gradient-to-r ${tool.color} group-hover:text-white group-hover:border-transparent transition-all duration-300`}
                    variant="outline"
                  >
                    {tool.id === 'dashboard' ? 'Öffnen' : 'Starten'}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-10 px-4 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">E-E-A-T</div>
              <div className="text-xs text-muted-foreground">Google Guidelines</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">5-Step</div>
              <div className="text-xs text-muted-foreground">Pro Wizard</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">MDR/HWG</div>
              <div className="text-xs text-muted-foreground">Compliance-Check</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">AI</div>
              <div className="text-xs text-muted-foreground">Powered Content</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          SEO Content Pro — Enterprise SEO-Plattform
        </p>
      </footer>
    </div>
  );
};

export default Index;
