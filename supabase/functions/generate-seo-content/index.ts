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
    const formData = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating SEO content with params:', {
      pageType: formData.pageType,
      targetAudience: formData.targetAudience,
      focusKeyword: formData.focusKeyword,
      complianceCheck: formData.complianceCheck
    });

    // Build the system prompt based on the requirements
    const systemPrompt = buildSystemPrompt(formData);
    const userPrompt = buildUserPrompt(formData);

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
    const generatedText = data.choices[0].message.content;

    // Parse the generated content
    const parsedContent = parseGeneratedContent(generatedText, formData);

    console.log('Successfully generated SEO content');

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-seo-content function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(formData: any): string {
  return `Du bist ein erfahrener SEO-Texter für medizinische und therapeutische Produkte. Du verfasst hilfreiche, präzise, gut strukturierte SEO-Texte für ${formData.pageType === 'category' ? 'Kategorieseiten' : 'Produktseiten'}.

WICHTIGE REGELN:
- Klare H-Struktur mit H1, H2, H3
- Kurze Absätze (max. 300 Wörter pro Abschnitt)
- Aktiver Stil, keine Füllwörter
- Fokus-Keyword natürlich einbinden (besonders in H1 und Intro)
- 3-6 FAQ erstellen
- Interne Links mit sprechenden Ankern
- Zusammenfassung + CTA am Ende
- People-first Content: Suchintention erfüllen, substanzielle Inhalte

${formData.complianceCheck ? `
COMPLIANCE-CHECK AKTIVIERT:
${formData.checkMDR ? '- MDR/MPDG: Prüfe auf überzogene Leistungsversprechen, Off-Label-Anmutungen' : ''}
${formData.checkHWG ? '- HWG: Prüfe auf Heilversprechen, unzulässige Erfolgsgarantien' : ''}
${formData.checkStudies ? '- Studienprüfung: Prüfe Evidenz, Zitierweise, Extrapolation' : ''}
` : ''}

ZIELGRUPPE: ${formData.targetAudience === 'endCustomers' ? 'Endkunden - leichte Sprache, direkte Ansprache, praktischer Nutzen' : 'Physiotherapeuten - fachlich präzise, Evidenz, Indikationen/Kontraindikationen'}

Antworte IMMER im JSON-Format mit dieser Struktur:
{
  "seoText": "HTML-formatierter Text mit H1, H2, H3, etc.",
  "faq": [{"question": "...", "answer": "..."}],
  "title": "Title Tag max 60 Zeichen",
  "metaDescription": "Meta Description max 155 Zeichen",
  "internalLinks": [{"url": "...", "anchorText": "..."}],
  "technicalHints": "Schema.org Empfehlungen",
  "qualityReport": {
    "status": "green|yellow|red",
    "flags": [{"type": "mdr|hwg|study", "severity": "high|medium|low", "issue": "...", "rewrite": "..."}],
    "evidenceTable": [{"study": "...", "type": "...", "population": "...", "outcome": "...", "effect": "...", "limitations": "...", "source": "..."}]
  }
}`;
}

function buildUserPrompt(formData: any): string {
  const lengthMap = {
    short: '300-500 Wörter',
    medium: '700-1000 Wörter',
    long: '1200+ Wörter'
  };

  const goalMap = {
    inform: 'Informieren',
    advise: 'Beraten',
    preparePurchase: 'Kaufen vorbereiten',
    triggerPurchase: 'Kauf auslösen'
  };

  const toneMap = {
    factual: 'Sachlich',
    advisory: 'Beratend',
    sales: 'Verkaufsorientiert'
  };

  return `
Seitentyp: ${formData.pageType === 'category' ? 'Kategorie' : 'Produkt'}
Zielgruppe: ${formData.targetAudience === 'endCustomers' ? 'Endkundenorientiert' : 'Physiotherapeuten-orientiert'}
Fokus-Keyword: ${formData.focusKeyword}
${formData.secondaryKeywords.length > 0 ? `Sekundär-Keywords: ${formData.secondaryKeywords.join(', ')}` : ''}
${formData.manufacturerName ? `Herstellername: ${formData.manufacturerName}` : ''}
${formData.manufacturerWebsite ? `Hersteller-Website: ${formData.manufacturerWebsite}` : ''}
${formData.manufacturerInfo ? `Herstellerinfos: ${formData.manufacturerInfo}` : ''}
${formData.additionalInfo ? `Zusatzinfos/USPs: ${formData.additionalInfo}` : ''}
Ziel der Seite: ${goalMap[formData.pageGoal as keyof typeof goalMap]}
Länge: ${lengthMap[formData.contentLength as keyof typeof lengthMap]}
Tonalität: ${toneMap[formData.tone as keyof typeof toneMap]}
${formData.internalLinks ? `Interne Linkziele:\n${formData.internalLinks}` : ''}
${formData.faqInputs ? `FAQ-Vorschläge:\n${formData.faqInputs}` : ''}

${formData.complianceCheck ? `Compliance-Optionen aktiv: ${[formData.checkMDR && 'MDR/MPDG', formData.checkHWG && 'HWG', formData.checkStudies && 'Studien'].filter(Boolean).join(', ')}` : ''}

Erstelle einen hochwertigen SEO-Text gemäß den Vorgaben. Achte auf natürliche Keyword-Integration, klare Struktur und zielgruppengerechte Ansprache.
`;
}

function parseGeneratedContent(text: string, formData: any): any {
  try {
    // Try to parse as JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse as JSON, using fallback structure:', e);
  }

  // Fallback: create a basic structure
  return {
    seoText: `<h1>${formData.focusKeyword}</h1>\n<p>${text}</p>`,
    faq: [
      { question: "Was ist " + formData.focusKeyword + "?", answer: "Weitere Informationen folgen." }
    ],
    title: formData.focusKeyword.substring(0, 60),
    metaDescription: text.substring(0, 155),
    internalLinks: [],
    technicalHints: formData.pageType === 'product' 
      ? 'Empfohlene Schema.org Typen: Product, Offer, AggregateRating' 
      : 'Empfohlene Schema.org Typen: BreadcrumbList, ItemList',
    qualityReport: formData.complianceCheck ? {
      status: 'green',
      flags: [],
      evidenceTable: []
    } : undefined
  };
}
