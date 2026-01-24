import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  keyword: z.string().min(1, 'Keyword ist erforderlich').max(200, 'Keyword zu lang'),
  country: z.string().max(5).optional().default('de'),
  language: z.string().max(5).optional().default('de'),
  numResults: z.number().int().min(5).max(20).optional().default(10),
});

// Stopwords für Deutsch - werden bei der Term-Extraktion ignoriert
const GERMAN_STOPWORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'einem', 'einen', 'eines',
  'und', 'oder', 'aber', 'doch', 'wenn', 'weil', 'dass', 'ob', 'als', 'wie', 'was', 'wer',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'sie', 'Sie', 'mich', 'dich', 'sich', 'uns', 'euch',
  'mein', 'dein', 'sein', 'ihr', 'unser', 'euer', 'kein', 'keine', 'keiner', 'keinem', 'keinen',
  'ist', 'sind', 'war', 'waren', 'wird', 'werden', 'wurde', 'wurden', 'hat', 'haben', 'hatte', 'hatten',
  'kann', 'können', 'konnte', 'konnten', 'muss', 'müssen', 'musste', 'mussten', 'soll', 'sollte',
  'für', 'von', 'mit', 'bei', 'nach', 'zu', 'aus', 'in', 'im', 'an', 'am', 'auf', 'um', 'über', 'unter',
  'vor', 'hinter', 'neben', 'zwischen', 'durch', 'gegen', 'ohne', 'bis', 'seit', 'während',
  'auch', 'noch', 'schon', 'nur', 'sehr', 'mehr', 'viel', 'hier', 'dort', 'wo', 'wann', 'warum',
  'nicht', 'kein', 'nichts', 'nie', 'immer', 'oft', 'manchmal', 'selten', 'jetzt', 'dann', 'gleich',
  'alle', 'alles', 'jeder', 'jede', 'jedes', 'dieser', 'diese', 'dieses', 'welcher', 'welche', 'welches',
  'man', 'sein', 'seine', 'seiner', 'seinem', 'seinen', 'ihre', 'ihrer', 'ihrem', 'ihren',
  'so', 'also', 'damit', 'dazu', 'dabei', 'davon', 'daran', 'darauf', 'darin', 'darüber',
  'zum', 'zur', 'beim', 'vom', 'ins', 'ans', 'aufs', 'ums', 'übers', 'unters', 'vors', 'hinters',
  'sowie', 'bzw', 'etc', 'usw', 'ggf', 'evtl', 'ca', 'z.b', 'bspw', 'd.h',
]);

// Term-Extraktion aus Text
function extractTerms(text: string): Map<string, number> {
  const termCounts = new Map<string, number>();

  // Text normalisieren und in Wörter aufteilen
  const words = text
    .toLowerCase()
    .replace(/[^\wäöüßÄÖÜ\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !GERMAN_STOPWORDS.has(word));

  // Einzelne Wörter zählen
  for (const word of words) {
    termCounts.set(word, (termCounts.get(word) || 0) + 1);
  }

  // 2-Gramme (Wortpaare) extrahieren
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (!GERMAN_STOPWORDS.has(words[i]) && !GERMAN_STOPWORDS.has(words[i + 1])) {
      termCounts.set(bigram, (termCounts.get(bigram) || 0) + 1);
    }
  }

  return termCounts;
}

// Analysiere die SERP-Ergebnisse
function analyzeSerpResults(results: any[], focusKeyword: string) {
  const allTerms = new Map<string, { count: number; inTitles: number; inSnippets: number }>();
  const headings: string[] = [];
  const questions: string[] = [];
  let totalWordCount = 0;
  let resultCount = 0;

  const focusKeywordLower = focusKeyword.toLowerCase();

  for (const result of results) {
    // Title analysieren
    if (result.title) {
      headings.push(result.title);
      const titleTerms = extractTerms(result.title);
      for (const [term, count] of titleTerms) {
        const existing = allTerms.get(term) || { count: 0, inTitles: 0, inSnippets: 0 };
        existing.count += count;
        existing.inTitles += 1;
        allTerms.set(term, existing);
      }
    }

    // Snippet analysieren
    if (result.snippet) {
      const snippetTerms = extractTerms(result.snippet);
      const wordCount = result.snippet.split(/\s+/).length;
      totalWordCount += wordCount;
      resultCount++;

      for (const [term, count] of snippetTerms) {
        const existing = allTerms.get(term) || { count: 0, inTitles: 0, inSnippets: 0 };
        existing.count += count;
        existing.inSnippets += 1;
        allTerms.set(term, existing);
      }
    }
  }

  // People Also Ask extrahieren
  const paaQuestions = results
    .filter(r => r.relatedSearches || r.peopleAlsoAsk)
    .flatMap(r => r.peopleAlsoAsk || [])
    .map(q => q.question || q)
    .filter(Boolean);

  // Top-Terme sortieren nach Relevanz (Gewichtung: Titel > Snippet)
  const sortedTerms = Array.from(allTerms.entries())
    .map(([term, data]) => ({
      term,
      score: data.count + (data.inTitles * 3) + (data.inSnippets * 1),
      inTitles: data.inTitles,
      inSnippets: data.inSnippets,
      frequency: data.count,
    }))
    // Fokus-Keyword selbst ausschließen
    .filter(t => !focusKeywordLower.includes(t.term) && !t.term.includes(focusKeywordLower))
    .sort((a, b) => b.score - a.score);

  // Top 30 relevante Terme
  const topTerms = sortedTerms.slice(0, 30);

  // Kategorisierung: Must-Have (in >50% der Titel), Should-Have (in >30%), Nice-to-Have (Rest)
  const totalResults = results.length;
  const mustHave = topTerms.filter(t => t.inTitles >= totalResults * 0.5).slice(0, 10);
  const shouldHave = topTerms.filter(t => t.inTitles >= totalResults * 0.3 && t.inTitles < totalResults * 0.5).slice(0, 10);
  const niceToHave = topTerms.filter(t => t.inTitles < totalResults * 0.3).slice(0, 10);

  return {
    topTerms: topTerms.map(t => t.term),
    mustHave: mustHave.map(t => t.term),
    shouldHave: shouldHave.map(t => t.term),
    niceToHave: niceToHave.map(t => t.term),
    termDetails: topTerms,
    competitorHeadings: headings,
    peopleAlsoAsk: paaQuestions,
    averageSnippetLength: resultCount > 0 ? Math.round(totalWordCount / resultCount) : 0,
    totalResultsAnalyzed: results.length,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('SERP Analysis - Authenticated user:', user.id);
    // ===== END AUTHENTICATION =====

    // ===== INPUT VALIDATION =====
    const rawData = await req.json();
    const parseResult = requestSchema.safeParse(rawData);

    if (!parseResult.success) {
      console.log('Validation error:', parseResult.error.format());
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parseResult.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { keyword, country, language, numResults } = parseResult.data;
    // ===== END VALIDATION =====

    // ===== SERPER.DEV API CALL =====
    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');

    if (!SERPER_API_KEY) {
      console.error('SERPER_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'SERP-Analyse nicht konfiguriert',
          hint: 'Bitte SERPER_API_KEY in den Supabase Secrets hinterlegen (kostenlos: serper.dev)'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching SERP for: "${keyword}" (${country}/${language})`);

    const serpResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: keyword,
        gl: country,
        hl: language,
        num: numResults,
      }),
    });

    if (!serpResponse.ok) {
      const errorText = await serpResponse.text();
      console.error('Serper API error:', serpResponse.status, errorText);

      if (serpResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'SERP-API Limit erreicht. Bitte später erneut versuchen.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'SERP-Abfrage fehlgeschlagen' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serpData = await serpResponse.json();
    console.log(`Received ${serpData.organic?.length || 0} organic results`);
    // ===== END SERPER API CALL =====

    // ===== ANALYZE RESULTS =====
    const organicResults = serpData.organic || [];
    const analysis = analyzeSerpResults(organicResults, keyword);

    // People Also Ask from Serper
    const peopleAlsoAsk = serpData.peopleAlsoAsk?.map((item: any) => item.question) || [];

    // Related Searches from Serper
    const relatedSearches = serpData.relatedSearches?.map((item: any) => item.query) || [];

    // Competitor Analysis
    const competitors = organicResults.slice(0, 5).map((result: any, index: number) => ({
      position: index + 1,
      title: result.title,
      url: result.link,
      snippet: result.snippet,
      domain: new URL(result.link).hostname,
    }));
    // ===== END ANALYSIS =====

    const response = {
      keyword,
      searchedAt: new Date().toISOString(),

      // Hauptergebnisse für Content-Optimierung
      serpTerms: {
        mustHave: analysis.mustHave,
        shouldHave: analysis.shouldHave,
        niceToHave: analysis.niceToHave,
        all: analysis.topTerms,
      },

      // Fragen für FAQ
      questions: {
        peopleAlsoAsk: [...new Set([...peopleAlsoAsk, ...analysis.peopleAlsoAsk])],
        relatedSearches,
      },

      // Wettbewerber-Insights
      competitors,
      competitorHeadings: analysis.competitorHeadings,

      // Statistiken
      stats: {
        totalResultsAnalyzed: analysis.totalResultsAnalyzed,
        averageSnippetLength: analysis.averageSnippetLength,
        termDetails: analysis.termDetails.slice(0, 15),
      },

      // Prompt-Erweiterung für generate-seo-content
      promptContext: `
SERP-ANALYSE FÜR "${keyword}":

PFLICHT-BEGRIFFE (in >50% der Top-10 Titel):
${analysis.mustHave.length > 0 ? analysis.mustHave.map(t => `- ${t}`).join('\n') : '- Keine gefunden'}

EMPFOHLENE BEGRIFFE (in >30% der Ergebnisse):
${analysis.shouldHave.length > 0 ? analysis.shouldHave.map(t => `- ${t}`).join('\n') : '- Keine gefunden'}

OPTIONALE BEGRIFFE (zur Differenzierung):
${analysis.niceToHave.length > 0 ? analysis.niceToHave.map(t => `- ${t}`).join('\n') : '- Keine gefunden'}

WETTBEWERBER-TITEL (für H1-Inspiration):
${analysis.competitorHeadings.slice(0, 5).map((h, i) => `${i + 1}. ${h}`).join('\n')}

HÄUFIGE FRAGEN (für FAQ):
${peopleAlsoAsk.slice(0, 5).map(q => `- ${q}`).join('\n')}
      `.trim(),
    };

    console.log('SERP Analysis completed successfully');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SERP Analysis error:', error);
    return new Response(
      JSON.stringify({ error: 'Interner Fehler bei SERP-Analyse', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
