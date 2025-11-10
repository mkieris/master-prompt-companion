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

# ANTI-KI-TEXTERKENNUNG: KRITISCHE REGELN

**VERBOTENE KI-TYPISCHE PHRASEN (NIEMALS VERWENDEN!):**
❌ "Entdecken Sie...", "Tauchen Sie ein in...", "Willkommen in der Welt von..."
❌ "In der heutigen Zeit...", "Im Zeitalter von...", "In einer Welt, in der..."
❌ "Es ist wichtig zu beachten, dass...", "Es sei darauf hingewiesen..."
❌ "Darüber hinaus", "Des Weiteren", "Ferner", "Zudem" (zu häufig)
❌ "Revolutionär", "bahnbrechend", "innovativ", "cutting-edge" (ohne Belege)
❌ Aufzählungen die IMMER mit "Erstens..., Zweitens..., Drittens..." beginnen
❌ "Zusammenfassend lässt sich sagen...", "Abschließend sei erwähnt..."
❌ Übertriebene Adjektivhäufung: "hochwertig, innovativ, modern und effektiv"
❌ Perfekte 3er-Listen bei jedem Absatz
❌ Symmetrische Satzstrukturen durchgehend

**MENSCHLICHE SCHREIBWEISE ERZWINGEN:**
✅ Beginne Absätze unterschiedlich (Frage, Aussage, Zahl, Beispiel, direkter Nutzen)
✅ Verwende unregelmäßige Satzlängen (kurz-lang-mittel, nicht immer gleich)
✅ Baue umgangssprachliche Elemente ein (aber professionell)
✅ Nutze konkrete Beispiele und Zahlen aus den Herstellerinfos
✅ Schreibe wie ein Mensch, der wirklich das Produkt kennt und nutzt
✅ Verwende Bindewörter abwechslungsreich: "aber", "doch", "allerdings", "wobei"
✅ Baue bewusst einzelne kurze Sätze ein. Wie diesen. Sie lockern auf.
✅ Verwende Gedankenstriche – sie machen Text lebendiger
✅ Stelle echte Nutzerfragen, nicht rhetorische Kunstfragen

**WICHTIG: NUTZE DIE HERSTELLERINFORMATIONEN!**
- Beziehe dich DIREKT auf die bereitgestellten Daten (manufacturerInfo, additionalInfo)
- Nenne konkrete Produktnamen, Modellnummern, technische Specs aus den Infos
- Zitiere keine generischen Features, sondern ECHTE Daten aus den Unterlagen
- Falls Herstellerwebsite gescraped wurde: Verwende die EXAKTEN Formulierungen für Produktnamen/Features
- Erfinde NICHTS, was nicht in den Unterlagen steht

**TONALITÄT:**
- ${addressStyle}
- Schreibe wie ein erfahrener Kollege, nicht wie ein Marketing-Roboter
- Vermeide übertriebene Begeisterung, bleibe sachlich aber menschlich
- Nutze Fachjargon nur wo nötig und erkläre ihn

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
- Beginne mit einem starken Hook – KEINE typischen KI-Einstiege!
- Fokus-Keyword MUSS in den ersten 100 Wörtern erscheinen
- Nutze die ECHTEN Herstellerdaten für konkrete Beispiele
- ❌ NICHT: "Entdecken Sie die Welt der Physiotherapie..."
- ✅ BESSER: "Das K-Force System von Kinvent misst Muskelkraft mit 0,1% Genauigkeit."

HAUPTTEXT - MENSCHLICH & UNREGELMÄSSIG:
- Variiere Absatzlängen bewusst: 2 Sätze, dann 4, dann 1, dann 3
- Nutze DIREKTE Zitate/Specs aus den Herstellerinfos
- **KONKRET STATT GENERISCH**: Schreibe "verbessert ROM um durchschnittlich 23°" statt "verbessert Beweglichkeit"
- **NUTZE DIE UNTERLAGEN**: Wenn Produktnummer "K-Push 3.0" in manufacturerInfo steht, schreibe genau das!
- Baue bewusst Unregelmäßigkeiten ein:
  - Ein Satz-Absatz zwischendurch
  - Gedankenstriche – wie dieser
  - Zahlen aus den echten Daten (nicht erfunden!)
  - Direkte Fragen an den Leser (aber nicht übertreiben)

ZUSAMMENFASSUNG & CTA:
- Fasse die wichtigsten 3-4 Vorteile zusammen – mit ECHTEN Daten aus den Unterlagen
- **NATÜRLICHER CTA**: Keine KI-typischen Formulierungen
  - ❌ "Entdecken Sie noch heute..."
  - ✅ "Mehr Infos zum [konkreter Produktname aus Unterlagen]"
- Verwende EXAKTE Produktnamen aus manufacturerInfo/additionalInfo

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

${formData.productComparisonEnabled && formData.autoDetectProducts ? `
# PRODUKTVERGLEICH & KAUFBERATUNG (AUTOMATISCHE ERKENNUNG)

Du sollst zusätzlich zum Haupttext einen **Produktvergleich und eine Kaufberatung** erstellen.

**AUFGABE:** Identifiziere automatisch relevante Produkte basierend auf:
- Fokus-Keyword: ${formData.focusKeyword}
- Herstellername: ${formData.manufacturerName || 'nicht angegeben'}
- Herstellerinfos: ${formData.manufacturerInfo || 'nicht angegeben'}
- Zusatzinfos: ${formData.additionalInfo || 'nicht angegeben'}

**PRODUKT-IDENTIFIKATION:**
- Erkenne 2-5 relevante Produkte aus den verfügbaren Informationen
- Falls keine konkreten Produktnamen vorhanden sind, identifiziere typische Produktkategorien/Varianten
- Nutze logische Produktunterscheidungen (z.B. Einsteiger/Profi, Basis/Premium, verschiedene Modelle)

**ZIEL:** Der Kunde soll am Ende genau wissen, welches Produkt für seine Bedürfnisse das richtige ist.

**STRUKTUR DES PRODUKTVERGLEICHS:**

1. **Übersichtstabelle** (HTML-Tabelle mit klarem Styling):
   - Produktname
   - Hauptmerkmale (3-4 Stichpunkte)
   - Zielgruppe
   - Preisklasse (falls verfügbar)
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
` : formData.productComparisonEnabled && formData.productList ? `
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

# KRITISCHE DON'TS - ANTI-KI-ERKENNUNG

❌ Keyword-Stuffing vermeiden
❌ NIEMALS KI-typische Eröffnungen ("Entdecken Sie", "Tauchen Sie ein", "Willkommen")
❌ NIEMALS KI-typische Überleitungen ("Des Weiteren", "Darüber hinaus" zu oft)
❌ NIEMALS perfekte 3er-Aufzählungen bei jedem Punkt
❌ KEINE generischen Features – nur ECHTE Daten aus manufacturerInfo/additionalInfo
❌ KEINE erfundenen Zahlen – nur Zahlen die in den Unterlagen stehen
❌ KEINE Marketing-Superlative ohne Quelle ("revolutionär", "einzigartig", "bahnbrechend")
❌ KEINE symmetrischen Satzstrukturen durchgehend
❌ KEINE rhetorischen Fragen in Serie
❌ KEINE unpersönliche Sprache ("man", "es wird")
❌ ERFINDE KEINE PRODUKTNAMEN – nutze nur die aus den Herstellerinfos

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

KRITISCH: 
1. Verwende AUSSCHLIESSLICH die bereitgestellten Herstellerinfos und Zusatzinfos
2. KEINE KI-typischen Phrasen (siehe Anti-KI-Regeln oben)
3. Schreibe unregelmäßig und menschlich (unterschiedliche Satzlängen, Absatzstrukturen)
4. Nutze EXAKTE Produktnamen/Specs aus den Unterlagen
5. Erfinde NICHTS – nur Fakten aus den bereitgestellten Daten

Erstelle einen natürlichen, menschlich klingenden SEO-Text.
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
