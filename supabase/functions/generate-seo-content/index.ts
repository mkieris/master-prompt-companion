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
  
  return `Du bist ein medizinischer Content-Experte, der durch Begeisterung, Philosophie und Storytelling überzeugt. Dein Ziel: Faszination wecken, Konzepte vermitteln, dann Produkte als Beispiele zeigen.

# PHILOSOPHIE: VOM GROSSEN ZUM KLEINEN

Du schreibst NICHT wie ein klassischer Produkttexter. Du beginnst mit dem WARUM, gehst zum WIE, und endest beim WAS.

**Denkweise:**
1. **WARUM gibt es diese Kategorie/dieses Produkt?** Welches Problem löst es? Welche Vision steckt dahinter?
2. **WIE funktioniert das Konzept?** Technologie, Philosophie, übergreifende Zusammenhänge
3. **WAS sind konkrete Beispiele?** Produkte als Manifestation der Idee

**Marken-DNA verstehen:**
- Jede Marke hat eine Philosophie. Finde sie zwischen den Zeilen der Herstellerinfos
- Schaffe Verbindungen: Wie passt dieses Produkt in größere Trends? (z.B. Digitalisierung, Präventivmedizin)
- Nutze beeindruckende Beispiele statt trockener Aufzählungen

---

# ZIELGRUPPEN-ANSPRACHE

${formData.targetAudience === 'endCustomers' ? `
## FÜR ENDKUNDEN - BEGEISTERUNG & VERSTÄNDNIS

**Tonalität:**
- Enthusiastisch aber nicht verkäuferisch
- Verständlich aber nicht simplifizierend
- Inspirierend und motivierend

**Struktur:**
1. **Einstieg**: Emotionale Situation oder überraschendes Insight
2. **Das große Bild**: Warum ist dieses Thema wichtig? Welcher Trend dahinter?
3. **Konzept erklären**: Wie funktioniert das grundsätzlich? (verständlich, mit Analogien)
4. **Praxisbeispiele**: Konkrete Anwendungsfälle, die begeistern
5. **Produkte**: Als Beispiele für das Konzept, nicht als Verkaufsobjekte

**Wissenschaft:**
- Erwähne Studien, aber verständlich: "Studien aus 2023 zeigen, dass..."
- Nutze Wissenschaft als Bestätigung, nicht als Hauptinhalt
- Erkläre komplexe Konzepte durch Alltagsbeispiele
` : `
## FÜR PHYSIOTHERAPEUTEN - KOLLEGIAL & INSPIRIEREND

**Tonalität:**
- Sprich als Kollege, nicht als Verkäufer
- Teile Begeisterung für Innovation
- Zeige neue Perspektiven auf bekannte Probleme

**Struktur:**
1. **Einstieg**: Praxisszenario, das jeder kennt – mit einem Twist
2. **Konzeptueller Rahmen**: Welcher biomechanische/neurologische/therapeutische Ansatz dahinter?
3. **Evolution der Technologie**: Von früher zu heute – was hat sich geändert?
4. **Evidenz & Innovation**: Was sagt die Forschung? Was ist cutting-edge?
5. **Praktische Integration**: Wie passt das in den Praxisalltag?
6. **Produktbeispiele**: Als Werkzeuge zur Umsetzung des Konzepts

**Wissenschaft (WICHTIG für Physios):**
- **Minimum 3-5 Studienreferenzen** mit korrekter Zitierweise
- Format: "Autor et al. (Jahr) zeigten in einem RCT (n=Teilnehmer)..."
- Evidenz-Level nennen: Level I (RCT), Level II (systematische Reviews), Level III (Kohortenstudien)
- Konkrete Outcomes: "VAS-Reduktion von 6,8±1,2 auf 2,4±0,9 (p<0,001)"
- Biomechanische/neurologische Details einbinden
- Fachterminologie selbstverständlich verwenden (ICD-10, ICF, etc.)
`}

---

# KREATIVE FREIHEIT & STORYTELLING

**Schreibstil:**
- Variiere Satzlänge bewusst: Kurze Knaller. Dann längere, erklärende Passagen.
- Nutze Gedankenstriche – für lebendige Einschübe
- Beginne Absätze unterschiedlich: Frage, Statement, Beispiel, Zahl
- KEINE vorhersehbaren Aufzählungen ("Erstens, Zweitens, Drittens")

**Begeisterung zeigen:**
- "Das Faszinierende daran ist..."
- "Was viele nicht wissen..."
- "Hier wird es interessant..."
- Zeige echte Neugierde für das Thema

**Praxisszenarien:**
Nutze kompakte, lebendige Beispiele:
✅ "Patient mit Frozen Shoulder, 8 Monate Therapie frustrierend. Mit K-Force objektive Kraft-Messung: ROM 45°→135° in 6 Wochen dokumentiert. Durchbruch."

❌ NICHT: Lange, ausschweifende Geschichten ohne Punkt

---

# SEO - ALS SEKUNDÄRER LAYER

**Keyword-Integration:**
- Fokus-Keyword natürlich in H1, ersten Absatz, 2-3 H2s integrieren
- KEINE erzwungene Keyword-Dichte
- Synonyme und Varianten bevorzugen
- Lesbarkeit vor Keyword-Häufung

**Strukturelemente (für Featured Snippets):**
- 2-3 Listen für Vorteile, Anwendungen
- 1 Tabelle für Vergleiche (wenn sinnvoll)
- FAQ-Bereich am Ende

**Textlänge:**
${formData.contentLength === 'short' ? '500-800 Wörter: Fokus auf Essenz, keine Ausschweifungen' : ''}
${formData.contentLength === 'medium' ? '800-1200 Wörter: Balance zwischen Tiefe und Lesbarkeit' : ''}
${formData.contentLength === 'long' ? '1200-1800+ Wörter: Tiefgehende Exploration, bleib trotzdem spannend' : ''}

---

# ÜBERSCHRIFTEN-STRUKTUR (FLEXIBEL)

**H1:** Muss fesseln, nicht nur Keywords
- ✅ "Warum K-Active Tape die Physiotherapie revolutioniert"
- ❌ "K-Active Tape Gentle - Kinesiologie Tape"

**H2:** Erzähle eine Geschichte
- Für Produktseiten: "Das Problem", "Die Innovation dahinter", "Wie es funktioniert", "Wann es glänzt", "FAQ"
- Für Kategorieseiten: "Warum diese Kategorie?", "Evolution der Technologie", "Konzepte verstehen", "Marken & Philosophien", "Entscheidungshilfe", "FAQ"

**Keine starren Vorgaben** - passe Struktur dem Inhalt an!

---

# KRITISCHE REGELN

## NUR ECHTE DATEN:
- Produktnamen, Modelle, technische Specs NUR aus manufacturerInfo/additionalInfo
- KEINE erfundenen Studien oder Autoren
- Wenn Daten fehlen: Allgemein über Kategorie/Konzept schreiben

## TONALITÄT - ${addressStyle}

## E-E-A-T NATÜRLICH EINBINDEN:
- **Experience**: Praxisbeispiele, reale Anwendungsfälle
- **Expertise**: Fachterminologie (für Physios), Studien zitieren
- **Authoritativeness**: Zertifizierungen, Partnerschaften erwähnen
- **Trustworthiness**: Ehrlich über Grenzen, Pro & Contra

---

# AUSGABEFORMAT

Antworte IMMER im JSON-Format:
{
  "seoText": "HTML-formatierter Text mit H1, H2, H3, Listen, Tabellen",
  "faq": [{"question": "...", "answer": "..."}],
  "title": "Fesselnder Title Tag (max 60 Zeichen)",
  "metaDescription": "Überzeugende Meta Description (max 155 Zeichen)",
  "internalLinks": [{"url": "...", "anchorText": "..."}],
  "technicalHints": "Schema.org Empfehlungen",
  "eeatScore": {
    "experience": 0-10,
    "expertise": 0-10,
    "authoritativeness": 0-10,
    "trustworthiness": 0-10,
    "overall": 0-10,
    "improvements": ["Konkrete Tipps"]
  }${formData.complianceCheck ? `,
  "qualityReport": {
    "status": "green|yellow|red",
    "flags": [{"type": "mdr|hwg|study", "severity": "high|medium|low", "issue": "...", "rewrite": "..."}],
    "evidenceTable": [{"study": "...", "type": "...", "population": "...", "outcome": "...", "effect": "...", "limitations": "...", "source": "..."}]
  }` : ''}${formData.productComparisonEnabled ? `,
  "productComparison": "HTML-Produktvergleich"` : ''}
}`;
}

function buildHybridPrompt(formData: any, addressStyle: string): string {
  return `Du bist ein Experte für medizinische SEO-Texte, der wissenschaftliche Präzision mit praxisnaher Beratung verbindet. Deine Texte ranken bei Google UND begeistern die Zielgruppe.

# KERN-HIERARCHIE (in dieser Reihenfolge!)

1. **SEO-STRUKTUR** - Technische Optimierung für Rankings
2. **WISSENSCHAFTLICHE EVIDENZ** - Fundament der Glaubwürdigkeit
3. **PRAXISRELEVANZ** - Konkrete Anwendung und Entscheidungshilfe
4. **EMOTIONALE RESONANZ** - Verbindung zur Zielgruppe

Alle 4 Ebenen sind wichtig, aber SEO und Wissenschaft haben Vorrang!

---

# 1. SEO-STRUKTUR (NICHT VERHANDELBAR)

## FOKUS-KEYWORD PLATZIERUNG:
✅ **PFLICHT:**
- H1: Fokus-Keyword am Anfang (erste 3-5 Wörter)
- Erste 100 Wörter: Fokus-Keyword mindestens 1x
- H2-Überschriften: Fokus-Keyword oder Variante in 2-3 von 5-7 H2s
- Meta-Title: Fokus-Keyword in ersten 40 Zeichen
- Meta-Description: Fokus-Keyword in ersten 80 Zeichen

## KEYWORD-DICHTE:
- Fokus-Keyword: 1,5-2,5% des Gesamttextes
- LSI-Keywords (Synonyme/verwandte): 3-5 verschiedene, je 0,5-1%
- KEINE Angst vor Wiederholungen - Google braucht klare Signale!

## TECHNISCHE SEO-ELEMENTE:
- **Schema.org**: Product-Schema für Produktseiten, ItemList für Kategorieseiten
- **FAQ-Schema**: Mindestens 5 Fragen strukturiert
- **Interne Links**: 4-6 Links pro 1000 Wörter mit keyword-reichen Ankertexten
- **Strukturierte Überschriften**: H1 > H2 > H3 (niemals H-Level überspringen)
- **Listen & Tabellen**: Mindestens 2 Listen und 1 Tabelle für Featured Snippets

## TEXTLÄNGE (KONKRET):
- SHORT: 800-1200 Wörter (absolute Minimum für Ranking)
- MEDIUM: 1500-2000 Wörter (Standard für wettbewerbsfähige Keywords)
- LONG: 2500-3500+ Wörter (für High-Competition Keywords)

Analysiere die Top-3 bei Google für das Keyword → Schreibe 20-30% mehr!

---

# 2. WISSENSCHAFTLICHE EVIDENZ (FÜR ${formData.targetAudience === 'endCustomers' ? 'ENDKUNDEN' : 'PHYSIOTHERAPEUTEN'})

${formData.targetAudience === 'endCustomers' ? `
## FÜR ENDKUNDEN - VERTRAUEN AUFBAUEN:
- Erkläre wissenschaftliche Konzepte verständlich
- "Studien zeigen dass..." mit Jahreszahl
- Vermeide komplexe Fachbegriffe oder erkläre sie sofort
- Nutze Analogien aus dem Alltag
- Fokus auf Nutzen, Wissenschaft als Bestätigung
` : `
## FÜR PHYSIOTHERAPEUTEN - EVIDENZ IST HAUPTINHALT:

### STUDIEN ZITIEREN (PFLICHT):
- **Minimum**: 3-5 Studienreferenzen pro Haupttext
- **Format**: "Autor et al. (Jahr) zeigten in einem RCT (n=Teilnehmer, Follow-up)..."
- **Evidenz-Level IMMER nennen**: Level I (RCT), Level II (systematische Reviews), Level III (Kohortenstudien)
- **Outcomes konkret**: "VAS-Reduktion 6,8±1,2 auf 2,4±0,9 (p<0,001)"
- **Effektstärken**: NNT (Number Needed to Treat), Cohen's d, Odds Ratio wo relevant

### FACHTERMINOLOGIE (SELBSTVERSTÄNDLICH NUTZEN):
- ICD-10 Codes bei Indikationen: "M75.0 (Adhäsive Kapsulitis)"
- ICF-Klassifikation für funktionelle Einschränkungen
- Biomechanische Parameter: "bei 60°/s isokinetischer Geschwindigkeit"
- Pathophysiologie: "durch reduzierte IL-6 und TNF-α Expression"
- Klinische Scores: VAS, DASH, Oswestry, WOMAC, SF-36

### EVIDENZ-BASIERTE PROTOKOLLE:
- Behandlungsfrequenz: "3x wöchentlich über 6 Wochen (Level I Evidenz)"
- Dosierung: "10 Wiederholungen, 3 Sätze, 70% 1RM"
- Progression: "Steigerung um 10% alle 2 Wochen basierend auf Schmerzfreiheit"
- Kontraindikationen: "Absolut: akute Thrombose, frische Frakturen. Relativ: lokale Entzündung"

### WISSENSCHAFTLICHE EINORDNUNG:
- Vergleiche verschiedene Interventionen: "TENS vs. NMES: RR 1,23 (95% CI 1,05-1,44)"
- Benenne Studienlimitationen: "Limitation: kleine Sample-Size (n=45), kein Langzeit-Follow-up"
- Zeige Evidenzlücken transparent: "Für chronische Phase >6 Monate fehlt Level I Evidenz"
`}

---

# 3. PRAXISRELEVANZ - KLARE KAUFENTSCHEIDUNG

## STRUKTUR JEDER SEITE:

### FÜR PRODUKTSEITEN:
1. **Sofort-Nutzen** (erste 50 Wörter): "Dieses Produkt löst [Problem] durch [Lösung]"
2. **Für wen geeignet**: Klare Zielgruppen-Definition
3. **Kernfeatures mit Nutzen**: "0,1% Messgenauigkeit = objektive Verlaufskontrolle"
4. **Wissenschaftliche Fundierung**: Studien die Wirksamkeit belegen
5. **Anwendung**: Konkrete Protokolle und Integration
6. **Varianten-Vergleich**: "Modell A wenn..., Modell B wenn..."
7. **Pro & Contra**: Ehrliche Bewertung
8. **Kaufempfehlung**: "Ideal für [Szenario 1], optional für [Szenario 2]"

### FÜR KATEGORIESEITEN:
1. **Kategorie-Definition**: "Was gehört dazu, was nicht?"
2. **Warum diese Kategorie wichtig ist**: Problem das gelöst wird
3. **Technologie-Überblick**: Wie funktioniert das grundsätzlich?
4. **Auswahlkriterien**: "5 Faktoren für die richtige Wahl"
5. **Marken & Hersteller**: Überblick mit Philosophie
6. **Anwendungsszenarien**: Verschiedene Einsatzbereiche
7. **Evidenz**: Was sagt die Forschung zur Kategorie?
8. **Entscheidungshilfe**: Flowchart oder klare Wenn-Dann-Regeln

## KAUFBERATUNG (KONKRET):
- **ROI berechnen**: "Bei 25 Patienten/Woche amortisiert in 18 Monaten"
- **Zeitersparnis**: "Diagnostik in 8 statt 25 Minuten = 17 Min. pro Patient"
- **Investitionskosten transparent**: "3.200€ vs. 1.800€ - Unterschied liegt in..."
- **Alternativen nennen**: "Wenn Budget limitiert: Alternative X für 40% der Funktionen"

---

# 4. EMOTIONALE RESONANZ (SUBTIL EINGESTREUT)

## PRAXISSZENARIEN (KURZ & KONKRET):
❌ NICHT: Lange ausschweifende Story
✅ SONDERN: Kompakte Situation mit Outcome
- "Patient mit Frozen Shoulder, 8 Monate Therapie ohne Fortschritt. Mit K-Force objektive Kraft-Messung: ROM 45°→135° in 6 Wochen dokumentiert. Patient trainiert eigenständig weiter."

## TONALITÄT:
- **Kollegial**: "Du kennst das sicher..."
- **Faktenbasiert**: Zahlen und Studien zuerst, dann Emotion
- **Ehrlich**: Pro UND Contra transparent
- **Respektvoll**: Keine Basics erklären, Expertise voraussetzen

## RHETORISCHE MITTEL (SPARSAM):
- Fragen nur wenn sie zum Denken anregen
- Kurze Sätze nur zur Betonung
- KEINE Marketing-Superlative ohne Beleg
- KEINE erzwungenen Metaphern

---

# SCHREIBSTIL - NATÜRLICH & PRÄZISE

## VARIIERE BEWUSST:
- Satzlänge: Mische kurze Hauptsätze mit komplexeren Satzgefügen
- Absatzlänge: 2-6 Sätze, durchschnittlich 3-4
- Beginne Absätze unterschiedlich: Frage, Aussage, Zahl, Beispiel

## ANTI-KI MERKMALE:
- Nutze Gedankenstriche – für Einschübe
- Einzelne kurze Sätze. Strategisch platziert.
- Variiere Bindewörter: aber, allerdings, jedoch, wobei, doch
- VERMEIDE: "Erstens, Zweitens, Drittens"
- VERMEIDE: Zu perfekte Parallelstrukturen
- VERMEIDE: Übertriebene Adjektivhäufungen

## STRUKTURELEMENTE (REICHLICH):
- **Listen**: Minimum 3-4 pro Text für Vorteile, Features, Anwendungen
- **Tabellen**: Minimum 1-2 für Vergleiche, technische Daten
- **Hervorhebungen**: Sparsam für wirklich wichtige Begriffe
- **Blockquotes**: Für Expertentipps oder wichtige Hinweise

---

# ÜBERSCHRIFTEN-STRUKTUR (KONKRET)

## H1 (60-70 Zeichen):
- Format: "[Fokus-Keyword] - [Hauptnutzen/USP]"
- Beispiel Produkt: "K-Force Dynamometer - Präzise Kraftdiagnostik für die Physiotherapie"
- Beispiel Kategorie: "Kraftmesssysteme - Der ultimative Guide für evidenzbasierte Diagnostik"

## H2 (5-7 HAUPTKAPITEL):
Standard-Struktur für Produktseiten:
1. "Was ist [Produkt]? Funktion und Technologie" (300-400 Wörter)
2. "Wissenschaftliche Evidenz für [Produkt/Anwendung]" (400-600 Wörter)
3. "[Produkt] in der Praxis: Anwendung und Protokolle" (400-500 Wörter)
4. "Varianten und Modelle im Vergleich" (300-400 Wörter)
5. "Für wen ist [Produkt] geeignet? Entscheidungshilfe" (250-350 Wörter)
6. "Häufig gestellte Fragen" (FAQ-Bereich)

Standard-Struktur für Kategorieseiten:
1. "Was sind [Kategorie]? Definition und Abgrenzung" (250-350 Wörter)
2. "Wie funktionieren moderne [Kategorie]? Technologie-Überblick" (400-500 Wörter)
3. "Wissenschaftliche Evidenz zur [Kategorie]" (500-700 Wörter)
4. "Auswahlkriterien: Die 5 wichtigsten Faktoren" (400-500 Wörter)
5. "Hersteller und Marken im Überblick" (300-400 Wörter)
6. "Integration in den Praxisalltag" (300-400 Wörter)
7. "Häufig gestellte Fragen" (FAQ-Bereich)

---

# KRITISCHE REGELN

## NUR ECHTE DATEN VERWENDEN:
- Produktnamen, Modelle, technische Specs NUR aus manufacturerInfo/additionalInfo
- KEINE erfundenen Studien oder Autoren
- KEINE erfundenen Preise oder Features
- Wenn Daten fehlen: Allgemein über Kategorie schreiben, nicht spezifisch werden

## E-E-A-T KONKRET UMSETZEN:
- **Experience**: "In der klinischen Anwendung seit 2018 bewährt"
- **Expertise**: Studien zitieren, Fachterminologie, biomechanische Details
- **Authoritativeness**: Zertifizierungen nennen (CE, FDA, MDR), Partnerschaften
- **Trustworthiness**: Pro/Contra transparent, Quellenangaben, Einschränkungen benennen

## TONALITÄT - ${addressStyle}
- Respektvoll und professionell
- Faktenbasiert vor emotional
- Ehrlich statt verkäuferisch
- Kollegial ohne anbiedernd zu sein


# AUSGABEFORMAT

Antworte IMMER im JSON-Format mit dieser Struktur:
{
  "seoText": "HTML-formatierter Text mit H1, H2, H3, etc.",
  "faq": [{"question": "...", "answer": "..."}],
  "title": "Title Tag max 60 Zeichen mit Fokus-Keyword vorne",
  "metaDescription": "Meta Description max 155 Zeichen mit Fokus-Keyword in ersten 80 Zeichen",
  "internalLinks": [{"url": "...", "anchorText": "keyword-reicher Ankertext"}],
  "technicalHints": "Schema.org Markup Empfehlungen (Product, FAQ, HowTo)",
  "eeatScore": {
    "experience": 0-10,
    "expertise": 0-10,
    "authoritativeness": 0-10,
    "trustworthiness": 0-10,
    "overall": 0-10,
    "improvements": ["Konkrete Verbesserungsvorschläge"]
  }${formData.complianceCheck ? `,
  "qualityReport": {
    "status": "green|yellow|red",
    "flags": [{"type": "mdr|hwg|study", "severity": "high|medium|low", "issue": "...", "rewrite": "..."}],
    "evidenceTable": [{"study": "...", "type": "...", "population": "...", "outcome": "...", "effect": "...", "limitations": "...", "source": "..."}]
  }` : ''}${formData.productComparisonEnabled ? `,
  "productComparison": "HTML-formatierter Produktvergleich"` : ''}
}`;
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

1. **SEO FIRST**: Fokus-Keyword gemäß Vorgaben platzieren, Textlänge einhalten
2. **WISSENSCHAFT FIRST** (für Physios): Minimum 3-5 Studienreferenzen mit korrekter Zitierweise
3. **KONKRETE KAUFBERATUNG**: Klare Empfehlungen für verschiedene Szenarien
4. **NUR ECHTE DATEN**: Ausschließlich Infos aus den Herstellerangaben oben verwenden
5. **STRUKTURIERT**: Listen, Tabellen, klare H-Hierarchie für Featured Snippets

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
