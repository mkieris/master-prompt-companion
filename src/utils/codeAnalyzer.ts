// Code Analyzer - Comprehensive code quality and functionality analysis

export interface AnalysisResult {
  id: string;
  category: 'logic' | 'error-handling' | 'quality' | 'performance';
  severity: 'critical' | 'warning' | 'info' | 'success';
  file: string;
  line?: number;
  title: string;
  description: string;
  suggestion?: string;
  codeSnippet?: string;
}

export interface AnalysisSummary {
  totalIssues: number;
  critical: number;
  warnings: number;
  info: number;
  success: number;
  score: number; // 0-100
  categories: {
    logic: number;
    errorHandling: number;
    quality: number;
    performance: number;
  };
  analyzedFiles: number;
  timestamp: Date;
}

export interface FileAnalysis {
  path: string;
  issues: AnalysisResult[];
  linesOfCode: number;
  complexity: 'low' | 'medium' | 'high';
}

// Rule interface for analysis patterns
interface AnalysisRule {
  pattern: RegExp;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  suggestion: string;
}

interface AnalysisRules {
  errorHandling: AnalysisRule[];
  logic: AnalysisRule[];
  quality: AnalysisRule[];
  performance: AnalysisRule[];
}

// Analysis rules and patterns
const analysisRules: AnalysisRules = {
  // Error Handling Patterns
  errorHandling: [
    {
      pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g,
      title: 'Leerer Catch-Block',
      description: 'Catch-Block ohne Fehlerbehandlung gefunden',
      severity: 'critical',
      suggestion: 'Füge Fehlerlogging oder Benutzer-Feedback hinzu'
    },
    {
      pattern: /catch\s*\(\s*\w+\s*\)\s*\{\s*console\.log/g,
      title: 'Nur Console.log im Catch',
      description: 'Fehler wird nur geloggt, aber nicht behandelt',
      severity: 'warning',
      suggestion: 'Erwäge toast() für Benutzer-Feedback und sinnvolle Fehlerbehandlung'
    },
    {
      pattern: /\.then\([^)]+\)(?!\s*\.catch)/g,
      title: 'Promise ohne Catch',
      description: 'Promise-Chain ohne Fehlerbehandlung',
      severity: 'warning',
      suggestion: 'Füge .catch() oder try/catch mit async/await hinzu'
    },
    {
      pattern: /throw\s+new\s+Error\s*\(\s*['"`].*['"`]\s*\)/g,
      title: 'Generischer Error',
      description: 'Generische Error-Message ohne Kontext',
      severity: 'info',
      suggestion: 'Verwende spezifischere Fehlermeldungen mit Kontext'
    }
  ],
  
  // Logic & Functionality Patterns
  logic: [
    {
      pattern: /if\s*\(\s*\w+\s*==\s*(?!null|undefined)/g,
      title: 'Lose Gleichheit (==)',
      description: 'Verwendung von == statt === kann zu unerwarteten Ergebnissen führen',
      severity: 'warning',
      suggestion: 'Verwende === für strikte Gleichheit'
    },
    {
      pattern: /useState\s*<[^>]+>\s*\(\s*\[\s*\]\s*\)/g,
      title: 'Leeres Array als Initial-State',
      description: 'useState mit leerem Array initialisiert',
      severity: 'info',
      suggestion: 'Stelle sicher, dass Loading-States korrekt behandelt werden'
    },
    {
      pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*fetch[^}]*\}\s*,\s*\[\s*\]\s*\)/gs,
      title: 'Fetch in useEffect ohne Dependencies',
      description: 'API-Call in useEffect nur bei Mount - prüfe ob Refetch nötig',
      severity: 'info',
      suggestion: 'Erwäge React Query für besseres Data-Fetching'
    },
    {
      pattern: /&&\s*\w+\.map\s*\(/g,
      title: 'Conditional Rendering mit map',
      description: 'Array-Rendering mit &&-Operator',
      severity: 'info',
      suggestion: 'Prüfe ob Fallback für leeres Array nötig ist'
    },
    // Note: This pattern will be context-checked in analyzeContent
    {
      pattern: /JSON\.parse\s*\(/g,
      title: 'JSON.parse Verwendung',
      description: 'JSON.parse gefunden - prüfe ob Try-Catch vorhanden',
      severity: 'info',
      suggestion: 'Stelle sicher dass JSON.parse in einem try-catch Block ist'
    }
  ],
  
  // Code Quality Patterns
  quality: [
    {
      pattern: /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]{500,}/g,
      title: 'Große Funktion',
      description: 'Funktion mit mehr als 500 Zeichen - schwer wartbar',
      severity: 'warning',
      suggestion: 'Refactore in kleinere, fokussierte Funktionen'
    },
    {
      pattern: /\/\/\s*TODO/gi,
      title: 'TODO Kommentar',
      description: 'Unerledigte Aufgabe im Code',
      severity: 'info',
      suggestion: 'Erledige TODO oder erstelle Issue'
    },
    {
      pattern: /\/\/\s*FIXME/gi,
      title: 'FIXME Kommentar',
      description: 'Bekanntes Problem im Code',
      severity: 'warning',
      suggestion: 'Behebe das markierte Problem'
    },
    {
      pattern: /console\.(log|warn|error)\s*\(/g,
      title: 'Console Statement',
      description: 'Debug-Ausgabe im Produktionscode',
      severity: 'info',
      suggestion: 'Entferne oder ersetze durch Debug-System'
    },
    {
      pattern: /any(?:\s|,|\)|\]|>)/g,
      title: 'TypeScript "any" Type',
      description: 'Verwendung von "any" umgeht TypeScript-Prüfungen',
      severity: 'warning',
      suggestion: 'Definiere spezifischen Typ oder verwende unknown'
    },
    {
      pattern: /!important/g,
      title: 'CSS !important',
      description: '!important überschreibt CSS-Kaskade',
      severity: 'warning',
      suggestion: 'Verwende spezifischere Selektoren statt !important'
    }
  ],
  
  // Performance Patterns
  performance: [
    {
      pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*\)/g,
      title: 'useEffect ohne Dependencies',
      description: 'useEffect ohne Dependency-Array läuft bei jedem Render',
      severity: 'critical',
      suggestion: 'Füge Dependency-Array hinzu um unnötige Ausführungen zu vermeiden'
    },
    {
      pattern: /new\s+Date\(\)/g,
      title: 'Date in Render',
      description: 'new Date() im Render kann Performance beeinträchtigen',
      severity: 'info',
      suggestion: 'Erwäge useMemo wenn häufig verwendet'
    },
    {
      pattern: /\.filter\([^)]+\)\.map\(/g,
      title: 'Chained Filter+Map',
      description: 'Array wird zweimal durchlaufen',
      severity: 'info',
      suggestion: 'Erwäge reduce() für einzelnen Durchlauf bei großen Arrays'
    },
    {
      pattern: /style=\{\{/g,
      title: 'Inline Style Object',
      description: 'Inline-Style-Objekt wird bei jedem Render neu erstellt',
      severity: 'info',
      suggestion: 'Verwende className mit Tailwind oder useMemo für Styles'
    },
    {
      pattern: /import\s+\*\s+as/g,
      title: 'Wildcard Import',
      description: 'Importiert gesamtes Modul - verhindert Tree-Shaking',
      severity: 'warning',
      suggestion: 'Importiere nur benötigte Exports'
    }
  ]
};

// Edge Function specific rules
// Edge Function specific rules
const edgeFunctionRules: Pick<AnalysisRules, 'errorHandling' | 'logic'> = {
  errorHandling: [
    {
      pattern: /Deno\.env\.get\s*\([^)]+\)(?!\s*(?:\|\||&&|\?))/g,
      title: 'Env-Variable ohne Fallback',
      description: 'Umgebungsvariable ohne Default-Wert',
      severity: 'warning',
      suggestion: 'Füge Fallback-Wert oder Fehlerprüfung hinzu'
    }
  ],
  logic: [
    {
      pattern: /fetch\s*\([^)]+\)(?!\s*\.then|\s*;[\s\S]*?catch)/g,
      title: 'Fetch ohne Fehlerbehandlung',
      description: 'HTTP-Request ohne Error-Handling',
      severity: 'critical',
      suggestion: 'Wrappe fetch in try-catch und prüfe response.ok'
    }
  ]
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function analyzeContent(
  content: string, 
  filePath: string,
  rules: AnalysisRules
): AnalysisResult[] {
  const results: AnalysisResult[] = [];
  
  for (const [category, patterns] of Object.entries(rules)) {
    for (const rule of patterns) {
      const matches = content.matchAll(rule.pattern);
      for (const match of matches) {
        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
        
        // Smart context check for JSON.parse - verify if it's in a try block
        if (rule.title === 'JSON.parse Verwendung') {
          // Look for 'try {' before the match within 500 chars
          const contextBefore = content.substring(Math.max(0, (match.index || 0) - 500), match.index);
          const tryCount = (contextBefore.match(/\btry\s*\{/g) || []).length;
          const catchCount = (contextBefore.match(/\}\s*catch\s*\(/g) || []).length;
          
          // If there's an unmatched try (more tries than catches), it's likely in a try block
          if (tryCount > catchCount) {
            continue; // Skip this match - it's already in a try block
          }
        }
        
        // Extract code snippet (surrounding lines)
        const lines = content.split('\n');
        const startLine = Math.max(0, lineNumber - 2);
        const endLine = Math.min(lines.length, lineNumber + 2);
        const snippet = lines.slice(startLine, endLine).join('\n');
        
        results.push({
          id: generateId(),
          category: category === 'errorHandling' ? 'error-handling' : category as AnalysisResult['category'],
          severity: rule.severity,
          file: filePath,
          line: lineNumber,
          title: rule.title,
          description: rule.description,
          suggestion: rule.suggestion,
          codeSnippet: snippet
        });
      }
    }
  }
  
  return results;
}

function calculateComplexity(content: string): 'low' | 'medium' | 'high' {
  const lines = content.split('\n').length;
  const conditionals = (content.match(/if\s*\(|switch\s*\(|\?.*:/g) || []).length;
  const loops = (content.match(/for\s*\(|while\s*\(|\.forEach|\.map|\.reduce/g) || []).length;
  
  const complexityScore = (conditionals * 2) + (loops * 3) + (lines / 50);
  
  if (complexityScore < 10) return 'low';
  if (complexityScore < 30) return 'medium';
  return 'high';
}

export function analyzeFile(content: string, filePath: string): FileAnalysis {
  const isEdgeFunction = filePath.includes('supabase/functions');
  
  // For edge functions, merge additional rules into the main categories
  let rules = analysisRules;
  if (isEdgeFunction) {
    rules = {
      errorHandling: [...analysisRules.errorHandling, ...edgeFunctionRules.errorHandling],
      logic: [...analysisRules.logic, ...edgeFunctionRules.logic],
      quality: analysisRules.quality,
      performance: analysisRules.performance
    };
  }
  
  const issues = analyzeContent(content, filePath, rules);
  const lines = content.split('\n').length;
  const complexity = calculateComplexity(content);
  
  return {
    path: filePath,
    issues,
    linesOfCode: lines,
    complexity
  };
}

export function calculateSummary(fileAnalyses: FileAnalysis[]): AnalysisSummary {
  const allIssues = fileAnalyses.flatMap(f => f.issues);
  
  const critical = allIssues.filter(i => i.severity === 'critical').length;
  const warnings = allIssues.filter(i => i.severity === 'warning').length;
  const info = allIssues.filter(i => i.severity === 'info').length;
  
  // Calculate score: Start at 100, subtract points for issues
  let score = 100;
  score -= critical * 15;
  score -= warnings * 5;
  score -= info * 1;
  score = Math.max(0, Math.min(100, score));
  
  // Check for good practices (add points back)
  const hasTypeScript = fileAnalyses.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
  const hasTests = fileAnalyses.some(f => f.path.includes('.test.') || f.path.includes('.spec.'));
  
  if (hasTypeScript) score = Math.min(100, score + 5);
  if (hasTests) score = Math.min(100, score + 5);
  
  return {
    totalIssues: allIssues.length,
    critical,
    warnings,
    info,
    success: 0, // Will be set based on passed checks
    score: Math.round(score),
    categories: {
      logic: allIssues.filter(i => i.category === 'logic').length,
      errorHandling: allIssues.filter(i => i.category === 'error-handling').length,
      quality: allIssues.filter(i => i.category === 'quality').length,
      performance: allIssues.filter(i => i.category === 'performance').length
    },
    analyzedFiles: fileAnalyses.length,
    timestamp: new Date()
  };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Exzellent';
  if (score >= 80) return 'Sehr Gut';
  if (score >= 70) return 'Gut';
  if (score >= 60) return 'Befriedigend';
  if (score >= 50) return 'Ausreichend';
  if (score >= 40) return 'Mangelhaft';
  return 'Kritisch';
}

export function getSeverityIcon(severity: AnalysisResult['severity']): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'warning': return '🟡';
    case 'info': return '🔵';
    case 'success': return '🟢';
  }
}

export function getCategoryLabel(category: AnalysisResult['category']): string {
  switch (category) {
    case 'logic': return 'Logik & Funktionalität';
    case 'error-handling': return 'Fehlerbehandlung';
    case 'quality': return 'Code-Qualität';
    case 'performance': return 'Performance';
  }
}
