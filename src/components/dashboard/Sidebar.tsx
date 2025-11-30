import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Sparkles, 
  FolderOpen, 
  Calendar,
  Globe,
  Users,
  Settings,
  Building2,
  ChevronDown,
  Bot,
  GraduationCap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  currentOrg: { id: string; name: string; logo_url: string | null } | null;
  organizations: { id: string; name: string }[];
  onSwitchOrg: (orgId: string) => void;
  userRole: string | null;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "SEO-Check", href: "/seo-check", icon: Search },
  { name: "KI Content Creator", href: "/dashboard/ai-content", icon: Bot, isNew: true },
  { name: "Content Basic", href: "/basic", icon: FileText },
  { name: "Content Pro", href: "/pro", icon: Sparkles },
  { name: "Projekte", href: "/dashboard/projects", icon: FolderOpen },
  { name: "Content Planner", href: "/dashboard/planner", icon: Calendar },
  { name: "Domain Learning", href: "/dashboard/domain", icon: Globe },
  { name: "SEO-Schulung", href: "/dashboard/seo-training", icon: GraduationCap },
];

const adminNavigation = [
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Einstellungen", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ currentOrg, organizations, onSwitchOrg, userRole }: SidebarProps) {
  const location = useLocation();
  const isAdmin = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Organization Switcher */}
      <div className="p-4 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-auto py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium truncate max-w-[140px]">
                    {currentOrg?.name || "Organisation"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px]">
            {organizations.map((org) => (
              <DropdownMenuItem 
                key={org.id} 
                onClick={() => onSwitchOrg(org.id)}
                className={cn(org.id === currentOrg?.id && "bg-muted")}
              >
                <Building2 className="h-4 w-4 mr-2" />
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                  {(item as any).isNew && (
                    <Badge variant="default" className="ml-auto text-[10px] px-1.5 py-0 h-5 bg-gradient-to-r from-primary to-accent">
                      NEU
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        {isAdmin && (
          <>
            <div className="my-4 border-t border-border" />
            <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Administration
            </p>
            <div className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          SEO Toolbox Enterprise
        </p>
      </div>
    </div>
  );
}
