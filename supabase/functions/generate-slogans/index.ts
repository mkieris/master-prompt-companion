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
    const { productService, targetAudience, usp, type, framework, tone, platform, additionalInfo } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating slogans with:', { productService, targetAudience, type, framework, tone, platform });

    const systemPrompt = buildSystemPrompt(type, framework, tone, platform);
    const userPrompt = buildUserPrompt(productService, targetAudience, usp, additionalInfo);

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
      console.error('AI Gateway Error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Raw AI response:', generatedText);

    const parsedResult = parseGeneratedSlogans(generatedText);

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-slogans function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(type: string, framework: string, tone: string, platform: string): string {
  const typeDescriptions: Record<string, string> = {
    slogan: "ein prägnanter, einprägsamer Slogan (kurz und merkfähig)",
    tagline: "eine Tagline (beschreibt Markenpositionierung, zeitlos)",
    headline: "eine kraftvolle Headline (aufmerksamkeitsstark für Kampagnen)",
    subline: "eine unterstützende Subline (ergänzt Headline mit Details)",
    claim: "einen Markenclaim (repräsentiert Markenversprechen)",
  };

  const frameworkInstructions: Record<string, string> = {
    aida: "AIDA-Framework: Erzeuge Attention (Aufmerksamkeit), wecke Interest (Interesse), schaffe Desire (Verlangen), fordere zu Action (Handlung) auf.",
    pas: "PAS-Framework: Identifiziere das Problem, verstärke den Schmerz (Agitate), präsentiere die Lösung.",
    "4us": "4 U's Framework: Mache es Useful (nützlich), Urgent (dringend), Unique (einzigartig), Ultra-specific (ultra-spezifisch).",
    fab: "FAB-Framework: Nenne Features (Eigenschaften), zeige Advantages (Vorteile), kommuniziere Benefits (Nutzen).",
    power: "Power Words: Nutze emotional aufgeladene, kraftvolle Wörter die Neugierde, Dringlichkeit oder Exklusivität vermitteln.",
  };

  const toneInstructions: Record<string, string> = {
    emotional: "Emotionaler Ton: Berühre Gefühle, schaffe Verbindung, nutze bildhafte Sprache.",
    rational: "Rationaler Ton: Fokussiere Fakten, Logik, messbare Vorteile, Vertrauen.",
    provocative: "Provokativer Ton: Hinterfrage Status Quo, sei mutig, erzeuge Kontraste.",
    humorous: "Humorvoller Ton: Sei witzig, charmant, unterhaltsam ohne das Produkt zu entwerten.",
    luxury: "Luxuriöser Ton: Vermittle Exklusivität, Eleganz, Premium-Qualität.",
    authentic: "Authentischer Ton: Sei ehrlich, bodenständig, nah am Menschen.",
  };

  const platformInstructions: Record<string, string> = {
    instagram: "Instagram: Visuell unterstützend, Emoji-freundlich, kurz, inspirierend.",
    linkedin: "LinkedIn: Professionell, faktenbasiert, lösungsorientiert.",
    facebook: "Facebook: Community-orientiert, teilbar, emotional ansprechend.",
    tiktok: "TikTok: Kurz, catchy, trend-bewusst, authentisch.",
    print: "Print/Offline: Zeitlos, prägnant, ohne Kontext verständlich.",
    allgemein: "Allgemein einsetzbar, plattformunabhängig.",
  };

  return `Du bist ein preisgekrönter Copywriter und Experte für kreative Markenkommunikation.

AUFGABE: Erstelle ${typeDescriptions[type] || typeDescriptions.slogan} für ein Produkt/Service.

FRAMEWORK: ${frameworkInstructions[framework] || frameworkInstructions.aida}

TONALITÄT: ${toneInstructions[tone] || toneInstructions.emotional}

PLATTFORM: ${platformInstructions[platform] || platformInstructions.allgemein}

QUALITÄTSKRITERIEN:
- Prägnant und merkfähig
- Einzigartig und differenzierend
- Emotional oder rational überzeugend (je nach Tonalität)
- Ohne Klischees und Floskeln
- Authentisch zur Marke passend

AUSGABEFORMAT (JSON):
{
  "variants": [
    {
      "text": "Der Slogan/Headline Text",
      "explanation": "Kurze Erklärung warum dieser funktioniert",
      "framework": "Welches Framework-Element betont wird"
    }
  ],
  "recommendations": "Allgemeine Empfehlungen zur Verwendung"
}

Erstelle 8 unterschiedliche Varianten mit verschiedenen Ansätzen und Schwerpunkten.`;
}

function buildUserPrompt(productService: string, targetAudience: string, usp: string, additionalInfo: string): string {
  let prompt = `PRODUKT/SERVICE: ${productService}\n\n`;
  prompt += `ZIELGRUPPE: ${targetAudience}\n\n`;
  
  if (usp) {
    prompt += `USP/ALLEINSTELLUNGSMERKMAL: ${usp}\n\n`;
  }
  
  if (additionalInfo) {
    prompt += `ZUSÄTZLICHE INFORMATIONEN: ${additionalInfo}\n\n`;
  }

  prompt += `Erstelle jetzt 8 kreative Varianten im angegebenen JSON-Format.`;

  return prompt;
}

function parseGeneratedSlogans(text: string): any {
  try {
    // Try direct JSON parse
    const parsed = JSON.parse(text);
    if (parsed.variants && Array.isArray(parsed.variants)) {
      return parsed;
    }
  } catch (e) {
    // Continue to other parsing methods
  }

  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.variants && Array.isArray(parsed.variants)) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse JSON from markdown block:', e);
    }
  }

  // Fallback: create basic structure
  console.log('Using fallback parsing for slogans');
  return {
    variants: [
      {
        text: "Kreative Slogan-Generierung",
        explanation: "Parsing-Fehler aufgetreten",
        framework: "Fallback"
      }
    ],
    recommendations: "Bitte versuche es erneut."
  };
}
