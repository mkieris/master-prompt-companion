import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileText, 
  Scale, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Zap,
  Eye,
  Loader2,
  Info,
  ShieldAlert,
  Stethoscope,
  FileSearch,
  Highlighter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HighlightedText } from '@/components/text-check/HighlightedText';

// Lesbarkeits-Analyse Funktionen
function calculateFleschDE(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((acc, word) => acc + countSyllablesDE(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const ASL = words.length / sentences.length; // Durchschnittliche Satzlänge
  const ASW = syllables / words.length; // Durchschnittliche Silben pro Wort
  
  // Flesch-Reading-Ease für Deutsch
  const flesch = 180 - ASL - (58.5 * ASW);
  return Math.max(0, Math.min(100, Math.round(flesch)));
}

function calculateWienerSachtextformel(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const MS = words.filter(w => countSyllablesDE(w) >= 3).length; // Wörter mit 3+ Silben
  const SL = words.length / sentences.length; // Durchschnittliche Satzlänge
  const IW = words.filter(w => w.length > 6).length; // Lange Wörter (>6 Zeichen)
  const ES = words.filter(w => countSyllablesDE(w) === 1).length; // Einsilbige Wörter
  
  // Wiener Sachtextformel (vereinfacht)
  const wstf = 0.1935 * (MS / words.length * 100) + 0.1672 * SL + 0.1297 * (IW / words.length * 100) - 0.0327 * (ES / words.length * 100) - 0.875;
  
  return Math.max(1, Math.min(15, Math.round(wstf * 10) / 10));
}

function countSyllablesDE(word: string): number {
  const vowels = 'aeiouyäöü';
  let count = 0;
  let prevWasVowel = false;
  
  const lowerWord = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
  
  for (const char of lowerWord) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }
  
  // Diphthonge korrigieren
  const diphthongs = ['ei', 'ai', 'au', 'eu', 'äu', 'ie', 'oi'];
  for (const diph of diphthongs) {
    if (lowerWord.includes(diph)) count--;
  }
  
  return Math.max(1, count);
}

function getSprachniveau(flesch: number): { level: string; color: string } {
  if (flesch >= 90) return { level: 'A1', color: 'text-green-600' };
  if (flesch >= 80) return { level: 'A2', color: 'text-green-500' };
  if (flesch >= 70) return { level: 'B1', color: 'text-yellow-500' };
  if (flesch >= 60) return { level: 'B2', color: 'text-yellow-600' };
  if (flesch >= 50) return { level: 'C1', color: 'text-orange-500' };
  return { level: 'C2', color: 'text-red-500' };
}

// Füllwörter und Passiv-Erkennung
const FUELLWOERTER = [
  'eigentlich', 'grundsätzlich', 'gewissermaßen', 'sozusagen', 'quasi', 'irgendwie',
  'halt', 'eben', 'nun', 'mal', 'ja', 'doch', 'wohl', 'schon', 'noch', 'auch',
  'etwa', 'vielleicht', 'möglicherweise', 'eventuell', 'sicherlich', 'bestimmt',
  'natürlich', 'selbstverständlich', 'offensichtlich', 'offenbar', 'anscheinend',
  'ziemlich', 'relativ', 'einigermaßen', 'durchaus', 'wirklich', 'tatsächlich',
  'letztendlich', 'im Grunde', 'an sich', 'an und für sich', 'im Prinzip',
  'praktisch', 'regelrecht', 'richtig', 'total', 'völlig', 'absolut', 'einfach',
  'überhaupt', 'jedenfalls', 'zumindest', 'immerhin', 'allerdings'
];

const PASSIV_PATTERNS = [
  /\b(wird|werden|wurde|wurden|worden)\s+\w+t\b/gi,
  /\b(ist|sind|war|waren)\s+\w+t\s+worden\b/gi,
  /\b(kann|konnte|muss|musste|soll|sollte)\s+\w+t\s+werden\b/gi
];

function findFuellwoerter(text: string): string[] {
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const fw of FUELLWOERTER) {
    const regex = new RegExp(`\\b${fw}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      found.push(...matches);
    }
  }
  
  return found;
}

function findPassivSaetze(text: string): number {
  let count = 0;
  for (const pattern of PASSIV_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

function analyzeSentences(text: string) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const lengths = sentences.map(s => {
    const words = s.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  });
  
  const tooLong = lengths.filter(l => l > 20).length;
  const veryLong = lengths.filter(l => l > 30).length;
  const short = lengths.filter(l => l <= 10).length;
  const medium = lengths.filter(l => l > 10 && l <= 20).length;
  
  const avgLength = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  
  // Sprachmelodie (Variation der Satzlängen)
  const variance = lengths.length > 1 
    ? lengths.reduce((acc, l) => acc + Math.pow(l - avgLength, 2), 0) / lengths.length
    : 0;
  const standardDeviation = Math.sqrt(variance);
  
  let melody = 'Monoton';
  if (standardDeviation > 8) melody = 'Sehr dynamisch';
  else if (standardDeviation > 5) melody = 'Dynamisch';
  else if (standardDeviation > 3) melody = 'Ausgewogen';
  
  return {
    total: sentences.length,
    tooLong,
    veryLong,
    short,
    medium,
    avgLength: Math.round(avgLength * 10) / 10,
    melody
  };
}

// Compliance-Prüfung Patterns
const COMPLIANCE_PATTERNS = {
  heilversprechen: [
    { pattern: /\b(heilt|heilung|geheilt|kuriert|kur)\b/gi, severity: 'critical', category: 'Heilversprechen' },
    { pattern: /\b(garantiert|100%|sicher|definitiv)\s+(wirk|heil|hilf)/gi, severity: 'critical', category: 'Heilversprechen' },
    { pattern: /\b(nie wieder|für immer|endgültig)\s+\w*(schmerz|krank|beschwer)/gi, severity: 'critical', category: 'Heilversprechen' },
  ],
  hwg: [
    { pattern: /\b(ärzte empfehlen|von ärzten empfohlen|ärztlich empfohlen)\b/gi, severity: 'warning', category: 'HWG §11' },
    { pattern: /\b(klinisch (getestet|erprobt|bewiesen))\b/gi, severity: 'warning', category: 'HWG §11' },
    { pattern: /\b(wissenschaftlich (bewiesen|belegt|nachgewiesen))\b/gi, severity: 'warning', category: 'HWG §11' },
    { pattern: /\b(nebenwirkungsfrei|keine nebenwirkungen)\b/gi, severity: 'critical', category: 'HWG §3' },
    { pattern: /\b(wundermittel|wunderwaffe|wunderheilung)\b/gi, severity: 'critical', category: 'HWG §3' },
  ],
  mdr: [
    { pattern: /\b(CE[- ]?(kennzeichnung|zertifiziert|geprüft))\b/gi, severity: 'info', category: 'MDR' },
    { pattern: /\b(medizinprodukt|klasse\s+(I|II[ab]?|III))\b/gi, severity: 'info', category: 'MDR' },
    { pattern: /\b(zulassung|zugelassen|genehmigt)\b/gi, severity: 'warning', category: 'MDR' },
  ],
  studien: [
    { pattern: /\b(studien?\s+(zeig|beleg|beweis|bestätig))/gi, severity: 'warning', category: 'Studien' },
    { pattern: /\b(wissenschaftl\w*\s+(studi|untersuch|forsch))/gi, severity: 'warning', category: 'Studien' },
    { pattern: /\b(\d+%?\s+(der\s+)?(teilnehmer|probanden|patienten))/gi, severity: 'warning', category: 'Studien' },
    { pattern: /\b(placebo|doppelblind|randomisiert)/gi, severity: 'info', category: 'Studien' },
  ],
  problematisch: [
    { pattern: /\b(behandelt|behandlung)\s+(von\s+)?\w*(krankheit|erkrankung|leiden)/gi, severity: 'warning', category: 'Indikation' },
    { pattern: /\b(therapie|therapeut\w*)\b/gi, severity: 'info', category: 'Indikation' },
    { pattern: /\b(diagnose|diagnostisch|diagnostiziert)\b/gi, severity: 'warning', category: 'Indikation' },
    { pattern: /\b(symptom\w*|beschwerden|schmerz\w*)\s+(lindert|beseitigt|bekämpft)/gi, severity: 'warning', category: 'Symptome' },
    { pattern: /\b(ersetzt\s+(den\s+)?arzt|statt\s+arzt)/gi, severity: 'critical', category: 'Arzt-Ersatz' },
  ]
};

interface ComplianceFinding {
  text: string;
  pattern: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  position: number;
}

function checkCompliance(text: string): ComplianceFinding[] {
  const findings: ComplianceFinding[] = [];
  
  for (const [, patterns] of Object.entries(COMPLIANCE_PATTERNS)) {
    for (const { pattern, severity, category } of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        findings.push({
          text: match[0],
          pattern: pattern.source,
          severity: severity as 'critical' | 'warning' | 'info',
          category,
          position: match.index
        });
      }
    }
  }
  
  // Sortiere nach Schweregrad
  return findings.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

export default function TextCheck() {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState('highlights');
  const [isAiChecking, setIsAiChecking] = useState(false);
  const [aiFindings, setAiFindings] = useState<ComplianceFinding[]>([]);

  // Berechnete Metriken
  const metrics = useMemo(() => {
    if (!text.trim()) {
      return null;
    }

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const characters = text.replace(/\s/g, '').length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const flesch = calculateFleschDE(text);
    const wiener = calculateWienerSachtextformel(text);
    const sprachniveau = getSprachniveau(flesch);
    const fuellwoerter = findFuellwoerter(text);
    const passivCount = findPassivSaetze(text);
    const sentenceAnalysis = analyzeSentences(text);
    
    // Lesezeit (Durchschnitt: 200 Wörter/Minute)
    const readingTimeMinutes = words.length / 200;
    const readingTime = {
      minutes: Math.floor(readingTimeMinutes),
      seconds: Math.round((readingTimeMinutes % 1) * 60)
    };

    return {
      words: words.length,
      characters,
      paragraphs: paragraphs.length,
      flesch,
      wiener,
      sprachniveau,
      fuellwoerter,
      fuellwoerterCount: fuellwoerter.length,
      fuellwoerterPercent: words.length > 0 ? Math.round((fuellwoerter.length / words.length) * 1000) / 10 : 0,
      passivCount,
      sentences: sentenceAnalysis,
      readingTime
    };
  }, [text]);

  // Compliance-Prüfung
  const complianceFindings = useMemo(() => {
    if (!text.trim()) return [];
    return checkCompliance(text);
  }, [text]);

  // AI-basierte Compliance-Prüfung
  const runAiComplianceCheck = useCallback(async () => {
    if (!text.trim()) {
      toast.error('Bitte gib einen Text ein');
      return;
    }

    setIsAiChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-compliance', {
        body: { text }
      });

      if (error) throw error;

      if (data?.findings) {
        setAiFindings(data.findings);
        toast.success(`AI-Prüfung abgeschlossen: ${data.findings.length} Hinweise gefunden`);
      }
    } catch (err) {
      console.error('AI Compliance Check error:', err);
      toast.error('AI-Prüfung fehlgeschlagen');
    } finally {
      setIsAiChecking(false);
    }
  }, [text]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Kritisch</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-700"><AlertTriangle className="h-3 w-3" /> Warnung</Badge>;
      case 'info':
        return <Badge variant="outline" className="gap-1"><Info className="h-3 w-3" /> Hinweis</Badge>;
      default:
        return null;
    }
  };

  const getVerstaendlichkeitsLabel = (flesch: number) => {
    if (flesch >= 80) return { label: 'Sehr leicht', color: 'text-green-600' };
    if (flesch >= 60) return { label: 'Leicht', color: 'text-green-500' };
    if (flesch >= 40) return { label: 'Mittel', color: 'text-yellow-500' };
    if (flesch >= 20) return { label: 'Schwer', color: 'text-orange-500' };
    return { label: 'Sehr schwer', color: 'text-red-500' };
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Text-Check</h1>
              <p className="text-muted-foreground mt-1">
                Rechtliche Compliance-Prüfung & Lesbarkeits-Analyse
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Texteingabe */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Text eingeben
                </CardTitle>
                <CardDescription>
                  Füge deinen Text ein oder tippe ihn direkt ein
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Hier deinen Text einfügen oder eingeben..."
                  className="min-h-[400px] font-mono text-sm resize-none"
                />
                
                {/* Quick Stats */}
                {metrics && (
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                    <span>{metrics.words} Wörter</span>
                    <span>{metrics.characters} Zeichen</span>
                    <span>{metrics.sentences.total} Sätze</span>
                    <span>{metrics.paragraphs} Absätze</span>
                    <span>Lesezeit: {metrics.readingTime.minutes}:{metrics.readingTime.seconds.toString().padStart(2, '0')} min</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schnellübersicht */}
            <div className="space-y-4">
              {/* Verständlichkeit */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Verständlichkeit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getVerstaendlichkeitsLabel(metrics.flesch).color}`}>
                          {metrics.flesch}
                        </div>
                        <div className={`text-sm ${getVerstaendlichkeitsLabel(metrics.flesch).color}`}>
                          {getVerstaendlichkeitsLabel(metrics.flesch).label}
                        </div>
                      </div>
                      <Progress value={metrics.flesch} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Schwer</span>
                        <span>Leicht</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      Text eingeben...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sprachniveau */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Sprachniveau
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics ? (
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${metrics.sprachniveau.color}`}>
                        {metrics.sprachniveau.level}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        CEFR-Level
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      -
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Compliance Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {text.trim() ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Kritisch</span>
                        <Badge variant="destructive">{complianceFindings.filter(f => f.severity === 'critical').length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Warnungen</span>
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
                          {complianceFindings.filter(f => f.severity === 'warning').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Hinweise</span>
                        <Badge variant="outline">{complianceFindings.filter(f => f.severity === 'info').length}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      -
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Detaillierte Analyse */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
              <TabsTrigger value="highlights" className="gap-2">
                <Highlighter className="h-4 w-4" />
                Markierungen
              </TabsTrigger>
              <TabsTrigger value="readability" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistiken
              </TabsTrigger>
              <TabsTrigger value="compliance" className="gap-2">
                <Scale className="h-4 w-4" />
                Compliance
              </TabsTrigger>
            </TabsList>

            {/* Markierungs-Tab */}
            <TabsContent value="highlights" className="mt-6">
              <HighlightedText text={text} />
            </TabsContent>

            {/* Lesbarkeits-Tab */}
            <TabsContent value="readability" className="mt-6">
              {metrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Flesch-Index */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Flesch-Index (DE)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${getVerstaendlichkeitsLabel(metrics.flesch).color}`}>
                        {metrics.flesch}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        0 = Sehr schwer, 100 = Sehr leicht
                      </p>
                    </CardContent>
                  </Card>

                  {/* Wiener Sachtextformel */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Wiener Sachtextformel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {metrics.wiener}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Schulstufe (4-15)
                      </p>
                    </CardContent>
                  </Card>

                  {/* Durchschnittliche Satzlänge */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Ø Satzlänge</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${metrics.sentences.avgLength > 20 ? 'text-orange-500' : 'text-green-500'}`}>
                        {metrics.sentences.avgLength}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Wörter pro Satz (Ideal: 12-18)
                      </p>
                    </CardContent>
                  </Card>

                  {/* Sprachmelodie */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Sprachmelodie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">
                        {metrics.sentences.melody}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Variation der Satzlängen
                      </p>
                    </CardContent>
                  </Card>

                  {/* Füllwörter */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Füllwörter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${metrics.fuellwoerterPercent > 5 ? 'text-orange-500' : 'text-green-500'}`}>
                        {metrics.fuellwoerterPercent}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {metrics.fuellwoerterCount} von {metrics.words} Wörtern
                      </p>
                    </CardContent>
                  </Card>

                  {/* Passiv-Sätze */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Passiv-Konstruktionen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${metrics.passivCount > 3 ? 'text-orange-500' : 'text-green-500'}`}>
                        {metrics.passivCount}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gefundene Passiv-Sätze
                      </p>
                    </CardContent>
                  </Card>

                  {/* Satzlängen-Verteilung */}
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Satzlängen-Verteilung</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-500">{metrics.sentences.short}</div>
                          <div className="text-xs text-muted-foreground">Kurz (&lt;10)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{metrics.sentences.medium}</div>
                          <div className="text-xs text-muted-foreground">Mittel (10-20)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-500">{metrics.sentences.tooLong}</div>
                          <div className="text-xs text-muted-foreground">Lang (&gt;20)</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-500">{metrics.sentences.veryLong}</div>
                          <div className="text-xs text-muted-foreground">Sehr lang (&gt;30)</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Checkliste */}
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Checkliste</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          {metrics.sentences.veryLong === 0 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Keine überlangen Sätze (&gt;30 Wörter)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {metrics.fuellwoerterPercent <= 5 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Füllwörter unter 5%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {metrics.passivCount <= 3 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Wenig Passiv-Konstruktionen</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {metrics.sentences.avgLength <= 18 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Durchschnittliche Satzlänge optimal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {metrics.flesch >= 60 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Gute Lesbarkeit (Flesch &gt;60)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {metrics.sentences.melody !== 'Monoton' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Abwechslungsreiche Satzlängen</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Gib einen Text ein, um die Lesbarkeitsanalyse zu starten</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Compliance-Tab */}
            <TabsContent value="compliance" className="mt-6 space-y-4">
              {/* AI-Check Button */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={runAiComplianceCheck} 
                  disabled={!text.trim() || isAiChecking}
                  className="gap-2"
                >
                  {isAiChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  AI-Tiefenprüfung starten
                </Button>
                <p className="text-sm text-muted-foreground">
                  Erweiterte Prüfung auf MDR, HWG, Heilmittelwerbegesetz und Studien-Claims
                </p>
              </div>

              {/* Findings */}
              {text.trim() ? (
                <div className="space-y-4">
                  {/* Kritische Findings */}
                  {complianceFindings.filter(f => f.severity === 'critical').length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Kritische Probleme gefunden!</AlertTitle>
                      <AlertDescription>
                        Diese Textstellen müssen überarbeitet werden.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Alle Findings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Gefundene Compliance-Hinweise
                      </CardTitle>
                      <CardDescription>
                        Automatische Prüfung auf rechtlich problematische Formulierungen
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {complianceFindings.length > 0 || aiFindings.length > 0 ? (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {[...complianceFindings, ...aiFindings].map((finding, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                {getSeverityBadge(finding.severity)}
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{finding.category}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Gefunden: <code className="bg-muted px-1 rounded">{finding.text}</code>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                          <p>Keine offensichtlichen Compliance-Probleme gefunden</p>
                          <p className="text-xs mt-2">Führe die AI-Tiefenprüfung für eine umfassendere Analyse durch</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Kategorien-Erklärung */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Kategorien-Erklärung</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong className="text-destructive">Heilversprechen</strong>
                        <p className="text-muted-foreground">Unzulässige Heilungsversprechen oder Garantien</p>
                      </div>
                      <div>
                        <strong className="text-yellow-600">HWG §11</strong>
                        <p className="text-muted-foreground">Heilmittelwerbegesetz - Verbotene Werbeaussagen</p>
                      </div>
                      <div>
                        <strong className="text-blue-600">MDR</strong>
                        <p className="text-muted-foreground">EU-Medizinprodukteverordnung - Kennzeichnungspflichten</p>
                      </div>
                      <div>
                        <strong className="text-orange-600">Studien</strong>
                        <p className="text-muted-foreground">Unbelegte wissenschaftliche Behauptungen</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Gib einen Text ein, um die Compliance-Prüfung zu starten</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
