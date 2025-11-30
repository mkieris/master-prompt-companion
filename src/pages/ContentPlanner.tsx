import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Plus, 
  Sparkles,
  Loader2,
  Lightbulb,
  Target,
  Clock
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface ContentPlannerProps {
  session: Session | null;
}

interface ContentPlan {
  id: string;
  title: string;
  topic: string;
  description: string | null;
  page_type: string | null;
  target_keyword: string | null;
  priority: string;
  status: string;
  planned_date: string | null;
  created_at: string;
}

const ContentPlanner = ({ session }: ContentPlannerProps) => {
  const { currentOrg } = useOrganization(session);
  const { toast } = useToast();
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: "",
    topic: "",
    description: "",
    page_type: "guide",
    target_keyword: "",
    priority: "medium",
    planned_date: "",
  });

  useEffect(() => {
    if (currentOrg) {
      fetchPlans();
    }
  }, [currentOrg]);

  const fetchPlans = async () => {
    if (!currentOrg) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('content_plans')
      .select('*')
      .eq('organization_id', currentOrg.id)
      .order('planned_date', { ascending: true, nullsFirst: false });

    if (data) {
      setPlans(data);
    }
    setIsLoading(false);
  };

  const handleAddPlan = async () => {
    if (!currentOrg || !newPlan.title.trim() || !newPlan.topic.trim()) {
      toast({
        title: "Fehler",
        description: "Titel und Thema sind erforderlich.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingPlan(true);

    const { error } = await supabase
      .from('content_plans')
      .insert({
        organization_id: currentOrg.id,
        title: newPlan.title,
        topic: newPlan.topic,
        description: newPlan.description || null,
        page_type: newPlan.page_type,
        target_keyword: newPlan.target_keyword || null,
        priority: newPlan.priority,
        planned_date: newPlan.planned_date || null,
      });

    if (error) {
      toast({
        title: "Fehler",
        description: "Plan konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Erfolgreich",
        description: "Content-Plan wurde erstellt.",
      });
      setNewPlan({
        title: "",
        topic: "",
        description: "",
        page_type: "guide",
        target_keyword: "",
        priority: "medium",
        planned_date: "",
      });
      setDialogOpen(false);
      fetchPlans();
    }

    setIsAddingPlan(false);
  };

  const generateIdeas = async () => {
    if (!currentOrg) return;

    setIsGeneratingIdeas(true);

    try {
      // Fetch domain knowledge for context
      const { data: domainData } = await supabase
        .from('domain_knowledge')
        .select('*')
        .eq('organization_id', currentOrg.id)
        .single();

      const context = domainData?.ai_summary || "Allgemeines Unternehmen";

      const { data, error } = await supabase.functions.invoke('generate-seo-content', {
        body: {
          contentPlannerMode: true,
          context,
          existingTopics: plans.map(p => p.topic),
        }
      });

      if (data?.suggestions) {
        // Add AI suggestions as new plans
        for (const suggestion of data.suggestions.slice(0, 3)) {
          await supabase
            .from('content_plans')
            .insert({
              organization_id: currentOrg.id,
              title: suggestion.title,
              topic: suggestion.topic,
              description: suggestion.description,
              target_keyword: suggestion.keyword,
              priority: suggestion.priority || 'medium',
              status: 'idea',
              ai_suggestions: { generated: true, ...suggestion },
            });
        }

        toast({
          title: "KI-Vorschläge generiert",
          description: "3 neue Content-Ideen wurden hinzugefügt.",
        });

        fetchPlans();
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Konnte keine Ideen generieren.",
        variant: "destructive",
      });
    }

    setIsGeneratingIdeas(false);
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={colors[priority] || colors.medium}>
        {priority === 'high' ? 'Hoch' : priority === 'low' ? 'Niedrig' : 'Mittel'}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      idea: "Idee",
      planned: "Geplant",
      "in-progress": "In Arbeit",
      completed: "Fertig",
    };
    return <Badge variant="outline">{labels[status] || status}</Badge>;
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
          <h1 className="text-2xl font-bold">Content Planner</h1>
          <p className="text-muted-foreground">Plane und organisiere deine SEO-Inhalte</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateIdeas} disabled={isGeneratingIdeas}>
            {isGeneratingIdeas ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            KI-Ideen generieren
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Neuer Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Content-Plan erstellen</DialogTitle>
                <DialogDescription>
                  Plane deinen nächsten SEO-Inhalt
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Titel</Label>
                  <Input
                    placeholder="z.B. Ratgeber: Die besten Tipps für..."
                    value={newPlan.title}
                    onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thema</Label>
                  <Input
                    placeholder="Hauptthema des Contents"
                    value={newPlan.topic}
                    onChange={(e) => setNewPlan({ ...newPlan, topic: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beschreibung (optional)</Label>
                  <Textarea
                    placeholder="Kurze Beschreibung..."
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Seitentyp</Label>
                    <Select value={newPlan.page_type} onValueChange={(v) => setNewPlan({ ...newPlan, page_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Produktseite</SelectItem>
                        <SelectItem value="category">Kategorieseite</SelectItem>
                        <SelectItem value="guide">Ratgeber/Blog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priorität</Label>
                    <Select value={newPlan.priority} onValueChange={(v) => setNewPlan({ ...newPlan, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Hoch</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="low">Niedrig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ziel-Keyword (optional)</Label>
                  <Input
                    placeholder="Fokus-Keyword"
                    value={newPlan.target_keyword}
                    onChange={(e) => setNewPlan({ ...newPlan, target_keyword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Geplantes Datum (optional)</Label>
                  <Input
                    type="date"
                    value={newPlan.planned_date}
                    onChange={(e) => setNewPlan({ ...newPlan, planned_date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddPlan} className="w-full" disabled={isAddingPlan}>
                  {isAddingPlan ? "Wird erstellt..." : "Plan erstellen"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Plans */}
      {plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Keine Content-Pläne</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Erstelle deinen ersten Content-Plan oder lass die KI Ideen generieren
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generateIdeas} disabled={isGeneratingIdeas}>
                <Sparkles className="mr-2 h-4 w-4" />
                KI-Ideen
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Manuell erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{plan.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Target className="h-3 w-3" />
                      {plan.topic}
                    </CardDescription>
                  </div>
                  {getPriorityBadge(plan.priority)}
                </div>
              </CardHeader>
              <CardContent>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {plan.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  {getStatusBadge(plan.status)}
                  {plan.planned_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(plan.planned_date).toLocaleDateString('de-DE')}
                    </span>
                  )}
                </div>
                {plan.target_keyword && (
                  <div className="mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {plan.target_keyword}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentPlanner;
