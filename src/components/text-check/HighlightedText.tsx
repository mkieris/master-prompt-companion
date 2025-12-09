import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Shuffle,
  Zap,
  MessageSquare,
  Stethoscope,
  Bot,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Lightbulb
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

// ========== UMFASSENDE KI-TEXT ERKENNUNG ==========

// 1. Typische KI-Phrasen (ChatGPT, Claude, Gemini etc.)
const AI_PHRASES = [
  // Einleitungen
  'in der heutigen zeit', 'in der heutigen welt', 'in der modernen welt',
  'in einer welt, in der', 'in zeiten von', 'im zeitalter von',
  'es ist wichtig zu beachten', 'es ist erwähnenswert', 'es sei darauf hingewiesen',
  'es lässt sich feststellen', 'es zeigt sich', 'es wird deutlich',
  'in der heutigen digitalen welt', 'in unserer schnelllebigen zeit',
  'stellen sie sich vor', 'haben sie sich jemals gefragt',
  
  // Übergänge
  'darüber hinaus', 'des weiteren', 'ferner', 'überdies', 'zudem',
  'in diesem zusammenhang', 'in diesem kontext', 'vor diesem hintergrund',
  'mit blick auf', 'im hinblick auf', 'hinsichtlich',
  'nicht zuletzt', 'last but not least', 'hinzu kommt',
  
  // Zusammenfassungen
  'zusammenfassend lässt sich sagen', 'zusammenfassend kann festgehalten werden',
  'abschließend lässt sich festhalten', 'alles in allem', 'insgesamt zeigt sich',
  'letztlich bleibt festzuhalten', 'resümierend lässt sich sagen',
  'zusammenfassend kann man sagen', 'abschließend sei gesagt',
  'fazit:', 'zusammenfassung:', 'schlussfolgerung:',
  
  // Verstärkungen
  'von entscheidender bedeutung', 'von großer wichtigkeit', 'von zentraler bedeutung',
  'eine wichtige rolle spielen', 'eine entscheidende rolle spielen',
  'maßgeblich beitragen', 'wesentlich dazu beitragen',
  'nicht zu unterschätzen', 'von besonderer bedeutung',
  'einen wichtigen beitrag leisten', 'von großer relevanz',
  
  // Generische Aussagen
  'sowohl als auch', 'nicht nur sondern auch',
  'eine vielzahl von', 'eine breite palette', 'ein breites spektrum',
  'in vielerlei hinsicht', 'auf vielfältige weise',
  'eine wichtige grundlage', 'einen wichtigen beitrag',
  'auf der einen seite', 'auf der anderen seite',
  
  // Typische AI-Floskeln
  'optimale ergebnisse erzielen', 'bestmögliche ergebnisse',
  'nachhaltig verbessern', 'effektiv und effizient',
  'ganzheitlicher ansatz', 'ganzheitliche betrachtung',
  'individuelle bedürfnisse', 'maßgeschneiderte lösungen',
  'nahtlose integration', 'reibungsloser ablauf',
  'kontinuierlich verbessern', 'stetig weiterentwickeln',
  'das volle potenzial', 'ihr volles potenzial',
  
  // Hedging/Absicherungen
  'es könnte argumentiert werden', 'man könnte sagen',
  'es scheint, dass', 'es erscheint', 'tendenziell',
];

// 2. Überverwendete KI-Wörter
const AI_OVERUSED_WORDS = new Set([
  'jedoch', 'allerdings', 'dennoch', 'nichtsdestotrotz', 'nichtsdestoweniger',
  'optimal', 'effektiv', 'effizient', 'nachhaltig', 'ganzheitlich',
  'vielfältig', 'umfassend', 'weitreichend', 'maßgeblich', 'essenziell',
  'gewährleisten', 'sicherstellen', 'ermöglichen', 'unterstützen',
  'relevant', 'signifikant', 'essentiell', 'fundamental', 'elementar',
  'implementieren', 'integrieren', 'optimieren', 'maximieren',
  'transparent', 'authentisch', 'innovativ', 'dynamisch', 'holistisch',
  'synergie', 'synergien', 'potenzial', 'mehrwert', 'wertschöpfung',
  'skalierbar', 'agil', 'proaktiv', 'zukunftsorientiert', 'lösungsorientiert',
  'ganzheitlich', 'strategisch', 'systematisch', 'strukturiert',
  'entsprechend', 'diesbezüglich', 'dahingehend', 'insbesondere',
  'grundlegend', 'wesentlich', 'zentral', 'entscheidend', 'maßgebend',
]);

// 3. Typische KI-Satzanfänge
const AI_SENTENCE_STARTERS = [
  'es ist', 'es gibt', 'es wird', 'es kann', 'es sollte',
  'dies ist', 'dies bedeutet', 'dies ermöglicht', 'dies führt',
  'darüber hinaus', 'zusätzlich', 'außerdem', 'weiterhin', 'ferner',
  'insgesamt', 'grundsätzlich', 'prinzipiell', 'generell',
  'in diesem', 'bei diesem', 'mit diesem', 'durch dieses',
  'um dies', 'um diese', 'um dieses',
  'wichtig ist', 'entscheidend ist', 'relevant ist',
  'zusammenfassend', 'abschließend', 'schließlich',
];

// 4. Interpunktions-Muster die auf KI hinweisen
interface PunctuationAnalysis {
  emDashes: number;       // —
  enDashes: number;       // –
  colonsBeforeLists: number;
  semicolons: number;
  excessiveCommas: boolean;
  bulletPoints: number;
  numberedLists: number;
}

function analyzePunctuation(text: string): PunctuationAnalysis {
  const emDashes = (text.match(/—/g) || []).length;
  const enDashes = (text.match(/–/g) || []).length;
  const colonsBeforeLists = (text.match(/:\s*\n\s*[-•\d]/g) || []).length;
  const semicolons = (text.match(/;/g) || []).length;
  const bulletPoints = (text.match(/^\s*[-•]\s/gm) || []).length;
  const numberedLists = (text.match(/^\s*\d+[.)]\s/gm) || []).length;
  
  // Durchschnittliche Kommas pro Satz
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const totalCommas = (text.match(/,/g) || []).length;
  const avgCommasPerSentence = sentences.length > 0 ? totalCommas / sentences.length : 0;
  const excessiveCommas = avgCommasPerSentence > 3;
  
  return { emDashes, enDashes, colonsBeforeLists, semicolons, excessiveCommas, bulletPoints, numberedLists };
}

// 5. Vokabular-Diversität (Type-Token-Ratio)
function calculateTTR(text: string): number {
  const words = text.toLowerCase().match(/[a-zäöüß]+/g) || [];
  if (words.length < 50) return 1; // Zu kurz für Analyse
  
  const uniqueWords = new Set(words);
  // Normalisierte TTR (für längere Texte)
  return uniqueWords.size / Math.sqrt(words.length * 2);
}

// 6. Satzanfänge-Analyse (Repetitive Anfänge = KI)
function analyzeSentenceStarters(text: string): { repetitionScore: number; repeatedStarters: string[] } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length < 4) return { repetitionScore: 0, repeatedStarters: [] };
  
  const starters: Record<string, number> = {};
  sentences.forEach(sentence => {
    const firstWords = sentence.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
    starters[firstWords] = (starters[firstWords] || 0) + 1;
  });
  
  const repeatedStarters = Object.entries(starters)
    .filter(([_, count]) => count >= 2)
    .map(([starter]) => starter);
  
  // Wie viele Sätze beginnen mit AI-typischen Anfängen?
  let aiStarterCount = 0;
  sentences.forEach(sentence => {
    const lowerSentence = sentence.trim().toLowerCase();
    if (AI_SENTENCE_STARTERS.some(starter => lowerSentence.startsWith(starter))) {
      aiStarterCount++;
    }
  });
  
  const repetitionScore = (aiStarterCount / sentences.length) * 100;
  return { repetitionScore, repeatedStarters };
}

// 7. Absatz-Längen-Uniformität
function analyzeParagraphUniformity(text: string): { uniform: boolean; stdDev: number } {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);
  if (paragraphs.length < 3) return { uniform: false, stdDev: 999 };
  
  const lengths = paragraphs.map(p => p.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  
  // Niedrige Standardabweichung = zu gleichmäßig
  return { uniform: stdDev < 10, stdDev };
}

// 8. Adjektiv-Ketten erkennen
function countAdjectiveChains(text: string): number {
  // Muster: "adjektiv und adjektiv Nomen" oder "adjektiv, adjektiv Nomen"
  const patterns = [
    /\b\w+e\s+und\s+\w+e\s+\w+/gi,
    /\b\w+en\s+und\s+\w+en\s+\w+/gi,
    /\b\w+er\s+und\s+\w+er\s+\w+/gi,
  ];
  
  let count = 0;
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });
  
  return count;
}

// 9. Aufzählungsmuster (erstens, zweitens, drittens)
function hasEnumerationPattern(text: string): boolean {
  const lowerText = text.toLowerCase();
  const patterns = [
    /erstens[\s\S]{0,500}zweitens/,
    /zunächst[\s\S]{0,500}anschließend[\s\S]{0,500}schließlich/,
    /zum einen[\s\S]{0,500}zum anderen/,
    /einerseits[\s\S]{0,500}andererseits/,
  ];
  
  return patterns.some(p => p.test(lowerText));
}

// 10. HAUPTFUNKTION: Berechnet umfassenden AI-Score
interface AIAnalysisResult {
  score: number;
  reasons: string[];
  details: {
    category: string;
    score: number;
    description: string;
  }[];
  highlights: Set<string>;
}

function calculateAIScore(text: string): AIAnalysisResult {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const reasons: string[] = [];
  const details: { category: string; score: number; description: string }[] = [];
  const highlights = new Set<string>();
  let totalScore = 0;
  
  // 1. AI-Phrasen (max 25 Punkte)
  let phraseCount = 0;
  AI_PHRASES.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      phraseCount += matches.length;
      phrase.split(/\s+/).forEach(w => highlights.add(w.replace(/[^a-zäöüß]/g, '')));
    }
  });
  if (phraseCount > 0) {
    const phraseScore = Math.min(phraseCount * 5, 25);
    totalScore += phraseScore;
    reasons.push(`${phraseCount} KI-Phrasen`);
    details.push({ category: '🔤 KI-Phrasen', score: phraseScore, description: `${phraseCount} typische Formulierungen gefunden` });
  }
  
  // 2. Überverwendete Wörter (max 15 Punkte)
  let overusedCount = 0;
  words.forEach(word => {
    const cleanWord = word.replace(/[^a-zäöüß]/g, '');
    if (AI_OVERUSED_WORDS.has(cleanWord)) {
      overusedCount++;
      highlights.add(cleanWord);
    }
  });
  const overusedRatio = words.length > 0 ? overusedCount / words.length : 0;
  if (overusedRatio > 0.01) {
    const overusedScore = Math.min(overusedRatio * 500, 15);
    totalScore += overusedScore;
    details.push({ category: '📝 KI-Wörter', score: Math.round(overusedScore), description: `${overusedCount} Wörter (${(overusedRatio * 100).toFixed(1)}%)` });
  }
  
  // 3. Interpunktion (max 15 Punkte)
  const punct = analyzePunctuation(text);
  let punctScore = 0;
  const punctIssues: string[] = [];
  
  if (punct.emDashes + punct.enDashes >= 3) {
    punctScore += 5;
    punctIssues.push(`${punct.emDashes + punct.enDashes} Gedankenstriche`);
  }
  if (punct.semicolons >= 3) {
    punctScore += 3;
    punctIssues.push(`${punct.semicolons} Semikolons`);
  }
  if (punct.excessiveCommas) {
    punctScore += 4;
    punctIssues.push('Viele Kommas');
  }
  if (punct.bulletPoints >= 5 || punct.numberedLists >= 3) {
    punctScore += 3;
    punctIssues.push('Viele Listen');
  }
  
  if (punctScore > 0) {
    totalScore += Math.min(punctScore, 15);
    details.push({ category: '✏️ Interpunktion', score: Math.min(punctScore, 15), description: punctIssues.join(', ') });
  }
  
  // 4. Satzlängen-Uniformität (max 12 Punkte)
  if (sentences.length > 4) {
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 4 && avgLength > 10) {
      totalScore += 12;
      details.push({ category: '📏 Satzlängen', score: 12, description: `Sehr gleichmäßig (σ=${stdDev.toFixed(1)})` });
    } else if (stdDev < 6 && avgLength > 10) {
      totalScore += 6;
      details.push({ category: '📏 Satzlängen', score: 6, description: `Gleichmäßig (σ=${stdDev.toFixed(1)})` });
    }
  }
  
  // 5. Satzanfänge (max 12 Punkte)
  const starterAnalysis = analyzeSentenceStarters(text);
  if (starterAnalysis.repetitionScore > 30) {
    const starterScore = Math.min(starterAnalysis.repetitionScore / 3, 12);
    totalScore += starterScore;
    details.push({ category: '🔁 Satzanfänge', score: Math.round(starterScore), description: `${Math.round(starterAnalysis.repetitionScore)}% KI-typische Anfänge` });
  }
  
  // 6. Vokabular-Diversität (max 10 Punkte)
  const ttr = calculateTTR(text);
  if (ttr < 0.4 && words.length >= 100) {
    const ttrScore = Math.round((0.4 - ttr) * 50);
    totalScore += Math.min(ttrScore, 10);
    details.push({ category: '📚 Vokabular', score: Math.min(ttrScore, 10), description: `Geringe Diversität (TTR=${ttr.toFixed(2)})` });
  }
  
  // 7. Absatz-Uniformität (max 8 Punkte)
  const paragraphAnalysis = analyzeParagraphUniformity(text);
  if (paragraphAnalysis.uniform) {
    totalScore += 8;
    details.push({ category: '📄 Absätze', score: 8, description: 'Sehr gleichmäßige Absatzlängen' });
  }
  
  // 8. Aufzählungsmuster (max 5 Punkte)
  if (hasEnumerationPattern(text)) {
    totalScore += 5;
    details.push({ category: '🔢 Aufzählung', score: 5, description: 'Typisches KI-Aufzählungsmuster' });
  }
  
  // 9. Adjektiv-Ketten (max 5 Punkte)
  const adjChains = countAdjectiveChains(text);
  if (adjChains >= 2) {
    const adjScore = Math.min(adjChains * 2, 5);
    totalScore += adjScore;
    details.push({ category: '🎨 Adjektive', score: adjScore, description: `${adjChains} Adjektiv-Ketten` });
  }
  
  // Zusammenfassung
  if (details.length > 0) {
    const topReasons = details
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(d => d.category.slice(2).trim());
    reasons.push(...topReasons);
  }
  
  return { 
    score: Math.min(totalScore, 100), 
    reasons: reasons.slice(0, 4), 
    details: details.sort((a, b) => b.score - a.score),
    highlights 
  };
}

// Prüft ob ein Wort KI-typisch ist
function isAIWord(word: string, aiHighlights: Set<string>): boolean {
  const cleanWord = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
  return aiHighlights.has(cleanWord) || AI_OVERUSED_WORDS.has(cleanWord);
}

// ========== FACHBEGRIFFE ==========

const FACHBEGRIFF_PATTERNS = [
  /\w*(itis|ose|ismus|pathie|logie|tomie|ektomie|plastik|skopie|therapie|gramm|graphie)\b/gi,
  /\b(anti|hyper|hypo|intra|extra|trans|peri|post|prä|neo|pseudo|patho|physio|cardio|neuro|gastro|derma|ortho|psycho)\w+/gi,
  /\w*(azol|pril|sartan|statin|mycin|cillin|oxacin|mab|nib|zumab)\b/gi,
  /\b(algorithmus|infrastruktur|implementierung|konfiguration|spezifikation|validierung|zertifizierung|akkreditierung|standardisierung)\b/gi,
  /\b(hypothese|signifikanz|korrelation|kausalität|evidenz|metaanalyse|randomisierung|placebo|doppelblind)\b/gi,
  /\b(konformität|compliance|regulierung|zulassung|haftung|gewährleistung|inverkehrbringung)\b/gi,
];

const MEDICAL_TERMS = new Set([
  'muskulatur', 'skelett', 'gelenk', 'wirbelsäule', 'bandscheibe', 'sehne', 'ligament',
  'faszien', 'myofaszial', 'propriozeption', 'nozizeption', 'innervation',
  'arthrose', 'arthritis', 'tendinitis', 'bursitis', 'fibromyalgie', 'neuropathie',
  'ischialgie', 'lumbalgie', 'cervikalgie', 'epicondylitis', 'karpaltunnelsyndrom',
  'impingement', 'instabilität', 'dysfunktion', 'insuffizienz',
  'mobilisation', 'manipulation', 'traktion', 'kompression', 'dekompression',
  'elektrotherapie', 'ultraschall', 'kryotherapie', 'thermotherapie', 'hydrotherapie',
  'tens', 'ems', 'biofeedback', 'propriozeptiv', 'sensomotorisch',
  'medizinprodukt', 'konformitätsbewertung', 'risikoklasse', 'biokompatibilität',
  'sterilisation', 'desinfektion', 'kontamination',
]);

const TECH_TERMS = new Set([
  'frequenz', 'amplitude', 'modulation', 'stimulation', 'impuls', 'elektrode',
  'applikator', 'sensor', 'aktuator', 'interface', 'protokoll', 'parameter',
  'kalibrierung', 'justierung', 'wartung', 'instandhaltung',
]);

function isFachbegriff(word: string): boolean {
  const cleanWord = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
  if (MEDICAL_TERMS.has(cleanWord) || TECH_TERMS.has(cleanWord)) return true;
  for (const pattern of FACHBEGRIFF_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(cleanWord)) return true;
  }
  return false;
}

// ========== PASSIV ==========

const PASSIV_PATTERNS = [
  /\b(wird|werden|wurde|wurden)\s+\w+t\b/gi,
  /\b(ist|sind|war|waren)\s+\w+t\s+worden\b/gi,
];

// ========== KATEGORIEN ==========

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

// AI-Score Label und Farbe
function getAIScoreLabel(score: number): { label: string; color: string; bgColor: string; borderColor: string } {
  if (score >= 70) return { label: 'Sehr wahrscheinlich KI', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-300' };
  if (score >= 50) return { label: 'Wahrscheinlich KI', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' };
  if (score >= 30) return { label: 'Möglicherweise KI', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' };
  if (score >= 15) return { label: 'Leichte KI-Merkmale', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' };
  return { label: 'Vermutlich menschlich', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-300' };
}

// AI Analysis Response Type
interface DeepAIAnalysis {
  score: number;
  verdict: string;
  confidence: string;
  analysis: {
    positiveIndicators: string[];
    negativeIndicators: string[];
    linguisticPatterns: string;
    structuralPatterns: string;
  };
  recommendations: string[];
  highlightedPhrases: string[];
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
  const [showAIDetails, setShowAIDetails] = useState(false);
  
  // Deep AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAIAnalysis | null>(null);
  const [showDeepDetails, setShowDeepDetails] = useState(true);

  const toggleCategory = (categoryId: string) => {
    setActiveCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Deep AI Analysis function
  const runDeepAIAnalysis = async () => {
    if (!text.trim() || text.length < 100) {
      toast.error('Text muss mindestens 100 Zeichen haben');
      return;
    }

    setIsAnalyzing(true);
    setDeepAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-ai-text', {
        body: { text }
      });

      if (error) {
        console.error('Deep AI Analysis error:', error);
        toast.error('Fehler bei der KI-Analyse');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.analysis) {
        setDeepAnalysis(data.analysis);
        toast.success('KI-Analyse abgeschlossen');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI-Score berechnen
  const aiAnalysis = useMemo(() => {
    if (!text.trim()) return { score: 0, reasons: [], details: [], highlights: new Set<string>() };
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

    const sentences = text.split(/(?<=[.!?])\s+/);
    
    return sentences.map((sentence, sentenceIndex) => {
      const words = sentence.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      
      const sentenceCategories: string[] = [];
      if (wordCount > 30 && activeCategories.veryLongSentence) {
        sentenceCategories.push('veryLongSentence');
      } else if (wordCount > 20 && activeCategories.longSentence) {
        sentenceCategories.push('longSentence');
      }

      let hasPassiv = false;
      if (activeCategories.passiv) {
        for (const pattern of PASSIV_PATTERNS) {
          if (pattern.test(sentence)) {
            hasPassiv = true;
            break;
          }
        }
      }

      const renderedWords = sentence.split(/(\s+)/).map((part, partIndex) => {
        if (/^\s+$/.test(part)) {
          return <span key={`${sentenceIndex}-${partIndex}`}>{part}</span>;
        }

        const wordCategories: string[] = [];
        const cleanWord = part.toLowerCase().replace(/[^a-zäöüß]/g, '');

        if (activeCategories.aiText && isAIWord(part, aiAnalysis.highlights)) {
          wordCategories.push('aiText');
        }

        if (activeCategories.fuellwort && FUELLWOERTER.includes(cleanWord)) {
          wordCategories.push('fuellwort');
        }

        if (activeCategories.fachbegriff && isFachbegriff(part)) {
          wordCategories.push('fachbegriff');
        }

        if (hasPassiv && activeCategories.passiv) {
          const passivWords = ['wird', 'werden', 'wurde', 'wurden', 'worden'];
          if (passivWords.includes(cleanWord)) {
            wordCategories.push('passiv');
          }
        }

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
  const deepScoreInfo = deepAnalysis ? getAIScoreLabel(deepAnalysis.score) : null;

  return (
    <div className="space-y-4">
      {/* KI-Erkennung Card - Regel-basiert */}
      <Card className={`border-2 ${aiScoreInfo.bgColor} ${aiScoreInfo.borderColor}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              KI-Text Erkennung
              <Badge variant="outline" className="text-xs font-normal">Regel-basiert</Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 opacity-60" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="text-xs font-medium mb-1">Analysierte Metriken:</p>
                    <ul className="text-xs space-y-0.5 list-disc pl-3">
                      <li>KI-typische Phrasen & Floskeln</li>
                      <li>Überverwendete Wörter</li>
                      <li>Interpunktion (Gedankenstriche, Semikolons)</li>
                      <li>Satz- und Absatzlängen-Uniformität</li>
                      <li>Repetitive Satzanfänge</li>
                      <li>Vokabular-Diversität (TTR)</li>
                      <li>Aufzählungsmuster</li>
                      <li>Adjektiv-Ketten</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runDeepAIAnalysis}
              disabled={isAnalyzing || text.length < 100}
              className="gap-1.5"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analysiere...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Deep AI Analyse
                </>
              )}
            </Button>
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
                className="h-2.5"
              />
            </div>
          </div>
          
          {aiAnalysis.details.length > 0 && (
            <Collapsible open={showAIDetails} onOpenChange={setShowAIDetails}>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {showAIDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showAIDetails ? 'Details ausblenden' : `${aiAnalysis.details.length} Kriterien analysiert`}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="grid gap-2">
                  {aiAnalysis.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-background/50 rounded px-2 py-1.5">
                      <span className="flex items-center gap-1.5">
                        <span>{detail.category}</span>
                        <span className="text-muted-foreground">– {detail.description}</span>
                      </span>
                      <Badge variant="secondary" className="text-xs h-5">
                        +{detail.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Deep AI Analysis Results */}
      {deepAnalysis && deepScoreInfo && (
        <Card className={`border-2 ${deepScoreInfo.bgColor} ${deepScoreInfo.borderColor}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Deep AI Analyse
              <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">Google Gemini</Badge>
              <Badge variant="outline" className="text-xs font-normal">
                Konfidenz: {deepAnalysis.confidence}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className={`text-sm font-medium ${deepScoreInfo.color}`}>
                    {deepAnalysis.verdict}
                  </span>
                  <span className="text-sm font-bold">{deepAnalysis.score}%</span>
                </div>
                <Progress value={deepAnalysis.score} className="h-2.5" />
              </div>
            </div>

            <Collapsible open={showDeepDetails} onOpenChange={setShowDeepDetails}>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {showDeepDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showDeepDetails ? 'Details ausblenden' : 'Details anzeigen'}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-4">
                {/* Positive Indicators */}
                {deepAnalysis.analysis.positiveIndicators.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium flex items-center gap-1.5 mb-2 text-red-700">
                      <XCircle className="h-3.5 w-3.5" />
                      KI-Indikatoren gefunden
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {deepAnalysis.analysis.positiveIndicators.map((indicator, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-red-50 text-red-700">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Negative Indicators */}
                {deepAnalysis.analysis.negativeIndicators.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium flex items-center gap-1.5 mb-2 text-green-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Menschliche Merkmale
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {deepAnalysis.analysis.negativeIndicators.map((indicator, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-green-50 text-green-700">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Patterns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="text-xs bg-muted/50 rounded-lg p-3">
                    <h5 className="font-medium mb-1">Sprachliche Muster</h5>
                    <p className="text-muted-foreground">{deepAnalysis.analysis.linguisticPatterns}</p>
                  </div>
                  <div className="text-xs bg-muted/50 rounded-lg p-3">
                    <h5 className="font-medium mb-1">Strukturelle Muster</h5>
                    <p className="text-muted-foreground">{deepAnalysis.analysis.structuralPatterns}</p>
                  </div>
                </div>

                {/* Highlighted Phrases */}
                {deepAnalysis.highlightedPhrases.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                      Typische KI-Phrasen im Text
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {deepAnalysis.highlightedPhrases.map((phrase, idx) => (
                        <Badge key={idx} className="text-xs bg-orange-100 text-orange-800 border-0">
                          "{phrase}"
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {deepAnalysis.recommendations.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h4 className="text-xs font-medium flex items-center gap-1.5 mb-2 text-blue-800">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Verbesserungsvorschläge
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                      {deepAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

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
