import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { 
  LogOut, 
  Loader2, 
  Search, 
  FileText, 
  Sparkles, 
  FolderOpen,
  Calendar,
  Globe,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Link } from "react-router-dom";

interface DashboardProps {
  session: Session | null;
}

const DashboardHome = () => {
  const quickActions = [
    { title: "SEO-Check", description: "Analysiere eine bestehende Seite", icon: Search, href: "/seo-check", color: "from-blue-500 to-cyan-500" },
    { title: "Content Basic", description: "Schnelle SEO-Texte erstellen", icon: FileText, href: "/basic", color: "from-emerald-500 to-teal-500" },
    { title: "Content Pro", description: "Professioneller 5-Step Wizard", icon: Sparkles, href: "/pro", color: "from-violet-500 to-purple-500" },
  ];

  const features = [
    { title: "Projekte", description: "Deine gespeicherten Inhalte", icon: FolderOpen, href: "/dashboard/projects", count: "0" },
    { title: "Content Planner", description: "Geplante Inhalte", icon: Calendar, href: "/dashboard/planner", count: "0" },
    { title: "Domain Learning", description: "Unternehmens-Wissen", icon: Globe, href: "/dashboard/domain", count: "Neu" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Willkommen zurück! Was möchtest du heute erstellen?</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Schnellstart</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Dein Workspace</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.href}>
              <Card className="cursor-pointer hover:shadow-md transition-all group">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">{feature.count}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Generierte Texte</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Search className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">SEO-Checks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FolderOpen className="h-6 w-6 mx-auto text-warning mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Projekte</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="h-6 w-6 mx-auto text-accent mb-2" />
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-muted-foreground">Domain Score</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Dashboard = ({ session }: DashboardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    organizations, 
    currentOrg, 
    userRole, 
    isLoading, 
    needsOnboarding,
    switchOrganization 
  } = useOrganization(session);

  useEffect(() => {
    if (!session) {
      navigate("/auth");
      return;
    }

    if (!isLoading && needsOnboarding) {
      navigate("/onboarding");
    }
  }, [session, isLoading, needsOnboarding, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDashboardRoot = location.pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 hidden md:block">
        <div className="fixed w-64 h-screen">
          <Sidebar 
            currentOrg={currentOrg}
            organizations={organizations}
            onSwitchOrg={switchOrganization}
            userRole={userRole}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="md:hidden">
              <h1 className="font-semibold">{currentOrg?.name || "Dashboard"}</h1>
            </div>
            <div className="hidden md:block" />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
          {isDashboardRoot ? <DashboardHome /> : <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
