import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const buildSystemPrompt = (extractedData: any, domainKnowledge: any) => {
  const tonalityInstructions: Record<string, string> = {
    'expert-mix': `Tonalität: Expertenmix (70% Fachwissen, 20% Lösung, 10% Story)
- 70% des Textes: Tiefgehende Fachbegriffe, technische Details, Branchenwissen
- 20%: Konkrete Lösungsvorschläge und praktische Anwendungen
- 10%: Kurze Anekdoten oder Praxisbeispiele zur Auflockerung`,
    'consultant-mix': `Tonalität: Beratermix (40% Fachwissen, 40% Lösung, 20% Story)
- 40%: Fundiertes Fachwissen, aber verständlich erklärt
- 40%: Ausführliche Lösungswege und Handlungsempfehlungen
- 20%: Nachvollziehbare Geschichten und Beispiele`,
    'storytelling-mix': `Tonalität: Storytelling-Mix (30% Fachwissen, 30% Lösung, 40% Story)
- 30%: Wichtige Fakten und Informationen
- 30%: Lösungsansätze eingebettet in Narrativ
- 40%: Emotionale Geschichten, Kundenerlebnisse, Szenarien`,
    'conversion-mix': `Tonalität: Conversion-Mix (20% Fachwissen, 60% Lösung, 20% Story)
- 20%: Nur die wichtigsten technischen Fakten
- 60%: Starker Fokus auf Nutzen, Vorteile, Call-to-Actions
- 20%: Überzeugende Beispiele und Social Proof`,
    'balanced-mix': `Tonalität: Balanced-Mix (33% Fachwissen, 33% Lösung, 33% Story)
- Gleichmäßige Verteilung aller drei Elemente
- Vielseitiger, ausgewogener Ansatz`,
  };

  const addressForm = extractedData.formOfAddress === 'du' 
    ? 'Verwende die Du-Anrede (locker, modern, direkt)'
    : 'Verwende die Sie-Anrede (formell, professionell, respektvoll)';

  const headingInstructions: Record<string, string> = {
    'h2-only': 'Verwende nur H2-Überschriften für die Hauptabschnitte.',
    'h2-h3': 'Verwende H2 für Hauptabschnitte und H3 für Unterabschnitte.',
    'h2-h3-h4': 'Verwende H2 für Hauptabschnitte, H3 für Unterabschnitte und H4 für Details.',
  };

  return `Du bist ein professioneller SEO-Texter. Erstelle hochwertigen, SEO-optimierten Content basierend auf den folgenden Vorgaben.

=== INHALTLICHE VORGABEN ===
Seitentyp: ${extractedData.pageType || 'Allgemein'}
Fokus-Keyword: ${extractedData.focusKeyword || 'Nicht definiert'}
Sekundäre Keywords: ${extractedData.secondaryKeywords?.join(', ') || 'Keine'}
Suchintention: ${extractedData.searchIntent?.join(', ') || 'Informational'}
W-Fragen: ${extractedData.wQuestions?.join(', ') || 'Keine spezifischen'}

=== ZIELGRUPPE ===
Typ: ${extractedData.audienceType || 'B2C'}
${addressForm}
Sprache: ${extractedData.language === 'en' ? 'Englisch' : extractedData.language === 'fr' ? 'Französisch' : 'Deutsch'}

=== STIL & STRUKTUR ===
${tonalityInstructions[extractedData.tonality] || tonalityInstructions['balanced-mix']}

Textlänge: ca. ${extractedData.wordCount || '1000'} Wörter
${headingInstructions[extractedData.headingStructure] || headingInstructions['h2-h3']}

Keyword-Dichte: ${extractedData.keywordDensity === 'high' ? 'Hoch (2-3%)' : 'Normal (1-2%)'}
${extractedData.includeIntro ? 'Beginne mit einer einleitenden Zusammenfassung.' : ''}
${extractedData.includeFAQ ? 'Füge am Ende einen FAQ-Bereich mit 3-5 relevanten Fragen hinzu.' : ''}

=== PRODUKT/MARKE ===
Marke: ${extractedData.brandName || 'Nicht angegeben'}
Produkt: ${extractedData.productName || 'Nicht angegeben'}
USPs: ${extractedData.usps?.join(', ') || 'Keine spezifischen'}
Zusätzliche Infos: ${extractedData.productInfo || 'Keine'}
Seitenziel/CTA: ${extractedData.pageGoal || 'Nicht definiert'}

${domainKnowledge ? `
=== UNTERNEHMENS-KONTEXT ===
Unternehmen: ${domainKnowledge.companyName || 'Unbekannt'}
Branche: ${domainKnowledge.industry || 'Unbekannt'}
Zielgruppe: ${domainKnowledge.targetAudience || 'Unbekannt'}
Brand Voice: ${domainKnowledge.brandVoice || 'Neutral'}
` : ''}

=== AUSGABE-FORMAT ===
Gib den Content im folgenden JSON-Format zurück:
{
  "metaTitle": "SEO-optimierter Titel (max 60 Zeichen)",
  "metaDescription": "Ansprechende Meta-Beschreibung (max 160 Zeichen)",
  "mainContent": "Der Hauptinhalt in Markdown-Format mit # für H1, ## für H2, ### für H3, **fett** für wichtige Begriffe",
  "faq": [{"question": "Frage 1", "answer": "Antwort 1"}, ...]
}

WICHTIGE REGELN:
1. Integriere das Fokus-Keyword natürlich in Titel, erste 100 Wörter und Überschriften
2. Verwende aktive Sprache und kurze Sätze (max. 20 Wörter)
3. Absätze maximal 300 Wörter
4. Nutze Aufzählungen für bessere Lesbarkeit
5. Beantworte die W-Fragen im Text
6. Der Content muss einzigartig und mehrwertig sein
7. GEBE NUR VALIDES JSON ZURÜCK, KEINEN ANDEREN TEXT!`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedData, domainKnowledge } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating content with data:', JSON.stringify(extractedData, null, 2));

    const systemPrompt = buildSystemPrompt(extractedData, domainKnowledge);

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
          { role: 'user', content: 'Generiere jetzt den SEO-Content basierend auf allen Vorgaben. Antworte NUR mit validem JSON.' }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit erreicht. Bitte versuche es in einer Minute erneut.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI-Credits aufgebraucht. Bitte Guthaben aufladen.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const contentText = data.choices?.[0]?.message?.content || '';
    
    console.log('Raw AI response:', contentText);

    // Parse JSON from response
    let generatedContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: create structured content from raw text
      generatedContent = {
        metaTitle: extractedData.focusKeyword || 'SEO Content',
        metaDescription: `Erfahren Sie alles über ${extractedData.focusKeyword || 'dieses Thema'}`,
        mainContent: contentText,
        faq: []
      };
    }

    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
