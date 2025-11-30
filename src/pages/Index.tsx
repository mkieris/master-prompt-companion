import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  FileText, 
  Sparkles, 
  LogOut,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  BarChart3,
  FileCheck
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface IndexProps {
  session: Session | null;
}

const Index = ({ session }: IndexProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!session) {
    return null;
  }

  const tools = [
    {
      id: 'seo-check',
      title: 'SEO-Check',
      subtitle: 'Analyse & Audit',
      description: 'Umfassende SEO-Analyse für bestehende Seiten. Prüft Meta-Tags, Content-Qualität, technische SEO-Faktoren und gibt konkrete Verbesserungsvorschläge.',
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
      title: 'SEO Content',
      subtitle: 'Basic Generator',
      description: 'Schnelle SEO-Texterstellung für einfache Anforderungen. Ideal für einzelne Produktseiten und einfache Content-Projekte.',
      icon: FileText,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/50',
      features: ['Keyword-Optimierung', 'FAQ-Generator', 'Meta-Tags', 'Interne Links'],
      route: '/basic',
      badge: null,
    },
    {
      id: 'pro',
      title: 'SEO Content',
      subtitle: 'Pro Generator',
      description: 'Professionelle SEO-Texterstellung mit erweiterten Funktionen. Multi-Step-Wizard, Zielgruppen-Analyse, Tonalitäts-Mixer und umfassender After-Check.',
      icon: Sparkles,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20 hover:border-violet-500/50',
      features: ['5-Step Wizard', 'Tonalitäts-Mixer', 'SEO After-Check', 'PDF/Word Export'],
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
                <h1 className="text-xl font-bold text-foreground">SEO Toolbox</h1>
                <p className="text-xs text-muted-foreground">Professionelle SEO-Tools</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleSignOut} size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            KI-gestützte SEO-Optimierung
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Wähle dein <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">SEO-Tool</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Analysiere bestehende Seiten, generiere optimierte Texte oder erstelle professionellen Content mit erweiterten Funktionen.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Card 
                key={tool.id}
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 ${tool.borderColor} group`}
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

                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-2xl ${tool.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className={`h-7 w-7 text-transparent bg-clip-text bg-gradient-to-br ${tool.color}`} style={{ color: tool.color.includes('blue') ? '#3b82f6' : tool.color.includes('emerald') ? '#10b981' : '#8b5cf6' }} />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {tool.title}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-muted-foreground">
                      {tool.subtitle}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2">
                    {tool.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-foreground/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full group-hover:bg-gradient-to-r ${tool.color} group-hover:text-white transition-all duration-300`}
                    variant="outline"
                  >
                    Tool starten
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 border-t border-border/50 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-1">E-E-A-T</div>
              <div className="text-sm text-muted-foreground">Google Guidelines</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">5-Step</div>
              <div className="text-sm text-muted-foreground">Pro Wizard</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">PDF/DOCX</div>
              <div className="text-sm text-muted-foreground">Export Optionen</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">KI</div>
              <div className="text-sm text-muted-foreground">Powered Content</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          SEO Toolbox — Professionelle SEO-Optimierung für bessere Rankings
        </p>
      </footer>
    </div>
  );
};

export default Index;
