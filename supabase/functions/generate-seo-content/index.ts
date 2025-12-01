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
      // Generate 3 variants in parallel for new content
      // Each variant has a DIFFERENT creative approach to maximize variety
      console.log('Generating 3 content variants in parallel with distinct approaches...');
      
      const variantApproaches = [
        {
          name: 'Variante A',
          description: 'Strukturiert & Umfassend',
          instruction: `VARIANTE A - STRUKTURIERT & UMFASSEND:
Fokussiere auf maximale Vollständigkeit und klare Struktur:
- Beantworte ALLE möglichen Nutzerfragen zum Thema
- Nutze besonders viele Zwischenüberschriften für Scanbarkeit
- Integriere umfangreiche Listen und Bullet Points
- Füge detaillierte technische Informationen ein wo relevant
- Erstelle einen besonders ausführlichen FAQ-Bereich (6-8 Fragen)
- Achte auf perfekte SEO-Struktur mit allen Keywords
Ziel: Der umfassendste, informativste Text zum Thema`
        },
        {
          name: 'Variante B', 
          description: 'Nutzenorientiert & Überzeugend',
          instruction: `VARIANTE B - NUTZENORIENTIERT & ÜBERZEUGEND:
Fokussiere auf maximale Überzeugungskraft und Nutzenargumentation:
- Starte JEDEN Abschnitt mit einem konkreten Nutzenversprechen
- Nutze die AIDA-Formel (Attention, Interest, Desire, Action)
- Integriere konkrete Zahlen, Fakten und Belege für jeden Nutzen
- Verwende mehr Verben und aktive Sprache
- Baue starke CTAs (Call-to-Actions) in den Text ein
- Nutze "Vorher-Nachher" Szenarien wo möglich
Ziel: Der überzeugendste, handlungsauslösende Text zum Thema`
        },
        {
          name: 'Variante C',
          description: 'Emotional & Authentisch',
          instruction: `VARIANTE C - EMOTIONAL & AUTHENTISCH:
Fokussiere auf emotionale Verbindung und Authentizität:
- Beginne mit einem fesselnden Szenario oder einer Geschichte
- Nutze bildhafte, sensorische Sprache (fühlen, erleben, spüren)
- Integriere Praxisbeispiele und Use Cases aus dem echten Leben
- Schreibe so, als würdest du einen Freund beraten
- Verwende direkte Ansprache und rhetorische Fragen
- Zeige echte Empathie für die Probleme der Zielgruppe
Ziel: Der emotional ansprechendste, nahbarste Text zum Thema`
        }
      ];
      
      const generateVariant = async (variantIndex: number): Promise<any> => {
        const approach = variantApproaches[variantIndex];
        
        // Build variant-specific prompt with clear differentiation
        const variantUserPrompt = `${approach.instruction}

=== WICHTIG: QUALITÄTSKONTROLLE VOR AUSGABE ===
Bevor du den Text ausgibst, prüfe:
1. ✓ Ist das Fokus-Keyword in H1 und den ersten 100 Wörtern?
2. ✓ Sind alle Absätze unter ${formData.maxParagraphLength || 300} Wörter?
3. ✓ Entspricht die Tonalität exakt der Vorgabe?
4. ✓ Sind alle W-Fragen beantwortet (falls vorgegeben)?
5. ✓ Ist der Text für die Zielgruppe optimiert?
6. ✓ Gibt es keine Passivkonstruktionen oder Füllwörter?

=== BRIEFING ===
${userPrompt}`;
        
        const variantMessages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: variantUserPrompt }
        ];
        
        const maxRetries = 3;
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Variant ${variantIndex + 1} (${approach.description}): AI Gateway request attempt ${attempt}/${maxRetries}`);
            
            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                // Use gemini-2.5-pro for better quality on complex SEO content
                model: 'google/gemini-2.5-pro',
                messages: variantMessages,
                // Lower temperature for more consistent, high-quality output
                temperature: 0.65,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const generatedText = data.choices[0].message.content;
              const parsed = parseGeneratedContent(generatedText, formData);
              // Add variant metadata
              parsed._variantInfo = {
                name: approach.name,
                description: approach.description
              };
              return parsed;
            }
            
            const errorText = await response.text();
            console.error(`Variant ${variantIndex + 1} error (attempt ${attempt}):`, response.status, errorText);
            
            if (response.status === 429 || response.status === 402) {
              throw new Error(response.status === 429 
                ? 'Rate limit exceeded. Please try again in a few minutes.'
                : 'Payment required. Please add funds to your Lovable AI workspace.');
            }
            
            if (response.status >= 500 && attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 1000;
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            
            lastError = new Error(`AI Gateway error: ${response.status}`);
          } catch (fetchError) {
            lastError = fetchError instanceof Error ? fetchError : new Error('Network error');
            if (attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 1000;
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        throw lastError || new Error(`Failed to generate variant ${variantIndex + 1}`);
      };
      
      try {
        const variants = await Promise.all([
          generateVariant(0),
          generateVariant(1),
          generateVariant(2),
        ]);
        
        console.log('Successfully generated 3 distinct SEO content variants');
        
        return new Response(JSON.stringify({ 
          variants,
          selectedVariant: 0,
          variantDescriptions: variantApproaches.map(a => ({ name: a.name, description: a.description }))
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (variantError) {
        console.error('Error generating variants:', variantError);
        throw variantError;
      }
    }

    // For refinement/quick change - single generation
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
            // Use pro model for better refinement quality
            model: 'google/gemini-2.5-pro',
            messages: messages,
            // Moderate temperature for balanced refinement
            temperature: 0.6,
          }),
        });

        if (response.ok) {
          break;
        }
        
        const errorText = await response.text();
        console.error(`AI gateway error (attempt ${attempt}):`, response.status, errorText);
        
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
        
        if (response.status >= 500 && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
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
  // === RADIKAL VEREINFACHTER SYSTEM-PROMPT ===
  // Fokus: Top 10 kritische SEO-Faktoren
  // Länge: Max 400 Zeilen (von 850+ reduziert)
  // Ziel: Weniger ist mehr - klare Priorisierung statt Constraint-Overload
  
  const addressMap: Record<string, string> = {
    du: "Verwende durchgehend die Du-Form (du, dich, dein).",
    sie: "Verwende durchgehend die Sie-Form (Sie, Ihnen, Ihr).",
    neutral: "Vermeide direkte Anrede. Schreibe neutral und sachlich."
  };
  const addressStyle = addressMap[formData.formOfAddress || 'du'] || addressMap.du;
  
  // === TONALITÄT-SYSTEM: 5 PRÄZISE MIX-VARIANTEN ===
  const tonalityMap: Record<string, string> = {
    'expertenmix': `TONALITÄT: Expertenmix (70% Fachwissen, 20% Lösungsorientierung, 10% Storytelling)
- Fachlich-präzise Sprache mit Terminologie
- Studienzitate & technische Spezifikationen im Vordergrund
- Minimale emotionale Elemente
- Zielgruppe: B2B-Entscheider, wissenschaftliches Publikum`,
    
    'consultant-mix': `TONALITÄT: Beratermix (40% Fachwissen, 40% Lösungsorientierung, 20% Storytelling)
- Balance zwischen Fachwissen und Nutzenargumenten
- "Was bedeutet das konkret für Sie?" Ansatz
- Fallbeispiele zur Veranschaulichung
- Zielgruppe: Entscheider im Vergleichsmodus`,
    
    'storytelling-mix': `TONALITÄT: Storytelling-Mix (30% Fachwissen, 30% Lösungsorientierung, 40% Storytelling)
- Emotionale Geschichten & sensorische Sprache dominieren
- Fachwissen in Narrativen verpackt
- "Stell dir vor..." / "Erlebe..." Sprache
- Zielgruppe: Emotionale Käufer, Lifestyle-Fokus`,
    
    'conversion-mix': `TONALITÄT: Conversion-Mix (20% Fachwissen, 60% Lösungsorientierung, 20% Storytelling)
- Jeden Absatz mit konkretem Nutzen enden lassen
- Verkaufsstarke Sprache: "Jetzt", "Sofort", "Sparen Sie"
- Erfolgsbeweise statt langer Erklärungen
- Zielgruppe: Kaufbereite Nutzer, Produktseiten`,
    
    'balanced-mix': `TONALITÄT: Balanced-Mix (je 33% Fachwissen, Lösungsorientierung, Storytelling)
- Gleichmäßige Verteilung aller drei Elemente
- Spricht alle Käufertypen an
- Vielseitiger Ansatz
- Zielgruppe: Breites Publikum, Landingpages`
  };

  const tonalityInstruction = tonalityMap[formData.tonality] || tonalityMap['balanced-mix'];
  
  return `Du bist ein erfahrener SEO-Texter nach Google-Standards 2024/2025.

# === TOP 10 KRITISCHE SEO-FAKTOREN (PRIORITÄT: HOCH) ===

## 1️⃣ FOKUS-KEYWORD-PLATZIERUNG ⭐⭐⭐⭐⭐
**Google Ranking-Relevanz: KRITISCH**
- Fokus-Keyword MUSS in H1 erscheinen (möglichst am Anfang)
- Fokus-Keyword MUSS in den ersten 100 Wörtern vorkommen
- Keyword-Dichte: 1-3% des Gesamttextes
- KEIN Keyword-Stuffing - natürliche Integration

## 2️⃣ H1-STRUKTUR ⭐⭐⭐⭐⭐
**Google: 96.8% der Top-10-Ergebnisse haben genau EINE H1**
- NUR EINE H1 pro Seite
- Max. 60-70 Zeichen
- Muss Hauptinhalt klar kommunizieren
- Nutzenorientiert formulieren

## 3️⃣ ABSATZLÄNGE ⭐⭐⭐⭐
**STRIKT: Max. ${formData.maxParagraphLength || 300} Wörter pro Absatz**
- Ein Absatz = ein Gedanke (3-4 Sätze ideal)
- Bei längeren Themen: Neuen Absatz mit Zwischenüberschrift beginnen
- Kürzere Absätze = bessere Lesbarkeit = höheres Engagement

## 4️⃣ E-E-A-T SIGNALE ⭐⭐⭐⭐⭐
**Google Quality Rater Guidelines 2024 - Top Ranking-Faktor**
- **Experience**: Zeige echte Praxiserfahrung mit konkreten Beispielen
- **Expertise**: Nutze Fachbegriffe korrekt, zitiere Studien wo relevant
- **Authority**: Erwähne Qualifikationen, Zertifizierungen, Marktposition
- **Trust**: Sei transparent, ehrlich, keine übertriebenen Versprechen

## 5️⃣ ${tonalityInstruction}

## 6️⃣ ANREDEFORM ⭐⭐⭐
${addressStyle}

## 7️⃣ PEOPLE-FIRST CONTENT ⭐⭐⭐⭐⭐
**John Mueller, Google 2024: "Create content for users, not search engines"**
- Fokussiere auf echten NUTZEN für den Leser
- Beantworte die Fragen, die Suchende wirklich haben
- Biete einzigartigen Mehrwert (nicht nur Zusammenfassung anderer Quellen)
- Vermeide künstliches Aufblähen ohne Mehrwert

## 8️⃣ HEADING-HIERARCHIE ⭐⭐⭐⭐
**Struktur: H1 → H2 → H3 (keine Level überspringen!)**
- H1: Nur eine, mit Fokus-Keyword
- H2: 3-6 Hauptabschnitte, Fokus/LSI-Keywords in 1-2 H2s
- H3: Unterabschnitte für Details, Long-Tail-Keywords

## 9️⃣ AKTIVE SPRACHE ⭐⭐⭐
**Evergreen Media: Max. 15% Passivkonstruktionen**
- Nutze aktive Verben statt Passiv
- "Verwenden Sie..." statt "wird verwendet"
- Durchschnittliche Satzlänge: 15-20 Wörter
- Keine Füllwörter ("quasi", "eigentlich", "im Grunde")

## 🔟 FAQ-SEKTION ⭐⭐⭐⭐
**Hohe Featured Snippet Chance**
- 5-8 relevante Fragen erstellen
- W-Fragen abdecken (Was, Wie, Warum, Wann, Wo, Wer)
- Konkrete, präzise Antworten (50-150 Wörter)
- Schema.org FAQPage kompatibel

# === COMPLIANCE-CHECKS (falls aktiviert) ===
${formData.complianceChecks ? `
${formData.complianceChecks.mdr ? '- MDR/MPDG: Keine überzogenen Leistungsversprechen, Off-Label-Anmutungen' : ''}
${formData.complianceChecks.hwg ? '- HWG: Keine Heilversprechen, unzulässige Erfolgsgarantien' : ''}
${formData.complianceChecks.studies ? '- Studienprüfung: Korrekte Evidenz, Zitierweise, keine Extrapolation' : ''}
` : ''}

# === WICHTIGE DON'TS ===
❌ Keyword-Stuffing
❌ Lange, verschachtelte Sätze (max. 15-20 Wörter)
❌ Passivsätze ("wird verwendet" → "verwenden Sie")
❌ Nichtssagende Ankertexte ("hier", "mehr", "klicken")
❌ Zu lange Absätze (max. ${formData.maxParagraphLength || 300} Wörter)
❌ Füllwörter ("quasi", "eigentlich", "im Grunde")
❌ Leere Versprechen ("hochwertig", "innovativ" ohne Beleg)
❌ Unpersönliche Sprache ("man", "es wird")

# === JSON-AUSGABEFORMAT ===
Antworte IMMER in diesem JSON-Format:
{
  "seoText": "HTML-formatierter Text mit H1, H2, H3, etc.",
  "faq": [{"question": "...", "answer": "..."}],
  "title": "Title Tag max 60 Zeichen mit Fokus-Keyword",
  "metaDescription": "Meta Description max 155 Zeichen",
  "internalLinks": [{"url": "...", "anchorText": "sprechender Ankertext"}],
  "technicalHints": "Schema.org Empfehlungen",
  "qualityReport": {
    "status": "green|yellow|red",
    "flags": [{"type": "mdr|hwg|study", "severity": "high|medium|low", "issue": "...", "rewrite": "..."}],
    "evidenceTable": [{"study": "...", "type": "...", "outcome": "...", "source": "..."}]
  },
  "guidelineValidation": {
    "overallScore": 85,
    "googleEEAT": {
      "experience": {"score": 80, "status": "green|yellow|red", "notes": "..."},
      "expertise": {"score": 90, "status": "green|yellow|red", "notes": "..."},
      "authority": {"score": 75, "status": "green|yellow|red", "notes": "..."},
      "trust": {"score": 85, "status": "green|yellow|red", "notes": "..."}
    },
    "johnMuellerChecks": {
      "peopleFirst": {"passed": true, "note": "..."},
      "uniqueValue": {"passed": true, "note": "..."},
      "noKeywordStuffing": {"passed": true, "note": "..."}
    },
    "headingStructure": {
      "h1": {"count": 1, "hasKeyword": true, "status": "green|yellow|red"},
      "h2": {"count": 5, "keywordVariations": 2, "status": "green|yellow|red"},
      "hierarchyValid": true
    }
  }
}
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
    complianceInfo = '\n\nCOMPLIANCE-PRUEFUNGEN AKTIV:\n' + activeChecks.join('\n') + '\nBitte beachte diese Anforderungen bei der Texterstellung und erstelle am Ende einen Compliance-Bericht.';
  }

  // Build layout structure description
  let layoutStructure = '\n\n=== SEITENLAYOUT-STRUKTUR ===\n';
  if (formData.includeIntro) {
    layoutStructure += 'EINLEITUNG: Kurze, fesselnde Einleitung am Anfang (ca. 100-150 Woerter) mit Fokus-Keyword\n';
  }
  if (formData.imageTextBlocks && formData.imageTextBlocks > 0) {
    layoutStructure += 'BILD-TEXT-BLOECKE: ' + formData.imageTextBlocks + ' abwechselnde Text-Bild-Abschnitte\n';
    layoutStructure += '  - Jeder Block behandelt einen spezifischen Aspekt/Vorteil\n';
    layoutStructure += '  - Bloecke alternieren: Text links/Bild rechts, dann Text rechts/Bild links\n';
    layoutStructure += '  - Nutze starke, ueberzeugende Zwischenueberschriften fuer jeden Block\n';
  }
  if (formData.includeTabs) {
    layoutStructure += 'TAB-STRUKTUR: Organisiere zusaetzliche Informationen in Tabs\n';
    if (pageType === 'product') {
      layoutStructure += '  Empfohlene Tabs: Technische Daten | Anwendungsbereiche | Zubehoer & Erweiterungen | Downloads\n';
    } else if (pageType === 'category') {
      layoutStructure += '  Empfohlene Tabs: Produktuebersicht | Auswahlhilfe | Marken | Zubehoer\n';
    } else {
      layoutStructure += '  Empfohlene Tabs: Uebersicht | Anleitung | Tipps | Weiterfuehrende Infos\n';
    }
    layoutStructure += '  - Jeder Tab enthaelt strukturierte, leicht erfassbare Informationen\n';
  }
  if (formData.includeFAQ) {
    layoutStructure += 'FAQ-BEREICH: Umfangreicher FAQ-Block am Ende mit 5-8 relevanten Fragen\n';
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
- Die max. Absatzlänge von ${formData.maxParagraphLength || 300} Wörtern pro Absatz STRIKT einhält
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
