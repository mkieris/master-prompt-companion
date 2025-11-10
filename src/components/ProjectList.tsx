import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Project {
  id: string;
  title: string;
  page_type: string;
  focus_keyword: string;
  form_data: any;
  generated_content: any;
  created_at: string;
  updated_at: string;
}

interface ProjectListProps {
  onLoadProject: (project: Project) => void;
}

export const ProjectList = ({ onLoadProject }: ProjectListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Fehler beim Laden der Projekte');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Möchten Sie dieses Projekt wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('seo_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProjects(projects.filter(p => p.id !== id));
      toast.success('Projekt gelöscht');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Noch keine Projekte vorhanden.<br />
            Erstellen Sie Ihr erstes SEO-Projekt!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(project.updated_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteProject(project.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Badge variant="outline" className="mb-2">
                  {project.page_type === 'product' ? 'Produktseite' : 'Kategorieseite'}
                </Badge>
                <p className="text-sm font-medium text-foreground">
                  Fokus-Keyword: <span className="text-primary">{project.focus_keyword}</span>
                </p>
              </div>
              <Button 
                onClick={() => onLoadProject(project)}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Projekt öffnen
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
