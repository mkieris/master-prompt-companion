import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Type, 
  Shuffle,
  Zap,
  MessageSquare
} from 'lucide-react';

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

// Komplexe Wörter (> 3 Silben und > 10 Zeichen)
function isComplexWord(word: string): boolean {
  const cleanWord = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
  if (cleanWord.length < 10) return false;
  
  const vowels = 'aeiouyäöü';
  let syllables = 0;
  let prevWasVowel = false;
  
  for (const char of cleanWord) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevWasVowel) syllables++;
    prevWasVowel = isVowel;
  }
  
  return syllables >= 4;
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
    id: 'complex',
    label: 'Komplexe Wörter',
    color: 'text-teal-700',
    bgColor: 'bg-teal-200',
    icon: <Type className="h-3 w-3" />,
    description: '4+ Silben'
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

export function HighlightedText({ text }: HighlightedTextProps) {
  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({
    longSentence: true,
    veryLongSentence: true,
    fuellwort: true,
    passiv: true,
    complex: true
  });

  const toggleCategory = (categoryId: string) => {
    setActiveCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Kategorisierte Counts
  const counts = useMemo(() => {
    if (!text.trim()) return { longSentence: 0, veryLongSentence: 0, fuellwort: 0, passiv: 0, complex: 0 };
    
    const sentences = text.split(/(?<=[.!?])\s+/);
    let longSentence = 0;
    let veryLongSentence = 0;
    let fuellwort = 0;
    let passiv = 0;
    let complex = 0;

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
      if (isComplexWord(word)) complex++;
    });

    return { longSentence, veryLongSentence, fuellwort, passiv, complex };
  }, [text]);

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

        // Füllwort?
        if (activeCategories.fuellwort && FUELLWOERTER.includes(cleanWord)) {
          wordCategories.push('fuellwort');
        }

        // Komplexes Wort?
        if (activeCategories.complex && isComplexWord(part)) {
          wordCategories.push('complex');
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
  }, [text, activeCategories]);

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

  return (
    <div className="space-y-4">
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
                    ({counts[category.id as keyof typeof counts]})
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
