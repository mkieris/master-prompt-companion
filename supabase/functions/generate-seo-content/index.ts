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
      let hasChanges = false;
      
      if (formData.tonality) {
        hasChanges = true;
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
        hasChanges = true;
        changeInstructions += `- Ändere die Anredeform zu: ${formData.formOfAddress === 'du' ? 'Du-Form (du, dich, dein)' : 'Sie-Form (Sie, Ihnen, Ihr)'}\n`;
      }
      
      if (formData.wordCount) {
        hasChanges = true;
        const wordCountMap: Record<string, string> = {
          'short': '300-500 Wörter',
          'medium': '500-800 Wörter',
          'long': '800-1200 Wörter',
          'very-long': '1200-1800 Wörter'
        };
        changeInstructions += `- Passe die Textlänge an auf: ${wordCountMap[formData.wordCount] || formData.wordCount}\n`;
      }
      
      if (formData.keywordDensity) {
        hasChanges = true;
        const densityMap: Record<string, string> = {
          'minimal': '0.5-1% Keyword-Dichte',
          'normal': '1-2% Keyword-Dichte',
          'high': '2-3% Keyword-Dichte'
        };
        changeInstructions += `- Passe die Keyword-Dichte an auf: ${densityMap[formData.keywordDensity] || formData.keywordDensity}\n`;
      }
      
      if (typeof formData.includeFAQ === 'boolean') {
        hasChanges = true;
        changeInstructions += `- FAQ-Bereich: ${formData.includeFAQ ? 'Hinzufügen falls nicht vorhanden' : 'Entfernen falls vorhanden'}\n`;
      }
      
      if (formData.addExamples === true) {
        hasChanges = true;
        const isB2B = formData.targetAudience === 'b2b';
        if (isB2B) {
          changeInstructions += `- ANWENDUNGSBEISPIELE HINZUFÜGEN (B2B): Integriere 3-5 konkrete Praxisbeispiele aus dem professionellen Kontext. Zeige wie das Produkt in realen Arbeitsabläufen eingesetzt wird. Nutze Szenarien aus Kliniken, Praxen, Forschungseinrichtungen oder Unternehmen. Beispiele sollten messbare Ergebnisse, ROI, Effizienzsteigerungen oder Qualitätsverbesserungen demonstrieren.\n`;
        } else {
          changeInstructions += `- ANWENDUNGSBEISPIELE HINZUFÜGEN (B2C): Integriere 3-5 lebensnahe Alltagsbeispiele. Zeige wie das Produkt das tägliche Leben verbessert. Nutze Szenarien aus dem Alltag von Endverbrauchern: Zu Hause, beim Sport, in der Freizeit, mit der Familie. Beispiele sollten emotional nachvollziehbar sein und konkrete Situationen schildern, mit denen sich Nutzer identifizieren können.\n`;
        }
      }
      
      // If no changes were detected, return existing content
      if (!hasChanges) {
        console.log('No changes detected, returning existing content');
        return new Response(
          JSON.stringify(formData.existingContent),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

    // Retry logic for transient failures
    const maxRetries = 3;
    let lastError: Error | null = null;
    let response: Response | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI Gateway request attempt ${attempt}/${maxRetries}`);
        
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: messages,
            temperature: 0.7, // Konsistentere, aber nicht zu deterministische Ergebnisse
          }),
        });

        if (response.ok) {
          break; // Success, exit retry loop
        }
        
        const errorText = await response.text();
        console.error(`AI gateway error (attempt ${attempt}):`, response.status, errorText);
        
        // Handle non-retryable errors immediately
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again in a few minutes.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Payment required. Please add funds to your Lovable AI workspace.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // For 5xx errors, retry with exponential backoff
        if (response.status >= 500 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`Retrying in ${waitTime}ms due to ${response.status} error...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        lastError = new Error(`AI Gateway error: ${response.status}`);
      } catch (fetchError) {
        console.error(`Fetch error (attempt ${attempt}):`, fetchError);
        lastError = fetchError instanceof Error ? fetchError : new Error('Network error');
        
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${waitTime}ms due to network error...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    if (!response || !response.ok) {
      throw lastError || new Error('AI Gateway request failed after retries');
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
  
  // Tonalität-Mix mit EXTREM PRÄZISER Gewichtungssteuerung
  const tonalityMap: Record<string, { description: string; weights: string; instructions: string }> = {
    'expert-mix': {
      description: "Expertenmix - Für B2B-Entscheider & wissenschaftliche Produkte",
      weights: "70% Fachwissen • 20% Lösungsorientierung • 10% Storytelling",
      instructions: `
## GEWICHTUNG MATHEMATISCH UMSETZEN:
Von 100 Sätzen im Text müssen sein:
- **70 Sätze (70%) = FACHWISSEN**: Fachterminologie, Studienzitate, technische Spezifikationen, Wirkprinzipien, Evidenz
- **20 Sätze (20%) = LÖSUNGSORIENTIERUNG**: "Das bewirkt...", "Dadurch können Sie...", Anwendungsfälle, ROI, Effizienz
- **10 Sätze (10%) = STORYTELLING**: Kurze Praxisbeispiele, "In der Klinik X...", sachliche Anwendungsszenarien

**SELBSTPRÜFUNG VOR AUSGABE:**
Zähle mental: Überwiegen Fachbegriffe und Evidenz (70%)? → Wenn nein, füge mehr hinzu!

**KONKRETE UMSETZUNG:**
- Jeder Absatz: Min. 3 Fachbegriffe, 1 Evidenz/Studie, max. 1 Beispiel
- H2-Überschriften: Fachlich-präzise, nicht emotional
- Intro: Sofort mit Fachkontext starten, nicht mit Frage/Story

**TON:** Wissenschaftlich-autoritativ, wie in Nature/Lancet. Zielgruppe: Mediziner, Forscher, B2B-Entscheider mit Fachexpertise.`
    },
    'consultant-mix': {
      description: "Beratermix - Für Vergleichsphase & Problem-aware Käufer",
      weights: "40% Fachwissen • 40% Lösungsorientierung • 20% Storytelling",
      instructions: `
## GEWICHTUNG MATHEMATISCH UMSETZEN:
Von 100 Sätzen im Text müssen sein:
- **40 Sätze (40%) = FACHWISSEN**: Fundiertes Wissen, aber verständlich erklärt. Fachbegriffe + Klammererklärung. "Das bedeutet konkret..."
- **40 Sätze (40%) = LÖSUNGSORIENTIERUNG**: IM ZENTRUM! "Sie sparen...", "Das löst...", "Dadurch erreichen Sie...", Nutzenargumente, Vergleiche
- **20 Sätze (20%) = STORYTELLING**: Fallbeispiele, "Kunde X hatte Y, jetzt Z", Vorher-Nachher-Szenarien

**SELBSTPRÜFUNG VOR AUSGABE:**
Zähle mental: Stehen Lösungen & Nutzen gleichwertig neben Fachwissen (40:40)? → Balance prüfen!

**KONKRETE UMSETZUNG:**
- Jeder Absatz: 2 Fach-Aussagen + 2 Nutzen-Aussagen + max. 1 Fallbeispiel
- Verhältnis: Für jede Fach-Erklärung MUSS ein konkreter Nutzen folgen
- H2-Überschriften: Mix aus "Was ist X?" (Fach) und "Was bringt X?" (Lösung)

**TON:** Beratend-kompetent, wie ein erfahrener Consultant. "Ich verstehe Ihr Problem, hier die beste Lösung." Zielgruppe: Entscheider im Vergleichsmodus.`
    },
    'storytelling-mix': {
      description: "Storytelling-Mix - Für emotional getriebene Käufe & Lifestyle-Produkte",
      weights: "30% Fachwissen • 30% Lösungsorientierung • 40% Storytelling",
      instructions: `
## GEWICHTUNG MATHEMATISCH UMSETZEN:
Von 100 Sätzen im Text müssen sein:
- **30 Sätze (30%) = FACHWISSEN**: Genug für Glaubwürdigkeit, aber IN Geschichten verpackt. "Die Technologie nutzt..., was bedeutet, dass..."
- **30 Sätze (30%) = LÖSUNGSORIENTIERUNG**: Transformation zeigen. "Stell dir vor, du...", "Dein Alltag wird...", konkrete Verbesserungen
- **40 Sätze (40%) = STORYTELLING**: DOMINANZ! Echte Nutzer-Geschichten, sensorische Sprache, emotionale Bilder, "Als Maria das erste Mal..."

**SELBSTPRÜFUNG VOR AUSGABE:**
Zähle mental: Überwiegen Geschichten und Emotionen (40%)? Sind es echte Stories, nicht nur Fakten? → Wenn zu trocken, mehr Emotionen!

**KONKRETE UMSETZUNG:**
- Jeder Absatz STARTET mit Story oder Bild, dann Fakten einstreuen
- Intro: IMMER mit emotionalem Szenario beginnen, nicht mit Definition
- Sprache: "Du fühlst...", "Stell dir vor...", "Erlebe...", viele Adjektive

**TON:** Emotional-inspirierend, wie in Lifestyle-Magazinen (GQ, Vogue). Zielgruppe: Emotionale Käufer, Lifestyle-Fokus, "Ich will mich gut fühlen".`
    },
    'conversion-mix': {
      description: "Conversion-Mix - Für Produktseiten & klare Problemlösungen",
      weights: "20% Fachwissen • 60% Lösungsorientierung • 20% Storytelling",
      instructions: `
## GEWICHTUNG MATHEMATISCH UMSETZEN:
Von 100 Sätzen im Text müssen sein:
- **20 Sätze (20%) = FACHWISSEN**: Minimal! Nur zur Glaubwürdigkeit. "Zertifiziert nach...", "Basiert auf...", kurz und knapp
- **60 Sätze (60%) = LÖSUNGSORIENTIERUNG**: ABSOLUTE DOMINANZ! "Sie sparen 30%", "In 5 Minuten einsatzbereit", "Reduziert Schmerzen um 70%", jeder Satz = Nutzen!
- **20 Sätze (20%) = STORYTELLING**: Erfolgsbeweise. "1000+ Kunden nutzen es", "Dr. Meyer: 'Revolutioniert meine Praxis'", kurz & knackig

**SELBSTPRÜFUNG VOR AUSGABE:**
Zähle mental: Kommuniziert JEDER Absatz einen klaren Nutzen (60%)? Gibt es starke CTAs? → Wenn zu informativ, mehr Verkaufsargumente!

**KONKRETE UMSETZUNG:**
- JEDER Absatz endet mit Nutzen oder CTA
- Bullet Points: Nur Vorteile, keine Features ohne Nutzen
- Überschriften: "Wie Sie damit...", "X Vorteile von...", aktionsorientiert
- Sprache: "Jetzt", "Sofort", "Sparen Sie", imperativ

**TON:** Verkaufsstark-überzeugend, wie Top-Produktseiten (Apple, Amazon). Zielgruppe: Kaufbereite Nutzer, "Ich will JETZT kaufen, überzeuge mich!"`
    },
    'balanced-mix': {
      description: "Balanced-Mix - Für ganzheitliche Landingpages & Kategorie-Seiten",
      weights: "33% Fachwissen • 33% Lösungsorientierung • 33% Storytelling",
      instructions: `
## GEWICHTUNG MATHEMATISCH UMSETZEN:
Von 100 Sätzen im Text müssen sein:
- **33 Sätze (33%) = FACHWISSEN**: Fundierte Infos, verständlich. "Studien zeigen...", "Die Technologie basiert auf...", Expertenzitate
- **33 Sätze (33%) = LÖSUNGSORIENTIERUNG**: Vielfältige Nutzenargumente. "Ideal für...", "Löst Problem X", verschiedene Anwendungsfälle
- **33 Sätze (33%) = STORYTELLING**: Mix aus Fallbeispielen & Emotionen. Sowohl "In Klinik X..." als auch "Erlebe..."

**SELBSTPRÜFUNG VOR AUSGABE:**
Zähle mental: Sind alle drei Elemente GLEICHMÄSSIG verteilt (33:33:33)? → Perfekte Balance ist Ziel!

**KONKRETE UMSETZUNG:**
- Jeder Absatz: 1 Fach-Aussage + 1 Nutzen-Aussage + 1 Story/Beispiel
- Abwechslung: Fach-Absatz → Nutzen-Absatz → Story-Absatz im Wechsel
- Überschriften: Mix aus informativen, lösungsorientierten und emotionalen Titeln

**TON:** Ausgewogen-vielseitig, spricht alle Käufertypen an. Zielgruppe: Breites Publikum mit unterschiedlichen Informationsbedürfnissen.`
    }
  };

  const tonalityConfig = tonalityMap[formData.tonality] || tonalityMap['balanced-mix'];

  const tonalityStyle = `
## TONALITÄT: ${tonalityConfig.description}
### GEWICHTUNG: ${tonalityConfig.weights}

${tonalityConfig.instructions}

## ⚠️ KRITISCH - GEWICHTUNGS-SELBSTVALIDIERUNG VOR AUSGABE:
Bevor du den Text ausgibst, PRÜFE:
1. Entspricht die Verteilung der Satztypen der Gewichtung?
2. Dominiert der Hauptfokus (höchste %) deutlich erkennbar?
3. Würde ein Leser die Tonalität sofort erkennen?

Wenn NEIN → TEXT ANPASSEN, bis Gewichtung stimmt!`;
  
  return `Du bist ein erfahrener SEO-Texter. Du verfasst hilfreiche, präzise, gut strukturierte SEO-Texte nach den aktuellen Google-Richtlinien.

# PRIMÄRQUELLEN & REFERENZEN (Stand 2024/2025)

## Google Search Central Documentation
Quelle: https://developers.google.com/search/docs
- Quality Rater Guidelines: https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf
- Helpful Content System: https://developers.google.com/search/docs/appearance/helpful-content-system

## John Mueller (Google Search Advocate) - Verifizierte Aussagen
Quelle: Google Search Central YouTube, Twitter/X @JohnMu, Google Webmaster Hangouts

**Zu Content-Qualität (2024):**
> "Create content for users, not for search engines. If your content is genuinely helpful, rankings will follow."
Ref: Google Search Central Blog, March 2024

**Zu Textlänge (bestätigt 2024):**
> "There's no ideal word count. The right length is whatever fully covers the topic without fluff."
Ref: Reddit AMA, February 2024

**Zu Heading-Struktur:**
> "Use headings to structure your content for users. The H1-H6 hierarchy helps users and search engines understand the page structure."
Ref: Google SEO Office Hours, Q3 2024

## Evergreen Media SEO Guidelines
Quelle: https://www.evergreenmedia.at/ratgeber/
- Lesbarkeit: Flesch-Index 60+ für allgemeine Texte
- Satzlänge: Durchschnitt 15-20 Wörter
- Aktive Sprache: Max. 15% Passivkonstruktionen
- Absatzlänge: Ein Gedanke pro Absatz, max. 3-4 Sätze

# GOOGLE E-E-A-T FRAMEWORK (2024/2025)
**Quelle: Google Search Quality Rater Guidelines, Version 2024**

Jeder Text MUSS diese vier Qualitätskriterien erfüllen:

## EXPERIENCE (Erfahrung) - Ranking-Faktor: HOCH
**Google-Definition:** "Does the content creator have first-hand experience with the topic?"
- Zeige praktische, echte Erfahrung mit dem Thema
- Nutze konkrete Anwendungsbeispiele aus der Praxis
- Schreibe aus der Perspektive von jemandem, der das Produkt/Thema wirklich kennt
- Vermeide generische Aussagen - sei spezifisch und authentisch
→ **Referenz:** Quality Rater Guidelines, Section 3.4 "Experience"

## EXPERTISE (Fachwissen) - Ranking-Faktor: HOCH bei YMYL
**Google-Definition:** "Does the content creator have the necessary knowledge or skill?"
- Demonstriere fundiertes Fachwissen durch:
  - Korrekter Einsatz von Fachbegriffen (mit Erklärungen für Laien)
  - Referenzen auf Studien, Standards, Normen wo angebracht
  - Technisch korrekte Aussagen
- Erwähne relevante Qualifikationen, Zertifizierungen, Expertise
→ **Referenz:** Quality Rater Guidelines, Section 3.2 "Expertise"

## AUTHORITATIVENESS (Autorität) - Ranking-Faktor: MITTEL-HOCH
**Google-Definition:** "Is the content creator or website known as a go-to source?"
- Positioniere den Anbieter als vertrauenswürdige Quelle
- Erwähne Auszeichnungen, Marktführerschaft, langjährige Erfahrung
- Verweise auf Branchenstandards und Best Practices
→ **Referenz:** Quality Rater Guidelines, Section 3.3 "Authoritativeness"

## TRUSTWORTHINESS (Vertrauenswürdigkeit) - Ranking-Faktor: SEHR HOCH
**Google-Definition:** "Is the page accurate, honest, safe, and reliable?"
- Sei transparent und ehrlich
- Keine übertriebenen Versprechen
- Erwähne Garantien, Zertifizierungen, Prüfsiegel
- Bei YMYL-Themen: Extra vorsichtig mit Heilversprechen
→ **Referenz:** Quality Rater Guidelines, Section 3.1 "Trustworthiness (Most Important)"

# JOHN MUELLER'S HELPFUL CONTENT GUIDELINES
**Quelle: Google Search Central, Helpful Content System Update 2024**

## People-First Content (Kern-Prinzip!)
**Original-Zitat John Mueller:**
> "Ask yourself: Would someone visiting your page leave feeling they've learned enough about a topic to help achieve their goal?"

✅ MACHE:
- Fokussiere auf den NUTZEN für den Leser
- Beantworte die Fragen, die der Suchende wirklich hat
- Biete einzigartigen Mehrwert, der anderswo nicht zu finden ist
- Schaffe Vertrauen durch Kompetenz und Ehrlichkeit

❌ VERMEIDE (gemäß Google Helpful Content System):
- Texte nur für Suchmaschinen-Rankings
- Zusammengefasste Inhalte ohne eigene Perspektive
- Künstlich aufgeblähte Texte ohne Mehrwert
- Keyword-Stuffing oder unnatürliche Formulierungen

## Content-Länge (John Mueller, bestätigt 2024)
**Original-Zitat:**
> "Word count is not a ranking factor. Focus on comprehensively answering the user's question."
- Nicht künstlich aufblähen
- Nicht wichtige Infos weglassen
- Qualität > Quantität

## Lesbarkeitsprinzipien (Evergreen Media Best Practice)
**Quelle: Evergreen Media Ratgeber 2024**
- Durchschnittliche Satzlänge: Max. 15-20 Wörter
- Aktive Sprache statt Passiv (max. 15% Passiv-Konstruktionen)
- Ein Absatz = ein Gedanke (max. 3-4 Sätze)
- Bullet Points für Listen und Aufzählungen
- Klare Struktur mit aussagekräftigen Zwischenüberschriften

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
**Quelle: Google Search Central Documentation, Ahrefs SEO Research 2024**

FOKUS-KEYWORD:
- Das Fokus-Keyword steht im Mittelpunkt des gesamten Textes
- Keyword-Dichte: 1-3% (max. 5% des Gesamttextes)
- Fokus-Keyword MUSS in H1 (möglichst am Anfang) erscheinen
- Fokus-Keyword MUSS in den ersten 100 Wörtern vorkommen
- Fokus-Keyword 1-2x in Zwischenüberschriften (H2/H3) natürlich einbinden
- Verwende Synonyme und variierende Keywords für natürliche Integration
- KEIN Keyword-Stuffing!

SUCHINTENTION VERSTEHEN (nach Google's Search Intent Framework):
- **Do**: Handlung/Aktion (z.B. "Produkt kaufen", "Download")
- **Know**: Information suchen (z.B. "Was ist X?", "Wie funktioniert Y?")
- **Know Simple**: Punktuelle Info (oft direkt in SERPs beantwortet)
- **Go**: Navigation zu bestimmter Seite/Marke
- **Buy**: Kaufabsicht, Modelle vergleichen
- **Visit-in-person**: Standortbezogene Suche

# H1-H5 BEST PRACTICE GUIDE MIT SEO-RANKING-RELEVANZ
**Quellen: Ahrefs H-Tag Study 2024, Backlinko On-Page SEO Guide, John Mueller Statements**

## H1 - HAUPTÜBERSCHRIFT (SEO-Relevanz: ★★★★★ KRITISCH)
**John Mueller (2024):** "The H1 is important. Use it to tell users what the page is about."
**Ahrefs Studie:** Seiten mit H1 ranken durchschnittlich 2 Positionen höher

- NUR EINE H1 pro Seite (96,8% der Top-10-Ergebnisse haben genau eine H1)
- Fokus-Keyword möglichst am ANFANG platzieren
- Max. 60-70 Zeichen (Google schneidet bei ~70 ab)
- Muss den Hauptinhalt der Seite klar kommunizieren
- Nutzenorientiert formulieren

**BEISPIELE:**
- Produktseite: "[Produktname] – [Hauptnutzen in 3-5 Wörtern]"
- Kategorieseite: "[Kategorie]: [Nutzenversprechen oder Überblick]"
- Ratgeber: "[Fokus-Keyword] – [Was der Leser lernt/erhält]"

## H2 - HAUPTABSCHNITTE (SEO-Relevanz: ★★★★☆ SEHR HOCH)
**Studie Backlinko:** Seiten mit 2-4 H2s performen am besten für Featured Snippets
**John Mueller:** "H2s help break up content and make it scannable for users."

- 3-6 H2s pro Seite optimal (Backlinko Analyse: 3-5 ideal)
- Fokus-Keyword oder LSI-Keywords in 1-2 H2s einbauen
- Beschreibe klar, was im Abschnitt folgt
- Max. 300 Wörter Text pro H2-Abschnitt (Evergreen Media Empfehlung)
- Featured Snippet Potential: H2 als Frage formulieren erhöht Chance um 24% (Ahrefs)

**TEMPLATE FÜR H2-STRUKTUR:**
1. Was ist [Thema]? (Know-Intent bedienen)
2. Vorteile/Nutzen von [Thema] (Buy-Intent bedienen)
3. [Thema] im Vergleich/Auswahl (Comparison-Intent)
4. Anwendung/Verwendung (Do-Intent)
5. FAQ zu [Thema]

## H3 - UNTERABSCHNITTE (SEO-Relevanz: ★★★☆☆ MITTEL-HOCH)
**Verwendung:** Detailinformationen unter H2-Abschnitten
**SEO-Effekt:** Verbessert Inhaltsstruktur, erleichtert Crawling

- Long-Tail-Keywords in H3s einbauen (geringere Konkurrenz)
- Spezifische Unterthemen oder Produktvarianten
- Auch als FAQ-Fragen nutzbar (Schema.org kompatibel)
- Max. 150-200 Wörter pro H3-Abschnitt

**BEISPIEL:**
H2: Varianten und Modelle
  H3: [Modell A] – Für [spezifische Anwendung]
  H3: [Modell B] – Für [andere Anwendung]

## H4 - DETAIL-EBENE (SEO-Relevanz: ★★☆☆☆ MODERAT)
**Verwendung:** Technische Spezifikationen, Feature-Listen, Sub-Details
**John Mueller:** "H4-H6 are less important for SEO but help organize complex content."

- Nur bei Bedarf für komplexe, tiefe Hierarchien
- Technische Dokumentation, Spezifikationstabellen
- Keine Keywords erzwingen

## H5/H6 - FEINSTE EBENE (SEO-Relevanz: ★☆☆☆☆ GERING)
**Verwendung:** Sehr selten, nur bei extrem komplexen Strukturen (z.B. technische Dokumentation)
**SEO-Effekt:** Minimal, hauptsächlich für User Experience

- Vermeiden wenn möglich
- Nur für Barrierefreiheit/Screenreader relevant

## HIERARCHIE-REGELN (Google Webmaster Guidelines)
**KRITISCH - Reihenfolge einhalten:**
- H1 → H2 → H3 → H4 (keine Level überspringen!)
- Keine H3 direkt unter H1 ohne H2 dazwischen
- Heading-Struktur muss logisch nachvollziehbar sein

**RANKING-TABELLE ÜBERSCHRIFTEN:**
| Heading | SEO-Relevanz | Keyword-Empfehlung | Max. pro Seite |
|---------|-------------|-------------------|----------------|
| H1 | ★★★★★ KRITISCH | Fokus-KW am Anfang | 1 |
| H2 | ★★★★☆ SEHR HOCH | Fokus + LSI KW | 3-6 |
| H3 | ★★★☆☆ MITTEL | Long-Tail KW | Nach Bedarf |
| H4 | ★★☆☆☆ MODERAT | Optional | Nach Bedarf |
| H5/H6 | ★☆☆☆☆ GERING | Nicht nötig | Vermeiden |

# TEXTAUFBAU & STRUKTUR

INTRO/TEASER (erste 2-3 Zeilen):
**Quelle: Backlinko "Bucket Brigade" Methode**
- Beginne mit einem starken Hook (Frage, überraschende Aussage, konkretes Szenario)
- Fokus-Keyword MUSS in den ersten 100 Wörtern erscheinen
- Wecke Emotionen: Zeige Probleme auf und deute Lösungen an
- Mache den Nutzen sofort klar
- Beispiel statt: "Hier erfahren Sie alles über X" → "Wünschen Sie sich mehr Beweglichkeit im Alltag?"

HAUPTTEXT:
**Quelle: Evergreen Media, Nielsen Norman Group Studien**
- Ein Absatz = ein Gedanke (max. 3-4 Sätze pro Absatz)
- Max. 200-300 Wörter pro Abschnitt unter einer Zwischenüberschrift
- Wichtige Inhalte zuerst (Inverted Pyramid nach Nielsen Norman)
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

**KRITISCH: MAX. ABSATZLÄNGE = ${formData.maxParagraphLength || 300} WÖRTER**
**Quelle: Evergreen Media Best Practice**
- JEDER Absatz darf MAXIMAL ${formData.maxParagraphLength || 300} Wörter haben
- Ein Absatz = ein Gedanke (idealerweise 3-4 Sätze)
- Bei längeren Themen: NEUEN Absatz mit Zwischenüberschrift beginnen
- Kürzere Absätze = bessere Lesbarkeit = höheres Engagement
- PRÜFE VOR AUSGABE: Zähle mental die Wörter pro Absatz!

MULTIMEDIALE ELEMENTE (reichlich verwenden!):
- **Bullet Points**: Mindestens 2-3 Listen pro Text für Vorteile, Features, Anwendungen
- **Tabellen**: Für Vergleiche, technische Daten, "Auf einen Blick"-Zusammenfassungen
- **Fettmarkierungen**: Wichtige Begriffe, Zahlen, Kernaussagen hervorheben (aber sparsam!)
- **Merk- und Infoboxen**: Als HTML-Blockquotes für Top-Tipps, Wichtige Hinweise
- **Emoji-Einsatz** (optional): ✓ für Vorteile, → für Verweise, ⚡ für Highlights (nur wenn zielgruppengerecht)
- **Zwischenrufe**: Nutze kurze, prägnante Sätze als Absatz-Highlights
  Beispiel: "**Das Ergebnis? Spürbare Linderung bereits nach der ersten Anwendung.**"

INTERNE VERLINKUNGEN:
**Quelle: Ahrefs Internal Linking Study 2024**
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

ZIELGRUPPE: ${
  formData.targetAudience === 'b2b' ? 'B2B-Entscheider und Fachpersonal - fachlich präzise, Evidenz-basiert, ROI-fokussiert, professionelle Ansprache. Nutze Branchenterminologie, zeige messbare Vorteile und Effizienzsteigerungen.' :
  formData.targetAudience === 'b2c' ? 'Endverbraucher - verständliche Sprache, direkte Ansprache, praktischer Nutzen im Vordergrund. Nutze emotionale Verbindungen, Alltagsbeispiele und leicht verständliche Erklärungen.' :
  formData.targetAudience === 'mixed' ? 'Gemischte Zielgruppe (B2B & B2C) - Balance zwischen Fachwissen und Verständlichkeit. Fachbegriffe mit Erklärungen, sowohl professionelle Argumente als auch emotionale Ansprache.' :
  formData.targetAudience === 'endCustomers' ? 'Endkunden - leichte Sprache, direkte Ansprache, praktischer Nutzen im Vordergrund' :
  'Fachpersonal - fachlich präzise, Evidenz-basiert, professionelle Ansprache'
}

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
  },
  "guidelineValidation": {
    "overallScore": 85,
    "googleEEAT": {
      "experience": {"score": 80, "status": "green|yellow|red", "notes": "Bewertung der Experience-Signale im Text"},
      "expertise": {"score": 90, "status": "green|yellow|red", "notes": "Bewertung der Expertise-Signale (Fachbegriffe, Studien)"},
      "authority": {"score": 75, "status": "green|yellow|red", "notes": "Bewertung der Authority-Signale (Zertifikate, Erfahrung)"},
      "trust": {"score": 85, "status": "green|yellow|red", "notes": "Bewertung der Trust-Signale (Transparenz, keine Übertreibungen)"}
    },
    "johnMuellerChecks": {
      "peopleFirst": {"passed": true, "note": "Prüfung: Ist der Text für Menschen geschrieben, nicht für Suchmaschinen?"},
      "uniqueValue": {"passed": true, "note": "Prüfung: Bietet der Text einzigartige Perspektiven/Mehrwert?"},
      "noKeywordStuffing": {"passed": true, "note": "Prüfung: Natürliche Keyword-Integration ohne Überoptimierung?"},
      "comprehensiveContent": {"passed": true, "note": "Prüfung: Wird das Thema vollständig und hilfreich abgedeckt?"}
    },
    "headingStructure": {
      "h1": {"count": 1, "hasKeyword": true, "length": 45, "position": "am Anfang", "status": "green|yellow|red", "seoRelevance": "★★★★★ KRITISCH", "issues": []},
      "h2": {"count": 5, "keywordVariations": 2, "avgSectionLength": 250, "status": "green|yellow|red", "seoRelevance": "★★★★☆ SEHR HOCH", "issues": []},
      "h3": {"count": 8, "longTailKeywords": 3, "status": "green|yellow|red", "seoRelevance": "★★★☆☆ MITTEL", "issues": []},
      "h4": {"count": 0, "status": "green", "seoRelevance": "★★☆☆☆ MODERAT", "issues": []},
      "hierarchyValid": true,
      "hierarchyIssues": [],
      "rankingSummary": "Zusammenfassung der Heading-Struktur für Rankings"
    },
    "evergreenMediaChecks": {
      "avgSentenceLength": {"value": 16, "target": "15-20", "status": "green|yellow|red"},
      "passiveVoicePercent": {"value": 8, "target": "<15%", "status": "green|yellow|red"},
      "maxParagraphLength": {"value": 4, "target": "3-4 Sätze", "status": "green|yellow|red"},
      "readabilityScore": {"value": 65, "target": "60+", "status": "green|yellow|red"},
      "issues": []
    },
    "references": [
      {"guideline": "Google E-E-A-T Framework", "source": "Quality Rater Guidelines 2024", "url": "https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf", "section": "Section 3: E-E-A-T"},
      {"guideline": "Helpful Content System", "source": "John Mueller, Google Search Central", "url": "https://developers.google.com/search/docs/appearance/helpful-content-system", "quote": "Create content for users, not search engines"},
      {"guideline": "H1-H6 Best Practice", "source": "Ahrefs H-Tag Study 2024", "url": "https://ahrefs.com/blog/h1-tag/", "finding": "96.8% der Top-10-Ergebnisse haben genau eine H1"},
      {"guideline": "Content-Länge", "source": "John Mueller Reddit AMA 2024", "url": "https://www.reddit.com/r/SEO/", "quote": "There's no ideal word count"},
      {"guideline": "Lesbarkeit", "source": "Evergreen Media Ratgeber", "url": "https://www.evergreenmedia.at/ratgeber/", "recommendation": "Flesch-Index 60+, Satzlänge 15-20 Wörter"}
    ]
  }
}`;
}

function buildUserPrompt(formData: any, briefingContent: string = ''): string {
  const goalMap: Record<string, string> = {
    inform: 'Informieren und aufklären',
    advise: 'Beraten und Empfehlungen geben',
    preparePurchase: 'Kaufentscheidung vorbereiten',
    triggerPurchase: 'Direkten Kaufimpuls setzen'
  };

  const addressMap: Record<string, string> = {
    du: 'Du-Form (persönlich und direkt)',
    sie: 'Sie-Form (höflich und förmlich)',
    neutral: 'Neutral (keine direkte Anrede, sachlich)'
  };

  // KORRIGIERT: Tonality Labels müssen mit System-Prompt übereinstimmen!
  const tonalityLabels: Record<string, string> = {
    'expert-mix': 'Expertenmix: 70% Fachwissen, 20% Lösungsorientierung, 10% Storytelling - wissenschaftlich-professionell für Fachpublikum',
    'consultant-mix': 'Beratermix: 40% Fachwissen, 40% Lösungsorientierung, 20% Storytelling - beratend-partnerschaftlich',
    'storytelling-mix': 'Storytelling-Mix: 30% Fachwissen, 30% Lösungsorientierung, 40% Storytelling - emotional und inspirierend',
    'conversion-mix': 'Conversion-Mix: 20% Fachwissen, 60% Lösungsorientierung, 20% Storytelling - verkaufsstark und nutzenorientiert',
    'balanced-mix': 'Balanced-Mix: je 33% Fachwissen, Lösungsorientierung, Storytelling - ausgewogen für breites Publikum',
    // Legacy-Support für alte Werte
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

  // KORRIGIERT: Zielgruppen-Mapping erweitert
  const audienceLabels: Record<string, string> = {
    'b2b': 'B2B-Entscheider und Fachpersonal - fachlich präzise, Evidenz-basiert, ROI-fokussiert, professionelle Ansprache',
    'b2c': 'Endverbraucher - verständliche Sprache, direkte Ansprache, praktischer Nutzen im Vordergrund, emotionale Verbindungen',
    'mixed': 'Gemischte Zielgruppe (B2B & B2C) - Balance zwischen Fachwissen und Verständlichkeit, sowohl professionelle als auch emotionale Ansprache',
    'endCustomers': 'Endkunden - leichte Sprache, direkte Ansprache, praktischer Nutzen im Vordergrund',
    'professionals': 'Fachpersonal - fachlich präzise, Evidenz-basiert, Indikationen/Kontraindikationen beachten'
  };

  // KORRIGIERT: Word Count Mapping hinzugefügt
  const wordCountMap: Record<string, string> = {
    'short': '300-500 Wörter (kurz und prägnant)',
    'medium': '500-800 Wörter (mittellang, ausgewogen)',
    'long': '800-1200 Wörter (umfassend, detailliert)',
    'very-long': '1200-1800 Wörter (sehr umfangreich, tiefgehend)'
  };

  // Page type specific labels
  const pageTypeConfig: Record<string, { brandLabel: string; topicLabel: string; urlsLabel: string; description: string }> = {
    product: {
      brandLabel: 'Hersteller/Marke',
      topicLabel: 'Produktname',
      urlsLabel: 'Produkt-URLs',
      description: 'Produktseite mit Spezifikationen und Anwendungen'
    },
    category: {
      brandLabel: 'Shop/Marke',
      topicLabel: 'Kategoriename',
      urlsLabel: 'Beispiel-Produkte/Unterseiten',
      description: 'Kategorieseite/Shop-Übersicht (evtl. Multi-Brand)'
    },
    guide: {
      brandLabel: 'Autor/Unternehmen',
      topicLabel: 'Thema/Titel',
      urlsLabel: 'Quellen/Referenzen',
      description: 'Ratgeber/Blog-Artikel zu einem Thema'
    }
  };

  const pageType = formData.pageType || 'product';
  const config = pageTypeConfig[pageType] || pageTypeConfig.product;

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
    if (pageType === 'product') {
      layoutStructure += '  Empfohlene Tabs: Technische Daten | Anwendungsbereiche | Zubehör & Erweiterungen | Downloads\n';
    } else if (pageType === 'category') {
      layoutStructure += '  Empfohlene Tabs: Produktübersicht | Auswahlhilfe | Marken | Zubehör\n';
    } else {
      layoutStructure += '  Empfohlene Tabs: Übersicht | Anleitung | Tipps | Weiterführende Infos\n';
    }
    layoutStructure += '  - Jeder Tab enthält strukturierte, leicht erfassbare Informationen\n';
  }
  if (formData.includeFAQ) {
    layoutStructure += '✓ FAQ-BEREICH: Umfangreicher FAQ-Block am Ende mit 5-8 relevanten Fragen\n';
  }

  // Build step 1 info based on page type
  let step1Info = `=== SCHRITT 1: GRUNDINFORMATIONEN ===\n`;
  step1Info += `Seitentyp: ${config.description}\n`;
  
  // Support both old and new field names for backward compatibility
  const brandName = formData.brandName || formData.manufacturerName || '';
  const websiteUrl = formData.websiteUrl || formData.manufacturerWebsite || '';
  const mainTopic = formData.mainTopic || formData.productName || '';
  const referenceUrls = formData.referenceUrls || formData.productUrls || [];
  
  if (brandName) {
    step1Info += `${config.brandLabel}: ${brandName}\n`;
  }
  if (websiteUrl) {
    step1Info += `Website: ${websiteUrl}\n`;
  }
  if (mainTopic) {
    step1Info += `${config.topicLabel}: ${mainTopic}\n`;
  }
  if (referenceUrls && referenceUrls.length > 0) {
    step1Info += `${config.urlsLabel}:\n${referenceUrls.map((url: string) => `- ${url}`).join('\n')}\n`;
  }
  if (formData.additionalInfo) {
    step1Info += `Zusätzliche Informationen/USPs:\n${formData.additionalInfo}\n`;
  }
  if (formData.competitorData) {
    step1Info += `\n=== KONKURRENTEN-ANALYSE (BEST PRACTICES) ===\n${formData.competitorData}\n\nNUTZE DIESE ERKENNTNISSE:\n- Übernimm erfolgreiche Keyword-Strategien\n- Adaptiere bewährte Content-Strukturen\n- Integriere überzeugende Argumentationsmuster\n- Hebe dich gleichzeitig mit einzigartigen USPs ab\n`;
  }

  // Resolve tonality label
  const tonalityValue = formData.tonality || 'balanced-mix';
  const resolvedTonality = tonalityLabels[tonalityValue] || tonalityValue;

  // Resolve target audience label
  const audienceValue = formData.targetAudience || 'mixed';
  const resolvedAudience = audienceLabels[audienceValue] || audienceValue;

  // Resolve word count
  const wordCountValue = formData.wordCount || 'medium';
  const resolvedWordCount = wordCountMap[wordCountValue] || wordCountValue;

  return `
${step1Info}

=== SCHRITT 2: ZIELGRUPPE & ANSPRACHE ===
Zielgruppe: ${resolvedAudience}
Anrede: ${addressMap[formData.formOfAddress as keyof typeof addressMap] || 'Du-Form'}
Sprache: ${formData.language || 'Deutsch'}
Tonalität: ${resolvedTonality}

WICHTIG - TONALITÄT EXAKT UMSETZEN:
Die oben genannte Tonalität (${tonalityValue}) definiert die GEWICHTUNG der Textelemente.
Du MUSST die im System-Prompt definierten Prozent-Vorgaben für diese Tonalität einhalten!
Prüfe vor der Ausgabe: Entspricht die Verteilung von Fachwissen/Lösungsorientierung/Storytelling der Vorgabe?

=== SCHRITT 3: TEXTSTRUKTUR & SEO ===
Fokus-Keyword: ${formData.focusKeyword}
${formData.secondaryKeywords && formData.secondaryKeywords.length > 0 ? `Sekundär-Keywords: ${formData.secondaryKeywords.join(', ')}` : ''}

${formData.searchIntent && formData.searchIntent.length > 0 ? `SUCHINTENTION: ${formData.searchIntent.map((i: string) => {
  const intentLabels: Record<string, string> = {
    'know': 'Know (Information suchen)',
    'do': 'Do (Aktion ausführen)',
    'buy': 'Buy (Kaufen/vergleichen)',
    'go': 'Go (Navigation)',
    'visit': 'Visit (Vor Ort besuchen)'
  };
  return intentLabels[i] || i;
}).join(', ')}\nRichte den Text an dieser Suchintention aus!` : ''}

${formData.keywordDensity ? `KEYWORD-DICHTE: ${
  formData.keywordDensity === 'minimal' ? 'Minimal (0.5-1%) - Sehr natürliche Integration, wenig Wiederholungen' :
  formData.keywordDensity === 'normal' ? 'Normal (1-2%) - Ausgewogene, empfohlene Keyword-Dichte' :
  'Hoch (2-3%) - Stärker optimiert, aber kein Keyword-Stuffing!'
}` : ''}

${formData.wQuestions && formData.wQuestions.length > 0 ? `W-FRAGEN (MÜSSEN IM TEXT BEANTWORTET WERDEN):\n${formData.wQuestions.map((q: string) => `- ${q}`).join('\n')}\nDiese Fragen müssen im Text explizit behandelt und beantwortet werden!` : ''}
${layoutStructure}
Wortanzahl: ${resolvedWordCount}
Max. Absatzlänge: ${formData.maxParagraphLength || 300} Wörter pro Absatz (STRIKT einhalten!)
Überschriftenstruktur: ${formData.headingStructure || 'H1 > H2 > H3'}
Ziel der Seite: ${goalMap[formData.pageGoal as keyof typeof goalMap] || 'Informieren'}
${formData.contentStructure ? `\nZusätzliche Struktur-Anforderungen:\n${formData.contentStructure}` : ''}
${briefingContent ? `\n\n=== HOCHGELADENE BRIEFING-DOKUMENTE ===\nBerücksichtige folgende Informationen aus den hochgeladenen Dokumenten:${briefingContent}` : ''}${complianceInfo}

=== AUFGABE ===
Erstelle einen hochwertigen, SEO-optimierten ${pageType === 'product' ? 'Produkttext' : pageType === 'category' ? 'Kategorietext' : 'Ratgeberartikel'}, der:
- Alle Keyword-Vorgaben natürlich integriert
- Die definierte Seitenlayout-Struktur exakt umsetzt
- Auf die Zielgruppe (${audienceValue}) zugeschnitten ist
- Das definierte Ziel der Seite erreicht
- Überschriften und Text perfekt aufeinander abstimmt
- Die gewählte Tonalität (${tonalityValue}) mit der exakten Gewichtung konsequent umsetzt
- Die vorgegebene Wortanzahl (${resolvedWordCount}) einhält
`;
}

function parseGeneratedContent(text: string, formData: any): any {
  const pageType = formData.pageType || 'product';
  const mainTopic = formData.mainTopic || formData.productName || formData.focusKeyword;
  
  try {
    // Try to parse as JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse as JSON, using fallback structure:', e);
  }

  // Fallback: create a basic structure based on page type
  const schemaRecommendations: Record<string, string> = {
    product: 'Empfohlene Schema.org Typen: Product, Offer, AggregateRating',
    category: 'Empfohlene Schema.org Typen: BreadcrumbList, ItemList, CollectionPage',
    guide: 'Empfohlene Schema.org Typen: Article, FAQPage, HowTo'
  };

  return {
    seoText: `<h1>${mainTopic}</h1>\n<p>${text}</p>`,
    faq: [
      { question: "Was ist " + mainTopic + "?", answer: "Weitere Informationen folgen." }
    ],
    title: mainTopic.substring(0, 60),
    metaDescription: text.substring(0, 155),
    internalLinks: [],
    technicalHints: schemaRecommendations[pageType] || schemaRecommendations.product,
    qualityReport: formData.complianceCheck ? {
      status: 'green',
      flags: [],
      evidenceTable: []
    } : undefined
  };
}
