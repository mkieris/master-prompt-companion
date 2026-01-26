import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Loader2,
  Package,
  FolderTree,
  BookOpen,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { sanitizeHtml } from "@/lib/sanitize";

interface GeneratedProject {
  id: string;
  title: string;
  page_type: string;
  focus_keyword: string;
  created_at: string;
  form_data: any;
  generated_content: any;
  status: string;
}

const pageTypeIcons = {
  product: Package,
  category: FolderTree,
  guide: BookOpen
};

const promptVersionNames: Record<string, string> = {
  'v1-kompakt-seo': '🎯 Kompakt-SEO',
  'v2-marketing-first': '🚀 Marketing-First',
  'v3-hybrid-intelligent': '🧠 Hybrid-Intelligent',
  'v4-minimal-kreativ': '✨ Minimal-Kreativ',
  'v5-ai-meta-optimiert': '🤖 AI-Meta-Optimiert',
  'v6-quality-auditor': '🔍 Quality-Auditor'
};

export default function GenerationHistory() {
  const [projects, setProjects] = useState<GeneratedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<GeneratedProject | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.current_organization_id) return;

      const { data, error } = await supabase
        .from('content_projects')
        .select('*')
        .eq('organization_id', profile.current_organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
    } catch (error) {
      console.error('Load error:', error);
      toast({
        title: "Fehler",
        description: "Projekte konnten nicht geladen werden",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);

      toast({
        title: "Erfolgreich",
        description: "Projekt wurde gelöscht"
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht gelöscht werden",
        variant: "destructive"
      });
    }
  };

  const downloadAsHTML = (project: GeneratedProject) => {
    const content = project.generated_content;
    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${content.title || project.title}</title>
  <meta name="description" content="${content.metaDescription || ''}">
</head>
<body>
  ${content.seoText || ''}
  ${content.faq ? `<section><h2>FAQ</h2>${content.faq.map((q: any) => `<h3>${q.question}</h3><p>${q.answer}</p>`).join('')}</section>` : ''}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Erfolgreich",
      description: "HTML-Datei wurde heruntergeladen"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Clock className="h-8 w-8" />
          Generierungs-Verlauf
        </h1>
        <p className="text-muted-foreground mt-2">
          Alle generierten Inhalte werden automatisch gespeichert und können jederzeit abgerufen werden.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Noch keine Generierungen</h3>
          <p className="text-muted-foreground">
            Erstellen Sie Ihren ersten SEO-Content im Pro-Modus!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste */}
          <div className="lg:col-span-1">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3 pr-4">
                {projects.map((project) => {
                  const IconComponent = pageTypeIcons[project.page_type as keyof typeof pageTypeIcons] || FileText;
                  const promptVersion = project.form_data?.promptVersion || 'v1-kompakt-seo';
                  
                  return (
                    <Card
                      key={project.id}
                      className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
                        selectedProject?.id === project.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{project.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {project.focus_keyword}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {promptVersionNames[promptVersion]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(project.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge>{selectedProject.page_type}</Badge>
                      <Badge variant="outline">
                        {promptVersionNames[selectedProject.form_data?.promptVersion || 'v1-kompakt-seo']}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(selectedProject.created_at), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAsHTML(selectedProject)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProject(selectedProject.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-6">
                    {/* Meta Tags */}
                    <div>
                      <h3 className="font-semibold mb-2">Meta-Informationen</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Title:</span> {selectedProject.generated_content?.title}
                        </div>
                        <div>
                          <span className="font-medium">Meta Description:</span> {selectedProject.generated_content?.metaDescription}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-semibold mb-2">Generierter Content</h3>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedProject.generated_content?.seoText || '') }}
                      />
                    </div>

                    {/* FAQ */}
                    {selectedProject.generated_content?.faq && (
                      <div>
                        <h3 className="font-semibold mb-2">FAQ</h3>
                        <div className="space-y-3">
                          {selectedProject.generated_content.faq.map((item: any, index: number) => (
                            <div key={index} className="border-l-2 border-primary pl-4">
                              <h4 className="font-medium">{item.question}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{item.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Eye className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Keine Auswahl</h3>
                <p className="text-muted-foreground">
                  Wählen Sie ein Projekt aus der Liste aus, um die Details anzuzeigen.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
