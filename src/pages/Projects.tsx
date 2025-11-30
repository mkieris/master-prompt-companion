import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  FileText,
  Calendar,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

interface ProjectsProps {
  session: Session | null;
}

interface Project {
  id: string;
  title: string;
  status: string;
  page_type: string;
  focus_keyword: string;
  seo_score: number | null;
  created_at: string;
  updated_at: string;
}

const Projects = ({ session }: ProjectsProps) => {
  const { currentOrg } = useOrganization(session);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentOrg) {
      fetchProjects();
    }
  }, [currentOrg]);

  const fetchProjects = async () => {
    if (!currentOrg) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('content_projects')
      .select('*')
      .eq('organization_id', currentOrg.id)
      .order('updated_at', { ascending: false });

    if (data) {
      setProjects(data);
    }
    setIsLoading(false);
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.focus_keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "secondary",
      published: "default",
      archived: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projekte</h1>
          <p className="text-muted-foreground">Deine gespeicherten SEO-Inhalte</p>
        </div>
        <Link to="/pro">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neues Projekt
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Projekte durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Keine Projekte vorhanden</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Erstelle dein erstes SEO-Projekt mit dem Content Pro Generator
            </p>
            <Link to="/pro">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Projekt erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      {project.page_type}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status)}
                    {project.seo_score && (
                      <Badge variant="outline" className="text-xs">
                        Score: {project.seo_score}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.updated_at).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {project.focus_keyword}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
