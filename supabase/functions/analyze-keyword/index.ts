import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeywordAnalysis {
  secondaryKeywords: string[];
  wQuestions: string[];
  searchIntent: "know" | "do" | "buy" | "go";
  suggestedTopics: string[];
}

// Input validation schema
const requestSchema = z.object({
  focusKeyword: z.string().min(1, 'Fokus-Keyword ist erforderlich').max(200, 'Keyword zu lang'),
  targetAudience: z.enum(['endCustomers', 'physiotherapists']).optional(),
  language: z.string().optional().default('de'),
});

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);
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

    const { focusKeyword, targetAudience, language } = parseResult.data;
    // ===== END VALIDATION =====

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing keyword:', focusKeyword);

    const audienceContext = targetAudience === 'physiotherapists'
      ? 'B2B-Zielgruppe (Fachpersonal, Therapeuten, medizinische Fachkräfte)'
      : 'B2C-Zielgruppe (Endkunden, Verbraucher)';

    const analysisPrompt = `Du bist ein SEO-Keyword-Experte. Analysiere das folgende Fokus-Keyword und generiere passende Vorschläge.

FOKUS-KEYWORD: "${focusKeyword}"
ZIELGRUPPE: ${audienceContext}
SPRACHE: ${language === 'de' ? 'Deutsch' : 'Englisch'}

AUFGABEN:

1. **Sekundäre Keywords (8-12)**: Semantisch verwandte Begriffe, Long-Tail-Varianten und LSI-Keywords die zum Fokus-Keyword passen. Diese sollten natürlich in einem SEO-Text eingebaut werden können.

2. **W-Fragen (5-8)**: Typische Fragen die Nutzer zu diesem Thema stellen würden. Beginne mit "Was", "Wie", "Warum", "Wann", "Welche", "Wo". Diese Fragen sollten für FAQ-Abschnitte geeignet sein.

3. **Suchintention**: Bestimme die wahrscheinlichste Suchintention:
   - "know": Informationssuche (Nutzer will etwas lernen/verstehen)
   - "do": Transaktional (Nutzer will eine Aktion durchführen)
   - "buy": Kaufabsicht (Nutzer will kaufen/bestellen)
   - "go": Navigation (Nutzer sucht eine bestimmte Website)

4. **Themen-Vorschläge (3-5)**: Hauptthemen/Abschnitte die in einem umfassenden Text zu diesem Keyword behandelt werden sollten.

Antworte NUR mit validem JSON in diesem Format:
{
  "secondaryKeywords": ["keyword1", "keyword2", ...],
  "wQuestions": ["Wie funktioniert...?", "Was ist...?", ...],
  "searchIntent": "know",
  "suggestedTopics": ["Thema 1", "Thema 2", ...]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du bist ein SEO-Keyword-Analyse-Experte. Antworte nur mit validem JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        throw new Error('Rate limit erreicht. Bitte versuche es später erneut.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI-Credits aufgebraucht. Bitte Guthaben aufladen.');
      }
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || '';

    // Parse AI response
    let analysis: Partial<KeywordAnalysis> = {
      secondaryKeywords: [],
      wQuestions: [],
      searchIntent: "know",
      suggestedTopics: [],
    };

    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        analysis = {
          secondaryKeywords: parsed.secondaryKeywords || [],
          wQuestions: parsed.wQuestions || [],
          searchIntent: ['know', 'do', 'buy', 'go'].includes(parsed.searchIntent) ? parsed.searchIntent : 'know',
          suggestedTopics: parsed.suggestedTopics || [],
        };
      }
    } catch (e) {
      console.error('Failed to parse AI analysis:', e);
    }

    console.log('Keyword analysis completed:', {
      secondaryKeywordsCount: analysis.secondaryKeywords?.length,
      wQuestionsCount: analysis.wQuestions?.length,
      searchIntent: analysis.searchIntent,
    });

    return new Response(JSON.stringify({
      success: true,
      focusKeyword,
      analysis,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-keyword:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
