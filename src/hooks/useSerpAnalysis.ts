import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SerpTerms {
  mustHave: string[];
  shouldHave: string[];
  niceToHave: string[];
  all: string[];
}

export interface SerpCompetitor {
  position: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface SerpQuestions {
  peopleAlsoAsk: string[];
  relatedSearches: string[];
}

export interface SerpStats {
  totalResultsAnalyzed: number;
  averageSnippetLength: number;
  termDetails: Array<{
    term: string;
    score: number;
    inTitles: number;
    inSnippets: number;
    frequency: number;
  }>;
}

export interface SerpAnalysisResult {
  keyword: string;
  searchedAt: string;
  serpTerms: SerpTerms;
  questions: SerpQuestions;
  competitors: SerpCompetitor[];
  competitorHeadings: string[];
  stats: SerpStats;
  promptContext: string;
}

interface UseSerpAnalysisOptions {
  country?: string;
  language?: string;
  numResults?: number;
}

export function useSerpAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SerpAnalysisResult | null>(null);

  const analyze = useCallback(async (
    keyword: string,
    options: UseSerpAnalysisOptions = {}
  ): Promise<SerpAnalysisResult | null> => {
    if (!keyword.trim()) {
      setError('Keyword ist erforderlich');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-serp', {
        body: {
          keyword: keyword.trim(),
          country: options.country || 'de',
          language: options.language || 'de',
          numResults: options.numResults || 10,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'SERP-Analyse fehlgeschlagen');
      }

      if (data?.error) {
        // API nicht konfiguriert
        if (data.hint) {
          toast({
            title: 'SERP-Analyse nicht verfügbar',
            description: data.hint,
            variant: 'destructive',
          });
        }
        throw new Error(data.error);
      }

      setResult(data);
      toast({
        title: 'SERP-Analyse abgeschlossen',
        description: `${data.serpTerms.all.length} relevante Begriffe gefunden`,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);

      // Nur Toast zeigen, wenn nicht schon oben gezeigt
      if (!errorMessage.includes('nicht konfiguriert') && !errorMessage.includes('nicht verfügbar')) {
        toast({
          title: 'SERP-Analyse fehlgeschlagen',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    analyze,
    reset,
    isLoading,
    error,
    result,

    // Convenience getters
    serpTerms: result?.serpTerms || null,
    questions: result?.questions || null,
    competitors: result?.competitors || null,
    promptContext: result?.promptContext || null,
  };
}

// Hilfsfunktion um SERP-Terme in ein Format für generate-seo-content zu bringen
export function formatSerpTermsForPrompt(serpResult: SerpAnalysisResult | null): string {
  if (!serpResult) return '';
  return serpResult.promptContext;
}

// Hilfsfunktion um SERP-Fragen als W-Fragen zu extrahieren
export function extractWQuestionsFromSerp(serpResult: SerpAnalysisResult | null): string[] {
  if (!serpResult) return [];

  const allQuestions = [
    ...serpResult.questions.peopleAlsoAsk,
    ...serpResult.questions.relatedSearches,
  ];

  // Nur echte Fragen (mit ?)
  return allQuestions
    .filter(q => q.includes('?') || q.toLowerCase().startsWith('wie') ||
                  q.toLowerCase().startsWith('was') || q.toLowerCase().startsWith('warum') ||
                  q.toLowerCase().startsWith('wann') || q.toLowerCase().startsWith('wo') ||
                  q.toLowerCase().startsWith('wer') || q.toLowerCase().startsWith('welche'))
    .slice(0, 10);
}
