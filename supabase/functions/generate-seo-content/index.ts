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
  const addressMap: Record<string, string> = {
    du: "Verwende durchgehend die Du-Form (du, dich, dein). Sprich den Leser direkt und persönlich an.",
    sie: "Verwende durchgehend die Sie-Form (Sie, Ihnen, Ihr). Bleibe höflich und förmlich.",
    neutral: "Vermeide direkte Anrede. Schreibe neutral und sachlich ohne 'du' oder 'Sie'."
  };
  const addressStyle = addressMap[formData.formOfAddress || 'du'] || addressMap.du;
  
  // Choose prompt based on content strategy
  if (formData.contentStrategy === 'creative') {
    return buildCreativePrompt(formData, addressStyle);
  } else {
    return buildHybridPrompt(formData, addressStyle);
  }
}

function buildCreativePrompt(formData: any, addressStyle: string): string {
  const wordTarget = formData.contentLength === 'short' ? '800-1200' : formData.contentLength === 'medium' ? '1500-2000' : '2500-3500';
  
  const blockFormatAddition = formData.productPageBlocks ? `

# PRODUKTSEITEN-BLOCK-FORMAT

Du erstellst Content für ein spezifisches Produktseiten-Layout mit folgenden Elementen:

1. **Einführungstext** (100-150 Wörter): Kurzer, prägnanter Text der das Produkt vorstellt
2. **Tags** (5-8 Stück): Kurze Eigenschaften/Merkmale als Keywords (z.B. "sonnengereift", "Fair Trade", "bio", etc.)
3. **Content-Blöcke** (4-6 Blöcke): Jeder Block hat:
   - Überschrift (H2)
   - Bildposition (alternierend links/rechts)
   - Bildbeschreibung für Alt-Text
   - Text (200-300 Wörter)
4. **Gegenüberstellungs-Blöcke** (2 Blöcke): Zwei gleichwertige Blöcke nebeneinander mit:
   - Titel
   - Text (150-200 Wörter)

Die Blöcke sollten visuell und inhaltlich ausgewogen sein.` : '';
  
  return `Du bist ein medizinischer Content-Experte. Schreibe begeisternde, wissenschaftlich fundierte Texte.

Erstelle einen vollständigen SEO-Text mit ${wordTarget} Wörtern.${blockFormatAddition}

# SCHREIBPHILOSOPHIE

Denke vom Großen zum Kleinen:
1. **WARUM** - Welches Problem? Welche Vision?
2. **WIE** - Wie funktioniert die Lösung? Welche Wissenschaft?
3. **WAS** - Konkrete Produkte, Anwendungen, Details

# ZIELGRUPPE

${formData.targetAudience === 'endCustomers' ? 
`Endkunden: Verständlich, begeisternd, mit Studien belegt ("Studien 2024 zeigen...")` : 
`Physiotherapeuten: Fachlich, mit 4-6 Studien korrekt zitiert ("Müller et al. 2024, RCT, n=156"), Outcomes konkret ("VAS 6,8→2,4, p<0,001")`}

# STIL

- Natürlich und lebendig schreiben
- Satzlänge variieren
- Gedankenstriche nutzen – für Einschübe
- Begeisterung zeigen: "Faszinierend ist..."
- Kompakte Praxisbeispiele
- Keine "Erstens, Zweitens"-Aufzählungen

# SEO

Fokus-Keyword "${formData.focusKeyword}":
- In H1 (am Anfang)
- Im ersten Absatz
- In 2-3 H2-Überschriften
- Natürlich eingebunden

Struktur:
- H1 (60 Zeichen)
- 5-7 H2-Abschnitte mit ausführlichem Fließtext
- Listen und Tabellen
- FAQ (5-7 Fragen)

# NUR ECHTE DATEN

Keine erfundenen Studien, Produktnamen oder Zahlen. Bei fehlenden Infos allgemein schreiben.

# TONALITÄT

${addressStyle}

# AUSGABE

Antworte als JSON. Escape alle Sonderzeichen korrekt (Zeilenumbrüche als \\n, Anführungszeichen als \\"):

{
  "seoText": "Vollständiger HTML-Text mit h1, h2, h3, p, ul, ol, table",
  "faq": [{"question": "...", "answer": "..."}],
  "title": "Title max 60 Zeichen",
  "metaDescription": "Description max 155 Zeichen",
  "internalLinks": [{"url": "...", "anchorText": "..."}],
  "technicalHints": "Schema.org Empfehlungen",
  "eeatScore": {
    "experience": 8,
    "expertise": 9,
    "authoritativeness": 7,
    "trustworthiness": 9,
    "overall": 8,
    "improvements": ["..."]
  }${formData.productPageBlocks ? `,
  "productPageBlocks": {
    "introText": "Einführungstext 100-150 Wörter",
    "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
    "contentBlocks": [
      {
        "heading": "Überschrift des Blocks",
        "imagePosition": "left",
        "imageAlt": "Beschreibung für Bildalternativtext",
        "content": "Text 200-300 Wörter"
      }
    ],
    "comparisonBlocks": [
      {"title": "Thema A", "content": "Text 150-200 Wörter"},
      {"title": "Thema B", "content": "Text 150-200 Wörter"}
    ]
  }` : ''}${formData.complianceCheck ? ',\n  "qualityReport": {"status": "green", "flags": [], "evidenceTable": []}' : ''}${formData.productComparisonEnabled ? ',\n  "productComparison": "<table>...</table>"' : ''}
}

Schreibe jetzt den vollständigen Text: WARUM → WIE → WAS.`;
}
function buildHybridPrompt(formData: any, addressStyle: string): string {
  const wordTarget = formData.contentLength === 'short' ? '1000-1500' : formData.contentLength === 'medium' ? '1800-2500' : '3000-4000';
  
  const blockFormatAddition = formData.productPageBlocks ? `

# PRODUKTSEITEN-BLOCK-FORMAT

Du erstellst Content für ein spezifisches Produktseiten-Layout mit folgenden Elementen:

1. **Einführungstext** (100-150 Wörter): Kurzer, prägnanter Text der das Produkt vorstellt
2. **Tags** (5-8 Stück): Kurze Eigenschaften/Merkmale als Keywords
3. **Content-Blöcke** (4-6 Blöcke): Jeder Block hat:
   - Überschrift (H2)
   - Bildposition (alternierend links/rechts)
   - Bildbeschreibung für Alt-Text
   - Text (200-300 Wörter)
4. **Gegenüberstellungs-Blöcke** (2 Blöcke): Zwei Blöcke nebeneinander mit Titel und Text (150-200 Wörter)

Die Blöcke sollten visuell und inhaltlich ausgewogen sein.` : '';
  
  return `Du bist Experte für medizinische SEO-Texte. Schreibe strukturiert und wissenschaftlich fundiert.

Erstelle einen vollständigen SEO-Text mit ${wordTarget} Wörtern Fließtext.${blockFormatAddition}

# PRIORITÄTEN

1. Vollständige Absätze schreiben (keine Headlines ohne Text)
2. SEO-Struktur einhalten
3. ${formData.targetAudience === 'physiotherapists' ? 'Mindestens 4-6 Studien zitieren' : 'Studien erwähnen'}
4. Konkrete Kaufberatung

# SEO-ANFORDERUNGEN

Fokus-Keyword "${formData.focusKeyword}":
- H1: Keyword am Anfang
- Erster Absatz: Keyword in ersten 100 Wörtern
- 2-3 H2-Überschriften mit Keyword
- Meta-Title und Description mit Keyword

Struktur:
- H1 (60-70 Zeichen)
- 5-7 H2-Abschnitte, jeder mit 300-700 Wörtern Fließtext
- 3-4 Listen
- 1-2 Tabellen
- FAQ (5-7 Fragen)

# WISSENSCHAFT

${formData.targetAudience === 'endCustomers' ? 
`Für Endkunden: Studien verständlich erwähnen, keine Fachbegriffe` : 
`Für Physiotherapeuten: Min. 4-6 Studien korrekt zitieren ("Autor et al. Jahr, RCT, n=Anzahl"), Evidenz-Level nennen, konkrete Outcomes ("VAS 6,8±1,2→2,4±0,9, p<0,001"), Fachterminologie nutzen (ICD-10, ICF, Scores)`}

# STRUKTUR

Produktseiten:
1. Was ist [Produkt]? (400-600 Wörter)
2. Wissenschaftliche Evidenz (500-800 Wörter)
3. Praxisanwendung (450-650 Wörter)
4. Varianten-Vergleich (350-500 Wörter)
5. Für wen geeignet? (300-450 Wörter)
6. FAQ

Kategorieseiten:
1. Definition (300-450 Wörter)
2. Technologie (500-700 Wörter)
3. Wissenschaftliche Evidenz (600-900 Wörter)
4. Auswahlkriterien (450-600 Wörter)
5. Hersteller-Überblick (400-550 Wörter)
6. Praxisintegration (350-500 Wörter)
7. FAQ

# STIL

- Satzlänge variieren
- Gedankenstriche nutzen
- Keine "Erstens, Zweitens"
- Kompakte Praxisbeispiele

# NUR ECHTE DATEN

Keine erfundenen Studien, Autoren, Produktnamen. Bei fehlenden Daten allgemein schreiben.

# TONALITÄT

${addressStyle}
Professionell, faktenbasiert, ehrlich.

# AUSGABE

JSON mit korrekt escapeten Sonderzeichen (\\n für Zeilenumbrüche, \\" für Anführungszeichen):

{
  "seoText": "HTML-Text mit h1, h2, h3, p, ul, ol, table",
  "faq": [{"question": "...", "answer": "..."}],
  "title": "Max 60 Zeichen",
  "metaDescription": "Max 155 Zeichen",
  "internalLinks": [{"url": "...", "anchorText": "..."}],
  "technicalHints": "Schema.org Empfehlungen",
  "eeatScore": {
    "experience": 8,
    "expertise": 9,
    "authoritativeness": 7,
    "trustworthiness": 9,
    "overall": 8,
    "improvements": ["..."]
  }${formData.productPageBlocks ? `,
  "productPageBlocks": {
    "introText": "Einführungstext 100-150 Wörter",
    "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
    "contentBlocks": [
      {
        "heading": "Überschrift des Blocks",
        "imagePosition": "left",
        "imageAlt": "Beschreibung für Bildalternativtext",
        "content": "Text 200-300 Wörter"
      }
    ],
    "comparisonBlocks": [
      {"title": "Thema A", "content": "Text 150-200 Wörter"},
      {"title": "Thema B", "content": "Text 150-200 Wörter"}
    ]
  }` : ''}${formData.complianceCheck ? ',\n  "qualityReport": {"status": "green", "flags": [], "evidenceTable": []}' : ''}${formData.productComparisonEnabled ? ',\n  "productComparison": "<table>...</table>"' : ''}
}

Schreibe jetzt den vollständigen SEO-Text mit allen Abschnitten.`;
}

function buildUserPrompt(formData: any): string {
  const lengthMap = {
    short: '800-1200 Wörter',
    medium: '1500-2000 Wörter',
    long: '2500-3500+ Wörter'
  };

  const goalMap = {
    inform: 'Informieren',
    advise: 'Beraten und Kaufentscheidung vorbereiten',
    preparePurchase: 'Kaufentscheidung herbeiführen',
    triggerPurchase: 'Direkter Kaufabschluss'
  };

  const toneMap = {
    factual: 'Sachlich und evidenzbasiert',
    advisory: 'Beratend und empfehlend',
    sales: 'Verkaufsorientiert aber ehrlich'
  };

  return `
# AUFTRAG

**Seitentyp**: ${formData.pageType === 'category' ? 'KATEGORIESEITE' : 'PRODUKTSEITE'}
**Zielgruppe**: ${formData.targetAudience === 'endCustomers' ? 'Endkunden (verständlich aber fundiert)' : 'Physiotherapeuten (wissenschaftlich & praxisnah)'}
**Fokus-Keyword**: ${formData.focusKeyword} (PFLICHT in H1, ersten 100 Wörtern, 2-3 H2s)
${formData.secondaryKeywords.length > 0 ? `**Sekundär-Keywords (LSI)**: ${formData.secondaryKeywords.join(', ')}` : ''}

**Textlänge**: ${lengthMap[formData.contentLength as keyof typeof lengthMap]}
**Ziel**: ${goalMap[formData.pageGoal as keyof typeof goalMap]}
**Tonalität**: ${toneMap[formData.tone as keyof typeof toneMap]}

---

# HERSTELLERINFORMATIONEN (NUR DIESE DATEN VERWENDEN!)

${formData.manufacturerName ? `**Hersteller**: ${formData.manufacturerName}` : ''}
${formData.manufacturerWebsite ? `**Website**: ${formData.manufacturerWebsite}` : ''}

${formData.manufacturerInfo ? `**Herstellerinfos**:
${formData.manufacturerInfo}` : ''}

${formData.additionalInfo ? `**Zusätzliche Informationen/USPs**:
${formData.additionalInfo}` : ''}

${formData.internalLinks ? `**Interne Linkziele**:
${formData.internalLinks}` : ''}

${formData.faqInputs ? `**FAQ-Vorschläge**:
${formData.faqInputs}` : ''}

---

# WICHTIGSTE ANWEISUNGEN

⚠️ **ABSOLUTE PRIORITÄT NR. 1: VOLLSTÄNDIGE TEXTE SCHREIBEN!**
- NIEMALS nur Headlines oder Stichpunkte generieren
- Jeder Abschnitt braucht MEHRERE ABSÄTZE vollständigen Fließtext
- Die angegebene Wortanzahl (${lengthMap[formData.contentLength as keyof typeof lengthMap]}) muss erreicht werden!

1. **VOLLSTÄNDIGER CONTENT**: Schreibe ausführlich, tiefgehend, mit echtem Mehrwert
2. **SEO FIRST**: Fokus-Keyword gemäß Vorgaben platzieren, Textlänge einhalten
3. **WISSENSCHAFT FIRST** (für Physios): Minimum 3-5 Studienreferenzen mit korrekter Zitierweise
4. **KONKRETE KAUFBERATUNG**: Klare Empfehlungen für verschiedene Szenarien
5. **NUR ECHTE DATEN**: Ausschließlich Infos aus den Herstellerangaben oben verwenden
6. **STRUKTURIERT**: Listen, Tabellen, klare H-Hierarchie für Featured Snippets

${formData.complianceCheck ? `
**COMPLIANCE AKTIV**: 
${[formData.checkMDR && 'MDR/MPDG', formData.checkHWG && 'HWG', formData.checkStudies && 'Studien-Validierung'].filter(Boolean).join(', ')}
Prüfe alle Claims auf Zulässigkeit!` : ''}

Erstelle einen SEO-optimierten, wissenschaftlich fundierten Text der rankt UND überzeugt!
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
    } : undefined,
    productComparison: formData.productComparisonEnabled 
      ? '<h2>Produktvergleich</h2><p>Produktvergleich konnte nicht vollständig generiert werden.</p>' 
      : undefined
  };
}
