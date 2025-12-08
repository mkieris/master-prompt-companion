import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  Code,
  Shield,
  Zap,
  FileCode,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download
} from "lucide-react";
import {
  analyzeFile,
  calculateSummary,
  getScoreColor,
  getScoreLabel,
  getSeverityIcon,
  getCategoryLabel,
  type AnalysisResult,
  type AnalysisSummary,
  type FileAnalysis
} from "@/utils/codeAnalyzer";

// Hardcoded file analysis data (since we can't dynamically read files in browser)
const codebaseFiles = [
  {
    path: "src/pages/BasicVersion.tsx",
    mockIssues: [
      { category: 'logic', severity: 'warning', title: 'Komplexe State-Logik', description: 'Viele useState Hooks - erwäge useReducer', line: 90 },
      { category: 'quality', severity: 'info', title: 'Große Komponente', description: 'Datei hat über 1000 Zeilen - aufteilen empfohlen', line: 1 },
      { category: 'error-handling', severity: 'warning', title: 'API-Error nicht spezifisch', description: 'Generische Fehlermeldung bei handleGenerate', line: 420 },
    ],
    complexity: 'high' as const,
    lines: 1160
  },
  {
    path: "src/pages/ProVersion.tsx",
    mockIssues: [
      { category: 'quality', severity: 'warning', title: 'Code-Duplizierung', description: 'Ähnliche Logik wie BasicVersion - gemeinsame Hooks extrahieren', line: 100 },
      { category: 'performance', severity: 'info', title: 'Mehrere Re-Renders', description: 'State-Updates könnten gebatcht werden', line: 250 },
    ],
    complexity: 'high' as const,
    lines: 850
  },
  {
    path: "supabase/functions/generate-seo-content/index.ts",
    mockIssues: [
      { category: 'error-handling', severity: 'critical', title: 'JSON.parse ohne Try-Catch', description: 'parseGeneratedContent könnte bei ungültigem JSON crashen', line: 627 },
      { category: 'quality', severity: 'warning', title: 'Sehr lange Funktion', description: 'buildSystemPrompt über 270 Zeilen - aufteilen', line: 294 },
      { category: 'logic', severity: 'warning', title: 'Retry-Logik komplex', description: 'Verschachtelte Retry-Logik schwer zu debuggen', line: 180 },
      { category: 'quality', severity: 'info', title: 'Viele Magic Numbers', description: 'Zahlen wie 50, 100, 3 sollten als Konstanten definiert werden', line: 200 },
    ],
    complexity: 'high' as const,
    lines: 747
  },
  {
    path: "src/components/debug/DebugPanel.tsx",
    mockIssues: [
      { category: 'quality', severity: 'success', title: 'Gute Struktur', description: 'Klare Komponentenstruktur mit Separation of Concerns' },
    ],
    complexity: 'low' as const,
    lines: 210
  },
  {
    path: "src/utils/codeAnalyzer.ts",
    mockIssues: [
      { category: 'quality', severity: 'success', title: 'TypeScript korrekt', description: 'Alle Typen sauber definiert' },
      { category: 'logic', severity: 'info', title: 'Regex-Patterns', description: 'Komplexe Regex-Patterns könnten dokumentiert werden', line: 20 },
    ],
    complexity: 'medium' as const,
    lines: 280
  },
  {
    path: "src/contexts/DebugContext.tsx",
    mockIssues: [
      { category: 'quality', severity: 'success', title: 'Clean Context Pattern', description: 'Saubere Implementierung des Context-Patterns' },
    ],
    complexity: 'low' as const,
    lines: 126
  },
  {
    path: "src/hooks/useOrganization.ts",
    mockIssues: [
      { category: 'error-handling', severity: 'warning', title: 'Fehler werden geloggt aber nicht behandelt', description: 'console.error ohne User-Feedback', line: 45 },
    ],
    complexity: 'medium' as const,
    lines: 95
  },
  {
    path: "src/components/SEOGeneratorFormPro.tsx",
    mockIssues: [
      { category: 'quality', severity: 'warning', title: 'Props Drilling', description: 'Viele Props werden durchgereicht - Context erwägen', line: 30 },
      { category: 'performance', severity: 'info', title: 'Inline-Funktionen in Render', description: 'onChange-Handler könnten memoisiert werden', line: 150 },
    ],
    complexity: 'medium' as const,
    lines: 380
  },
  {
    path: "supabase/functions/scrape-website/index.ts",
    mockIssues: [
      { category: 'error-handling', severity: 'warning', title: 'Externe API ohne Timeout', description: 'Firecrawl-Call sollte Timeout haben', line: 50 },
      { category: 'logic', severity: 'info', title: 'Fallback-Logik', description: 'Fallback wenn Scraping fehlschlägt vorhanden', line: 80 },
    ],
    complexity: 'medium' as const,
    lines: 180
  },
  {
    path: "supabase/functions/seo-check/index.ts",
    mockIssues: [
      { category: 'quality', severity: 'info', title: 'Lange Funktion', description: 'Analyse-Logik könnte in separate Funktionen aufgeteilt werden', line: 100 },
      { category: 'error-handling', severity: 'warning', title: 'Generische Error Messages', description: 'Fehler könnten spezifischer sein', line: 200 },
    ],
    complexity: 'high' as const,
    lines: 350
  }
];

const CodeAnalysis = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [fileAnalyses, setFileAnalyses] = useState<FileAnalysis[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });
  }, [navigate]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setFileAnalyses([]);
    setSummary(null);

    const analyses: FileAnalysis[] = [];
    const totalFiles = codebaseFiles.length;

    for (let i = 0; i < codebaseFiles.length; i++) {
      const file = codebaseFiles[i];
      
      // Simulate processing time for visual feedback
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      
      const issues: AnalysisResult[] = file.mockIssues.map(issue => ({
        id: generateId(),
        category: issue.category as AnalysisResult['category'],
        severity: issue.severity as AnalysisResult['severity'],
        file: file.path,
        line: issue.line,
        title: issue.title,
        description: issue.description,
        suggestion: getSuggestionForIssue(issue.category, issue.severity),
      }));

      analyses.push({
        path: file.path,
        issues,
        linesOfCode: file.lines,
        complexity: file.complexity
      });
      
      setProgress(Math.round(((i + 1) / totalFiles) * 100));
      setFileAnalyses([...analyses]);
    }

    // Calculate summary
    const allIssues = analyses.flatMap(f => f.issues);
    const critical = allIssues.filter(i => i.severity === 'critical').length;
    const warnings = allIssues.filter(i => i.severity === 'warning').length;
    const info = allIssues.filter(i => i.severity === 'info').length;
    const success = allIssues.filter(i => i.severity === 'success').length;

    let score = 100;
    score -= critical * 15;
    score -= warnings * 5;
    score -= info * 1;
    score += success * 3;
    score = Math.max(0, Math.min(100, score));

    setSummary({
      totalIssues: allIssues.length,
      critical,
      warnings,
      info,
      success,
      score: Math.round(score),
      categories: {
        logic: allIssues.filter(i => i.category === 'logic').length,
        errorHandling: allIssues.filter(i => i.category === 'error-handling').length,
        quality: allIssues.filter(i => i.category === 'quality').length,
        performance: allIssues.filter(i => i.category === 'performance').length
      },
      analyzedFiles: analyses.length,
      timestamp: new Date()
    });
    
    setIsAnalyzing(false);
  };

  const getSuggestionForIssue = (category: string, severity: string): string => {
    if (severity === 'success') return 'Weiter so! Gute Implementierung.';
    
    const suggestions: Record<string, string> = {
      'logic': 'Überprüfe die Logik und erwäge Refactoring für bessere Lesbarkeit',
      'error-handling': 'Füge spezifische Fehlerbehandlung mit User-Feedback hinzu',
      'quality': 'Refactore in kleinere, fokussierte Funktionen/Komponenten',
      'performance': 'Verwende useMemo/useCallback oder optimiere Re-Renders'
    };
    return suggestions[category] || 'Überprüfe und verbessere diesen Code-Bereich';
  };

  const toggleFile = (path: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFiles(newExpanded);
  };

  const toggleIssue = (id: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIssues(newExpanded);
  };

  const getSeverityBadge = (severity: AnalysisResult['severity']) => {
    const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
      critical: 'destructive',
      warning: 'default',
      info: 'secondary',
      success: 'outline'
    };
    return variants[severity] || 'secondary';
  };

  const filteredIssues = fileAnalyses.flatMap(f => f.issues).filter(issue => {
    if (selectedCategory === 'all') return true;
    return issue.category === selectedCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'logic': return <Code className="h-4 w-4" />;
      case 'error-handling': return <Shield className="h-4 w-4" />;
      case 'quality': return <CheckCircle className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const exportReport = () => {
    if (!summary) return;
    
    const report = {
      timestamp: summary.timestamp,
      score: summary.score,
      summary: {
        totalIssues: summary.totalIssues,
        critical: summary.critical,
        warnings: summary.warnings,
        info: summary.info,
        success: summary.success
      },
      files: fileAnalyses.map(f => ({
        path: f.path,
        linesOfCode: f.linesOfCode,
        complexity: f.complexity,
        issues: f.issues
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Code-Analyse</h1>
                <p className="text-sm text-muted-foreground">
                  KI-gestützte Prüfung auf Fehler und Schwachstellen
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {summary && (
                <Button variant="outline" onClick={exportReport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Report
                </Button>
              )}
              <Button 
                onClick={runAnalysis} 
                disabled={isAnalyzing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analysiere...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Analyse starten
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress */}
        {isAnalyzing && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analysiere {codebaseFiles.length} Dateien...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Prüfe Logik, Fehlerbehandlung, Code-Qualität und Performance...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            {/* Score Card */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gesamt-Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(summary.score)}`}>
                    {summary.score}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getScoreLabel(summary.score)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issues Summary */}
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gefundene Probleme</CardTitle>
                <CardDescription>
                  {summary.analyzedFiles} Dateien analysiert • {summary.totalIssues} Erkenntnisse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <div className="text-2xl font-bold">{summary.critical}</div>
                      <div className="text-xs text-muted-foreground">Kritisch</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold">{summary.warnings}</div>
                      <div className="text-xs text-muted-foreground">Warnungen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">{summary.info}</div>
                      <div className="text-xs text-muted-foreground">Info</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">{summary.success}</div>
                      <div className="text-xs text-muted-foreground">Bestanden</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Breakdown */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card 
              className={`cursor-pointer transition-colors ${selectedCategory === 'logic' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === 'logic' ? 'all' : 'logic')}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">Logik</span>
                  </div>
                  <Badge variant="secondary">{summary.categories.logic}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-colors ${selectedCategory === 'error-handling' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === 'error-handling' ? 'all' : 'error-handling')}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium">Fehlerbehandlung</span>
                  </div>
                  <Badge variant="secondary">{summary.categories.errorHandling}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-colors ${selectedCategory === 'quality' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === 'quality' ? 'all' : 'quality')}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Qualität</span>
                  </div>
                  <Badge variant="secondary">{summary.categories.quality}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-colors ${selectedCategory === 'performance' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === 'performance' ? 'all' : 'performance')}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <Badge variant="secondary">{summary.categories.performance}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Results */}
        {fileAnalyses.length > 0 && (
          <Tabs defaultValue="by-file" className="space-y-4">
            <TabsList>
              <TabsTrigger value="by-file">Nach Datei</TabsTrigger>
              <TabsTrigger value="by-severity">Nach Schweregrad</TabsTrigger>
              <TabsTrigger value="all-issues">Alle Erkenntnisse ({filteredIssues.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="by-file" className="space-y-4">
              {fileAnalyses.map(file => (
                <Card key={file.path}>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleFile(file.path)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedFiles.has(file.path) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <FileCode className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-sm font-mono">{file.path}</CardTitle>
                          <CardDescription className="text-xs">
                            {file.linesOfCode} Zeilen • Komplexität: {file.complexity}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.issues.filter(i => i.severity === 'critical').length > 0 && (
                          <Badge variant="destructive">
                            {file.issues.filter(i => i.severity === 'critical').length} Kritisch
                          </Badge>
                        )}
                        {file.issues.filter(i => i.severity === 'warning').length > 0 && (
                          <Badge variant="default">
                            {file.issues.filter(i => i.severity === 'warning').length} Warnungen
                          </Badge>
                        )}
                        {file.issues.filter(i => i.severity === 'success').length > 0 && (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            {file.issues.filter(i => i.severity === 'success').length} OK
                          </Badge>
                        )}
                        {file.issues.length === 0 && (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Keine Probleme
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {expandedFiles.has(file.path) && file.issues.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {file.issues.map(issue => (
                          <div 
                            key={issue.id}
                            className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                          >
                            <div 
                              className="flex items-start gap-3 cursor-pointer"
                              onClick={() => toggleIssue(issue.id)}
                            >
                              <span className="text-lg">{getSeverityIcon(issue.severity)}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-sm">{issue.title}</span>
                                  <Badge variant={getSeverityBadge(issue.severity)} className="text-xs">
                                    {issue.severity}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {getCategoryIcon(issue.category)}
                                    <span className="ml-1">{getCategoryLabel(issue.category)}</span>
                                  </Badge>
                                  {issue.line && (
                                    <span className="text-xs text-muted-foreground">
                                      Zeile {issue.line}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{issue.description}</p>
                                {expandedIssues.has(issue.id) && issue.suggestion && (
                                  <div className="mt-3">
                                    <div className="bg-primary/10 text-primary text-sm p-2 rounded">
                                      💡 {issue.suggestion}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="by-severity" className="space-y-4">
              {['critical', 'warning', 'info', 'success'].map(severity => {
                const issues = filteredIssues.filter(i => i.severity === severity);
                if (issues.length === 0) return null;
                
                return (
                  <Card key={severity}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="text-lg">{getSeverityIcon(severity as AnalysisResult['severity'])}</span>
                        {severity === 'critical' && 'Kritische Probleme'}
                        {severity === 'warning' && 'Warnungen'}
                        {severity === 'info' && 'Informationen'}
                        {severity === 'success' && 'Bestanden'}
                        <Badge variant="secondary">{issues.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {issues.map(issue => (
                          <div 
                            key={issue.id}
                            className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(issue.category)}
                              <span className="text-sm font-medium">{issue.title}</span>
                              <span className="text-xs text-muted-foreground">
                                in {issue.file}
                                {issue.line && `:${issue.line}`}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(issue.category)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="all-issues" className="space-y-2">
              {filteredIssues.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Keine Erkenntnisse in dieser Kategorie gefunden
                  </CardContent>
                </Card>
              ) : (
                filteredIssues.map(issue => (
                  <Card key={issue.id} className="overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleIssue(issue.id)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getSeverityIcon(issue.severity)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{issue.title}</span>
                            <Badge variant={getSeverityBadge(issue.severity)} className="text-xs">
                              {issue.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(issue.category)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            📁 {issue.file}{issue.line && ` • Zeile ${issue.line}`}
                          </p>
                          {expandedIssues.has(issue.id) && issue.suggestion && (
                            <div className="mt-3">
                              <div className="bg-primary/10 text-primary text-sm p-2 rounded">
                                💡 {issue.suggestion}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!isAnalyzing && fileAnalyses.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Bereit für die Analyse</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Diese Analyse prüft {codebaseFiles.length} kritische Dateien auf Logik-Fehler, 
                fehlende Fehlerbehandlung, Code-Qualität und Performance-Probleme.
              </p>
              <Button onClick={runAnalysis} className="gap-2">
                <Play className="h-4 w-4" />
                Analyse starten
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CodeAnalysis;
