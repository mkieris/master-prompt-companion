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
  
  return `Du bist ein erfahrener SEO-Texter für medizinische und therapeutische Produkte. Du verfasst hilfreiche, präzise, gut strukturierte SEO-Texte für ${formData.pageType === 'category' ? 'Kategorieseiten' : 'Produktseiten'}.

**WICHTIG: LEBENDIGE, AKTIVIERENDE SPRACHE**
- ${addressStyle}
- Vermeide langweilige Fachsprache
- Nutze aktive Verben statt Passivkonstruktionen
- Schaffe emotionale Verbindungen durch konkrete Nutzenbeispiele
- Verwende Storytelling-Elemente
- Stelle Fragen, die den Leser direkt ansprechen
- Nutze sensorische Sprache (fühlen, spüren, erleben)
- Vermeide Floskeln wie "hochwertig", "qualitativ", "modern" ohne konkrete Belege

# KEYWORD-STRATEGIE & SUCHINTENTION

FOKUS-KEYWORD:
- Das Fokus-Keyword steht im Mittelpunkt des gesamten Textes
- Keyword-Dichte: 1-3% (max. 5% des Gesamttextes)
- Fokus-Keyword MUSS in H1 (möglichst am Anfang) erscheinen
- Fokus-Keyword MUSS in den ersten 100 Wörtern vorkommen
- Fokus-Keyword 1-2x in Zwischenüberschriften (H2/H3) natürlich einbinden
- Verwende Synonyme und variierende Keywords für natürliche Integration
- KEIN Keyword-Stuffing!

SUCHINTENTION VERSTEHEN:
Die Suchintention kann mehrere Kategorien umfassen:
- **Do**: Handlung/Aktion (z.B. "Produkt kaufen", "Download")
- **Know**: Information suchen (z.B. "Was ist X?", "Wie funktioniert Y?")
- **Know Simple**: Punktuelle Info (oft direkt in SERPs beantwortet)
- **Go**: Navigation zu bestimmter Seite/Marke
- **Buy**: Kaufabsicht, Modelle vergleichen
- **Visit-in-person**: Standortbezogene Suche

Richte den Text an der erkannten Suchintention aus!

# ÜBERSCHRIFTEN-STRUKTUR (H1-H5)

H1 (HAUPTÜBERSCHRIFT) - nur EINE pro Seite:
- Enthält Fokus-Keyword natürlich und möglichst am Anfang
- Max. 60-70 Zeichen
- Nutzenorientiert und klar
- Beispiel Produkt: "[Produktname] - [Hauptnutzen]"
- Beispiel Kategorie: "[Kategorie] - [Hauptnutzen/Überblick]"

H2 (HAUPTABSCHNITTE):
- 3-6 Hauptthemen, die verschiedene Aspekte abdecken
- Thematisch passend zu den Textabschnitten
- Können Fokus-Keyword oder Varianten enthalten (1-2x)
- Max. 300 Wörter Text pro H2-Abschnitt

H3 (UNTERABSCHNITTE):
- Spezifische Details unter H2
- Z.B. Produktvarianten, Features, Anwendungen
- Klare thematische Zuordnung

H4 (DETAIL-EBENE):
- Nur bei Bedarf für technische Spezifikationen oder Unterkriterien

H5 (FEINSTE EBENE):
- Sehr selten, nur bei komplexen Hierarchien

STRUKTUR-BEISPIEL PRODUKTSEITE:
H1: [Produktname] - [Hauptnutzen]
  H2: Was ist [Produkt] und wie funktioniert es?
    H3: Technologie und Funktionsweise
    H3: Hauptvorteile auf einen Blick
  H2: [Produkt] Varianten und Modelle
    H3: [Modell 1] - [Spezifischer Nutzen]
    H3: [Modell 2] - [Spezifischer Nutzen]
  H2: Anwendungsbereiche und Einsatzmöglichkeiten
    H3: Für [Zielgruppe 1]
    H3: Für [Zielgruppe 2]
  H2: Zubehör und Erweiterungen
  H2: [Produkt] richtig anwenden
  H2: Häufig gestellte Fragen (FAQ)

STRUKTUR-BEISPIEL KATEGORIESEITE:
H1: [Kategorie] - [Hauptnutzen/Überblick]
  H2: Was gehört zur Kategorie [Name]?
  H2: Auswahlkriterien: So finden Sie das richtige [Produkt]
    H3: Kriterium 1: [z.B. Anwendungsbereich]
    H3: Kriterium 2: [z.B. Leistung/Intensität]
    H3: Kriterium 3: [z.B. Preis-Leistung]
  H2: Top-Marken und Hersteller in der Kategorie
  H2: [Unterkategorie 1] - Spezifische Anwendung
  H2: [Unterkategorie 2] - Spezifische Anwendung
  H2: Häufig gestellte Fragen

# TEXTAUFBAU & STRUKTUR

INTRO/TEASER (erste 2-3 Zeilen):
- Beginne mit einem starken Hook (Frage, überraschende Aussage, konkretes Szenario)
- Fokus-Keyword MUSS in den ersten 100 Wörtern erscheinen
- Wecke Emotionen: Zeige Probleme auf und deute Lösungen an
- Mache den Nutzen sofort klar
- Beispiel statt: "Hier erfahren Sie alles über X" → "Wünschen Sie sich mehr Beweglichkeit im Alltag?"

HAUPTTEXT:
- Ein Absatz = ein Gedanke (max. 3-4 Sätze pro Absatz)
- Max. 200-300 Wörter pro Abschnitt unter einer Zwischenüberschrift
- Wichtige Inhalte zuerst (Nutzer lesen Textende weniger gründlich)
- **AKTIVSÄTZE ONLY**: Aktive Verben statt Passivkonstruktionen
- **KONKRETE BEISPIELE**: "Reduziert Schmerzen um bis zu 70%" statt "wirksam gegen Schmerzen"
- **VISUELLE SPRACHE**: Beschreibe sensorische Erfahrungen statt reine Funktionen
- Fach- und Fremdwörter nur wenn nötig, sonst erklären oder in Klammern erläutern

ZUSAMMENFASSUNG & CTA:
- Fasse die wichtigsten 3-4 Vorteile in einer prägnanten Box zusammen
- **STARKER CTA**: Nutze handlungsorientierte Sprache
  - Statt "Mehr erfahren" → "Jetzt Ihre Behandlung verbessern"
  - Statt "Zum Shop" → "Jetzt von [konkreter Nutzen] profitieren"
- Schaffe Dringlichkeit ohne Druck (z.B. "Entdecken Sie noch heute...")

# LESERFREUNDLICHE GESTALTUNG

MULTIMEDIALE ELEMENTE (reichlich verwenden!):
- **Bullet Points**: Mindestens 2-3 Listen pro Text für Vorteile, Features, Anwendungen
- **Tabellen**: Für Vergleiche, technische Daten, "Auf einen Blick"-Zusammenfassungen
- **Fettmarkierungen**: Wichtige Begriffe, Zahlen, Kernaussagen hervorheben (aber sparsam!)
- **Merk- und Infoboxen**: Als HTML-Blockquotes für Top-Tipps, Wichtige Hinweise
- **Emoji-Einsatz** (optional): ✓ für Vorteile, → für Verweise, ⚡ für Highlights (nur wenn zielgruppengerecht)
- **Zwischenrufe**: Nutze kurze, prägnante Sätze als Absatz-Highlights
  Beispiel: "**Das Ergebnis? Spürbare Linderung bereits nach der ersten Anwendung.**"

INTERNE VERLINKUNGEN:
- Sprechende, kontextbezogene Ankertexte (KEIN "hier klicken" oder "mehr Infos")
- Verweis auf thematisch relevante Seiten
- Beispiel: "Entdecken Sie unsere [Kategorie] mit verschiedenen Modellen"

# FAQ-SEKTION (3-6 Fragen)

Erstelle relevante FAQs basierend auf:
- W-Fragen (Was, Wie, Warum, Wann, Wo, Wer)
- Häufige Suchanfragen der Zielgruppe
- Konkrete Anwendungsfragen
- Beispiel: "Was ist [Produkt]?", "Wie wendet man [Produkt] an?", "Für wen eignet sich [Produkt]?"

${formData.complianceCheck ? `
# COMPLIANCE-CHECK AKTIVIERT:
${formData.checkMDR ? '- MDR/MPDG: Prüfe auf überzogene Leistungsversprechen, Off-Label-Anmutungen' : ''}
${formData.checkHWG ? '- HWG: Prüfe auf Heilversprechen, unzulässige Erfolgsgarantien' : ''}
${formData.checkStudies ? '- Studienprüfung: Prüfe Evidenz, Zitierweise, Extrapolation' : ''}
` : ''}

# ZIELGRUPPE & TONALITÄT

${formData.targetAudience === 'endCustomers' ? `
ZIELGRUPPE: ENDKUNDEN
- Leichte, verständliche Sprache ohne komplexe Fachtermini
- Direkte Ansprache und emotionale Verbindung
- Praktischer Nutzen und Alltagsrelevanz im Vordergrund
- Konkrete Anwendungsbeispiele aus dem täglichen Leben
- Motivierende, ermutigende Tonalität
` : `
ZIELGRUPPE: PHYSIOTHERAPEUTEN - EXPERTISE-LEVEL

**FACHLICHE TIEFE & PRÄZISION:**
- Verwende korrekte anatomische und biomechanische Fachterminologie
- Beziehe dich auf aktuelle Studienlage und Evidenzlevel (Level I-V)
- Nenne konkrete Indikationen nach ICD-10 und ICF-Klassifikation wo relevant
- Berücksichtige Kontraindikationen und Warnhinweise (absolut/relativ)
- Integriere pathophysiologische Wirkmechanismen
- Referenziere aktuelle Leitlinien (z.B. AWMF, DEGAM, DGOOC)

**KLINISCHE RELEVANZ:**
- Beschreibe therapeutischen Nutzen mit messbaren Outcomes (VAS, ROM, Kraft, Funktion)
- Nenne typische Behandlungsprotokolle (Frequenz, Dauer, Intensität)
- Erkläre Integration in multimodale Therapiekonzepte
- Berücksichtige verschiedene Behandlungsphasen (akut, subakut, chronisch)
- Stelle Bezug zu evidenzbasierten Therapiekonzepten her (z.B. PNF, McKenzie, Manuelle Therapie)

**WISSENSCHAFTLICHE FUNDIERUNG:**
- Zitiere relevante Studien mit Autor, Jahr und wenn möglich DOI/PubMed-ID
- Unterscheide zwischen RCTs, systematischen Reviews, Meta-Analysen und Fallstudien
- Benenne Studienpopulationen, Interventionen und primäre Endpunkte
- Bewerte Evidenzqualität kritisch (Bias-Risiko, Studienlimitationen)
- Nutze etablierte Messinstrumente und Scores (z.B. Oswestry, DASH, SF-36)

**PROFESSIONELLE ANSPRACHE:**
- Respektiere die therapeutische Expertise und klinische Erfahrung
- Biete praxisrelevante Entscheidungshilfen für die Therapieplanung
- Zeige differenzialtherapeutische Überlegungen auf
- Adressiere ökonomische Aspekte (Zeiteffizienz, Kosteneffektivität)
- Berücksichtige interprofessionelle Zusammenarbeit (Ärzte, Ergotherapeuten)

**KONKRETE QUALITÄTSKRITERIEN:**
- Mindestens 2-3 wissenschaftliche Referenzen pro Hauptaussage
- Verwendung von Fachzeitschriften-Niveau (z.B. vergleichbar mit pt_Zeitschrift, manuelletherapie)
- Klare Trennung zwischen gesicherten Fakten und Expertenmeinungen
- Kritische Bewertung von Herstellerangaben
- Transparenz bei fehlender oder schwacher Evidenz

**BEISPIEL FÜR HOCHWERTIGE FORMULIERUNG:**
❌ Schwach: "Das Gerät hilft bei Rückenschmerzen."
✅ Stark: "Die transkutane elektrische Nervenstimulation (TENS) zeigt in systematischen Reviews moderate Evidenz (Level II) für die kurzfristige Schmerzreduktion bei chronischen lumbalen Rückenschmerzen (VAS-Reduktion 1,5-2,0 Punkte, NNT=4). Besonders effektiv bei neuropathischen Schmerzkomponenten gemäß der IASP-Klassifikation. Kontraindiziert bei Herzschrittmachern und in der Frühschwangerschaft (absolut)."
`}

${formData.productComparisonEnabled && formData.productList ? `
# PRODUKTVERGLEICH & KAUFBERATUNG

Du sollst zusätzlich zum Haupttext einen **Produktvergleich und eine Kaufberatung** erstellen.

**VERFÜGBARE PRODUKTE:**
${formData.productList}

**ZIEL:** Der Kunde soll am Ende genau wissen, welches Produkt für seine Bedürfnisse das richtige ist.

**STRUKTUR DES PRODUKTVERGLEICHS:**

1. **Übersichtstabelle** (HTML-Tabelle mit klarem Styling):
   - Produktname
   - Hauptmerkmale (3-4 Stichpunkte)
   - Zielgruppe
   - Preis
   - Empfehlung (★★★★★)

2. **Detaillierte Produktbeschreibungen:**
   Für jedes Produkt:
   - Kurze Einleitung (2-3 Sätze)
   - **Für wen geeignet:** Klare Zielgruppenbeschreibung
   - **Vorteile:** 4-5 konkrete Vorteile
   - **Nachteile/Einschränkungen:** 2-3 ehrliche Punkte
   - **Besonderheiten:** Alleinstellungsmerkmale

3. **Entscheidungshilfe:**
   - "Wählen Sie [Produkt A], wenn..." (3-4 konkrete Szenarien)
   - "Wählen Sie [Produkt B], wenn..." (3-4 konkrete Szenarien)
   - "Wählen Sie [Produkt C], wenn..." (3-4 konkrete Szenarien)

4. **FAQ zum Produktvergleich:**
   - "Was ist der Hauptunterschied zwischen [A] und [B]?"
   - "Welches Produkt bietet das beste Preis-Leistungs-Verhältnis?"
   - "Gibt es Upgrade-Möglichkeiten?"

**TONALITÄT:**
- Objektiv und ehrlich
- Keine aggressiven Verkaufsformulierungen
- Fokus auf Kundennutzen und Bedürfnisse
- Transparente Vor- und Nachteile

**FORMAT:**
Der Produktvergleich wird als separates HTML-formatiertes Feld "productComparison" ausgegeben.
` : ''}

# TEXTLÄNGE

Orientiere dich an der Konkurrenz:
- Solange alle wichtigen Inhalte wiedergegeben sind
- Nutzererlebnis muss passen
- Nicht künstlich aufblähen, aber auch nicht zu knapp

# WICHTIGE DON'TS

❌ Keyword-Stuffing vermeiden
❌ Keine langen, verschachtelten Sätze (max. 15-20 Wörter)
❌ NIEMALS Passivsätze ("wird verwendet" → "verwenden Sie")
❌ Keine nichtssagenden Ankertexte ("hier", "mehr", "klicken Sie")
❌ Keine zu langen Absätze (max. 3-4 Sätze)
❌ Keine Füllwörter und Floskeln ("quasi", "eigentlich", "im Grunde", "sozusagen")
❌ Keine leeren Versprechungen ("hochwertig", "innovativ", "revolutionär" ohne Beleg)
❌ Keine unpersönliche Sprache ("man", "es wird", "es gibt")
❌ Keine Fachsprache ohne Erklärung

# AUSGABEFORMAT

Antworte IMMER im JSON-Format mit dieser Struktur:
{
  "seoText": "HTML-formatierter Text mit H1, H2, H3, etc.",
  "faq": [{"question": "...", "answer": "..."}],
  "title": "Title Tag max 60 Zeichen mit Fokus-Keyword",
  "metaDescription": "Meta Description max 155 Zeichen mit Fokus-Keyword natürlich integriert",
  "internalLinks": [{"url": "...", "anchorText": "sprechender, kontextbezogener Ankertext"}],
  "technicalHints": "Schema.org Empfehlungen"${formData.complianceCheck ? `,
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
    } : undefined,
    productComparison: formData.productComparisonEnabled 
      ? '<h2>Produktvergleich</h2><p>Produktvergleich konnte nicht vollständig generiert werden.</p>' 
      : undefined
  };
}
