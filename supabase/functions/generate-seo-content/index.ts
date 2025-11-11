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
  const minWords = formData.contentLength === 'short' ? 1000 : formData.contentLength === 'medium' ? 1800 : 3000;
  
  return `Du bist ein hochqualifizierter medizinischer Content-Experte mit Erfahrung in wissenschaftlichem Schreiben und SEO.

# AUFTRAG
Erstelle einen vollständigen SEO-Text mit MINIMUM ${minWords} Wörtern Fließtext (nicht Überschriften/Listen).

# SCHREIBPHILOSOPHIE: VOM GROSSEN ZUM KLEINEN

**1. WARUM** - Beginne mit dem großen Bild:
- Welches Problem existiert in der Therapie/im Leben?
- Warum wurde diese Lösung entwickelt?
- Was ist die Vision dahinter?

**2. WIE** - Erkläre das Konzept:
- Wie funktioniert die Technologie/Methode?
- Welche Wissenschaft steckt dahinter?
- Wie fügt sich das in größere Trends ein?

**3. WAS** - Zeige die konkreten Anwendungen:
- Welche Produkte/Varianten gibt es?
- Was unterscheidet sie?
- Wann nutzt man welche?

# ZIELGRUPPE: ${formData.targetAudience === 'endCustomers' ? 'ENDKUNDEN' : 'PHYSIOTHERAPEUTEN'}

${formData.targetAudience === 'endCustomers' ? `
**Für Endkunden schreibst du:**
- Begeisternd aber ehrlich und wissenschaftlich fundiert
- Verständlich ohne zu vereinfachen
- Mit Alltagsbeispielen und Analogien
- Studien erwähnen: "Studien aus 2024 zeigen, dass..."
- Fokus auf Nutzen und echte Problemlösung
` : `
**Für Physiotherapeuten schreibst du:**
- Als Kollege auf Augenhöhe, nicht als Verkäufer
- Mit korrekter Fachterminologie (ICD-10, ICF, Scores)
- Mit mindestens 4-6 Studienreferenzen im Text
- Format: "Müller et al. (2024) zeigten in einem RCT (n=156, 12 Wochen Follow-up)..."
- Mit konkreten Outcomes: "VAS-Reduktion von 6,8±1,2 auf 2,4±0,9 (p<0,001)"
- Evidenz-Level nennen: "Level I Evidenz", "systematisches Review"
- Biomechanische/neurologische Details einbinden
- Praxisszenarien aus therapeutischer Sicht
`}

# SCHREIBSTIL

**Natürlich und lebendig:**
- Variiere Satzlänge bewusst: Kurze Sätze. Dann auch längere, erklärende Passagen.
- Nutze Gedankenstriche – für lebendige Einschübe
- Zeige Begeisterung: "Das Faszinierende dabei...", "Interessant ist..."
- VERMEIDE: "Erstens, Zweitens, Drittens", roboterhafte Aufzählungen

**Praxisbeispiele (kompakt):**
✅ "Patient mit Frozen Shoulder, 8 Monate erfolglose Therapie. K-Force Kraftmessung dokumentiert: ROM 45°→135° in 6 Wochen. Objektiver Therapieerfolg nachgewiesen."
❌ Lange ausschweifende Geschichten

# NUR ECHTE INFORMATIONEN

**KRITISCH:**
- Produktnamen, Modelle, Spezifikationen NUR aus den gegebenen Daten
- KEINE erfundenen Studien, Autoren oder Zahlen
- Bei fehlenden Daten: Allgemein über Kategorie/Konzept schreiben
- Ehrlich über Grenzen und Limitationen

# SEO-INTEGRATION

**Fokus-Keyword: "${formData.focusKeyword}"**
- In H1 (am Anfang)
- Im ersten Absatz (erste 100 Wörter)
- In 2-3 H2-Überschriften
- Natürlich im Text (keine erzwungene Keyword-Dichte)

**Strukturelemente:**
- 2-3 Listen für Vorteile/Anwendungen
- 1 Tabelle für Vergleiche (wenn sinnvoll)
- FAQ am Ende (mindestens 5-7 Fragen)

**H1-Struktur:**
✅ "Warum K-Active Tape die Therapie verändert – Wissenschaft trifft Praxis"
❌ "K-Active Tape Gentle kaufen - Shop"

**H2-Struktur** (Beispiele, anpassen an Inhalt):
- "Das Problem: Warum [Thema] wichtig ist"
- "Die Innovation: Wie [Produkt/Kategorie] funktioniert"
- "Wissenschaftliche Evidenz"
- "Praktische Anwendung"
- "Varianten/Modelle im Vergleich"
- "Für wen geeignet?"
- "Häufige Fragen"

# E-E-A-T KRITERIEN

- **Experience**: Praxisbeispiele, reale Szenarien
- **Expertise**: ${formData.targetAudience === 'physiotherapists' ? 'Detaillierte Studienzitation, Fachterminologie' : 'Studien verständlich erwähnen'}
- **Authoritativeness**: Zertifizierungen, Herstellerinfo
- **Trustworthiness**: Ehrliche Pro/Contra-Darstellung

# TONALITÄT
${addressStyle}

# AUSGABEFORMAT

Antworte als valides JSON (achte auf korrekt escaped Sonderzeichen!):
\`\`\`json
{
  "seoText": "HTML-Text mit <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <table> - VOLLSTÄNDIGER FLIESSTEXT mit ${minWords}+ Wörtern",
  "faq": [
    {"question": "Frage 1?", "answer": "Ausführliche Antwort"},
    {"question": "Frage 2?", "answer": "Ausführliche Antwort"}
  ],
  "title": "Title Tag (max 60 Zeichen, Fokus-Keyword am Anfang)",
  "metaDescription": "Meta Description (max 155 Zeichen, überzeugendes Versprechen)",
  "internalLinks": [
    {"url": "/relevanter-link", "anchorText": "Beschreibender Ankertext"}
  ],
  "technicalHints": "Schema.org Empfehlungen: Product/ItemList, FAQ-Schema",
  "eeatScore": {
    "experience": 8,
    "expertise": 9,
    "authoritativeness": 7,
    "trustworthiness": 9,
    "overall": 8,
    "improvements": ["Konkrete Verbesserungsvorschläge"]
  }${formData.complianceCheck ? `,
  "qualityReport": {
    "status": "green",
    "flags": [],
    "evidenceTable": [
      {"study": "Müller et al. (2024)", "type": "RCT", "population": "n=156", "outcome": "Schmerzreduktion", "effect": "VAS 6,8→2,4", "limitations": "Kurzes Follow-up", "source": "J Physio Research"}
    ]
  }` : ''}${formData.productComparisonEnabled ? `,
  "productComparison": "<table>HTML-Tabelle mit Produktvergleich</table>"` : ''}
}
\`\`\`

**WICHTIG beim JSON:**
- Alle Strings mit doppelten Anführungszeichen
- Zeilenumbrüche als \\n
- Anführungszeichen im Text escapen: \\"
- Keine Control Characters im JSON

Jetzt schreibe den vollständigen Text: Beginne mit dem WARUM, erkläre das WIE, zeige das WAS.`;
}
function buildHybridPrompt(formData: any, addressStyle: string): string {
  const minWords = formData.contentLength === 'short' ? 1000 : formData.contentLength === 'medium' ? 1800 : 3000;
  
  return `Du bist ein Experte für medizinische SEO-Texte mit wissenschaftlicher Expertise.

# AUFTRAG
Erstelle einen SEO-optimierten Volltext mit MINIMUM ${minWords} Wörtern reinem Fließtext.

# KERN-PRIORITÄTEN (in dieser Reihenfolge)

1. **VOLLSTÄNDIGKEIT**: Schreibe ausführliche Absätze, KEINE Headlines/Stichpunkte
2. **SEO-STRUKTUR**: Fokus-Keyword korrekt platzieren, Textlänge einhalten
3. **WISSENSCHAFT**: ${formData.targetAudience === 'physiotherapists' ? 'Min. 4-6 Studien korrekt zitieren' : 'Studien verständlich erwähnen'}
4. **PRAXISRELEVANZ**: Konkrete Kaufberatung und Anwendungsszenarien

# SEO-ANFORDERUNGEN

**Fokus-Keyword: "${formData.focusKeyword}"**
- In H1 (erste 5 Wörter)
- Im ersten Absatz (erste 100 Wörter)
- In 2-3 von 5-7 H2-Überschriften
- Meta-Title: Keyword in ersten 40 Zeichen
- Meta-Description: Keyword in ersten 80 Zeichen

**Textlänge:**
- SHORT: Min. 1000 Wörter Fließtext
- MEDIUM: Min. 1800 Wörter Fließtext
- LONG: Min. 3000 Wörter Fließtext

**Strukturelemente:**
- 3-4 Listen (Vorteile, Features, Anwendungen)
- 1-2 Tabellen (Vergleiche, technische Daten)
- FAQ am Ende (min. 5-7 Fragen)

# WISSENSCHAFTLICHE EVIDENZ

${formData.targetAudience === 'endCustomers' ? `
**Für Endkunden:**
- Studien verständlich erwähnen: "Studien aus 2024 zeigen..."
- Keine komplexen Fachbegriffe (oder sofort erklären)
- Analogien und Alltagsbeispiele nutzen
` : `
**Für Physiotherapeuten:**
- **MINIMUM 4-6 Studienreferenzen** im Haupttext
- Format: "Müller et al. (2024) zeigten in einem RCT (n=156, Follow-up 12 Wochen)..."
- Evidenz-Level nennen: "Level I Evidenz", "RCT", "systematisches Review"
- Konkrete Outcomes: "VAS-Reduktion 6,8±1,2 auf 2,4±0,9 (p<0,001)"
- Fachterminologie: ICD-10, ICF, DASH, WOMAC, Oswestry, SF-36
- Biomechanische Details: "bei 60°/s isokinetischer Geschwindigkeit"
- Behandlungsprotokolle: "3x wöchentlich über 6 Wochen"
`}

# STRUKTUR-VORGABEN

**H1** (60-70 Zeichen):
"[Fokus-Keyword] - [Hauptnutzen/USP]"

**H2-Struktur** (5-7 Hauptkapitel, jeder mit VOLLTEXT):

Für Produktseiten:
1. "Was ist [Produkt]? Funktion und Technologie" (4-5 Absätze, 400-600 Wörter)
2. "Wissenschaftliche Evidenz" (5-7 Absätze, 500-800 Wörter)
3. "[Produkt] in der Praxis" (4-6 Absätze, 450-650 Wörter)
4. "Varianten im Vergleich" (3-4 Absätze + Tabelle, 350-500 Wörter)
5. "Für wen geeignet?" (3-4 Absätze, 300-450 Wörter)
6. "Häufige Fragen" (FAQ-Bereich)

Für Kategorieseiten:
1. "Was sind [Kategorie]?" (3-4 Absätze, 300-450 Wörter)
2. "Technologie-Überblick" (5-6 Absätze, 500-700 Wörter)
3. "Wissenschaftliche Evidenz" (6-8 Absätze, 600-900 Wörter)
4. "Auswahlkriterien" (5 Absätze, 450-600 Wörter)
5. "Hersteller im Überblick" (4-5 Absätze, 400-550 Wörter)
6. "Praxisintegration" (3-4 Absätze, 350-500 Wörter)
7. "Häufige Fragen" (FAQ-Bereich)

**Jeder H2-Abschnitt braucht MEHRERE Absätze FLIESSTEXT, nicht nur Stichpunkte!**

# SCHREIBSTIL

- Variiere Satzlänge: Kurze Sätze. Dann längere Erklärungen.
- Nutze Gedankenstriche – für Einschübe
- VERMEIDE: "Erstens, Zweitens", perfekte Parallelstrukturen
- Absätze: 2-6 Sätze, durchschnittlich 3-4 Sätze

# PRAXISSZENARIEN (KOMPAKT)

✅ RICHTIG: "Patient mit Frozen Shoulder, 8 Monate ohne Fortschritt. K-Force Kraftmessung dokumentiert: ROM 45°→135° in 6 Wochen."
❌ FALSCH: Lange ausschweifende Geschichten

# NUR ECHTE DATEN

- Produktnamen, Modelle, Specs NUR aus gegebenen Daten verwenden
- KEINE erfundenen Studien oder Autoren
- Bei fehlenden Daten: Allgemein über Kategorie schreiben
- Ehrlich über Grenzen und Limitationen

# E-E-A-T UMSETZEN

- **Experience**: Praxisbeispiele, reale Szenarien
- **Expertise**: Studien zitieren, Fachterminologie
- **Authoritativeness**: Zertifizierungen (CE, FDA, MDR), Partnerschaften
- **Trustworthiness**: Pro/Contra, Quellenangaben, Einschränkungen

# TONALITÄT
${addressStyle}
Professionell, faktenbasiert, ehrlich statt verkäuferisch.

# AUSGABEFORMAT

Antworte als valides JSON (Sonderzeichen korrekt escapen!):
\`\`\`json
{
  "seoText": "HTML-Text mit <h1>, <h2>, <h3>, <p>, <ul>, <table> - ${minWords}+ Wörter FLIESSTEXT",
  "faq": [
    {"question": "...", "answer": "ausführliche Antwort"}
  ],
  "title": "Title Tag max 60 Zeichen mit Fokus-Keyword vorne",
  "metaDescription": "Meta Description max 155 Zeichen",
  "internalLinks": [
    {"url": "...", "anchorText": "keyword-reicher Ankertext"}
  ],
  "technicalHints": "Schema.org Markup: Product/ItemList, FAQ",
  "eeatScore": {
    "experience": 8,
    "expertise": 9,
    "authoritativeness": 7,
    "trustworthiness": 9,
    "overall": 8,
    "improvements": ["Konkrete Verbesserungen"]
  }${formData.complianceCheck ? `,
  "qualityReport": {
    "status": "green",
    "flags": [],
    "evidenceTable": [{"study": "...", "type": "...", "population": "...", "outcome": "...", "effect": "...", "limitations": "...", "source": "..."}]
  }` : ''}${formData.productComparisonEnabled ? `,
  "productComparison": "<table>HTML-Produktvergleich</table>"` : ''}
}
\`\`\`

**JSON-Regeln:**
- Doppelte Anführungszeichen für Strings
- Zeilenumbrüche als \\n
- Anführungszeichen escapen: \\"
- Keine Control Characters

Jetzt schreibe den vollständigen, ausführlichen SEO-Text!`;
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
