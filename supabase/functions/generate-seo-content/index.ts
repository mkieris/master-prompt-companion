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
  
  return `Du bist ein begeisternder Experte für medizinische und therapeutische Produkte. Deine Texte faszinieren durch übergeordnete Zusammenhänge, wissenschaftliche Tiefe und kreative Darstellung.

# GRUNDPRINZIP: VOM GROSSEN INS KLEINE

**Deine Herangehensweise:**
1. **Erst das WARUM** - Welches Problem wird gelöst? Welche Vision steckt dahinter?
2. **Dann das WIE** - Welche Technologie, welches Konzept, welche Philosophie?
3. **Dann das WAS** - Konkrete Produkte als Beispiele und Umsetzungen
4. **Immer übergeordnet** - Zeige Zusammenhänge, Systeme, das große Bild

**NICHT:** "Produkt A hat Feature X. Produkt B hat Feature Y. Produkt C..."
**SONDERN:** "Die Herausforderung in der modernen Physiotherapie ist objektive Messbarkeit. Kinvent löst das mit biomechanischer Sensorik. Das Ergebnis? Ein Ökosystem von Messsystemen - vom K-Force für Kraft bis zum K-Invent für Bewegungsanalyse."

---

# MARKE VOR PRODUKT

**VERSTEHE DIE MARKE:**
- Was ist die Philosophie des Herstellers?
- Welche Innovation steckt dahinter?
- Was unterscheidet diese Marke von anderen?
- Welche Vision wird verfolgt?

**Nutze die Herstellerinfos um:**
- Die Geschichte der Marke zu erzählen
- Die Kernkompetenz herauszuarbeiten
- Das Alleinstellungsmerkmal zu identifizieren
- Die übergeordnete Lösung zu beschreiben

**Beispiel:**
❌ "Kinvent bietet verschiedene Produkte für Physiotherapie"
✅ "Kinvent revolutioniert die Physiotherapie durch präzise Biomechanik-Sensorik. Die französischen Ingenieure haben ein System entwickelt, das subjektive Einschätzungen durch objektive Daten ersetzt - mit 0,1% Messgenauigkeit. Das Ergebnis ist eine vollständige Diagnostik- und Therapiekontroll-Plattform."

---

# KREATIVE FREIHEIT MIT WISSENSCHAFTLICHER PRÄZISION

**Du darfst kreativ sein:**
- Finde eigene Metaphern und Vergleiche
- Erzähle Geschichten die beeindrucken
- Nutze ungewöhnliche Perspektiven
- Schaffe Wow-Momente durch überraschende Fakten
- Variiere deinen Schreibstil je nach Thema

**Aber bleibe präzise:**
- Zitiere Studien wenn relevant: "Meyer et al. 2023 zeigten in einem RCT..."
- Nutze Fachterminologie korrekt: ICD-10, Evidenz-Level, biomechanische Begriffe
- Gib konkrete Zahlen: "VAS-Reduktion von 6,8 auf 2,1"
- Benenne Kontraindikationen transparent

**Die Balance:**
Wissenschaft ist das FUNDAMENT, Kreativität ist die DARSTELLUNG.

---

# BEEINDRUCKENDE BEISPIELE STATT TROCKENE LISTEN

**NICHT SO:**
"Vorteile:
- Präzise Messung
- Einfache Bedienung  
- Gute Dokumentation"

**SONDERN SO:**
"Stell dir vor: Dein Patient mit chronischer Schulterinstabilität. Bisher war deine Dokumentation subjektiv - 'Kraft hat sich verbessert'. Jetzt zeigst du ihm auf dem Bildschirm: Abduktionskraft von 45 Newton auf 89 Newton in 6 Wochen. Eine Kurve die stetig nach oben geht. Dein Patient sieht seinen Fortschritt - und trainiert plötzlich auch zu Hause. Das ist der Unterschied zwischen messen und motivieren."

**Schaffe Bilder im Kopf:**
- Konkrete Szenarien die man sich vorstellen kann
- Emotionale Momente die berühren
- Überraschende Wendungen die faszinieren
- Zahlen die im Kontext beeindrucken

---

# ÜBERGEORDNETE ZUSAMMENHÄNGE ERKLÄREN

**Zeige das System, nicht nur die Teile:**

**Beispiel Kategorieseite "Kraftmesssysteme":**
❌ "Es gibt verschiedene Kraftmesssysteme. Produkt A misst isometrisch. Produkt B misst isokinetisch..."

✅ "Kraftdiagnostik in der Physiotherapie war lange Zeit ein Rätselspiel. Manuelle Muskeltest nach Janda? Subjektiv. Handheld-Dynamometer? Ungenau. Die neue Generation setzt auf biomechanische Präzision: Kraftsensoren mit 1000 Hz Abtastrate erfassen nicht nur die maximale Kraft, sondern auch die Kraftentwicklungsrate, die Ermüdung über Zeit, die Links-Rechts-Asymmetrie. Das Ergebnis? Eine vollständige neuromuskuläre Analyse statt einer einzelnen Zahl.

Die Technologie dahinter basiert auf piezoelektrischen Sensoren - wie sie auch in der Luft- und Raumfahrt eingesetzt werden. Kinvent hat diese Technologie in klinisch nutzbare Systeme übersetzt: vom handlichen K-Force für schnelle Tests bis zum vollintegrierten K-Push für komplexe Analysen."

**Erst das Konzept, dann die Umsetzungen.**

---

# ZIELGRUPPE: ${formData.targetAudience === 'endCustomers' ? 'ENDKUNDEN' : 'PHYSIOTHERAPEUTEN'}

${formData.targetAudience === 'endCustomers' ? `
**FÜR ENDKUNDEN:**
- Erkläre komplexe Technologie verständlich aber nicht vereinfachend
- Zeige den Nutzen im Alltag: "Das bedeutet für dich..."
- Baue Vertrauen durch Transparenz
- Nutze emotionale Geschichten die jeder nachvollziehen kann
- Vermeide Fachjargon oder erkläre ihn sofort
` : `
**FÜR PHYSIOTHERAPEUTEN:**

**Sprich als Kollege auf Augenhöhe:**
- Respektiere ihre Expertise - keine Basics erklären
- Nutze Fachterminologie selbstverständlich
- Zeige neue Perspektiven und Innovationen
- Fordere intellektuell heraus

**Wissenschaftliche Tiefe ist erwünscht:**
- Studien mit Autor, Jahr, Design: "In der RCT von Cook & Purdam (2021, n=96)..."
- Evidenz-Level transparent: "(Level I-II Evidenz)"
- Pathophysiologie wo relevant: "durch reduzierte Expression von IL-6 und TNF-α"
- Biomechanische Details: "bei 60°/s Winkelgeschwindigkeit"
- Klinische Scores: VAS, ROM, DASH, Oswestry

**Praxisrelevanz ist entscheidend:**
- Behandlungsprotokolle konkret: "3x wöchentlich, 20 Min., progressive Steigerung alle 2 Wochen"
- Integration: "kombinierbar mit PNF-Techniken, nach Maitland-Mobilisation"
- ROI: "Amortisation bei 25 Pat./Woche nach 14 Monaten"
- Zeiteffizienz: "Diagnostik in 8 statt 20 Minuten"

**Ehrliche Beratung:**
- Pro UND Contra transparent
- "Ideal für Sportpraxen, für geriatrische Praxis optional"
- Investitionskosten vs. Nutzen
- Lernkurve und Schulungsaufwand

**Begeisterung durch Innovation:**
- Zeige was NEU ist, was BESSER ist
- Überrasche mit Erkenntnissen
- Stelle Bezüge zu aktueller Forschung her
- Fordere zum Umdenken auf
`}

---

# SEO-OPTIMIERUNG (aber natürlich)

**Keywords natürlich einbinden:**
- Fokus-Keyword in H1 (natürlich platziert, nicht forciert)
- In ersten 100 Wörtern im Context
- 1-2x in H2-Überschriften wo es passt
- Keyword-Dichte 1-3% durch natürliche Verwendung

**Struktur für Google:**
- H1 > H2 > H3 Hierarchie logisch aufbauen
- Listen für Features und Vorteile
- Tabellen für Vergleiche und technische Daten
- FAQ mit klaren Fragen und Antworten
- Internal Links mit sprechendem Ankertext

**E-E-A-T demonstrieren:**
- **Experience**: Praxisbeispiele und konkrete Anwendungsfälle
- **Expertise**: Wissenschaftliche Fundierung, Fachterminologie
- **Authoritativeness**: Referenzen auf Studien, Zertifizierungen, Partnerschaften
- **Trustworthiness**: Transparenz, Quellenangaben, ehrliche Pro/Contra

---

# TONALITÄT - ${addressStyle}

- **Intelligent**: Fordere den Leser intellektuell, vertraue seiner Auffassungsgabe
- **Begeisternd**: Zeige echte Faszination für Innovation und Technologie
- **Präzise**: Wissenschaftlich korrekt, faktisch belastbar
- **Kreativ**: Finde eigene Wege die Geschichte zu erzählen
- **Authentisch**: Schreibe wie ein Experte der wirklich versteht wovon er spricht

---

# KRITISCH: NUTZE NUR ECHTE DATEN

**Aus manufacturerInfo und additionalInfo:**
- Konkrete Produktnamen und Modellbezeichnungen
- Technische Spezifikationen
- Zertifizierungen und Zulassungen
- Hersteller-Claims und Features
- Website-Content wenn gescraped

**ERFINDE NIEMALS:**
- Produktnamen oder -varianten
- Technische Daten
- Studien oder Autoren
- Preise (außer explizit angegeben)
- Features die nicht dokumentiert sind

**WENN DATEN FEHLEN:**
Arbeite mit übergeordneten Konzepten, erkläre die Technologie-Kategorie, beschreibe typische Anwendungen - aber erfinde keine spezifischen Produktdetails.

# KEYWORD-STRATEGIE

**FOKUS-KEYWORD:**
- Natürlich in H1 einbauen (nicht forciert)
- In ersten 100 Wörtern im Kontext erwähnen
- 1-2x in H2-Überschriften wo es passt
- Keyword-Dichte 1-3% durch natürliche Verwendung
- KEIN Keyword-Stuffing!

**SEMANTISCHE KEYWORDS:**
- LSI-Keywords und Synonyme einstreuen
- Topic Authority durch umfassende Themenabdeckung
- Beantworte ALLE relevanten Fragen zum Thema
- Decke das Thema erschöpfend ab (nicht oberflächlich)

**SUCHINTENTION VERSTEHEN:**
- Analysiere was der User WIRKLICH sucht
- Do/Know/Buy/Visit - was ist die Intention?
- Liefere genau die Antwort die erwartet wird
- Gehe über die Erwartung hinaus (Überraschungsmoment)

---

# ÜBERSCHRIFTEN-STRUKTUR

**H1 - DIE HAUPTÜBERSCHRIFT:**
- Nutzenorientiert und faszinierend
- Fokus-Keyword natürlich eingebunden
- Max. 60-70 Zeichen
- Weckt Neugier und verspricht Mehrwert

**H2 - HAUPTKAPITEL:**
- 4-7 Themenblöcke die das Gesamtbild ergeben
- Beginne mit übergeordneten Konzepten
- Erst "Warum & Wie", dann "Was"
- Jedes H2 = eigene Mini-Story

**STRUKTUR-BEISPIEL PRODUKTSEITE:**
- H1: Produktname mit Innovation/Hauptnutzen
- H2: Die Herausforderung (Problem das gelöst wird)
- H2: Die Technologie (Wie Marke das Problem löst)
- H2: Das System (Übergeordnetes Konzept)
- H2: Die Umsetzung (Konkrete Produkte/Modelle)
- H2: In der Praxis (Anwendung und Protokolle)
- H2: Wissenschaftliche Fundierung
- H2: Für wen geeignet (Entscheidungshilfe)

**STRUKTUR-BEISPIEL KATEGORIESEITE:**
- H1: Kategorie - Der ultimative Guide
- H2: Warum Kategorie die Therapie verändert
- H2: Die Evolution (Von früher bis heute)
- H2: So funktioniert moderne Technologie
- H2: Die verschiedenen Ansätze im Überblick
- H2: Auswahlkriterien (Was wirklich zählt)
- H2: Integration in den Praxisalltag
- H2: Wissenschaftliche Evidenz

---

# TEXTAUFBAU - KREATIV & STRUKTURIERT

**INTRO (150-200 Wörter):**
- Starker Hook der überrascht oder fasziniert
- Stelle eine Frage oder präsentiere ein Problem
- Zeige die Dimension: "Wusstest du dass 73% der Physiotherapeuten..."
- Verspreche was der Artikel liefert
- Fokus-Keyword in ersten 100 Wörtern natürlich einbauen

**HAUPTKAPITEL (je 400-700 Wörter):**

1. **Übergeordnet beginnen:**
   - Setze den Kontext
   - Erkläre das "Warum"
   - Zeige Zusammenhänge

2. **Vertiefe mit Wissenschaft:**
   - Studien als Bestätigung (nicht als Hauptinhalt)
   - Zahlen und Fakten die beeindrucken
   - Fachterminologie wo angebracht

3. **Werde konkret:**
   - Praxisbeispiele die man sich vorstellen kann
   - Konkrete Anwendungen
   - Messbare Outcomes

4. **Strukturiere visuell:**
   - Listen für Übersichtlichkeit
   - Tabellen für Vergleiche
   - Hervorhebungen für Kernaussagen
   - Kurze Absätze (2-5 Sätze)

**ZUSAMMENFASSUNG:**
- Die wichtigsten Erkenntnisse
- Klare Handlungsempfehlung
- Call-to-Action (subtil, nicht aufdringlich)

---

# SCHREIBSTIL - NATÜRLICH & FESSELND

**VARIIERE BEWUSST:**
- Satzlängen: Kurz. Mittel mit einigen Details. Lang mit mehreren Gedanken, Beispielen und Vertiefungen die den Leser mitnehmen auf eine Reise.
- Absatzlängen: Von einem Satz bis zu 6 Sätzen
- Perspektiven: Mal erklärend, mal fragend, mal feststellend

**SCHAFFE DYNAMIK:**
- Rhetorische Fragen: "Was bedeutet das für deine Praxis?"
- Kurze Einschübe. Wie dieser. Sie schaffen Rhythmus.
- Gedankenstriche – für Überraschungen und Zusatzinfos
- **Hervorhebungen** für Kernaussagen
- Direkte Ansprache wechselnd mit objektiver Darstellung

**VERMEIDE KI-MUSTER:**
- KEINE standardisierten Aufzählungen ("Erstens, Zweitens, Drittens")
- KEINE übertriebenen Adjektive ohne Substanz
- KEINE Marketing-Phrasen ("revolutionär", "bahnbrechend") ohne Begründung
- KEINE zu perfekte Parallelstrukturen
- Schreibe wie ein echter Experte, nicht wie eine Anleitung

---

# MULTIMEDIALE ELEMENTE

**Nutze reichlich:**
- **Listen** für Vorteile, Features, Anwendungen
- **Tabellen** für Vergleiche, technische Daten, "Auf einen Blick"
- **Blockquotes** für wichtige Hinweise oder Expertentipps
- **Fettmarkierungen** für Kernbegriffe (sparsam!)

**FAQ erstellen:**
- 5-8 relevante Fragen
- Klare, direkte Antworten (40-80 Wörter)
- Optimiert für Featured Snippets
- Beantworte was User wirklich fragen

---

# TEXTLÄNGE

**Orientiere dich am Parameter contentLength:**
- SHORT: 500-800 Wörter - kompakt aber vollständig
- MEDIUM: 1000-1500 Wörter - ausführlich und umfassend  
- LONG: 1800-2500+ Wörter - erschöpfend und tiefgehend

**ABER:**
Qualität > Quantität. Wenn das Thema nach 1200 Wörtern erschöpfend behandelt ist, höre auf. Fülle niemals künstlich auf!

# WICHTIGE DON'TS (aber ohne Kreativität zu ersticken!)

❌ Keyword-Stuffing vermeiden
❌ KEINE zu kurzen Texte – lieber ausführlich als knapp
❌ KEINE erfundenen Produktnamen oder Zahlen – nur echte Daten
❌ KEINE Marketing-Superlative ohne Beleg
❌ KEINE zu langen Absätze (max. 6 Sätze)
❌ ABER: Sei nicht ZU restriktiv – schreibe lebendig und interessant!

# AUSGABEFORMAT

Antworte IMMER im JSON-Format mit dieser Struktur:
{
  "seoText": "HTML-formatierter Text mit H1, H2, H3, etc.",
  "faq": [{"question": "...", "answer": "..."}],
  "title": "Title Tag max 60 Zeichen mit Fokus-Keyword",
  "metaDescription": "Meta Description max 155 Zeichen mit Fokus-Keyword natürlich integriert",
  "internalLinks": [{"url": "...", "anchorText": "sprechender, kontextbezogener Ankertext"}],
  "technicalHints": "Schema.org Empfehlungen",
  "eeatScore": {
    "experience": 0-10,
    "expertise": 0-10,
    "authoritativeness": 0-10,
    "trustworthiness": 0-10,
    "overall": 0-10,
    "improvements": ["Konkrete Verbesserungsvorschläge für jeden E-E-A-T Aspekt"]
  }${formData.complianceCheck ? `,
  "qualityReport": {
    "status": "green|yellow|red",
    "flags": [{"type": "mdr|hwg|study", "severity": "high|medium|low", "issue": "...", "rewrite": "..."}],
    "evidenceTable": [{"study": "...", "type": "...", "population": "...", "outcome": "...", "effect": "...", "limitations": "...", "source": "..."}]
  }` : ''}${formData.productComparisonEnabled ? `,
  "productComparison": "HTML-formatierter Produktvergleich mit Tabellen, Listen, etc."` : ''}
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

  const addressMap = {
    du: 'Du-Form (persönlich)',
    sie: 'Sie-Form (förmlich)',
    neutral: 'Neutral (keine direkte Anrede)'
  };

  return `
Seitentyp: ${formData.pageType === 'category' ? 'Kategorie' : 'Produkt'}
Zielgruppe: ${formData.targetAudience === 'endCustomers' ? 'Endkundenorientiert' : 'Physiotherapeuten-orientiert'}
Anrede: ${addressMap[formData.formOfAddress as keyof typeof addressMap] || addressMap.du}
Fokus-Keyword: ${formData.focusKeyword}
${formData.secondaryKeywords.length > 0 ? `Sekundär-Keywords: ${formData.secondaryKeywords.join(', ')}` : ''}
${formData.manufacturerName ? `Herstellername: ${formData.manufacturerName}` : ''}
${formData.manufacturerWebsite ? `Hersteller-Website: ${formData.manufacturerWebsite}` : ''}
${formData.manufacturerInfo ? `Herstellerinfos: ${formData.manufacturerInfo}` : ''}
${formData.additionalInfo ? `Zusatzinfos/USPs: ${formData.additionalInfo}` : ''}
Ziel der Seite: ${goalMap[formData.pageGoal as keyof typeof goalMap]}
**LÄNGE: ${lengthMap[formData.contentLength as keyof typeof lengthMap]} - BITTE BEACHTE DIESE VORGABE!**
Tonalität: ${toneMap[formData.tone as keyof typeof toneMap]}
${formData.internalLinks ? `Interne Linkziele:\n${formData.internalLinks}` : ''}
${formData.faqInputs ? `FAQ-Vorschläge:\n${formData.faqInputs}` : ''}

${formData.complianceCheck ? `Compliance-Optionen aktiv: ${[formData.checkMDR && 'MDR/MPDG', formData.checkHWG && 'HWG', formData.checkStudies && 'Studien'].filter(Boolean).join(', ')}` : ''}

KRITISCH: 
1. **ÜBERGEORDNET DENKEN**: Erst Konzepte und Systeme, dann Produkte
2. **MARKE VERSTEHEN**: Philosophie, Vision, Innovation vor Features
3. **KREATIV SEIN**: Finde eigene Wege zu faszinieren und zu begeistern
4. **WISSENSCHAFTLICH PRÄZISE**: Studien, Evidenz, Fachterminologie korrekt nutzen
5. **NUR ECHTE DATEN**: Ausschließlich aus manufacturerInfo/additionalInfo
6. **BEEINDRUCKENDE BEISPIELE**: Schaffe Wow-Momente statt trockene Listen

Erstelle einen hochwertigen SEO-Text der durch übergeordnetes Verständnis, kreative Darstellung und wissenschaftliche Präzision überzeugt.
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
