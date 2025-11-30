import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  AlertTriangle, 
  Type, 
  MessageSquare, 
  Zap,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextAnalysisResult {
  // Scores
  fleschScore: number;
  fleschLevel: string;
  
  // Statistics
  words: number;
  sentences: number;
  syllables: number;
  characters: number;
  paragraphs: number;
  avgSentenceLength: number;
  avgWordLength: number;
  
  // Issues
  longSentences: SentenceIssue[];
  veryLongSentences: SentenceIssue[];
  complexWords: WordIssue[];
  fillWords: WordIssue[];
  passiveConstructions: WordIssue[];
}

interface SentenceIssue {
  text: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
}

interface WordIssue {
  word: string;
  startIndex: number;
  endIndex: number;
  type: string;
}

interface HighlightConfig {
  longSentences: boolean;
  veryLongSentences: boolean;
  complexWords: boolean;
  fillWords: boolean;
  passiveVoice: boolean;
}

// German fill words
const GERMAN_FILL_WORDS = [
  'also', 'eigentlich', 'halt', 'eben', 'ja', 'nun', 'denn', 'wohl', 'mal', 'schon',
  'doch', 'etwa', 'einfach', 'quasi', 'sozusagen', 'gewissermaßen', 'irgendwie',
  'praktisch', 'grundsätzlich', 'prinzipiell', 'natürlich', 'selbstverständlich',
  'offensichtlich', 'offenbar', 'anscheinend', 'vermutlich', 'wahrscheinlich',
  'durchaus', 'jedenfalls', 'überhaupt', 'ziemlich', 'relativ', 'entsprechend'
];

// Passive voice indicators
const PASSIVE_INDICATORS = [
  'wird', 'werden', 'wurde', 'wurden', 'worden', 'geworden',
  'werde', 'wirst', 'werdet'
];

// Count German syllables
function countGermanSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
  if (cleaned.length === 0) return 0;
  if (cleaned.length <= 3) return 1;
  
  const diphthongs = ['ei', 'ai', 'au', 'äu', 'eu', 'ie', 'oi'];
  let processedWord = cleaned;
  
  for (const diphthong of diphthongs) {
    processedWord = processedWord.replace(new RegExp(diphthong, 'g'), '@');
  }
  
  const vowels = 'aeiouäöü';
  let syllables = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < processedWord.length; i++) {
    const char = processedWord[i];
    const isVowel = vowels.includes(char) || char === '@';
    
    if (isVowel && !prevWasVowel) {
      syllables++;
    }
    prevWasVowel = isVowel;
  }
  
  return Math.max(1, syllables);
}

function analyzeText(text: string): TextAnalysisResult {
  const cleanText = text.trim();
  
  if (!cleanText) {
    return {
      fleschScore: 0,
      fleschLevel: '-',
      words: 0,
      sentences: 0,
      syllables: 0,
      characters: 0,
      paragraphs: 0,
      avgSentenceLength: 0,
      avgWordLength: 0,
      longSentences: [],
      veryLongSentences: [],
      complexWords: [],
      fillWords: [],
      passiveConstructions: []
    };
  }
  
  // Split into sentences with their positions
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences: { text: string; start: number; end: number }[] = [];
  let match;
  
  while ((match = sentenceRegex.exec(cleanText)) !== null) {
    sentences.push({
      text: match[0].trim(),
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  // If no sentences found, treat entire text as one
  if (sentences.length === 0 && cleanText.length > 0) {
    sentences.push({ text: cleanText, start: 0, end: cleanText.length });
  }
  
  // Get all words with positions
  const wordRegex = /\b[a-zA-ZäöüÄÖÜß]+\b/g;
  const words: { word: string; start: number; end: number }[] = [];
  
  while ((match = wordRegex.exec(cleanText)) !== null) {
    words.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // Calculate syllables
  let totalSyllables = 0;
  const complexWords: WordIssue[] = [];
  const fillWords: WordIssue[] = [];
  const passiveConstructions: WordIssue[] = [];
  
  words.forEach(({ word, start, end }) => {
    const syllables = countGermanSyllables(word);
    totalSyllables += syllables;
    
    // Complex words (3+ syllables)
    if (syllables >= 3) {
      complexWords.push({ word, startIndex: start, endIndex: end, type: 'complex' });
    }
    
    // Fill words
    if (GERMAN_FILL_WORDS.includes(word.toLowerCase())) {
      fillWords.push({ word, startIndex: start, endIndex: end, type: 'fill' });
    }
    
    // Passive indicators
    if (PASSIVE_INDICATORS.includes(word.toLowerCase())) {
      passiveConstructions.push({ word, startIndex: start, endIndex: end, type: 'passive' });
    }
  });
  
  // Find long sentences
  const longSentences: SentenceIssue[] = [];
  const veryLongSentences: SentenceIssue[] = [];
  
  sentences.forEach(({ text: sentenceText, start, end }) => {
    const sentenceWords = sentenceText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = sentenceWords.length;
    
    if (wordCount > 30) {
      veryLongSentences.push({ text: sentenceText, startIndex: start, endIndex: end, wordCount });
    } else if (wordCount > 20) {
      longSentences.push({ text: sentenceText, startIndex: start, endIndex: end, wordCount });
    }
  });
  
  // Calculate Flesch score
  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  const avgSyllablesPerWord = totalSyllables / Math.max(words.length, 1);
  const fleschScore = Math.round(Math.max(0, Math.min(100, 180 - avgSentenceLength - (58.5 * avgSyllablesPerWord))));
  
  let fleschLevel: string;
  if (fleschScore >= 80) fleschLevel = 'Sehr leicht';
  else if (fleschScore >= 70) fleschLevel = 'Leicht';
  else if (fleschScore >= 60) fleschLevel = 'Mittel';
  else if (fleschScore >= 50) fleschLevel = 'Mittelschwer';
  else if (fleschScore >= 40) fleschLevel = 'Schwer';
  else if (fleschScore >= 30) fleschLevel = 'Sehr schwer';
  else fleschLevel = 'Extrem schwer';
  
  return {
    fleschScore,
    fleschLevel,
    words: words.length,
    sentences: sentences.length,
    syllables: totalSyllables,
    characters: cleanText.length,
    paragraphs: paragraphs.length,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: words.length > 0 ? Math.round((cleanText.replace(/\s/g, '').length / words.length) * 10) / 10 : 0,
    longSentences,
    veryLongSentences,
    complexWords,
    fillWords,
    passiveConstructions
  };
}

interface TextAnalysisEditorProps {
  initialText?: string;
}

export const TextAnalysisEditor = ({ initialText = '' }: TextAnalysisEditorProps) => {
  const [text, setText] = useState(initialText);
  const [highlightConfig, setHighlightConfig] = useState<HighlightConfig>({
    longSentences: true,
    veryLongSentences: true,
    complexWords: true,
    fillWords: true,
    passiveVoice: true
  });
  
  const analysis = useMemo(() => analyzeText(text), [text]);
  
  // Generate highlighted HTML
  const highlightedText = useMemo(() => {
    if (!text) return '';
    
    // Collect all highlights with their positions and priorities
    type Highlight = { start: number; end: number; type: string; priority: number };
    const highlights: Highlight[] = [];
    
    if (highlightConfig.veryLongSentences) {
      analysis.veryLongSentences.forEach(s => {
        highlights.push({ start: s.startIndex, end: s.endIndex, type: 'very-long-sentence', priority: 1 });
      });
    }
    
    if (highlightConfig.longSentences) {
      analysis.longSentences.forEach(s => {
        highlights.push({ start: s.startIndex, end: s.endIndex, type: 'long-sentence', priority: 2 });
      });
    }
    
    if (highlightConfig.complexWords) {
      analysis.complexWords.forEach(w => {
        highlights.push({ start: w.startIndex, end: w.endIndex, type: 'complex-word', priority: 3 });
      });
    }
    
    if (highlightConfig.fillWords) {
      analysis.fillWords.forEach(w => {
        highlights.push({ start: w.startIndex, end: w.endIndex, type: 'fill-word', priority: 4 });
      });
    }
    
    if (highlightConfig.passiveVoice) {
      analysis.passiveConstructions.forEach(w => {
        highlights.push({ start: w.startIndex, end: w.endIndex, type: 'passive', priority: 5 });
      });
    }
    
    // Sort by start position, then by priority (higher priority = more important)
    highlights.sort((a, b) => a.start - b.start || a.priority - b.priority);
    
    // Build highlighted text
    let result = '';
    let lastIndex = 0;
    
    // For overlapping highlights, we need to handle them carefully
    // We'll use a simple approach: just add spans for word-level highlights
    const wordHighlights = highlights.filter(h => 
      h.type === 'complex-word' || h.type === 'fill-word' || h.type === 'passive'
    );
    const sentenceHighlights = highlights.filter(h => 
      h.type === 'long-sentence' || h.type === 'very-long-sentence'
    );
    
    // Process character by character
    let i = 0;
    while (i < text.length) {
      // Check if we're at the start of any sentence highlight
      const sentenceHighlight = sentenceHighlights.find(h => h.start === i);
      if (sentenceHighlight) {
        const sentenceEnd = sentenceHighlight.end;
        const sentenceText = text.substring(i, sentenceEnd);
        
        // Process words within this sentence
        let sentenceHtml = '';
        let j = 0;
        while (j < sentenceText.length) {
          const absolutePos = i + j;
          const wordHighlight = wordHighlights.find(h => h.start === absolutePos);
          
          if (wordHighlight) {
            const wordEnd = wordHighlight.end - i;
            const wordText = sentenceText.substring(j, wordEnd);
            sentenceHtml += `<mark class="highlight-${wordHighlight.type}">${escapeHtml(wordText)}</mark>`;
            j = wordEnd;
          } else {
            sentenceHtml += escapeHtml(sentenceText[j]);
            j++;
          }
        }
        
        result += `<mark class="highlight-${sentenceHighlight.type}">${sentenceHtml}</mark>`;
        i = sentenceEnd;
      } else {
        // Check for word-level highlights outside sentences
        const wordHighlight = wordHighlights.find(h => h.start === i);
        if (wordHighlight) {
          const wordText = text.substring(i, wordHighlight.end);
          result += `<mark class="highlight-${wordHighlight.type}">${escapeHtml(wordText)}</mark>`;
          i = wordHighlight.end;
        } else {
          result += escapeHtml(text[i]);
          i++;
        }
      }
    }
    
    // Convert newlines to <br>
    result = result.replace(/\n/g, '<br>');
    
    return result;
  }, [text, analysis, highlightConfig]);
  
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  const getFleschColor = (score: number) => {
    if (score >= 60) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };
  
  const totalIssues = 
    (highlightConfig.veryLongSentences ? analysis.veryLongSentences.length : 0) +
    (highlightConfig.longSentences ? analysis.longSentences.length : 0) +
    (highlightConfig.complexWords ? analysis.complexWords.length : 0) +
    (highlightConfig.fillWords ? analysis.fillWords.length : 0) +
    (highlightConfig.passiveVoice ? analysis.passiveConstructions.length : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Editor Area */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Type className="h-5 w-5" />
              Interaktiver Text-Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle Controls */}
            <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Switch
                  id="veryLong"
                  checked={highlightConfig.veryLongSentences}
                  onCheckedChange={(checked) => setHighlightConfig(c => ({ ...c, veryLongSentences: checked }))}
                />
                <Label htmlFor="veryLong" className="text-sm flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500/80"></span>
                  Sehr lange Sätze ({analysis.veryLongSentences.length})
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="long"
                  checked={highlightConfig.longSentences}
                  onCheckedChange={(checked) => setHighlightConfig(c => ({ ...c, longSentences: checked }))}
                />
                <Label htmlFor="long" className="text-sm flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-orange-500/80"></span>
                  Lange Sätze ({analysis.longSentences.length})
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="complex"
                  checked={highlightConfig.complexWords}
                  onCheckedChange={(checked) => setHighlightConfig(c => ({ ...c, complexWords: checked }))}
                />
                <Label htmlFor="complex" className="text-sm flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-purple-500/80"></span>
                  Komplexe Wörter ({analysis.complexWords.length})
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="fill"
                  checked={highlightConfig.fillWords}
                  onCheckedChange={(checked) => setHighlightConfig(c => ({ ...c, fillWords: checked }))}
                />
                <Label htmlFor="fill" className="text-sm flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-cyan-500/80"></span>
                  Füllwörter ({analysis.fillWords.length})
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="passive"
                  checked={highlightConfig.passiveVoice}
                  onCheckedChange={(checked) => setHighlightConfig(c => ({ ...c, passiveVoice: checked }))}
                />
                <Label htmlFor="passive" className="text-sm flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-yellow-500/80"></span>
                  Passiv ({analysis.passiveConstructions.length})
                </Label>
              </div>
            </div>
            
            {/* Editor with tabs for Edit/Preview */}
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" className="flex items-center gap-1">
                  <Type className="h-4 w-4" />
                  Bearbeiten
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Analyse-Ansicht
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Fügen Sie hier Ihren Text ein oder beginnen Sie zu tippen..."
                  className="min-h-[350px] font-mono text-sm resize-y"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <ScrollArea className="min-h-[350px] max-h-[500px] rounded-md border bg-background p-3">
                  <div 
                    className="font-mono text-sm whitespace-pre-wrap min-h-[330px] analysis-text leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: highlightedText || '<span class="text-muted-foreground">Fügen Sie hier Ihren Text ein oder beginnen Sie zu tippen...</span>' }}
                  />
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            {/* Quick Stats Bar */}
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-muted-foreground">
                <strong>{analysis.words}</strong> Wörter
              </span>
              <span className="text-muted-foreground">
                <strong>{analysis.sentences}</strong> Sätze
              </span>
              <span className="text-muted-foreground">
                <strong>{analysis.paragraphs}</strong> Absätze
              </span>
              <span className="text-muted-foreground">
                <strong>{analysis.characters}</strong> Zeichen
              </span>
              <span className={`font-medium ${totalIssues === 0 ? 'text-success' : totalIssues < 10 ? 'text-warning' : 'text-destructive'}`}>
                <strong>{totalIssues}</strong> Markierungen
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Sidebar with Analysis */}
      <div className="space-y-4">
        {/* Readability Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Verständlichkeit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className={`text-4xl font-bold ${getFleschColor(analysis.fleschScore)}`}>
                {analysis.fleschScore}
              </p>
              <p className="text-sm text-muted-foreground">{analysis.fleschLevel}</p>
              <Progress 
                value={analysis.fleschScore} 
                className="h-2 mt-2" 
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Statistiken
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ø Satzlänge</span>
              <span className={`font-medium ${analysis.avgSentenceLength <= 20 ? 'text-success' : 'text-warning'}`}>
                {analysis.avgSentenceLength} Wörter
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ø Wortlänge</span>
              <span className="font-medium">{analysis.avgWordLength} Zeichen</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Silben gesamt</span>
              <span className="font-medium">{analysis.syllables}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lesezeit</span>
              <span className="font-medium">~{Math.ceil(analysis.words / 200)} Min.</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Checklist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Checkliste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className={`flex items-start gap-2 ${analysis.veryLongSentences.length === 0 ? 'text-success' : 'text-destructive'}`}>
              {analysis.veryLongSentences.length === 0 ? '✓' : '✗'}
              <span>
                {analysis.veryLongSentences.length === 0 
                  ? 'Keine sehr langen Sätze (>30 Wörter)'
                  : `${analysis.veryLongSentences.length} sehr lange Sätze`}
              </span>
            </div>
            <div className={`flex items-start gap-2 ${analysis.longSentences.length <= 2 ? 'text-success' : 'text-warning'}`}>
              {analysis.longSentences.length <= 2 ? '✓' : '!'}
              <span>
                {analysis.longSentences.length === 0 
                  ? 'Keine langen Sätze (21-30 Wörter)'
                  : `${analysis.longSentences.length} lange Sätze`}
              </span>
            </div>
            <div className={`flex items-start gap-2 ${analysis.complexWords.length / Math.max(analysis.words, 1) < 0.3 ? 'text-success' : 'text-warning'}`}>
              {analysis.complexWords.length / Math.max(analysis.words, 1) < 0.3 ? '✓' : '!'}
              <span>
                {Math.round((analysis.complexWords.length / Math.max(analysis.words, 1)) * 100)}% komplexe Wörter
              </span>
            </div>
            <div className={`flex items-start gap-2 ${analysis.fillWords.length <= 3 ? 'text-success' : 'text-warning'}`}>
              {analysis.fillWords.length <= 3 ? '✓' : '!'}
              <span>
                {analysis.fillWords.length === 0 
                  ? 'Keine Füllwörter'
                  : `${analysis.fillWords.length} Füllwörter`}
              </span>
            </div>
            <div className={`flex items-start gap-2 ${analysis.passiveConstructions.length <= 2 ? 'text-success' : 'text-warning'}`}>
              {analysis.passiveConstructions.length <= 2 ? '✓' : '!'}
              <span>
                {analysis.passiveConstructions.length === 0 
                  ? 'Kein Passiv'
                  : `${analysis.passiveConstructions.length} Passivkonstruktionen`}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Legend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Legende
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50"></span>
              <span>Sehr langer Satz (&gt;30 Wörter)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-orange-500/30 border border-orange-500/50"></span>
              <span>Langer Satz (21-30 Wörter)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-purple-500/30 border border-purple-500/50"></span>
              <span>Komplexes Wort (3+ Silben)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-cyan-500/30 border border-cyan-500/50"></span>
              <span>Füllwort</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/50"></span>
              <span>Passivkonstruktion</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* CSS for highlights */}
      <style>{`
        .analysis-text .highlight-very-long-sentence {
          background-color: rgba(239, 68, 68, 0.25);
          border-bottom: 2px solid rgba(239, 68, 68, 0.6);
          padding: 2px 0;
        }
        .analysis-text .highlight-long-sentence {
          background-color: rgba(249, 115, 22, 0.2);
          border-bottom: 2px solid rgba(249, 115, 22, 0.5);
          padding: 2px 0;
        }
        .analysis-text .highlight-complex-word {
          background-color: rgba(168, 85, 247, 0.3);
          border-radius: 3px;
          padding: 1px 2px;
        }
        .analysis-text .highlight-fill-word {
          background-color: rgba(6, 182, 212, 0.3);
          border-radius: 3px;
          padding: 1px 2px;
        }
        .analysis-text .highlight-passive {
          background-color: rgba(234, 179, 8, 0.35);
          border-radius: 3px;
          padding: 1px 2px;
        }
      `}</style>
    </div>
  );
};
