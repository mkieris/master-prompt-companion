import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Sparkles,
  FileText,
  Layers,
  Beaker,
} from "lucide-react";

const PAGE_TYPES = [
  { id: "product", label: "Produktseite", desc: "Einzelnes Produkt", icon: "🛍️" },
  { id: "category", label: "Kategorieseite", desc: "Markenneutrale Übersicht", icon: "📂" },
  { id: "brand", label: "Markenseite", desc: "Eigenmarke oder Distributionsmarke", icon: "🏷️" },
  { id: "topic_world", label: "Themenwelt", desc: "Anwendungsbereich", icon: "🌐" },
  { id: "guide", label: "Ratgeber-Artikel", desc: "Informativer Content", icon: "📖" },
];

const AUDIENCES = [
  { id: "b2b_practice", label: "B2B Praxis", desc: "Sie-Form, Fachterminologie, Studien-Refs" },
  { id: "b2c_active", label: "B2C Aktiv", desc: "Du-Form, Sport/Bewegung, motivierend" },
  { id: "b2c_patient", label: "B2C Patient", desc: "Du-Form, beruhigend, ärztl. Hinweis" },
];

const PRODUCT_TYPES = [
  { id: "own_brand", label: "Eigenmarke (K-Active)" },
  { id: "partner_brand", label: "Partner-Marke" },
  { id: "distribution", label: "Distribution (Drittmarke)" },
  { id: "accessory", label: "Zubehör" },
];

interface Props {
  session: Session | null;
}

type Stage = "context" | "outline" | "writer" | "compliance" | "done";

export default function ContentCreatorV3({ session }: Props) {
  const navigate = useNavigate();
  const { currentOrg } = useOrganization(session);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pageType, setPageType] = useState<string>("");
  const [productType, setProductType] = useState<string>("own_brand");
  const [brandName, setBrandName] = useState<string>("");
  const [objectName, setObjectName] = useState<string>("");
  const [audience, setAudience] = useState<string>("b2b_practice");
  const [keyword, setKeyword] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(800);
  const [parallelEnabled, setParallelEnabled] = useState(false);
  const [parallelAudience, setParallelAudience] = useState<string>("b2c_active");

  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [result, setResult] = useState<any>(null);

  const canStart = pageType && objectName && keyword && currentOrg && session;

  const handleGenerate = async () => {
    if (!canStart) return;
    setIsRunning(true);
    setResult(null);
    setCurrentStage("context");

    try {
      // Create project row first
      const { data: project, error: pErr } = await supabase
        .from("content_v3_projects")
        .insert({
          organization_id: currentOrg!.id,
          created_by: session!.user.id,
          page_type: pageType,
          audience_channel: audience,
          product_type: productType,
          brand_name: brandName || null,
          object_name: objectName,
          focus_keyword: keyword,
          target_word_count: wordCount,
          parallel_audience: parallelEnabled ? parallelAudience : null,
        })
        .select()
        .single();

      if (pErr || !project) throw new Error(pErr?.message ?? "Project creation failed");

      // Stage progression simulation
      const stageTimers: Stage[] = ["context", "outline", "writer", "compliance"];
      let i = 0;
      const stageInterval = setInterval(() => {
        i++;
        if (i < stageTimers.length) setCurrentStage(stageTimers[i]);
      }, 8000);

      const { data, error } = await supabase.functions.invoke("generate-content-v3", {
        body: {
          project_id: project.id,
          page_type: pageType,
          audience_channel: audience,
          product_type: productType,
          brand_name: brandName,
          object_name: objectName,
          focus_keyword: keyword,
          target_word_count: wordCount,
          parallel_audience: parallelEnabled ? parallelAudience : null,
        },
      });

      clearInterval(stageInterval);
      setCurrentStage("done");

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setResult(data);
      toast({
        title: "V3 Pipeline abgeschlossen",
        description: `Score ${data.content_score?.total ?? "?"}/100 · ${data.compliance_report?.overall_status}`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Pipeline fehlgeschlagen",
        description: e.message ?? String(e),
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const stageProgress = (() => {
    if (!currentStage) return 0;
    const map: Record<Stage, number> = {
      context: 15,
      outline: 35,
      writer: 70,
      compliance: 90,
      done: 100,
    };
    return map[currentStage];
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <div className="h-6 w-px bg-border" />
            <FlaskConical className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Content Studio V3</h1>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
              Experiment · K-Active Pipeline
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Claude Sonnet · 4-Stage · Brand-Voice + Evidence-Library
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!result && !isRunning && (
          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && <div className={`h-px w-12 ${step > s ? "bg-primary" : "bg-muted"}`} />}
                </div>
              ))}
              <span className="ml-4 text-sm text-muted-foreground">
                {step === 1 && "Seitentyp wählen"}
                {step === 2 && "Objekt definieren"}
                {step === 3 && "Audience & Keyword"}
              </span>
            </div>

            {/* Step 1 — Page Type */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Seitentyp wählen</CardTitle>
                  <CardDescription>
                    Jeder Seitentyp hat eine eigene Struktur, Voice-Mode-Kombination und Compliance-Regel.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {PAGE_TYPES.map((pt) => (
                      <button
                        key={pt.id}
                        onClick={() => {
                          setPageType(pt.id);
                          setStep(2);
                        }}
                        className={`p-4 border rounded-lg text-left transition hover:border-primary hover:bg-primary/5 ${
                          pageType === pt.id ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="text-2xl mb-2">{pt.icon}</div>
                        <div className="font-medium">{pt.label}</div>
                        <div className="text-xs text-muted-foreground">{pt.desc}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2 — Object */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Objekt definieren</CardTitle>
                  <CardDescription>
                    Was ist der Gegenstand des Textes? Bei Produktseiten der Produktname, bei Markenseiten der Markenname.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={objectName}
                      onChange={(e) => setObjectName(e.target.value)}
                      placeholder="z.B. K-Active Tape Classic"
                    />
                  </div>

                  {(pageType === "product" || pageType === "brand") && (
                    <>
                      <div>
                        <Label>Produkt-Typ</Label>
                        <Select value={productType} onValueChange={setProductType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_TYPES.map((pt) => (
                              <SelectItem key={pt.id} value={pt.id}>
                                {pt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Steuert Heritage-Claim-Logik (Nitto Denko, 1996, Kenzo Kase nur bei Eigenmarke)
                        </p>
                      </div>
                      <div>
                        <Label>Marke</Label>
                        <Input
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="z.B. K-Active oder BLACKROLL"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Zurück
                    </Button>
                    <Button onClick={() => setStep(3)} disabled={!objectName.trim()}>
                      Weiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3 — Audience + Keyword */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Audience, Keyword & Optionen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label>Audience-Channel *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      {AUDIENCES.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setAudience(a.id)}
                          className={`p-3 border rounded-md text-left text-sm transition ${
                            audience === a.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-medium">{a.label}</div>
                          <div className="text-xs text-muted-foreground">{a.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Fokus-Keyword *</Label>
                      <Input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="z.B. kinesiologisches tape"
                      />
                    </div>
                    <div>
                      <Label>Ziel-Wortzahl</Label>
                      <Input
                        type="number"
                        min={300}
                        max={3000}
                        value={wordCount}
                        onChange={(e) => setWordCount(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="parallel"
                        checked={parallelEnabled}
                        onCheckedChange={(v) => setParallelEnabled(!!v)}
                      />
                      <Label htmlFor="parallel" className="cursor-pointer">
                        Parallel-Audience-Modus
                      </Label>
                      <Badge variant="outline" className="text-xs">Experimentell</Badge>
                    </div>
                    {parallelEnabled && (
                      <div>
                        <Label>Zweite Audience</Label>
                        <Select value={parallelAudience} onValueChange={setParallelAudience}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AUDIENCES.filter((a) => a.id !== audience).map((a) => (
                              <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Zurück
                    </Button>
                    <Button onClick={handleGenerate} disabled={!canStart}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Pipeline starten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Running State */}
        {isRunning && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="w-5 h-5 animate-pulse text-primary" />
                Pipeline läuft …
              </CardTitle>
              <CardDescription>
                4-Stage-Pipeline mit Claude Sonnet (kann 30–90 Sekunden dauern)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={stageProgress} />
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(["context", "outline", "writer", "compliance"] as Stage[]).map((s) => {
                  const order = ["context", "outline", "writer", "compliance"];
                  const isCurrent = currentStage === s;
                  const isDone =
                    currentStage && order.indexOf(currentStage) > order.indexOf(s);
                  return (
                    <div
                      key={s}
                      className={`p-3 rounded border text-center ${
                        isDone
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                          : isCurrent
                            ? "bg-primary/10 border-primary text-primary animate-pulse"
                            : "bg-muted border-border text-muted-foreground"
                      }`}
                    >
                      <div className="font-medium uppercase">{s}</div>
                      <div className="text-[10px] mt-1">
                        {s === "context" && "Brand · Evidence · Heritage"}
                        {s === "outline" && "T=0.4 · Struktur"}
                        {s === "writer" && "T=0.7 · Text"}
                        {s === "compliance" && "HWG · Evidence-Match"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Score Banner */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                        result.content_score?.total >= 80
                          ? "bg-emerald-500/10 text-emerald-700"
                          : result.content_score?.total >= 60
                            ? "bg-amber-500/10 text-amber-700"
                            : "bg-red-500/10 text-red-700"
                      }`}
                    >
                      {result.content_score?.total ?? "—"}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Content-Score</div>
                      <div className="font-medium">
                        {result.compliance_report?.overall_status === "passed" && (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" /> Passed
                          </span>
                        )}
                        {result.compliance_report?.overall_status === "warnings" && (
                          <span className="flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="w-4 h-4" /> Warnings
                          </span>
                        )}
                        {result.compliance_report?.overall_status === "rejected" && (
                          <span className="flex items-center gap-1 text-red-700">
                            <XCircle className="w-4 h-4" /> Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>Tokens: {result.tokens_used?.toLocaleString()}</div>
                    <div>Kosten: {(result.cost_cents / 100).toFixed(3)} €</div>
                    {result.rewrite_count > 0 && (
                      <div className="text-amber-700">Rewrites: {result.rewrite_count}</div>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => { setResult(null); setStep(1); }}>
                    Neuer Lauf
                  </Button>
                </div>

                {result.content_score?.breakdown && (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-6">
                    {Object.entries(result.content_score.breakdown).map(([k, v]: [string, any]) => (
                      <div key={k} className="text-center p-2 bg-muted/30 rounded">
                        <div className="text-xs text-muted-foreground capitalize">{k}</div>
                        <div className="font-semibold">{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content"><FileText className="w-4 h-4 mr-1" />Content</TabsTrigger>
                <TabsTrigger value="outline"><Layers className="w-4 h-4 mr-1" />Outline</TabsTrigger>
                <TabsTrigger value="compliance"><ShieldCheck className="w-4 h-4 mr-1" />Compliance</TabsTrigger>
                {result.parallel_content && (
                  <TabsTrigger value="parallel">Parallel-Audience</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="content">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Title</div>
                      <h2 className="text-xl font-semibold">{result.final_content?.title}</h2>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Meta Description</div>
                      <p className="text-sm">{result.final_content?.meta_description}</p>
                    </div>
                    <div className="border-t pt-4 space-y-6">
                      {result.final_content?.sections?.map((s: any, i: number) => (
                        <div key={i}>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {s.h2}
                            {s.evidence_refs_used?.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({s.evidence_refs_used.join(", ")})
                              </span>
                            )}
                          </h3>
                          <div
                            className="prose prose-sm max-w-none mt-2"
                            dangerouslySetInnerHTML={{ __html: s.content_html ?? "" }}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outline">
                <Card>
                  <CardContent className="p-6">
                    <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-4 rounded">
                      {JSON.stringify(result.outline, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compliance">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <ComplianceSection
                      title="HWG-Verstöße"
                      items={result.compliance_report?.hwg_violations}
                      severity="error"
                      render={(v: any) => `${v.category}: "${v.phrase}"`}
                    />
                    <ComplianceSection
                      title="Brand-Voice 'Don't-Use'"
                      items={result.compliance_report?.dont_use_violations}
                      severity="warning"
                      render={(v: any) => v}
                    />
                    <ComplianceSection
                      title="Heritage-Verstöße"
                      items={result.compliance_report?.heritage_violations}
                      severity="error"
                      render={(v: any) => v}
                    />
                    <ComplianceSection
                      title="Page-Type-Verstöße"
                      items={result.compliance_report?.page_type_violations}
                      severity="error"
                      render={(v: any) => v}
                    />
                    <ComplianceSection
                      title="Competitor-Warnings"
                      items={result.compliance_report?.competitor_warnings}
                      severity="warning"
                      render={(v: any) => `${v.competitor}: "${v.phrase}"`}
                    />
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium mb-2">Evidence-Matching</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 bg-emerald-500/10 rounded">
                          <div className="text-muted-foreground">Matched</div>
                          <div className="font-semibold">{result.compliance_report?.evidence_matching?.matched?.join(", ") || "—"}</div>
                        </div>
                        <div className="p-2 bg-red-500/10 rounded">
                          <div className="text-muted-foreground">Invalid Refs</div>
                          <div className="font-semibold">{result.compliance_report?.evidence_matching?.invalid?.join(", ") || "—"}</div>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <div className="text-muted-foreground">Total</div>
                          <div className="font-semibold">{result.compliance_report?.evidence_matching?.total_refs ?? 0}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {result.parallel_content && (
                <TabsContent value="parallel">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <Badge variant="outline">Audience: {parallelAudience}</Badge>
                      <h2 className="text-xl font-semibold">{result.parallel_content?.title}</h2>
                      <div className="space-y-4 border-t pt-4">
                        {result.parallel_content?.sections?.map((s: any, i: number) => (
                          <div key={i}>
                            <h3 className="font-semibold">{s.h2}</h3>
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: s.content_html ?? "" }}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}

function ComplianceSection({
  title,
  items,
  severity,
  render,
}: {
  title: string;
  items?: any[];
  severity: "error" | "warning";
  render: (v: any) => string;
}) {
  const isEmpty = !items || items.length === 0;
  return (
    <div>
      <div className="text-sm font-medium flex items-center gap-2 mb-2">
        {isEmpty ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : severity === "error" ? (
          <XCircle className="w-4 h-4 text-red-600" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        )}
        {title}
        <Badge variant="outline" className="text-xs">{items?.length ?? 0}</Badge>
      </div>
      {!isEmpty && (
        <ul className="text-xs space-y-1 ml-6">
          {items!.map((it, i) => (
            <li
              key={i}
              className={severity === "error" ? "text-red-700" : "text-amber-700"}
            >
              • {render(it)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
