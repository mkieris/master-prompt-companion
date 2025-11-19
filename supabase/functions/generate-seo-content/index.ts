import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
      complianceCheck: formData.complianceCheck,
      briefingFiles: formData.briefingFiles?.length || 0
    });

    // Process uploaded briefing files if any
    let briefingContent = '';
    if (formData.briefingFiles && formData.briefingFiles.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const briefingPromises = formData.briefingFiles.map(async (filePath: string) => {
        try {
          const { data, error } = await supabase.storage
            .from('briefings')
            .download(filePath);

          if (error) {
            console.error(`Error downloading file ${filePath}:`, error);
            return null;
          }

          const text = await data.text();
          return `\n\n=== Dokument: ${filePath.split('/').pop()} ===\n${text.substring(0, 10000)}`;
        } catch (err) {
          console.error(`Error processing file ${filePath}:`, err);
          return null;
        }
      });

      const briefings = await Promise.all(briefingPromises);
      briefingContent = briefings.filter(Boolean).join('\n');
      
      if (briefingContent) {
        console.log('Processed briefing files:', formData.briefingFiles.length);
        
        // Summarize the briefing content using AI
        console.log('Summarizing briefing content...');
        const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: 'Du bist ein Experte für die Zusammenfassung von Briefing-Dokumenten. Extrahiere die wichtigsten Punkte, Produktinformationen, Zielgruppendetails, USPs und relevante Fakten. Strukturiere die Zusammenfassung klar und prägnant.' 
              },
              { 
                role: 'user', 
                content: `Fasse folgende Briefing-Dokumente auf die wichtigsten Punkte zusammen:\n\n${briefingContent}` 
              }
            ],
            temperature: 0.3,
          }),
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const summary = summaryData.choices[0].message.content;
          briefingContent = `\n\n=== ZUSAMMENFASSUNG DER BRIEFING-DOKUMENTE ===\n${summary}\n`;
          console.log('Briefing successfully summarized');
        } else {
          console.error('Failed to summarize briefing, using original content');
        }
      }
    }

    // Build the system prompt based on the requirements
    const systemPrompt = buildSystemPrompt(formData);
    const userPrompt = buildUserPrompt(formData, briefingContent);

    // Check if this is a refinement or quick change request
    let messages;
    if (formData.quickChange && formData.existingContent) {
      console.log('Processing quick change request');
      
      // Build a quick change prompt based on what changed
      let changeInstructions = 'Passe den folgenden Text an:\n\n';
      
      if (formData.tonality) {
        const tonalityDescriptions: Record<string, string> = {
          'expert-mix': 'Expertenmix: 70% Fachwissen, 20% Lösungsorientierung, 10% Storytelling - wissenschaftlich-professionell für Fachpublikum',
          'consultant-mix': 'Beratermix: 40% Fachwissen, 40% Lösungsorientierung, 20% Storytelling - beratend-partnerschaftlich',
          'storytelling-mix': 'Storytelling-Mix: 30% Fachwissen, 30% Lösungsorientierung, 40% Storytelling - emotional und inspirierend',
          'conversion-mix': 'Conversion-Mix: 20% Fachwissen, 60% Lösungsorientierung, 20% Storytelling - verkaufsstark und nutzenorientiert',
          'balanced-mix': 'Balanced-Mix: je 33% - ausgewogen für breites Publikum'
        };
        changeInstructions += `- Ändere die Tonalität zu: ${tonalityDescriptions[formData.tonality] || formData.tonality}\n`;
      }
      
      if (formData.formOfAddress) {
        changeInstructions += `- Ändere die Anredeform zu: ${formData.formOfAddress === 'du' ? 'Du-Form (du, dich, dein)' : 'Sie-Form (Sie, Ihnen, Ihr)'}\n`;
      }
      
      if (formData.wordCount) {
        const wordCountMap: Record<string, string> = {
          'short': '300-500 Wörter',
          'medium': '500-800 Wörter',
          'long': '800-1200 Wörter',
          'very-long': '1200-1800 Wörter'
        };
        changeInstructions += `- Passe die Textlänge an auf: ${wordCountMap[formData.wordCount] || formData.wordCount}\n`;
      }
      
      if (formData.keywordDensity) {
        const densityMap: Record<string, string> = {
          'minimal': '0.5-1% Keyword-Dichte',
          'normal': '1-2% Keyword-Dichte',
          'high': '2-3% Keyword-Dichte'
        };
        changeInstructions += `- Passe die Keyword-Dichte an auf: ${densityMap[formData.keywordDensity] || formData.keywordDensity}\n`;
      }
      
      if (typeof formData.includeFAQ === 'boolean') {
        changeInstructions += `- FAQ-Bereich: ${formData.includeFAQ ? 'Hinzufügen falls nicht vorhanden' : 'Entfernen falls vorhanden'}\n`;
      }
      
      messages = [
        { 
          role: 'system', 
          content: 'Du bist ein erfahrener SEO-Texter. Passe den vorhandenen Text gemäß den Anweisungen an. Behalte die JSON-Struktur bei und passe die relevanten Teile entsprechend der neuen Parameter an. Der Text soll weiterhin hochwertig und SEO-optimiert sein.' 
        },
        { 
          role: 'user', 
          content: `${changeInstructions}\n\nAktueller Text:\n${JSON.stringify(formData.existingContent, null, 2)}\n\nGib den angepassten Text im gleichen JSON-Format zurück.` 
        }
      ];
    } else if (formData.refinementPrompt && formData.existingContent) {
      console.log('Processing refinement request');
      messages = [
        { role: 'system', content: 'Du bist ein erfahrener SEO-Texter. Überarbeite den vorhandenen Text gemäß den Anweisungen des Nutzers. Behalte die JSON-Struktur bei und passe nur die relevanten Teile an.' },
        { role: 'user', content: `Hier ist der aktuelle Text:\n\n${JSON.stringify(formData.existingContent, null, 2)}\n\nBitte überarbeite den Text wie folgt:\n${formData.refinementPrompt}\n\nGib den kompletten überarbeiteten Text im gleichen JSON-Format zurück.` }
      ];
    } else {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
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
  
  // Tonalität-Mix mit präziser Gewichtungssteuerung
  const tonalityMap: Record<string, { description: string; weights: string; instructions: string }> = {
    'expert-mix': {
      description: "Expertenmix - Für B2B-Entscheider & wissenschaftliche Produkte",
      weights: "70% Fachwissen • 20% Lösungsorientierung • 10% Storytelling",
      instructions: `
**GEWICHTUNG STRIKT EINHALTEN:**
- 70% FACHWISSEN: Nutze präzise Fachterminologie, evidenzbasierte Aussagen, technische Details, Studienergebnisse. Zeige tiefe Expertise.
- 20% LÖSUNGSORIENTIERUNG: Zeige konkrete Anwendungsfälle, praktische Implementierung, messbare Resultate. Was löst das Produkt?
- 10% STORYTELLING: Kurze Praxisbeispiele aus dem professionellen Kontext, keine emotionalen Geschichten. Fokus bleibt auf Fakten.

**TON:** Wissenschaftlich-professionell, autoritativ, faktenbasiert. Zielgruppe: Fachpublikum, Ärzte, Wissenschaftler, B2B-Entscheider.`
    },
    'consultant-mix': {
      description: "Beratermix - Für Vergleichsphase & Problem-aware Käufer",
      weights: "40% Fachwissen • 40% Lösungsorientierung • 20% Storytelling",
      instructions: `
**GEWICHTUNG STRIKT EINHALTEN:**
- 40% FACHWISSEN: Erkläre Zusammenhänge fundiert aber verständlich. Nutze Fachbegriffe mit Erklärungen. Beweise Kompetenz ohne zu überfordern.
- 40% LÖSUNGSORIENTIERUNG: Stehe im Zentrum! Zeige konkrete Problemlösungen, Nutzenargumente, Vergleichsvorteile. "Warum DIESE Lösung?"
- 20% STORYTELLING: Nutze Fallbeispiele, Kundenszenarien, "Vorher-Nachher"-Situationen. Schaffe Identifikation mit der Problemstellung.

**TON:** Beratend-partnerschaftlich, lösungsorientiert, vertrauensbildend. Zielgruppe: Informierte Käufer in der Entscheidungsphase.`
    },
    'storytelling-mix': {
      description: "Storytelling-Mix - Für emotional getriebene Käufe & Lifestyle-Produkte",
      weights: "30% Fachwissen • 30% Lösungsorientierung • 40% Storytelling",
      instructions: `
**GEWICHTUNG STRIKT EINHALTEN:**
- 30% FACHWISSEN: Liefere genug Fakten für Glaubwürdigkeit, aber verpacke sie in Geschichten. Erkläre, warum es funktioniert - ohne Fachsprache.
- 30% LÖSUNGSORIENTIERUNG: Zeige die Transformation: Wie verändert das Produkt den Alltag? Was wird besser, leichter, schöner?
- 40% STORYTELLING: IM ZENTRUM! Erzähle emotionale Geschichten von echten Anwendern, schaffe Bilder, nutze sensorische Sprache (fühlen, spüren, erleben). Baue emotionale Verbindungen auf.

**TON:** Emotional, inspirierend, lebendig, nahbar. Zielgruppe: Lifestyle-orientierte Käufer, emotionale Kaufentscheidungen.`
    },
    'conversion-mix': {
      description: "Conversion-Mix - Für Produktseiten & klare Problemlösungen",
      weights: "20% Fachwissen • 60% Lösungsorientierung • 20% Storytelling",
      instructions: `
**GEWICHTUNG STRIKT EINHALTEN:**
- 20% FACHWISSEN: Nur das nötigste an Fakten - genug für Glaubwürdigkeit, aber nicht mehr. Halte es einfach.
- 60% LÖSUNGSORIENTIERUNG: IM ZENTRUM! Jeder Absatz muss einen konkreten Nutzen kommunizieren. "Was habe ICH davon?" Klare Vorteile, messbare Resultate, starke Call-to-Actions. VERKAUFE!
- 20% STORYTELLING: Kurze, prägnante Erfolgsbeispiele. "Kunde X hatte Problem Y, jetzt Lösung Z." Halte es konkret und actionable.

**TON:** Überzeugend, verkaufsstark, nutzenorientiert, handlungsauffordernd. Zielgruppe: Kaufbereite Nutzer auf Produktseiten.`
    },
    'balanced-mix': {
      description: "Balanced-Mix - Für ganzheitliche Landingpages & Kategorie-Seiten",
      weights: "33% Fachwissen • 33% Lösungsorientierung • 33% Storytelling",
      instructions: `
**GEWICHTUNG STRIKT EINHALTEN:**
- 33% FACHWISSEN: Liefere fundierte, aber verständliche Informationen. Baue Vertrauen durch Expertise auf, ohne zu überfordern.
- 33% LÖSUNGSORIENTIERUNG: Zeige vielfältige Anwendungsfälle, verschiedene Nutzenargumente, breites Lösungsspektrum. Decke unterschiedliche Bedürfnisse ab.
- 33% STORYTELLING: Mix aus rationalen Fallbeispielen und emotionalen Geschichten. Sprich verschiedene Käufertypen an.

**TON:** Ausgewogen, vielseitig, für breites Publikum zugänglich. Zielgruppe: Diverse Besuchergruppen auf Übersichtsseiten.`
    }
  };

  const tonalityConfig = tonalityMap[formData.tonality] || {
    description: "Standard-Mix (Fallback)",
    weights: "40% Fachwissen • 40% Lösungsorientierung • 20% Storytelling",
    instructions: "Beratend und vertrauensvoll - kombiniere Fachkompetenz mit zugänglicher Sprache."
  };

  const tonalityStyle = `
## TONALITÄT: ${tonalityConfig.description}
${tonalityConfig.weights}

${tonalityConfig.instructions}`;
  
  return `Du bist ein erfahrener SEO-Texter für medizinische und therapeutische Produkte. Du verfasst hilfreiche, präzise, gut strukturierte SEO-Texte.

**WICHTIG: LEBENDIGE, AKTIVIERENDE SPRACHE**
- ${addressStyle}
- Vermeide langweilige Fachsprache
- Nutze aktive Verben statt Passivkonstruktionen
- Schaffe emotionale Verbindungen durch konkrete Nutzenbeispiele
- Verwende Storytelling-Elemente
- Stelle Fragen, die den Leser direkt ansprechen
- Nutze sensorische Sprache (fühlen, spüren, erleben)
- Vermeide Floskeln wie "hochwertig", "qualitativ", "modern" ohne konkrete Belege

${tonalityStyle}

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

ZIELGRUPPE: ${formData.targetAudience === 'endCustomers' ? 'Endkunden - leichte Sprache, direkte Ansprache, praktischer Nutzen im Vordergrund' : 'Physiotherapeuten - fachlich präzise, Evidenz-basiert, Indikationen/Kontraindikationen beachten'}

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
  "technicalHints": "Schema.org Empfehlungen",
  "qualityReport": {
    "status": "green|yellow|red",
    "flags": [{"type": "mdr|hwg|study", "severity": "high|medium|low", "issue": "...", "rewrite": "..."}],
    "evidenceTable": [{"study": "...", "type": "...", "population": "...", "outcome": "...", "effect": "...", "limitations": "...", "source": "..."}]
  }
}`;
}

function buildUserPrompt(formData: any, briefingContent: string = ''): string {
  const goalMap = {
    inform: 'Informieren und aufklären',
    advise: 'Beraten und Empfehlungen geben',
    preparePurchase: 'Kaufentscheidung vorbereiten',
    triggerPurchase: 'Direkten Kaufimpuls setzen'
  };

  const addressMap = {
    du: 'Du-Form (persönlich und direkt)',
    sie: 'Sie-Form (höflich und förmlich)',
    neutral: 'Neutral (keine direkte Anrede, sachlich)'
  };

  const tonalityLabels: Record<string, string> = {
    professional: 'Professionell & Sachlich',
    scientific: 'Wissenschaftlich & Präzise',
    educational: 'Lehrreich & Verständlich',
    friendly: 'Freundlich & Zugänglich',
    empathetic: 'Empathisch & Verständnisvoll',
    trustworthy: 'Vertrauenswürdig & Transparent',
    persuasive: 'Überzeugend & Verkaufsstark',
    'benefit-focused': 'Nutzen-fokussiert & Lösungsorientiert',
    urgent: 'Dringlich & Handlungsauffordernd',
    premium: 'Premium & Exklusiv',
    storytelling: 'Storytelling & Emotional',
    innovative: 'Innovativ & Zukunftsorientiert'
  };

  // Build compliance info
  let complianceInfo = '';
  if (formData.complianceChecks && (formData.complianceChecks.mdr || formData.complianceChecks.hwg || formData.complianceChecks.studies)) {
    const activeChecks = [];
    if (formData.complianceChecks.mdr) activeChecks.push('MDR/MPDG-Konformität');
    if (formData.complianceChecks.hwg) activeChecks.push('HWG-Konformität');
    if (formData.complianceChecks.studies) activeChecks.push('Studienbasierte Aussagen');
    complianceInfo = `\n\nCOMPLIANCE-PRÜFUNGEN AKTIV:\n${activeChecks.join('\n')}\nBitte beachte diese Anforderungen bei der Texterstellung und erstelle am Ende einen Compliance-Bericht.`;
  }

  // Build layout structure description
  let layoutStructure = '\n\n=== SEITENLAYOUT-STRUKTUR ===\n';
  if (formData.includeIntro) {
    layoutStructure += '✓ EINLEITUNG: Kurze, fesselnde Einleitung am Anfang (ca. 100-150 Wörter) mit Fokus-Keyword\n';
  }
  if (formData.imageTextBlocks && formData.imageTextBlocks > 0) {
    layoutStructure += `✓ BILD-TEXT-BLÖCKE: ${formData.imageTextBlocks} abwechselnde Text-Bild-Abschnitte\n`;
    layoutStructure += '  - Jeder Block behandelt einen spezifischen Aspekt/Vorteil\n';
    layoutStructure += '  - Blöcke alternieren: Text links/Bild rechts, dann Text rechts/Bild links\n';
    layoutStructure += '  - Nutze starke, überzeugende Zwischenüberschriften für jeden Block\n';
  }
  if (formData.includeTabs) {
    layoutStructure += '✓ TAB-STRUKTUR: Organisiere zusätzliche Informationen in Tabs\n';
    layoutStructure += '  Empfohlene Tabs: Technische Daten | Anwendungsbereiche | Zubehör & Erweiterungen | Downloads\n';
    layoutStructure += '  - Jeder Tab enthält strukturierte, leicht erfassbare Informationen\n';
  }
  if (formData.includeFAQ) {
    layoutStructure += '✓ FAQ-BEREICH: Umfangreicher FAQ-Block am Ende mit 5-8 relevanten Fragen\n';
  }

  return `
=== SCHRITT 1: PRODUKTINFORMATIONEN ===
${formData.manufacturerName ? `Herstellername: ${formData.manufacturerName}` : ''}
${formData.manufacturerWebsite ? `Hersteller-Website: ${formData.manufacturerWebsite}` : ''}
${formData.productName ? `Produktname: ${formData.productName}` : ''}
${formData.productUrls && formData.productUrls.length > 0 ? `Produkt-URLs:\n${formData.productUrls.map((url: string) => `- ${url}`).join('\n')}` : ''}
${formData.additionalInfo ? `Zusätzliche Informationen/USPs:\n${formData.additionalInfo}` : ''}

=== SCHRITT 2: ZIELGRUPPE & ANSPRACHE ===
Zielgruppe: ${formData.targetAudience || 'Nicht angegeben'}
Anrede: ${addressMap[formData.formOfAddress as keyof typeof addressMap] || 'Du-Form'}
Sprache: ${formData.language || 'Deutsch'}
Tonalität: ${tonalityLabels[formData.tonality] || formData.tonality || 'Beratend und vertrauensvoll'}

=== SCHRITT 3: TEXTSTRUKTUR & SEO ===
Fokus-Keyword: ${formData.focusKeyword}
${formData.secondaryKeywords && formData.secondaryKeywords.length > 0 ? `Sekundär-Keywords: ${formData.secondaryKeywords.join(', ')}` : ''}${layoutStructure}
Wortanzahl: ${formData.wordCount || '800-1200'} Wörter
Überschriftenstruktur: ${formData.headingStructure || 'H1 > H2 > H3'}
Ziel der Seite: ${goalMap[formData.pageGoal as keyof typeof goalMap] || 'Informieren'}
${formData.contentStructure ? `\nZusätzliche Struktur-Anforderungen:\n${formData.contentStructure}` : ''}
${briefingContent ? `\n\n=== HOCHGELADENE BRIEFING-DOKUMENTE ===\nBerücksichtige folgende Informationen aus den hochgeladenen Dokumenten:${briefingContent}` : ''}${complianceInfo}

=== AUFGABE ===
Erstelle einen hochwertigen, SEO-optimierten Text, der:
- Alle Keyword-Vorgaben natürlich integriert
- Die definierte Seitenlayout-Struktur exakt umsetzt
- Auf die Zielgruppe zugeschnitten ist
- Das definierte Ziel der Seite erreicht
- Überschriften und Text perfekt aufeinander abstimmt
- Die gewählte Tonalität konsequent umsetzt
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
