import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    // AI-typische Muster erkennen
    const aiPatterns = [
      // KI-typische Eröffnungen
      { pattern: /(?:entdecken sie|tauchen sie ein|willkommen in der welt)/gi, severity: 'high', description: 'KI-typische Eröffnung' },
      { pattern: /(?:in der heutigen zeit|im zeitalter von|in einer welt, in der)/gi, severity: 'high', description: 'KI-typischer Kontext-Einstieg' },
      
      // KI-typische Überleitungen
      { pattern: /(?:des weiteren|darüber hinaus|ferner|zudem)/gi, severity: 'medium', description: 'KI-typische Überleitung (zu häufig)' },
      { pattern: /(?:es ist wichtig zu beachten|es sei darauf hingewiesen)/gi, severity: 'high', description: 'KI-typische Absicherungsphrase' },
      
      // KI-typische Schlüsse
      { pattern: /(?:zusammenfassend lässt sich sagen|abschließend sei erwähnt)/gi, severity: 'medium', description: 'KI-typischer Abschluss' },
      
      // Marketing-Superlative ohne Beleg
      { pattern: /\b(?:revolutionär|bahnbrechend|einzigartig|cutting-edge|innovativ)\b/gi, severity: 'low', description: 'Superlativ (Beleg prüfen)' },
      
      // Perfekte Listen-Strukturen
      { pattern: /erstens.*zweitens.*drittens/si, severity: 'medium', description: 'Perfekte 3er-Liste (KI-typisch)' },
    ];

    const findings: Array<{
      pattern: string;
      matches: number;
      severity: string;
      description: string;
      examples: string[];
    }> = [];

    let totalScore = 100;

    for (const { pattern, severity, description } of aiPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const deduction = severity === 'high' ? 15 : severity === 'medium' ? 10 : 5;
        totalScore -= (matches.length * deduction);

        findings.push({
          pattern: pattern.source,
          matches: matches.length,
          severity,
          description,
          examples: matches.slice(0, 3) // Zeige max. 3 Beispiele
        });
      }
    }

    // Zusätzliche Checks
    const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum: number, s: string) => sum + s.split(' ').length, 0) / sentences.length;
    
    // Prüfe auf zu einheitliche Satzlängen (KI-typisch)
    const sentenceLengths = sentences.map((s: string) => s.split(' ').length);
    const variance = sentenceLengths.reduce((sum: number, len: number) => {
      return sum + Math.pow(len - avgSentenceLength, 2);
    }, 0) / sentenceLengths.length;
    const standardDeviation = Math.sqrt(variance);

    if (standardDeviation < 5) {
      totalScore -= 10;
      findings.push({
        pattern: 'sentence_uniformity',
        matches: 1,
        severity: 'medium',
        description: 'Zu einheitliche Satzlängen (KI-typisch)',
        examples: [`Standardabweichung: ${standardDeviation.toFixed(2)} (ideal: >5)`]
      });
    }

    // Prüfe auf zu häufige Übergangswörter
    const transitionWords = ['jedoch', 'allerdings', 'dennoch', 'trotzdem', 'darüber hinaus', 'des weiteren', 'zudem', 'ferner'];
    let transitionCount = 0;
    transitionWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) transitionCount += matches.length;
    });

    const transitionRatio = (transitionCount / sentences.length) * 100;
    if (transitionRatio > 15) {
      totalScore -= 10;
      findings.push({
        pattern: 'transition_overuse',
        matches: transitionCount,
        severity: 'medium',
        description: 'Zu viele Übergangswörter (KI-typisch)',
        examples: [`${transitionRatio.toFixed(1)}% der Sätze (ideal: <15%)`]
      });
    }

    totalScore = Math.max(0, Math.min(100, totalScore));

    const status = totalScore >= 80 ? 'green' : totalScore >= 60 ? 'yellow' : 'red';

    return new Response(JSON.stringify({
      score: totalScore,
      status,
      findings,
      stats: {
        totalSentences: sentences.length,
        avgSentenceLength: avgSentenceLength.toFixed(1),
        sentenceLengthVariance: standardDeviation.toFixed(2),
        transitionWordRatio: transitionRatio.toFixed(1)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-detection-check function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
