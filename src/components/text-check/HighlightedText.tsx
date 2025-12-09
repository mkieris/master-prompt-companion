import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Shuffle,
  Zap,
  MessageSquare,
  Stethoscope,
  Bot,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Füllwörter Liste
const FUELLWOERTER = [
  'eigentlich', 'grundsätzlich', 'gewissermaßen', 'sozusagen', 'quasi', 'irgendwie',
  'halt', 'eben', 'nun', 'mal', 'ja', 'doch', 'wohl', 'schon', 'noch', 'auch',
  'etwa', 'vielleicht', 'möglicherweise', 'eventuell', 'sicherlich', 'bestimmt',
  'natürlich', 'selbstverständlich', 'offensichtlich', 'offenbar', 'anscheinend',
  'ziemlich', 'relativ', 'einigermaßen', 'durchaus', 'wirklich', 'tatsächlich',
  'letztendlich', 'praktisch', 'regelrecht', 'richtig', 'total', 'völlig', 'absolut', 
  'einfach', 'überhaupt', 'jedenfalls', 'zumindest', 'immerhin', 'allerdings',
  'im grunde', 'an sich', 'im prinzip', 'an und für sich'
];

// ========== KI-TEXT ERKENNUNG ==========

// Typische KI-Phrasen (ChatGPT, Claude, Gemini etc.)
const AI_PHRASES = [
  // Einleitungen
  'in der heutigen zeit', 'in der heutigen welt', 'in der modernen welt',
  'in einer welt, in der', 'in zeiten von', 'im zeitalter von',
  'es ist wichtig zu beachten', 'es ist erwähnenswert', 'es sei darauf hingewiesen',
  'es lässt sich feststellen', 'es zeigt sich', 'es wird deutlich',
  'in der heutigen digitalen welt', 'in unserer schnelllebigen zeit',
  
  // Übergänge
  'darüber hinaus', 'des weiteren', 'ferner', 'überdies', 'zudem',
  'in diesem zusammenhang', 'in diesem kontext', 'vor diesem hintergrund',
  'mit blick auf', 'im hinblick auf', 'hinsichtlich',
  'nicht zuletzt', 'last but not least',
  
  // Zusammenfassungen
  'zusammenfassend lässt sich sagen', 'zusammenfassend kann festgehalten werden',
  'abschließend lässt sich festhalten', 'alles in allem', 'insgesamt zeigt sich',
  'letztlich bleibt festzuhalten', 'resümierend lässt sich sagen',
  'zusammenfassend kann man sagen', 'abschließend sei gesagt',
  
  // Verstärkungen
  'von entscheidender bedeutung', 'von großer wichtigkeit', 'von zentraler bedeutung',
  'eine wichtige rolle spielen', 'eine entscheidende rolle spielen',
  'maßgeblich beitragen', 'wesentlich dazu beitragen',
  'nicht zu unterschätzen', 'von besonderer bedeutung',
  
  // Generische Aussagen
  'sowohl als auch', 'nicht nur sondern auch',
  'eine vielzahl von', 'eine breite palette', 'ein breites spektrum',
  'in vielerlei hinsicht', 'auf vielfältige weise',
  'eine wichtige grundlage', 'einen wichtigen beitrag',
  
  // Typische AI-Floskeln
  'optimale ergebnisse erzielen', 'bestmögliche ergebnisse',
  'nachhaltig verbessern', 'effektiv und effizient',
  'ganzheitlicher ansatz', 'ganzheitliche betrachtung',
  'individuelle bedürfnisse', 'maßgeschneiderte lösungen',
  'nahtlose integration', 'reibungsloser ablauf',
  'kontinuierlich verbessern', 'stetig weiterentwickeln',
];

// Wörter die AI übermäßig verwendet
const AI_OVERUSED_WORDS = new Set([
  'jedoch', 'allerdings', 'dennoch', 'nichtsdestotrotz', 'nichtsdestoweniger',
  'optimal', 'effektiv', 'effizient', 'nachhaltig', 'ganzheitlich',
  'vielfältig', 'umfassend', 'weitreichend', 'maßgeblich', 'essenziell',
  'gewährleisten', 'sicherstellen', 'ermöglichen', 'unterstützen',
  'relevant', 'signifikant', 'essentiell', 'fundamental', 'elementar',
  'implementieren', 'integrieren', 'optimieren', 'maximieren',
  'transparent', 'authentisch', 'innovativ', 'dynamisch', 'holistisch',
  'synergie', 'synergien', 'potenzial', 'mehrwert', 'wertschöpfung',
  'skalierbar', 'agil', 'proaktiv', 'zukunftsorientiert',
]);

// Patterns die auf AI hinweisen
const AI_PATTERNS = [
  // Aufzählungen mit "erstens, zweitens..."
  /erstens[\s\S]{0,200}zweitens[\s\S]{0,200}drittens/gi,
  // "Es ist [Adjektiv], dass..."
  /es ist \w+, dass/gi,
  // "Dies ermöglicht/gewährleistet..."
  /dies (ermöglicht|gewährleistet|unterstützt|fördert|bietet)/gi,
  // Übermäßige Doppelpunkte vor Aufzählungen
  /:\s*\n\s*[-•]/g,
];

// Berechnet AI-Wahrscheinlichkeit (0-100)
function calculateAIScore(text: string): { score: number; reasons: string[]; highlights: Set<string> } {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const reasons: string[] = [];
  const highlights = new Set<string>();
  let score = 0;
  
  // 1. AI-Phrasen zählen (max 40 Punkte)
  let phraseCount = 0;
  AI_PHRASES.forEach(phrase => {
    const regex = new RegExp(phrase, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      phraseCount += matches.length;
      // Markiere die Phrase-Wörter
      phrase.split(/\s+/).forEach(w => highlights.add(w.replace(/[^a-zäöüß]/g, '')));
    }
  });
  if (phraseCount > 0) {
    const phraseScore = Math.min(phraseCount * 10, 40);
    score += phraseScore;
    reasons.push(`${phraseCount} typische KI-Phrasen`);
  }
  
  // 2. Überverwendete Wörter (max 25 Punkte)
  let overusedCount = 0;
  words.forEach(word => {
    const cleanWord = word.replace(/[^a-zäöüß]/g, '');
    if (AI_OVERUSED_WORDS.has(cleanWord)) {
      overusedCount++;
      highlights.add(cleanWord);
    }
  });
  const overusedRatio = words.length > 0 ? overusedCount / words.length : 0;
  if (overusedRatio > 0.015) {
    const overusedScore = Math.min(overusedRatio * 600, 25);
    score += overusedScore;
    reasons.push(`${overusedCount} KI-typische Wörter`);
  }
  
  // 3. Satzlängen-Uniformität (max 15 Punkte)
  if (sentences.length > 4) {
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    
    // Niedrige Standardabweichung = zu gleichmäßig = AI-typisch
    if (stdDev < 4 && avgLength > 12) {
      score += 15;
      reasons.push('Sehr gleichmäßige Satzlängen');
    } else if (stdDev < 6 && avgLength > 12) {
      score += 8;
      reasons.push('Gleichmäßige Satzlängen');
    }
  }
  
  // 4. Pattern-Matching (max 20 Punkte)
  let patternMatches = 0;
  AI_PATTERNS.forEach(pattern => {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) patternMatches += matches.length;
  });
  if (patternMatches > 0) {
    const patternScore = Math.min(patternMatches * 7, 20);
    score += patternScore;
    reasons.push(`${patternMatches} KI-Satzmuster`);
  }
  
  return { score: Math.min(score, 100), reasons, highlights };
}

// Prüft ob ein Wort KI-typisch ist
function isAIWord(word: string, aiHighlights: Set<string>): boolean {
  const cleanWord = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
  return aiHighlights.has(cleanWord) || AI_OVERUSED_WORDS.has(cleanWord);
}

// Fachbegriffe - Medizin, Technik, Wissenschaft
const FACHBEGRIFF_PATTERNS = [
  // Medizinische Suffixe
  /\w*(itis|ose|ismus|pathie|logie|tomie|ektomie|plastik|skopie|therapie|gramm|graphie)\b/gi,
  // Medizinische Präfixe
  /\b(anti|hyper|hypo|intra|extra|trans|peri|post|prä|neo|pseudo|patho|physio|cardio|neuro|gastro|derma|ortho|psycho)\w+/gi,
  // Pharma/Wirkstoffe
  /\w*(azol|pril|sartan|statin|mycin|cillin|oxacin|mab|nib|zumab)\b/gi,
  // Technische Begriffe
  /\b(algorithmus|infrastruktur|implementierung|konfiguration|spezifikation|validierung|zertifizierung|akkreditierung|standardisierung)\b/gi,
  // Wissenschaftliche Begriffe
  /\b(hypothese|signifikanz|korrelation|kausalität|evidenz|metaanalyse|randomisierung|placebo|doppelblind)\b/gi,
  // Rechtliche Begriffe
  /\b(konformität|compliance|regulierung|zulassung|haftung|gewährleistung|inverkehrbringung)\b/gi,
];

// Medizinische Fachbegriffe (häufige)
const MEDICAL_TERMS = new Set([
  // Anatomie
  'muskulatur', 'skelett', 'gelenk', 'wirbelsäule', 'bandscheibe', 'sehne', 'ligament',
  'faszien', 'myofaszial', 'propriozeption', 'nozizeption', 'innervation',
  // Beschwerden/Diagnosen
  'arthrose', 'arthritis', 'tendinitis', 'bursitis', 'fibromyalgie', 'neuropathie',
  'ischialgie', 'lumbalgie', 'cervikalgie', 'epicondylitis', 'karpaltunnelsyndrom',
  'impingement', 'instabilität', 'dysfunktion', 'insuffizienz',
  // Therapie
  'mobilisation', 'manipulation', 'traktion', 'kompression', 'dekompression',
  'elektrotherapie', 'ultraschall', 'kryotherapie', 'thermotherapie', 'hydrotherapie',
  'tens', 'ems', 'biofeedback', 'propriozeptiv', 'sensomotorisch',
  // Medizinprodukte
  'medizinprodukt', 'konformitätsbewertung', 'risikoklasse', 'biokompatibilität',
  'sterilisation', 'desinfektion', 'kontamination',
]);

// Technische Fachbegriffe
const TECH_TERMS = new Set([
  'frequenz', 'amplitude', 'modulation', 'stimulation', 'impuls', 'elektrode',
  'applikator', 'sensor', 'aktuator', 'interface', 'protokoll', 'parameter',
  'kalibrierung', 'justierung', 'wartung', 'instandhaltung',
]);

function isFachbegriff(word: string): boolean {
  const cleanWord = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
  
  // Direkte Übereinstimmung
  if (MEDICAL_TERMS.has(cleanWord) || TECH_TERMS.has(cleanWord)) {
    return true;
  }
  
  // Pattern-Matching
  for (const pattern of FACHBEGRIFF_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(cleanWord)) {
      return true;
    }
  }
  
  return false;
}

// Passiv-Patterns
const PASSIV_PATTERNS = [
  /\b(wird|werden|wurde|wurden)\s+\w+t\b/gi,
  /\b(ist|sind|war|waren)\s+\w+t\s+worden\b/gi,
];

interface HighlightCategory {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  description: string;
}

const CATEGORIES: HighlightCategory[] = [
  {
    id: 'aiText',
    label: 'KI-Text',
    color: 'text-rose-700',
    bgColor: 'bg-rose-200',
    icon: <Bot className="h-3 w-3" />,
    description: 'KI-generierte Phrasen'
  },
  {
    id: 'longSentence',
    label: 'Lange Sätze',
    color: 'text-orange-700',
    bgColor: 'bg-orange-200',
    icon: <AlertTriangle className="h-3 w-3" />,
    description: '> 20 Wörter'
  },
  {
    id: 'veryLongSentence',
    label: 'Sehr lange Sätze',
    color: 'text-red-700',
    bgColor: 'bg-red-200',
    icon: <AlertTriangle className="h-3 w-3" />,
    description: '> 30 Wörter'
  },
  {
    id: 'fuellwort',
    label: 'Füllwörter',
    color: 'text-purple-700',
    bgColor: 'bg-purple-200',
    icon: <Shuffle className="h-3 w-3" />,
    description: 'Unnötige Wörter'
  },
  {
    id: 'passiv',
    label: 'Passiv',
    color: 'text-blue-700',
    bgColor: 'bg-blue-200',
    icon: <MessageSquare className="h-3 w-3" />,
    description: 'Passiv-Konstruktionen'
  },
  {
    id: 'fachbegriff',
    label: 'Fachbegriffe',
    color: 'text-teal-700',
    bgColor: 'bg-teal-200',
    icon: <Stethoscope className="h-3 w-3" />,
    description: 'Medizin/Technik'
  }
];

interface HighlightedTextProps {
  text: string;
}

interface TextSegment {
  text: string;
  categories: string[];
  isSentenceStart?: boolean;
}

// AI-Score Label und Farbe
function getAIScoreLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 70) return { label: 'Sehr wahrscheinlich KI', color: 'text-red-700', bgColor: 'bg-red-100' };
  if (score >= 50) return { label: 'Wahrscheinlich KI', color: 'text-orange-700', bgColor: 'bg-orange-100' };
  if (score >= 30) return { label: 'Möglicherweise KI', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
  if (score >= 15) return { label: 'Leichte KI-Merkmale', color: 'text-blue-700', bgColor: 'bg-blue-100' };
  return { label: 'Vermutlich menschlich', color: 'text-green-700', bgColor: 'bg-green-100' };
}

export function HighlightedText({ text }: HighlightedTextProps) {
  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({
    aiText: true,
    longSentence: true,
    veryLongSentence: true,
    fuellwort: true,
    passiv: true,
    fachbegriff: true
  });

  const toggleCategory = (categoryId: string) => {
    setActiveCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // AI-Score berechnen
  const aiAnalysis = useMemo(() => {
    if (!text.trim()) return { score: 0, reasons: [], highlights: new Set<string>() };
    return calculateAIScore(text);
  }, [text]);

  // Kategorisierte Counts
  const counts = useMemo(() => {
    if (!text.trim()) return { aiText: 0, longSentence: 0, veryLongSentence: 0, fuellwort: 0, passiv: 0, fachbegriff: 0 };
    
    const sentences = text.split(/(?<=[.!?])\s+/);
    let longSentence = 0;
    let veryLongSentence = 0;
    let fuellwort = 0;
    let passiv = 0;
    let fachbegriff = 0;
    let aiText = 0;

    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/).filter(w => w.length > 0);
      if (words.length > 30) veryLongSentence++;
      else if (words.length > 20) longSentence++;
    });

    const lowerText = text.toLowerCase();
    FUELLWOERTER.forEach(fw => {
      const regex = new RegExp(`\\b${fw}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) fuellwort += matches.length;
    });

    PASSIV_PATTERNS.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) passiv += matches.length;
    });

    const words = text.split(/\s+/);
    words.forEach(word => {
      if (isFachbegriff(word)) fachbegriff++;
      if (isAIWord(word, aiAnalysis.highlights)) aiText++;
    });

    return { aiText, longSentence, veryLongSentence, fuellwort, passiv, fachbegriff };
  }, [text, aiAnalysis.highlights]);

  // Text mit Highlights rendern
  const highlightedContent = useMemo(() => {
    if (!text.trim()) return null;

    // Split in Sätze mit deren Positionen
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    return sentences.map((sentence, sentenceIndex) => {
      const words = sentence.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      
      // Satz-Level Kategorien
      const sentenceCategories: string[] = [];
      if (wordCount > 30 && activeCategories.veryLongSentence) {
        sentenceCategories.push('veryLongSentence');
      } else if (wordCount > 20 && activeCategories.longSentence) {
        sentenceCategories.push('longSentence');
      }

      // Check für Passiv im Satz
      let hasPassiv = false;
      if (activeCategories.passiv) {
        for (const pattern of PASSIV_PATTERNS) {
          if (pattern.test(sentence)) {
            hasPassiv = true;
            break;
          }
        }
      }

      // Wort-Level Rendering
      const renderedWords = sentence.split(/(\s+)/).map((part, partIndex) => {
        if (/^\s+$/.test(part)) {
          return <span key={`${sentenceIndex}-${partIndex}`}>{part}</span>;
        }

        const wordCategories: string[] = [];
        const cleanWord = part.toLowerCase().replace(/[^a-zäöüß]/g, '');

        // KI-Text?
        if (activeCategories.aiText && isAIWord(part, aiAnalysis.highlights)) {
          wordCategories.push('aiText');
        }

        // Füllwort?
        if (activeCategories.fuellwort && FUELLWOERTER.includes(cleanWord)) {
          wordCategories.push('fuellwort');
        }

        // Fachbegriff?
        if (activeCategories.fachbegriff && isFachbegriff(part)) {
          wordCategories.push('fachbegriff');
        }

        // Passiv-Teil?
        if (hasPassiv && activeCategories.passiv) {
          const passivWords = ['wird', 'werden', 'wurde', 'wurden', 'worden'];
          if (passivWords.includes(cleanWord)) {
            wordCategories.push('passiv');
          }
        }

        // Styling basierend auf Kategorien
        if (wordCategories.length > 0 || sentenceCategories.length > 0) {
          const allCategories = [...wordCategories, ...sentenceCategories];
          const primaryCategory = allCategories[0];
          const categoryConfig = CATEGORIES.find(c => c.id === primaryCategory);
          
          if (categoryConfig) {
            return (
              <span
                key={`${sentenceIndex}-${partIndex}`}
                className={`${categoryConfig.bgColor} ${categoryConfig.color} px-0.5 rounded cursor-help`}
                title={`${categoryConfig.label}: ${categoryConfig.description}`}
              >
                {part}
              </span>
            );
          }
        }

        return <span key={`${sentenceIndex}-${partIndex}`}>{part}</span>;
      });

      // Satz-Container mit Border wenn lang
      if (sentenceCategories.length > 0) {
        const sentenceCategoryConfig = CATEGORIES.find(c => c.id === sentenceCategories[0]);
        return (
          <span
            key={sentenceIndex}
            className={`border-b-2 ${sentenceCategoryConfig?.bgColor?.replace('bg-', 'border-')} pb-0.5`}
          >
            {renderedWords}
            {sentenceIndex < sentences.length - 1 && ' '}
          </span>
        );
      }

      return (
        <span key={sentenceIndex}>
          {renderedWords}
          {sentenceIndex < sentences.length - 1 && ' '}
        </span>
      );
    });
  }, [text, activeCategories, aiAnalysis.highlights]);

  if (!text.trim()) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Text eingeben, um Markierungen anzuzeigen</p>
        </CardContent>
      </Card>
    );
  }

  const aiScoreInfo = getAIScoreLabel(aiAnalysis.score);

  return (
    <div className="space-y-4">
      {/* KI-Erkennung Card */}
      <Card className={`border-2 ${aiScoreInfo.bgColor} ${aiScoreInfo.color.replace('text-', 'border-')}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            KI-Text Erkennung
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 opacity-60" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Analysiert typische KI-Merkmale: Phrasen, Wortmuster, Satzgleichförmigkeit. 
                    Höherer Score = wahrscheinlicher KI-generiert.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className={`text-sm font-medium ${aiScoreInfo.color}`}>
                  {aiScoreInfo.label}
                </span>
                <span className="text-sm font-bold">{aiAnalysis.score}%</span>
              </div>
              <Progress 
                value={aiAnalysis.score} 
                className="h-2"
              />
            </div>
          </div>
          
          {aiAnalysis.reasons.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {aiAnalysis.reasons.map((reason, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {reason}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kategorie-Toggles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Markierungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {CATEGORIES.map(category => (
              <div key={category.id} className="flex items-center gap-2">
                <Switch
                  id={category.id}
                  checked={activeCategories[category.id]}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <Label htmlFor={category.id} className="flex items-center gap-2 cursor-pointer">
                  <Badge className={`${category.bgColor} ${category.color} border-0`}>
                    {category.icon}
                    <span className="ml-1">{category.label}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({counts[category.id as keyof typeof counts] || 0})
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legende */}
      <div className="flex flex-wrap gap-3 text-xs">
        {CATEGORIES.filter(c => activeCategories[c.id]).map(category => (
          <div key={category.id} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded ${category.bgColor}`} />
            <span className="text-muted-foreground">{category.label} ({category.description})</span>
          </div>
        ))}
      </div>

      {/* Markierter Text */}
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed text-foreground whitespace-pre-wrap font-sans">
            {highlightedContent}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
