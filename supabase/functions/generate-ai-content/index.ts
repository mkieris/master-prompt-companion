import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tonalität-Mix mit PRÄZISER Gewichtungssteuerung (identisch zum Pro-System)
const tonalityInstructions: Record<string, { description: string; weights: string; instructions: string }> = {
  'expert-mix': {
    description: "Expertenmix - Für B2B-Entscheider & wissenschaftliche Produkte",
    weights: "70% Fachwissen • 20% Lösungsorientierung • 10% Storytelling",
    instructions: `
## GEWICHTUNG MATHEMATISCH UMSETZEN:
Von 100 Sätzen im Text müssen sein:
- **70 Sätze (70%) = FACHWISSEN**: Fachterminologie, Studienzitate, technische Spezifikationen, Wirkprinzipien, Evidenz
- **20 Sätze (20%) = LÖSUNGSORIENTIERUNG**: "Das bewirkt...", "Dadurch können Sie...", Anwendungsfälle, ROI, Effizienz
- **10 Sätze (10%) = STORYTELLING**: Kurze Praxisbeispiele, "In der Klinik X...", sachliche Anwendungsszenarien

**KONKRETE UMSETZUNG:**
- Jeder Absatz: Min. 3 Fachbegriffe, 1 Evidenz/Studie, max. 1 Beispiel
- H2-Überschriften: Fachlich-präzise, nicht emotional
- Intro: Sofort mit Fachkontext starten

**TON:** Wissenschaftlich-autoritativ, wie Nature/Lancet. Zielgruppe: Experten mit Fachexpertise.`
  },
  'consultant-mix': {
    description: "Beratermix - Für Vergleichsphase & Problem-aware Käufer",
    weights: "40% Fachwissen • 40% Lösungsorientierung • 20% Storytelling",
    instructions: `
## GEWICHTUNG MATHEMATISCH UMSETZEN:
Von 100 Sätzen im Text müssen sein:
- **40 Sätze (40%) = FACHWISSEN**: Fundiertes Wissen, aber verständlich erklärt. Fachbegriffe + Klammererklärung
- **40 Sätze (40%) = LÖSUNGSORIENTIERUNG**: "Sie sparen...", "Das löst...", Nutzenargumente, Vergleiche
- **20 Sätze (20%) = STORYTELLING**: Fallbeispiele, "Kunde X hatte Y, jetzt Z", Vorher-Nachher

**KONKRETE UMSETZUNG:**
- Jeder Absatz: 2 Fach-Aussagen + 2 Nutzen-Aussagen + max. 1 Fallbeispiel
- H2-Überschriften: Mix aus "Was ist X?" und "Was bringt X?"

**TON:** Beratend-kompetent, wie ein Consultant. Zielgruppe: Entscheider im Vergleichsmodus.`
  },
  'storytelling-mix': {
    description: "Storytelling-Mix - Für emotional getriebene Käufe & Lifestyle",
    weights: "30% Fachwissen • 30% Lösungsorientierung • 40% Storytelling",
    instructions: `
## GEWICHTUNG MATHEMATISCH UMSETZEN:
Von 100 Sätzen im Text müssen sein:
- **30 Sätze (30%) = FACHWISSEN**: In Geschichten verpackt. "Die Technologie nutzt..., was bedeutet..."
- **30 Sätze (30%) = LÖSUNGSORIENTIERUNG**: Transformation zeigen. "Stell dir vor...", "Dein Alltag wird..."
- **40 Sätze (40%) = STORYTELLING**: DOMINANZ! Nutzer-Geschichten, sensorische Sprache, emotionale Bilder

**KONKRETE UMSETZUNG:**
- Jeder Absatz STARTET mit Story oder Bild, dann Fakten einstreuen
- Intro: IMMER mit emotionalem Szenario beginnen
- Sprache: "Du fühlst...", "Stell dir vor...", "Erlebe...", viele Adjektive

**TON:** Emotional-inspirierend, wie Lifestyle-Magazine. Zielgruppe: Emotionale Käufer.`
  },
  'conversion-mix': {
    description: "Conversion-Mix - Für Produktseiten & klare Problemlösungen",
    weights: "20% Fachwissen • 60% Lösungsorientierung • 20% Storytelling",
    instructions: `
## GEWICHTUNG MATHEMATISCH UMSETZEN:
Von 100 Sätzen im Text müssen sein:
- **20 Sätze (20%) = FACHWISSEN**: Minimal! Nur zur Glaubwürdigkeit. "Zertifiziert nach...", kurz
- **60 Sätze (60%) = LÖSUNGSORIENTIERUNG**: DOMINANZ! "Sie sparen 30%", "In 5 Minuten einsatzbereit", jeder Satz = Nutzen!
- **20 Sätze (20%) = STORYTELLING**: Erfolgsbeweise. "1000+ Kunden", kurz & knackig

**KONKRETE UMSETZUNG:**
- JEDER Absatz endet mit Nutzen oder CTA
- Bullet Points: Nur Vorteile, keine Features ohne Nutzen
- Überschriften: "Wie Sie damit...", "X Vorteile von...", aktionsorientiert

**TON:** Verkaufsstark, wie Top-Produktseiten (Apple). Zielgruppe: Kaufbereite Nutzer.`
  },
  'balanced-mix': {
    description: "Balanced-Mix - Für Landingpages & Kategorie-Seiten",
    weights: "33% Fachwissen • 33% Lösungsorientierung • 33% Storytelling",
    instructions: `
## GEWICHTUNG MATHEMATISCH UMSETZEN:
Von 100 Sätzen im Text müssen sein:
- **33 Sätze (33%) = FACHWISSEN**: Fundierte Infos, verständlich. Expertenzitate
- **33 Sätze (33%) = LÖSUNGSORIENTIERUNG**: Vielfältige Nutzenargumente, Anwendungsfälle
- **33 Sätze (33%) = STORYTELLING**: Mix aus Fallbeispielen & Emotionen

**KONKRETE UMSETZUNG:**
- Jeder Absatz: 1 Fach-Aussage + 1 Nutzen-Aussage + 1 Story/Beispiel
- Abwechslung: Fach → Nutzen → Story im Wechsel

**TON:** Ausgewogen-vielseitig, spricht alle Käufertypen an.`
  }
};

const buildSystemPrompt = (extractedData: any, domainKnowledge: any, competitorInsights: any) => {
  const addressForm = extractedData.formOfAddress === 'du' 
    ? 'Verwende die Du-Anrede (du, dich, dein) - locker, modern, direkt'
    : 'Verwende die Sie-Anrede (Sie, Ihnen, Ihr) - formell, professionell, respektvoll';

  const headingInstructions: Record<string, string> = {
    'h2-only': 'Verwende nur H2-Überschriften (##) für die Hauptabschnitte.',
    'h2-h3': 'Verwende H2 (##) für Hauptabschnitte und H3 (###) für Unterabschnitte.',
    'h2-h3-h4': 'Verwende H2 (##) für Hauptabschnitte, H3 (###) für Unterabschnitte und H4 (####) für Details.',
  };

  const tonalityConfig = tonalityInstructions[extractedData.tonality] || tonalityInstructions['balanced-mix'];

  const wordCountTargets: Record<string, string> = {
    '500': '450-550 Wörter',
    '800': '750-850 Wörter',
    '1000': '950-1050 Wörter',
    '1500': '1400-1600 Wörter',
    '2000': '1900-2100 Wörter',
    '3000': '2800-3200 Wörter',
  };

  const searchIntentInstructions = (extractedData.searchIntent || []).map((intent: string) => {
    switch(intent) {
      case 'know': return '- KNOW: Beantworte Informationsfragen umfassend, erkläre Zusammenhänge';
      case 'do': return '- DO: Gib Handlungsanleitungen, Schritt-für-Schritt-Guides';
      case 'buy': return '- BUY: Fokussiere auf Kaufentscheidungshilfen, Vergleiche, Vorteile';
      case 'go': return '- GO: Navigationsunterstützung, klare Wegweiser zu Angeboten';
      default: return '';
    }
  }).filter(Boolean).join('\n');

  // Build competitor insights section
  let competitorSection = '';
  if (competitorInsights && (competitorInsights.topKeywords?.length > 0 || competitorInsights.bestPractices?.length > 0)) {
    competitorSection = `
═══════════════════════════════════════════════════════════════════════
                     WETTBEWERBER-ANALYSE INSIGHTS
═══════════════════════════════════════════════════════════════════════

Diese Erkenntnisse stammen aus der Analyse von ${competitorInsights.competitorCount || 'mehreren'} Wettbewerbern.
NUTZE diese Insights, um BESSEREN Content als die Konkurrenz zu erstellen!

${competitorInsights.topKeywords?.length > 0 ? `
WICHTIGE KEYWORDS DER KONKURRENZ (integriere wo sinnvoll):
${competitorInsights.topKeywords.slice(0, 10).map((kw: string) => `• ${kw}`).join('\n')}
` : ''}

${competitorInsights.avgWordCount ? `
Ø TEXTLÄNGE DER KONKURRENZ: ${competitorInsights.avgWordCount} Wörter
→ Erstelle mindestens gleichwertig umfangreichen Content!
` : ''}

${competitorInsights.uspPatterns?.length > 0 ? `
USP-MUSTER DER KONKURRENZ (differenziere dich davon):
${competitorInsights.uspPatterns.slice(0, 5).map((usp: string) => `• ${usp}`).join('\n')}
→ Finde EIGENE, BESSERE Argumente!
` : ''}

${competitorInsights.bestPractices?.length > 0 ? `
BEST PRACTICES ZUM ÜBERNEHMEN:
${competitorInsights.bestPractices.slice(0, 5).map((bp: string) => `✓ ${bp}`).join('\n')}
` : ''}

${competitorInsights.contentStrategies?.length > 0 ? `
CONTENT-STRATEGIEN DER KONKURRENZ:
${competitorInsights.contentStrategies.slice(0, 3).map((cs: string) => `• ${cs}`).join('\n')}
` : ''}
`;
  }

  return `Du bist ein ELITE SEO-Content-Stratege mit 15+ Jahren Erfahrung. Du erstellst Content, der auf Seite 1 rankt.

═══════════════════════════════════════════════════════════════════════
                        TONALITÄT & GEWICHTUNG
═══════════════════════════════════════════════════════════════════════

## ${tonalityConfig.description}
### GEWICHTUNG: ${tonalityConfig.weights}

${tonalityConfig.instructions}

═══════════════════════════════════════════════════════════════════════
                          INHALTLICHE VORGABEN
═══════════════════════════════════════════════════════════════════════

SEITENTYP: ${extractedData.pageType || 'Allgemein'}
FOKUS-KEYWORD: "${extractedData.focusKeyword || 'Nicht definiert'}"
SEKUNDÄRE KEYWORDS: ${(extractedData.secondaryKeywords || []).join(', ') || 'Keine'}

SUCHINTENTION:
${searchIntentInstructions || '- Nicht spezifiziert'}

W-FRAGEN ZU BEANTWORTEN:
${(extractedData.wQuestions || []).map((q: string) => `- ${q}`).join('\n') || '- Keine spezifischen'}

═══════════════════════════════════════════════════════════════════════
                           ZIELGRUPPE & STIL
═══════════════════════════════════════════════════════════════════════

ZIELGRUPPE: ${extractedData.audienceType || 'B2C'}
${addressForm}
SPRACHE: ${extractedData.language === 'en' ? 'Englisch' : extractedData.language === 'fr' ? 'Französisch' : 'Deutsch'}

═══════════════════════════════════════════════════════════════════════
                          TEXTSTRUKTUR
═══════════════════════════════════════════════════════════════════════

TEXTLÄNGE: ${wordCountTargets[extractedData.wordCount] || 'ca. 1000 Wörter'}
${headingInstructions[extractedData.headingStructure] || headingInstructions['h2-h3']}

KEYWORD-DICHTE: ${extractedData.keywordDensity === 'high' ? 'Hoch (2-3%) - Fokus-Keyword häufiger einsetzen' : 'Normal (1-2%) - Natürliche Keyword-Integration'}

EINLEITUNG: ${extractedData.includeIntro !== false ? 'JA - Beginne mit einer packenden Einleitung (80-120 Wörter), die das Fokus-Keyword enthält' : 'NEIN - Direkt zum ersten Hauptabschnitt'}

FAQ-BEREICH: ${extractedData.includeFAQ !== false ? 'JA - Füge am Ende 4-6 relevante FAQs hinzu, die W-Fragen beantworten' : 'NEIN - Kein separater FAQ-Bereich'}

═══════════════════════════════════════════════════════════════════════
                       PRODUKT/MARKEN-KONTEXT
═══════════════════════════════════════════════════════════════════════

MARKE/UNTERNEHMEN: ${extractedData.brandName || 'Nicht angegeben'}
PRODUKT/THEMA: ${extractedData.productName || 'Nicht angegeben'}

USPs (ALLEINSTELLUNGSMERKMALE):
${(extractedData.usps || []).map((usp: string) => `✓ ${usp}`).join('\n') || '- Keine spezifischen USPs'}

ZUSÄTZLICHE INFOS: ${extractedData.productInfo || 'Keine'}
SEITENZIEL/CTA: ${extractedData.pageGoal || 'Nicht definiert'}

${domainKnowledge ? `
═══════════════════════════════════════════════════════════════════════
                     UNTERNEHMENS-KONTEXT (Domain Learning)
═══════════════════════════════════════════════════════════════════════

UNTERNEHMEN: ${domainKnowledge.companyName || 'Unbekannt'}
BRANCHE: ${domainKnowledge.industry || 'Unbekannt'}
ZIELGRUPPE: ${domainKnowledge.targetAudience || 'Unbekannt'}
BRAND VOICE: ${domainKnowledge.brandVoice || 'Neutral'}

→ Integriere dieses Wissen NATÜRLICH in den Text!
` : ''}

${competitorSection}

═══════════════════════════════════════════════════════════════════════
                          SEO-QUALITÄTSREGELN
═══════════════════════════════════════════════════════════════════════

1. FOKUS-KEYWORD PLATZIERUNG:
   - Im H1/Titel (erste 60 Zeichen)
   - In der Meta-Description
   - In den ersten 100 Wörtern
   - In mindestens einer H2-Überschrift
   - Im letzten Absatz/CTA

2. LESBARKEIT:
   - Sätze max. 20 Wörter im Durchschnitt
   - Absätze max. 150 Wörter (ca. 5 Sätze)
   - Aktive Sprache verwenden (nicht: "wird gemacht", sondern: "macht")
   - Füllwörter vermeiden (eigentlich, sozusagen, gewissermaßen)
   - Aufzählungen für bessere Scanbarkeit

3. E-E-A-T SIGNALE:
   - Zeige Expertise durch Fachwissen
   - Zeige Erfahrung durch Praxisbeispiele
   - Zeige Autorität durch Daten/Studien
   - Zeige Vertrauenswürdigkeit durch Transparenz

═══════════════════════════════════════════════════════════════════════
                          AUSGABE-FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════

Gib den Content AUSSCHLIESSLICH im folgenden JSON-Format zurück:

{
  "metaTitle": "SEO-Titel mit Fokus-Keyword (max 60 Zeichen)",
  "metaDescription": "Packende Meta-Beschreibung mit CTA (max 155 Zeichen)",
  "mainContent": "Hauptinhalt in Markdown (# für H1, ## für H2, ### für H3, **fett**, - für Listen)",
  "faq": [
    {"question": "W-Frage 1?", "answer": "Ausführliche Antwort (50-80 Wörter)"},
    {"question": "W-Frage 2?", "answer": "Ausführliche Antwort"}
  ]
}

⚠️ WICHTIG: Gib NUR valides JSON zurück, KEINEN anderen Text!`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedData, domainKnowledge, competitorInsights } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('=== GENERATE AI CONTENT ===');
    console.log('PageType:', extractedData.pageType);
    console.log('Tonality:', extractedData.tonality);
    console.log('FocusKeyword:', extractedData.focusKeyword);
    console.log('WordCount:', extractedData.wordCount);
    console.log('Audience:', extractedData.audienceType);
    console.log('Has competitor insights:', !!competitorInsights);

    const systemPrompt = buildSystemPrompt(extractedData, domainKnowledge, competitorInsights || null);

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
          { role: 'user', content: `Generiere jetzt den SEO-Content für "${extractedData.focusKeyword || extractedData.productName || 'das Thema'}".

CHECKLISTE VOR AUSGABE:
☐ Tonalitäts-Gewichtung eingehalten?
☐ Textlänge erreicht?
☐ Fokus-Keyword optimal platziert?
☐ W-Fragen beantwortet?
☐ USPs integriert?
☐ CTA eingebaut?

Antworte NUR mit validem JSON.` }
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
    
    console.log('Raw AI response length:', contentText.length);

    // Parse JSON from response
    let generatedContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed JSON content');
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: create structured content from raw text
      generatedContent = {
        metaTitle: `${extractedData.focusKeyword || 'SEO Content'} - Umfassender Ratgeber`,
        metaDescription: `Erfahren Sie alles über ${extractedData.focusKeyword || 'dieses Thema'}. Professionelle Informationen und praktische Tipps.`,
        mainContent: contentText,
        faq: []
      };
    }

    // Validate and enhance content quality
    const wordCount = generatedContent.mainContent?.split(/\s+/).length || 0;
    console.log('Generated content word count:', wordCount);

    // Post-generation quality checks
    const qualityIssues: string[] = [];
    
    // Check if meta title has keyword
    const keywordLower = (extractedData.focusKeyword || '').toLowerCase();
    if (keywordLower && !generatedContent.metaTitle?.toLowerCase().includes(keywordLower)) {
      qualityIssues.push('Meta-Title enthält nicht das Fokus-Keyword');
    }
    
    // Check meta lengths
    if ((generatedContent.metaTitle?.length || 0) > 60) {
      qualityIssues.push('Meta-Title überschreitet 60 Zeichen');
    }
    if ((generatedContent.metaDescription?.length || 0) > 160) {
      qualityIssues.push('Meta-Description überschreitet 160 Zeichen');
    }
    
    // Check word count against target
    const targetWordCount = parseInt(extractedData.wordCount || '1000');
    const wordCountDiff = Math.abs(wordCount - targetWordCount) / targetWordCount;
    if (wordCountDiff > 0.2) {
      qualityIssues.push(`Textlänge (${wordCount}) weicht >20% von Ziel (${targetWordCount}) ab`);
    }
    
    // Check keyword density
    if (keywordLower && generatedContent.mainContent) {
      const keywordMatches = (generatedContent.mainContent.toLowerCase().match(
        new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      ) || []).length;
      const density = (keywordMatches / wordCount) * 100;
      if (density < 0.5) {
        qualityIssues.push(`Keyword-Dichte zu niedrig (${density.toFixed(1)}%)`);
      } else if (density > 3.5) {
        qualityIssues.push(`Keyword-Dichte zu hoch (${density.toFixed(1)}%) - Risiko für Keyword-Stuffing`);
      }
    }
    
    // Check heading structure
    const h2Count = (generatedContent.mainContent?.match(/^## [^#]/gm) || []).length;
    if (h2Count < 2) {
      qualityIssues.push('Zu wenige H2-Überschriften für SEO-optimierte Struktur');
    }
    
    // Log quality issues for debugging
    if (qualityIssues.length > 0) {
      console.log('Content quality issues detected:', qualityIssues);
    }

    // Add quality metadata to response
    const responseData = {
      ...generatedContent,
      _meta: {
        wordCount,
        qualityIssues,
        generatedAt: new Date().toISOString(),
        parameters: {
          tonality: extractedData.tonality,
          wordCountTarget: extractedData.wordCount,
          focusKeyword: extractedData.focusKeyword,
        }
      }
    };

    return new Response(JSON.stringify(responseData), {
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
