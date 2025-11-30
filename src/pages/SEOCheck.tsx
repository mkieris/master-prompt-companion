import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  LogOut, 
  Search, 
  Globe, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  ArrowLeft,
  ExternalLink,
  Target,
  Link2,
  Image,
  Code,
  Zap,
  ChevronDown,
  ChevronRight,
  Eye,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface IndexProps {
  session: Session | null;
}

interface CheckResult {
  name: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  value?: string | number;
  recommendation?: string;
}

interface CategoryResult {
  score: number;
  maxScore: number;
  checks: CheckResult[];
}

interface SEOIssue {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
}

interface LinkInfo {
  url: string;
  text: string;
  hasNofollow: boolean;
}

interface HeadingInfo {
  level: number;
  text: string;
  hasIssue: boolean;
  issue?: string;
}

interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
}

interface SEOCheckResult {
  url: string;
  timestamp: string;
  score: number;
  categories: {
    meta: CategoryResult;
    content: CategoryResult;
    technical: CategoryResult;
    links: CategoryResult;
    media: CategoryResult;
  };
  issues: SEOIssue[];
  recommendations: string[];
  contentData: {
    markdown: string;
    wordCount: number;
    headings: HeadingInfo[];
  };
  linkData: {
    internal: LinkInfo[];
    external: LinkInfo[];
  };
  mediaData: {
    images: ImageInfo[];
    imagesWithoutAlt: ImageInfo[];
  };
  metaData: {
    title: string;
    description: string;
    canonical: string;
    robots: string;
  };
}

const SEOCheck = ({ session }: IndexProps) => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"single" | "domain">("single");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SEOCheckResult | null>(null);
  const [internalLinksOpen, setInternalLinksOpen] = useState(false);
  const [externalLinksOpen, setExternalLinksOpen] = useState(false);
  const { toast } = useToast();

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

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine URL ein",
        variant: "destructive",
      });
      return;
    }

    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = 'https://' + url;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("seo-check", {
        body: { url: normalizedUrl, mode },
      });

      if (error) {
        console.error("Error:", error);
        toast({
          title: "Fehler",
          description: error.message || "Fehler beim SEO-Check",
          variant: "destructive",
        });
        return;
      }

      setResult(data);
      toast({
        title: "Erfolgreich",
        description: `SEO-Check abgeschlossen. Score: ${data.score}/100`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-success/10";
    if (score >= 60) return "bg-warning/10";
    return "bg-destructive/10";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Kritisch</Badge>;
      case 'warning':
        return <Badge className="bg-warning text-warning-foreground">Warnung</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meta':
        return <FileText className="h-5 w-5" />;
      case 'content':
        return <Target className="h-5 w-5" />;
      case 'technical':
        return <Code className="h-5 w-5" />;
      case 'links':
        return <Link2 className="h-5 w-5" />;
      case 'media':
        return <Image className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'meta':
        return 'Meta & Titel';
      case 'content':
        return 'Content & Struktur';
      case 'technical':
        return 'Technisch';
      case 'links':
        return 'Links';
      case 'media':
        return 'Medien';
      default:
        return category;
    }
  };

  const renderCategoryCard = (key: string, category: CategoryResult) => {
    const percentage = Math.round((category.score / category.maxScore) * 100);
    const passedCount = category.checks.filter(c => c.passed).length;
    
    return (
      <Card key={key} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getCategoryIcon(key)}
              <CardTitle className="text-lg">{getCategoryLabel(key)}</CardTitle>
            </div>
            <Badge variant={percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "destructive"}>
              {percentage}%
            </Badge>
          </div>
          <CardDescription>
            {passedCount} von {category.checks.length} Checks bestanden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={percentage} className="h-2" />
          <div className="space-y-2">
            {category.checks.map((check, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                {check.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                ) : (
                  getSeverityIcon(check.severity)
                )}
                <div className="flex-1">
                  <span className={check.passed ? "text-muted-foreground" : "text-foreground"}>
                    {check.name}
                  </span>
                  <p className="text-xs text-muted-foreground">{check.message}</p>
                  {!check.passed && check.recommendation && (
                    <p className="text-xs text-primary mt-1">→ {check.recommendation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContentTab = () => {
    if (!result?.contentData) return renderCategoryCard('content', result!.categories.content);

    const { headings, markdown, wordCount } = result.contentData;
    const hasHeadingIssues = headings.some(h => h.hasIssue);

    return (
      <div className="space-y-4">
        {renderCategoryCard('content', result.categories.content)}
        
        {/* Headings Structure */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Überschriften-Struktur
              </CardTitle>
              {hasHeadingIssues && (
                <Badge variant="destructive">Probleme gefunden</Badge>
              )}
            </div>
            <CardDescription>
              {headings.length} Überschriften auf der Seite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] rounded border p-3 bg-muted/30">
              <div className="space-y-1 font-mono text-sm">
                {headings.length === 0 ? (
                  <p className="text-muted-foreground italic">Keine Überschriften gefunden</p>
                ) : (
                  headings.map((heading, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-2 py-1 ${heading.hasIssue ? 'bg-destructive/10 rounded px-2 -mx-2' : ''}`}
                      style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}
                    >
                      <Badge 
                        variant={heading.hasIssue ? "destructive" : "outline"} 
                        className="text-xs shrink-0"
                      >
                        H{heading.level}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <span className={heading.hasIssue ? "text-destructive" : "text-foreground"}>
                          {heading.text || "(leer)"}
                        </span>
                        {heading.hasIssue && heading.issue && (
                          <p className="text-xs text-destructive mt-0.5">⚠ {heading.issue}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Content Preview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content-Vorschau
            </CardTitle>
            <CardDescription>
              {wordCount} Wörter extrahiert
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] rounded border p-3 bg-muted/30">
              <div className="prose prose-sm max-w-none text-foreground">
                <pre className="whitespace-pre-wrap text-xs font-sans">
                  {markdown.substring(0, 3000)}{markdown.length > 3000 ? '...' : ''}
                </pre>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLinksTab = () => {
    if (!result?.linkData) return renderCategoryCard('links', result!.categories.links);

    const { internal, external } = result.linkData;

    return (
      <div className="space-y-4">
        {renderCategoryCard('links', result.categories.links)}

        {/* Internal Links (Outgoing to same domain) */}
        <Card>
          <Collapsible open={internalLinksOpen} onOpenChange={setInternalLinksOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-primary" />
                    Interne Links (ausgehend)
                    <Badge variant="secondary">{internal.length}</Badge>
                  </CardTitle>
                  {internalLinksOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <CardDescription>
                  Links zu anderen Seiten derselben Domain
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <ScrollArea className="h-[250px] rounded border bg-muted/30">
                  <div className="p-3 space-y-2">
                    {internal.length === 0 ? (
                      <p className="text-muted-foreground italic text-sm">Keine internen Links gefunden</p>
                    ) : (
                      internal.map((link, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm p-2 rounded hover:bg-muted/50">
                          <Link2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{link.text || "(kein Ankertext)"}</p>
                            <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                            {link.hasNofollow && (
                              <Badge variant="outline" className="text-xs mt-1">nofollow</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* External Links (Outgoing to other domains) */}
        <Card>
          <Collapsible open={externalLinksOpen} onOpenChange={setExternalLinksOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-accent" />
                    Externe Links (ausgehend)
                    <Badge variant="secondary">{external.length}</Badge>
                  </CardTitle>
                  {externalLinksOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <CardDescription>
                  Links zu anderen Domains
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <ScrollArea className="h-[250px] rounded border bg-muted/30">
                  <div className="p-3 space-y-2">
                    {external.length === 0 ? (
                      <p className="text-muted-foreground italic text-sm">Keine externen Links gefunden</p>
                    ) : (
                      external.map((link, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm p-2 rounded hover:bg-muted/50">
                          <ExternalLink className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{link.text || "(kein Ankertext)"}</p>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate block"
                            >
                              {link.url}
                            </a>
                            {link.hasNofollow && (
                              <Badge variant="outline" className="text-xs mt-1">nofollow</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    );
  };

  const renderMediaTab = () => {
    if (!result?.mediaData) return renderCategoryCard('media', result!.categories.media);

    const { images, imagesWithoutAlt } = result.mediaData;

    return (
      <div className="space-y-4">
        {renderCategoryCard('media', result.categories.media)}

        {/* Images without Alt */}
        {imagesWithoutAlt.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Bilder ohne Alt-Text
                </CardTitle>
                <Badge variant="destructive">{imagesWithoutAlt.length}</Badge>
              </div>
              <CardDescription>
                Diese Bilder benötigen beschreibende Alt-Texte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] rounded border bg-muted/30">
                <div className="p-3 space-y-2">
                  {imagesWithoutAlt.map((img, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm p-2 rounded bg-destructive/5 border border-destructive/20">
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{img.src}</p>
                        <p className="text-xs text-destructive mt-1">Alt-Text fehlt</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* All Images */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="h-5 w-5" />
              Alle Bilder
            </CardTitle>
            <CardDescription>
              {images.length} Bilder auf der Seite, {images.filter(i => i.hasAlt).length} mit Alt-Text
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] rounded border bg-muted/30">
              <div className="p-3 space-y-2">
                {images.length === 0 ? (
                  <p className="text-muted-foreground italic text-sm">Keine Bilder gefunden</p>
                ) : (
                  images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-2 text-sm p-2 rounded ${!img.hasAlt ? 'bg-destructive/5 border border-destructive/20' : 'hover:bg-muted/50'}`}
                    >
                      {img.hasAlt ? (
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{img.src}</p>
                        {img.hasAlt ? (
                          <p className="text-xs text-foreground mt-1">Alt: {img.alt}</p>
                        ) : (
                          <p className="text-xs text-destructive mt-1">Alt-Text fehlt</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Search className="h-6 w-6" />
                  SEO-Check
                </h1>
                <p className="text-sm text-muted-foreground">
                  Umfassende On-Page SEO-Analyse wie bei professionellen Tools
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/">
                <Button variant="outline">SEO Generator</Button>
              </Link>
              <Link to="/pro">
                <Button variant="default">PRO Version</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Website analysieren</CardTitle>
            <CardDescription>
              Geben Sie eine URL ein und wählen Sie den Analyse-Modus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheck} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="https://example.com/page"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <Button type="submit" disabled={isLoading} size="lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Analysieren
                    </>
                  )}
                </Button>
              </div>
              
              <RadioGroup
                value={mode}
                onValueChange={(v) => setMode(v as "single" | "domain")}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Einzelne Seite
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="domain" id="domain" disabled />
                  <Label htmlFor="domain" className="cursor-pointer text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Ganze Domain (bald verfügbar)
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <div>
                  <p className="text-lg font-medium">SEO-Analyse läuft...</p>
                  <p className="text-sm text-muted-foreground">
                    Die Seite wird gecrawlt und auf über 20 SEO-Faktoren geprüft
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && !isLoading && (
          <div className="space-y-6">
            {/* Score Overview */}
            <Card className={getScoreBgColor(result.score)}>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Analysierte URL</p>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      {result.url}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">SEO Score</p>
                    <p className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                      {result.score}
                      <span className="text-2xl text-muted-foreground">/100</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issues Summary */}
            {result.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Kritische Probleme ({result.issues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.issues.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{issue.title}</span>
                            {getSeverityBadge(issue.severity)}
                          </div>
                          <p className="text-sm text-muted-foreground">{issue.description}</p>
                          <p className="text-sm text-primary mt-1">→ {issue.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Recommendations */}
            {result.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Top-Empfehlungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 list-decimal list-inside">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm">{rec}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {/* Detailed Analysis Tabs */}
            <Tabs defaultValue="meta">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="meta" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Meta</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
                <TabsTrigger value="technical" className="flex items-center gap-1">
                  <Code className="h-4 w-4" />
                  <span className="hidden sm:inline">Technik</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="flex items-center gap-1">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Links</span>
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-1">
                  <Image className="h-4 w-4" />
                  <span className="hidden sm:inline">Medien</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="meta" className="mt-4">
                {renderCategoryCard('meta', result.categories.meta)}
              </TabsContent>
              <TabsContent value="content" className="mt-4">
                {renderContentTab()}
              </TabsContent>
              <TabsContent value="technical" className="mt-4">
                {renderCategoryCard('technical', result.categories.technical)}
              </TabsContent>
              <TabsContent value="links" className="mt-4">
                {renderLinksTab()}
              </TabsContent>
              <TabsContent value="media" className="mt-4">
                {renderMediaTab()}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!result && !isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium">Keine Analyse vorhanden</p>
                  <p className="text-sm text-muted-foreground">
                    Geben Sie oben eine URL ein, um die SEO-Analyse zu starten
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge variant="outline">Title & Meta</Badge>
                  <Badge variant="outline">Überschriften</Badge>
                  <Badge variant="outline">Content-Länge</Badge>
                  <Badge variant="outline">Interne Links</Badge>
                  <Badge variant="outline">Bilder Alt-Texte</Badge>
                  <Badge variant="outline">Schema.org</Badge>
                  <Badge variant="outline">Mobile-Friendly</Badge>
                  <Badge variant="outline">HTTPS</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SEOCheck;
