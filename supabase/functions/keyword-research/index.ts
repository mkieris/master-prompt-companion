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
    const { seedKeyword, industry = "medical" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting keyword research for:', seedKeyword, 'in industry:', industry);

    const systemPrompt = buildSystemPrompt(industry);
    const userPrompt = buildUserPrompt(seedKeyword);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add funds to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    const parsedResult = parseKeywordResult(generatedText, seedKeyword);

    console.log('Successfully completed keyword research');

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in keyword-research function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(industry: string): string {
  const industryContext = {
    medical: "Medizintechnik, therapeutische Produkte, Hilfsmittel, physiotherapeutische Geräte",
    fitness: "Fitness-Equipment, Sportgeräte, Trainingsprodukte, Wellness-Produkte",
    wellness: "Wellness-Produkte, Gesundheitsprodukte, Entspannungsgeräte, Massage",
    general: "Allgemeine Produkte und Dienstleistungen"
  };

  return `Du bist ein Experte für SEO und Keyword-Research im Bereich ${industryContext[industry as keyof typeof industryContext] || industryContext.general}.

Deine Aufgabe ist es, eine umfassende Keyword-Analyse durchzuführen, die folgende Aspekte abdeckt:

1. **Haupt-Keywords**: 5-8 relevante Keywords mit hohem Potenzial
   - Schätze das Suchvolumen (Niedrig: <1k/Monat, Mittel: 1k-10k/Monat, Hoch: >10k/Monat)
   - Bewerte die Keyword-Difficulty (low/medium/high basierend auf Wettbewerb)
   - Identifiziere die primäre Suchintention (informational, navigational, transactional, commercial)

2. **Long-tail Keywords**: 8-12 spezifische, längere Keyword-Phrasen
   - Fokus auf konkrete Anwendungsfälle und Probleme
   - Typischerweise 3-5 Wörter
   - Niedrigerer Wettbewerb, höhere Conversion-Rate

3. **Verwandte Keywords**: 10-15 semantisch verwandte Begriffe
   - Synonyme und Variationen
   - Branchenspezifische Fachbegriffe
   - Verwandte Konzepte und Anwendungen

4. **W-Fragen**: 8-12 häufige Fragen, die Nutzer stellen
   - Was, Wie, Warum, Wann, Wo, Wer, Welche
   - Konkrete Anwendungsfragen
   - Problemorientierte Fragen

5. **Wettbewerber-Insights**: Analyse der Wettbewerbssituation
   - Typische Content-Strategien der Top-Seiten
   - Häufige Themen und Formate
   - Differenzierungsmöglichkeiten

6. **Strategische Empfehlungen**: Konkrete Handlungsempfehlungen
   - Welche Keywords priorisieren?
   - Content-Formate für verschiedene Funnel-Stufen
   - Quick-Win Opportunities

WICHTIG: Antworte IMMER im folgenden JSON-Format:

{
  "seedKeyword": "Original Seed-Keyword",
  "mainKeywords": [
    {
      "keyword": "Keyword-Text",
      "searchVolume": "Niedrig|Mittel|Hoch",
      "difficulty": "low|medium|high",
      "intent": "informational|navigational|transactional|commercial"
    }
  ],
  "longtailKeywords": [
    {
      "keyword": "Long-tail Keyword",
      "searchVolume": "Niedrig|Mittel|Hoch",
      "intent": "Kurze Beschreibung der Suchintention"
    }
  ],
  "relatedKeywords": ["keyword1", "keyword2", ...],
  "questions": ["Frage 1?", "Frage 2?", ...],
  "competitorInsights": "Ausführliche Analyse der Wettbewerbssituation (2-4 Sätze)",
  "recommendations": "Konkrete strategische Empfehlungen mit Priorisierung (3-5 Punkte)"
}`;
}

function buildUserPrompt(seedKeyword: string): string {
  return `Führe eine umfassende Keyword-Research für das folgende Seed-Keyword durch:

Seed-Keyword: "${seedKeyword}"

Berücksichtige dabei:
- Deutsche Sprache (Keywords auf Deutsch)
- Fokus auf den DACH-Markt (Deutschland, Österreich, Schweiz)
- Aktuelle Suchtrends und Nutzerverhalten
- Verschiedene Funnel-Stufen (Awareness, Consideration, Decision)
- Mobile und Voice Search Optimierung

Erstelle eine detaillierte, praxisorientierte Keyword-Analyse im vorgegebenen JSON-Format.`;
}

function parseKeywordResult(text: string, seedKeyword: string): any {
  try {
    // Try to parse as JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse as JSON, using fallback structure:', e);
  }

  // Fallback structure
  return {
    seedKeyword,
    mainKeywords: [
      {
        keyword: seedKeyword,
        searchVolume: "Mittel",
        difficulty: "medium",
        intent: "informational"
      }
    ],
    longtailKeywords: [
      {
        keyword: `${seedKeyword} kaufen`,
        searchVolume: "Niedrig",
        intent: "Kaufabsicht"
      }
    ],
    relatedKeywords: [seedKeyword],
    questions: [`Was ist ${seedKeyword}?`, `Wie funktioniert ${seedKeyword}?`],
    competitorInsights: "Weitere Analyse erforderlich.",
    recommendations: "Fokussieren Sie sich auf informative Inhalte und bauen Sie Vertrauen auf."
  };
}
