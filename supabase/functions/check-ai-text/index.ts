import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text ist erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY nicht konfiguriert');
      return new Response(
        JSON.stringify({ error: 'API-Schlüssel nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Du bist ein Experte für die Erkennung von KI-generiertem Text. Analysiere den folgenden deutschen Text und bewerte, ob er von einer KI (wie ChatGPT, Claude, Gemini) oder von einem Menschen geschrieben wurde.

WICHTIG: Antworte NUR mit einem validen JSON-Objekt in folgendem Format (keine Markdown-Formatierung, kein Codeblock):

{
  "score": [0-100, wobei 100 = definitiv KI-generiert],
  "verdict": "[Sehr wahrscheinlich KI | Wahrscheinlich KI | Möglicherweise KI | Leichte KI-Merkmale | Vermutlich menschlich]",
  "confidence": "[hoch | mittel | niedrig]",
  "analysis": {
    "positiveIndicators": ["Liste von Merkmalen, die auf KI hindeuten"],
    "negativeIndicators": ["Liste von Merkmalen, die gegen KI sprechen"],
    "linguisticPatterns": "Kurze Beschreibung der sprachlichen Muster",
    "structuralPatterns": "Kurze Beschreibung der strukturellen Muster"
  },
  "recommendations": ["Konkrete Verbesserungsvorschläge, um den Text menschlicher klingen zu lassen"],
  "highlightedPhrases": ["Typische KI-Phrasen im Text, die ersetzt werden sollten"]
}

Achte besonders auf:
- Typische KI-Einleitungen ("In der heutigen Zeit", "Es ist wichtig zu beachten")
- Übermäßige Verwendung von Gedankenstrichen und Semikolons
- Gleichmäßige Satzlängen und Absätze
- Überverwendete Wörter (jedoch, darüber hinaus, ganzheitlich, nachhaltig)
- Fehlende persönliche Stimme oder Meinung
- Generische Formulierungen ohne konkrete Details
- Aufzählungsmuster (erstens, zweitens, drittens)
- Perfekte aber sterile Grammatik`;

    console.log('Sende Anfrage an Lovable AI Gateway...');
    console.log('Textlänge:', text.length, 'Zeichen');

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
          { role: 'user', content: `Analysiere diesen Text auf KI-Merkmale:\n\n${text.substring(0, 8000)}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway Fehler:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate-Limit erreicht. Bitte versuche es später erneut.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Kein Guthaben mehr. Bitte lade dein Lovable-Konto auf.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Fehler bei der KI-Analyse' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Keine Antwort von der KI erhalten');
      return new Response(
        JSON.stringify({ error: 'Keine Antwort von der KI erhalten' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('KI-Antwort erhalten:', content.substring(0, 200) + '...');

    // Parse JSON response
    let analysis;
    try {
      // Remove potential markdown code blocks
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON-Parse-Fehler:', parseError);
      console.error('Rohe Antwort:', content);
      
      // Fallback: Try to extract score from text
      const scoreMatch = content.match(/"score":\s*(\d+)/);
      analysis = {
        score: scoreMatch ? parseInt(scoreMatch[1]) : 50,
        verdict: 'Analyse nicht vollständig',
        confidence: 'niedrig',
        analysis: {
          positiveIndicators: ['Konnte nicht vollständig analysiert werden'],
          negativeIndicators: [],
          linguisticPatterns: 'Keine detaillierte Analyse verfügbar',
          structuralPatterns: 'Keine detaillierte Analyse verfügbar'
        },
        recommendations: ['Versuche es erneut'],
        highlightedPhrases: []
      };
    }

    console.log('Analyse erfolgreich, Score:', analysis.score);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
