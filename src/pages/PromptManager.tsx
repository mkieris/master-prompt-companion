import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2, Save, BookOpen, FileText, Plus, Pencil, X, Copy, Trash2,
  ChevronDown, ChevronUp
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface SystemPrompt {
  id: string;
  version_key: string;
  version_name: string;
  version_description: string | null;
  system_prompt: string;
  is_active: boolean | null;
  usage_count: number | null;
  average_rating: number | null;
  metadata: any;
  created_at: string | null;
}

interface UserPrompt {
  id: string;
  version_key: string;
  version_name: string;
  version_description: string | null;
  prompt_template: string;
  is_active: boolean | null;
  metadata: any;
  created_at: string | null;
}

type EditingSystemPrompt = Partial<SystemPrompt> & { isNew?: boolean };
type EditingUserPrompt = Partial<UserPrompt> & { isNew?: boolean };

export default function PromptManager() {
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [userPrompts, setUserPrompts] = useState<UserPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editSystemData, setEditSystemData] = useState<EditingSystemPrompt>({});
  const [editUserData, setEditUserData] = useState<EditingUserPrompt>({});
  const [saving, setSaving] = useState(false);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    const [sRes, uRes] = await Promise.all([
      supabase.from("system_prompt_versions").select("*").order("created_at", { ascending: false }),
      supabase.from("user_prompt_templates").select("*").order("created_at", { ascending: false }),
    ]);
    if (sRes.error || uRes.error) {
      toast({ title: "Fehler", description: "Prompts konnten nicht geladen werden", variant: "destructive" });
    }
    setSystemPrompts(sRes.data || []);
    setUserPrompts(uRes.data || []);
    setIsLoading(false);
  };

  // --- System Prompt CRUD ---
  const startEditSystem = (p: SystemPrompt) => {
    setEditingSystemId(p.id);
    setEditSystemData({ ...p });
  };

  const startNewSystem = () => {
    const newId = "new";
    setEditingSystemId(newId);
    setEditSystemData({
      isNew: true,
      version_key: "",
      version_name: "",
      version_description: "",
      system_prompt: "",
      is_active: true,
      metadata: {},
    });
  };

  const cancelEditSystem = () => {
    setEditingSystemId(null);
    setEditSystemData({});
  };

  const saveSystem = async () => {
    if (!editSystemData.version_key || !editSystemData.version_name || !editSystemData.system_prompt) {
      toast({ title: "Fehlende Felder", description: "Key, Name und Prompt sind Pflichtfelder", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editSystemData.isNew) {
        const { error } = await supabase.from("system_prompt_versions").insert({
          version_key: editSystemData.version_key,
          version_name: editSystemData.version_name,
          version_description: editSystemData.version_description || null,
          system_prompt: editSystemData.system_prompt,
          is_active: editSystemData.is_active ?? true,
          metadata: editSystemData.metadata || {},
        });
        if (error) throw error;
        toast({ title: "Erstellt", description: "System Prompt wurde erstellt" });
      } else {
        const { error } = await supabase
          .from("system_prompt_versions")
          .update({
            version_key: editSystemData.version_key,
            version_name: editSystemData.version_name,
            version_description: editSystemData.version_description || null,
            system_prompt: editSystemData.system_prompt,
            is_active: editSystemData.is_active ?? true,
            metadata: editSystemData.metadata || {},
          })
          .eq("id", editingSystemId!);
        if (error) throw error;
        toast({ title: "Gespeichert", description: "System Prompt wurde aktualisiert" });
      }
      cancelEditSystem();
      await loadAll();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const duplicateSystem = async (p: SystemPrompt) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("system_prompt_versions").insert({
        version_key: p.version_key + "-copy",
        version_name: p.version_name + " (Kopie)",
        version_description: p.version_description,
        system_prompt: p.system_prompt,
        is_active: false,
        metadata: p.metadata || {},
      });
      if (error) throw error;
      toast({ title: "Dupliziert", description: "Kopie wurde erstellt" });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteSystem = async (id: string) => {
    try {
      const { error } = await supabase.from("system_prompt_versions").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Gelöscht", description: "System Prompt wurde gelöscht" });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    }
  };

  // --- User Prompt CRUD ---
  const startEditUser = (p: UserPrompt) => {
    setEditingUserId(p.id);
    setEditUserData({ ...p });
  };

  const startNewUser = () => {
    setEditingUserId("new");
    setEditUserData({
      isNew: true,
      version_key: "",
      version_name: "",
      version_description: "",
      prompt_template: "",
      is_active: true,
      metadata: {},
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditUserData({});
  };

  const saveUser = async () => {
    if (!editUserData.version_key || !editUserData.version_name || !editUserData.prompt_template) {
      toast({ title: "Fehlende Felder", description: "Key, Name und Template sind Pflichtfelder", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editUserData.isNew) {
        const { error } = await supabase.from("user_prompt_templates").insert({
          version_key: editUserData.version_key,
          version_name: editUserData.version_name,
          version_description: editUserData.version_description || null,
          prompt_template: editUserData.prompt_template,
          is_active: editUserData.is_active ?? true,
          metadata: editUserData.metadata || {},
        });
        if (error) throw error;
        toast({ title: "Erstellt", description: "User Prompt wurde erstellt" });
      } else {
        const { error } = await supabase
          .from("user_prompt_templates")
          .update({
            version_key: editUserData.version_key,
            version_name: editUserData.version_name,
            version_description: editUserData.version_description || null,
            prompt_template: editUserData.prompt_template,
            is_active: editUserData.is_active ?? true,
            metadata: editUserData.metadata || {},
          })
          .eq("id", editingUserId!);
        if (error) throw error;
        toast({ title: "Gespeichert", description: "User Prompt wurde aktualisiert" });
      }
      cancelEditUser();
      await loadAll();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const duplicateUser = async (p: UserPrompt) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("user_prompt_templates").insert({
        version_key: p.version_key + "-copy",
        version_name: p.version_name + " (Kopie)",
        version_description: p.version_description,
        prompt_template: p.prompt_template,
        is_active: false,
        metadata: p.metadata || {},
      });
      if (error) throw error;
      toast({ title: "Dupliziert", description: "Kopie wurde erstellt" });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from("user_prompt_templates").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Gelöscht", description: "User Prompt wurde gelöscht" });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderSystemCard = (p: SystemPrompt) => {
    const isEditing = editingSystemId === p.id;
    const isExpanded = expandedSystem === p.id;

    if (isEditing) {
      return (
        <Card key={p.id} className="p-6 border-primary">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Bearbeiten</h3>
              <Button variant="ghost" size="sm" onClick={cancelEditSystem}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Version Key</Label>
                <Input value={editSystemData.version_key || ""} onChange={e => setEditSystemData(d => ({ ...d, version_key: e.target.value }))} placeholder="z.B. v9-master" />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={editSystemData.version_name || ""} onChange={e => setEditSystemData(d => ({ ...d, version_name: e.target.value }))} placeholder="z.B. ⭐ v9: Master Prompt" />
              </div>
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Input value={editSystemData.version_description || ""} onChange={e => setEditSystemData(d => ({ ...d, version_description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editSystemData.is_active ?? true} onCheckedChange={v => setEditSystemData(d => ({ ...d, is_active: v }))} />
              <Label>Aktiv</Label>
            </div>
            <div>
              <Label>System Prompt</Label>
              <Textarea
                className="min-h-[400px] font-mono text-xs"
                value={editSystemData.system_prompt || ""}
                onChange={e => setEditSystemData(d => ({ ...d, system_prompt: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEditSystem}>Abbrechen</Button>
              <Button onClick={saveSystem} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Speichern
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card key={p.id} className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => setExpandedSystem(isExpanded ? null : p.id)} className="shrink-0">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{p.version_name}</span>
                <Badge variant="outline" className="text-xs shrink-0">{p.version_key}</Badge>
                {p.is_active && <Badge className="shrink-0">Aktiv</Badge>}
              </div>
              {p.version_description && (
                <p className="text-xs text-muted-foreground truncate">{p.version_description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => startEditSystem(p)} title="Bearbeiten">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => duplicateSystem(p)} title="Duplizieren">
              <Copy className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Löschen">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Prompt löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{p.version_name}" wird unwiderruflich gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteSystem(p.id)}>Löschen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-4 border-t pt-4">
            <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded max-h-96 overflow-auto">
              {p.system_prompt}
            </pre>
          </div>
        )}
      </Card>
    );
  };

  const renderUserCard = (p: UserPrompt) => {
    const isEditing = editingUserId === p.id;
    const isExpanded = expandedUser === p.id;

    if (isEditing) {
      return (
        <Card key={p.id} className="p-6 border-primary">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Bearbeiten</h3>
              <Button variant="ghost" size="sm" onClick={cancelEditUser}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Version Key</Label>
                <Input value={editUserData.version_key || ""} onChange={e => setEditUserData(d => ({ ...d, version_key: e.target.value }))} />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={editUserData.version_name || ""} onChange={e => setEditUserData(d => ({ ...d, version_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Input value={editUserData.version_description || ""} onChange={e => setEditUserData(d => ({ ...d, version_description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editUserData.is_active ?? true} onCheckedChange={v => setEditUserData(d => ({ ...d, is_active: v }))} />
              <Label>Aktiv</Label>
            </div>
            <div>
              <Label>Prompt Template</Label>
              <Textarea
                className="min-h-[400px] font-mono text-xs"
                value={editUserData.prompt_template || ""}
                onChange={e => setEditUserData(d => ({ ...d, prompt_template: e.target.value }))}
              />
            </div>
            <div className="border rounded p-3 bg-muted/20">
              <p className="text-xs font-semibold mb-2">Verfügbare Platzhalter:</p>
              <div className="flex flex-wrap gap-1 text-xs">
                {['{brandName}', '{mainTopic}', '{focusKeyword}', '{secondaryKeywords}', '{targetAudience}',
                  '{formOfAddress}', '{tonality}', '{wordCount}', '{maxParagraphLength}', '{includeFAQ}',
                  '{wQuestions}', '{competitorData}', '{briefingContent}', '{additionalInfo}'].map(ph => (
                  <code key={ph} className="bg-muted px-1.5 py-0.5 rounded">{ph}</code>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEditUser}>Abbrechen</Button>
              <Button onClick={saveUser} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Speichern
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card key={p.id} className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => setExpandedUser(isExpanded ? null : p.id)} className="shrink-0">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{p.version_name}</span>
                <Badge variant="outline" className="text-xs shrink-0">{p.version_key}</Badge>
                {p.is_active && <Badge className="shrink-0">Aktiv</Badge>}
              </div>
              {p.version_description && (
                <p className="text-xs text-muted-foreground truncate">{p.version_description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => startEditUser(p)} title="Bearbeiten">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => duplicateUser(p)} title="Duplizieren">
              <Copy className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Löschen">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Template löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{p.version_name}" wird unwiderruflich gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteUser(p.id)}>Löschen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-4 border-t pt-4">
            <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded max-h-96 overflow-auto">
              {p.prompt_template}
            </pre>
          </div>
        )}
      </Card>
    );
  };

  // Render new-prompt form at top when creating
  const renderNewSystem = () => {
    if (editingSystemId !== "new") return null;
    return renderSystemCard({ id: "new", ...editSystemData } as any);
  };

  const renderNewUser = () => {
    if (editingUserId !== "new") return null;
    return renderUserCard({ id: "new", ...editUserData } as any);
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Prompt-Verwaltung</h1>
        <p className="text-muted-foreground mt-1">
          System Prompts und User Prompt Templates bearbeiten, erstellen und verwalten.
        </p>
      </div>

      <Tabs defaultValue="system">
        <TabsList className="mb-4">
          <TabsTrigger value="system" className="gap-2">
            <BookOpen className="h-4 w-4" />
            System Prompts ({systemPrompts.length})
          </TabsTrigger>
          <TabsTrigger value="user" className="gap-2">
            <FileText className="h-4 w-4" />
            User Prompts ({userPrompts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <div className="flex justify-end mb-4">
            <Button onClick={startNewSystem} disabled={editingSystemId === "new"}>
              <Plus className="h-4 w-4 mr-2" /> Neuer System Prompt
            </Button>
          </div>
          <div className="space-y-3">
            {renderNewSystem()}
            {systemPrompts.map(renderSystemCard)}
          </div>
        </TabsContent>

        <TabsContent value="user">
          <div className="flex justify-end mb-4">
            <Button onClick={startNewUser} disabled={editingUserId === "new"}>
              <Plus className="h-4 w-4 mr-2" /> Neues User Template
            </Button>
          </div>
          <div className="space-y-3">
            {renderNewUser()}
            {userPrompts.map(renderUserCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
