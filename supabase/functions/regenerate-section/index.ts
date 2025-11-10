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
    const { sectionTitle, currentContent, formData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Regenerating section:', sectionTitle);

    const addressMap: Record<string, string> = {
      du: "Verwende durchgehend die Du-Form (du, dich, dein).",
      sie: "Verwende durchgehend die Sie-Form (Sie, Ihnen, Ihr).",
      neutral: "Vermeide direkte Anrede. Schreibe neutral und sachlich."
    };
    const addressStyle = addressMap[formData.formOfAddress || 'du'] || addressMap.du;

    const systemPrompt = `Du bist ein erfahrener SEO-Texter. Deine Aufgabe ist es, einen bestimmten Abschnitt eines SEO-Textes neu zu formulieren.

WICHTIG:
- ${addressStyle}
- Verwende aktive Verben und lebendige Sprache
- Integriere das Fokus-Keyword "${formData.focusKeyword}" natürlich
- Bleibe beim Thema des Abschnitts: "${sectionTitle}"
- Zielgruppe: ${formData.targetAudience === 'endCustomers' ? 'Endkunden (einfache Sprache)' : 'Physiotherapeuten (Fachsprache mit Evidenz)'}

Generiere NUR den neuen Text-Inhalt für diesen Abschnitt. Keine Überschriften, keine JSON-Struktur, nur den Fließtext.`;

    const userPrompt = `Formuliere folgenden Abschnitt komplett neu, aber behalte die Kernaussagen bei:

Aktueller Inhalt:
${currentContent}

Kontext:
- Fokus-Keyword: ${formData.focusKeyword}
- Tonalität: ${formData.tone === 'factual' ? 'Sachlich' : formData.tone === 'advisory' ? 'Beratend' : 'Verkaufsorientiert'}

Erstelle eine verbesserte, SEO-optimierte Version dieses Abschnitts.`;

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
        temperature: 0.7,
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
    const regeneratedContent = data.choices[0].message.content;

    console.log('Successfully regenerated section');

    return new Response(JSON.stringify({ regeneratedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in regenerate-section function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
