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
    
    // Validierung kritischer Felder
    if (!formData || typeof formData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Ungültige Anfragedaten' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!formData.focusKeyword?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Fokus-Keyword ist erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server-Konfigurationsfehler' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
            console.error('Error downloading file:', filePath, error);
            return null;
          }

          const text = await data.text();
          return '\n\n=== Dokument: ' + filePath.split('/').pop() + ' ===\n' + text.substring(0, 10000);
        } catch (err) {
          console.error('Error processing file:', filePath, err);
          return null;
        }
      });

      const briefings = await Promise.all(briefingPromises);
      briefingContent = briefings.filter(Boolean).join('\n');
      
      if (briefingContent) {
        console.log('Processed briefing files:', formData.briefingFiles.length);
        
        const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + LOVABLE_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Du bist ein Experte fuer die Zusammenfassung von Briefing-Dokumenten.' },
              { role: 'user', content: 'Fasse folgende Briefing-Dokumente zusammen:\n\n' + briefingContent }
            ],
            temperature: 0.3,
          }),
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const summary = summaryData.choices[0].message.content;
          briefingContent = '\n\n=== ZUSAMMENFASSUNG DER BRIEFING-DOKUMENTE ===\n' + summary + '\n';
          console.log('Briefing successfully summarized');
        }
      }
    }

    const systemPrompt = buildSystemPrompt(formData);
    const userPrompt = buildUserPrompt(formData, briefingContent);

    let messages;
    if (formData.quickChange && formData.existingContent) {
      console.log('Processing quick change request');
      let changeInstructions = 'Passe den folgenden Text an:\n\n';
      let hasChanges = false;
      
      if (formData.tonality) {
        hasChanges = true;
        changeInstructions += '- Aendere Tonalitaet\n';
      }
      if (formData.formOfAddress) {
        hasChanges = true;
        changeInstructions += '- Aendere Anredeform zu: ' + formData.formOfAddress + '\n';
      }
      if (formData.wordCount) {
        hasChanges = true;
        changeInstructions += '- Passe Textlaenge an\n';
      }
      if (formData.keywordDensity) {
        hasChanges = true;
        changeInstructions += '- Passe Keyword-Dichte an\n';
      }
      if (typeof formData.includeFAQ === 'boolean') {
        hasChanges = true;
        changeInstructions += '- FAQ-Bereich: ' + (formData.includeFAQ ? 'Hinzufuegen' : 'Entfernen') + '\n';
      }
      if (formData.addExamples === true) {
        hasChanges = true;
        const isB2B = formData.targetAudience === 'b2b';
        changeInstructions += isB2B ? '- ANWENDUNGSBEISPIELE B2B hinzufuegen\n' : '- ANWENDUNGSBEISPIELE B2C hinzufuegen\n';
      }
      
      if (!hasChanges) {
        return new Response(JSON.stringify(formData.existingContent), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      messages = [
        { role: 'system', content: 'Du bist ein erfahrener SEO-Texter. Passe den vorhandenen Text an. Behalte die JSON-Struktur bei.' },
        { role: 'user', content: changeInstructions + '\n\nAktueller Text:\n' + JSON.stringify(formData.existingContent, null, 2) + '\n\nGib den angepassten Text im gleichen JSON-Format zurueck.' }
      ];
    } else if (formData.refinementPrompt && formData.existingContent) {
      console.log('Processing refinement request');
      messages = [
        { role: 'system', content: 'Du bist ein erfahrener SEO-Texter. Ueberarbeite den vorhandenen Text. Behalte die JSON-Struktur bei.' },
        { role: 'user', content: 'Hier ist der aktuelle Text:\n\n' + JSON.stringify(formData.existingContent, null, 2) + '\n\nBitte ueberarbeite:\n' + formData.refinementPrompt + '\n\nGib den Text im gleichen JSON-Format zurueck.' }
      ];
    } else {
      console.log('Generating 3 content variants in parallel...');
      
      const variantApproaches = [
        { name: 'Variante A', description: 'Strukturiert & Umfassend', instruction: 'VARIANTE A - STRUKTURIERT & UMFASSEND: Fokussiere auf Vollstaendigkeit und klare Struktur. Beantworte ALLE Nutzerfragen, nutze viele Zwischenueberschriften, integriere Listen und Bullet Points.' },
        { name: 'Variante B', description: 'Nutzenorientiert & Ueberzeugend', instruction: 'VARIANTE B - NUTZENORIENTIERT & UEBERZEUGEND: Fokussiere auf Ueberzeugungskraft. Starte jeden Abschnitt mit Nutzenversprechen, nutze AIDA-Formel, integriere Zahlen und Belege, baue starke CTAs ein.' },
        { name: 'Variante C', description: 'Emotional & Authentisch', instruction: 'VARIANTE C - EMOTIONAL & AUTHENTISCH: Fokussiere auf emotionale Verbindung. Beginne mit Szenario, nutze sensorische Sprache, integriere Praxisbeispiele, zeige Empathie.' }
      ];
      
      const generateVariant = async (variantIndex: number): Promise<any> => {
        const approach = variantApproaches[variantIndex];
        const maxPara = formData.maxParagraphLength || 300;
        const variantUserPrompt = approach.instruction + '\n\n=== QUALITAETSKONTROLLE ===\nPruefe: Fokus-Keyword in H1 und ersten 100 Woertern? Absaetze unter ' + maxPara + ' Woerter? W-Fragen beantwortet?\n\n=== BRIEFING ===\n' + userPrompt;
        
        const variantMessages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: variantUserPrompt }
        ];
        
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log('Variant ' + (variantIndex + 1) + ': attempt ' + attempt);
            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + LOVABLE_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'google/gemini-2.5-pro', messages: variantMessages, temperature: 0.65 }),
            });

            if (response.ok) {
              const data = await response.json();
              const parsed = parseGeneratedContent(data.choices[0].message.content, formData);
              parsed._variantInfo = { name: approach.name, description: approach.description };
              return parsed;
            }
            
            if (response.status === 429 || response.status === 402) {
              throw new Error(response.status === 429 ? 'Rate limit exceeded' : 'Payment required');
            }
            
            if (response.status >= 500 && attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
              continue;
            }
            
            throw new Error('AI Gateway error: ' + response.status);
          } catch (err) {
            if (attempt === maxRetries) throw err;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
        throw new Error('Failed variant ' + variantIndex);
      };
      
      const variants = await Promise.all([generateVariant(0), generateVariant(1), generateVariant(2)]);
      console.log('Successfully generated 3 variants');
      console.log('Variants structure:', { 
        count: variants.length, 
        types: variants.map((v, i) => ({ index: i, hasText: !!v?.seoText, textLength: v?.seoText?.length || 0 }))
      });
      return new Response(JSON.stringify({ variants, selectedVariant: 0, variantDescriptions: variantApproaches.map(a => ({ name: a.name, description: a.description })) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Refinement/quick change - single generation
    const maxRetries = 3;
    let response: Response | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + LOVABLE_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'google/gemini-2.5-pro', messages: messages, temperature: 0.6 }),
        });

        if (response.ok) break;
        
        if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (response.status === 402) return new Response(JSON.stringify({ error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        
        if (response.status >= 500 && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new Error('AI Gateway error: ' + response.status);
      } catch (err) {
        if (attempt === maxRetries) throw err;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    if (!response || !response.ok) throw new Error('AI Gateway request failed');

    const data = await response.json();
    const parsedContent = parseGeneratedContent(data.choices[0].message.content, formData);
    return new Response(JSON.stringify(parsedContent), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

// 5 VERSCHIEDENE SYSTEM-PROMPT STRATEGIEN ZUM TESTEN
function buildSystemPrompt(formData: any): string {
  const promptVersion = formData.promptVersion || 'v1-kompakt-seo';
  const addressMap: Record<string, string> = { du: "Verwende die Du-Form.", sie: "Verwende die Sie-Form.", neutral: "Vermeide direkte Anrede." };
  const addressStyle = addressMap[formData.formOfAddress || 'du'] || addressMap.du;
  
  const tonalityMap: Record<string, string> = {
    'expertenmix': 'Expertenmix (70% Fachwissen, 20% Loesung, 10% Story)',
    'consultant-mix': 'Beratermix (40% Fachwissen, 40% Loesung, 20% Story)',
    'storytelling-mix': 'Storytelling-Mix (30% Fachwissen, 30% Loesung, 40% Story)',
    'conversion-mix': 'Conversion-Mix (20% Fachwissen, 60% Loesung, 20% Story)',
    'balanced-mix': 'Balanced-Mix (je 33%)'
  };
  const tonality = tonalityMap[formData.tonality] || tonalityMap['balanced-mix'];
  const maxPara = formData.maxParagraphLength || 300;
  
  let compliance = '';
  if (formData.complianceChecks) {
    const checks = [];
    if (formData.complianceChecks.mdr) checks.push('MDR/MPDG beachten');
    if (formData.complianceChecks.hwg) checks.push('HWG beachten');
    if (formData.complianceChecks.studies) checks.push('Studien korrekt zitieren');
    if (checks.length > 0) compliance = '\n\nCOMPLIANCE: ' + checks.join(', ');
  }

  // VERSION 1: KOMPAKT-SEO (aktuell - technisch praezise)
  if (promptVersion === 'v1-kompakt-seo') {
    return 'Du bist erfahrener SEO-Texter nach Google-Standards 2024/2025.\n\n' +
    '# TOP 10 KRITISCHE SEO-FAKTOREN\n\n' +
    '1. FOKUS-KEYWORD: MUSS in H1 und ersten 100 Woertern, Keyword-Dichte 1-3%\n' +
    '2. H1-STRUKTUR: NUR EINE H1, max 60-70 Zeichen, mit Fokus-Keyword\n' +
    '3. ABSATZLAENGE: Max ' + maxPara + ' Woerter pro Absatz (STRIKT!)\n' +
    '4. E-E-A-T: Experience, Expertise, Authority, Trust signalisieren\n' +
    '5. TONALITAET: ' + tonality + '\n' +
    '6. ANREDEFORM: ' + addressStyle + '\n' +
    '7. PEOPLE-FIRST: Echten Nutzen bieten, nicht nur fuer Suchmaschinen\n' +
    '8. HEADING-HIERARCHIE: H1 dann H2 dann H3, keine Level ueberspringen\n' +
    '9. AKTIVE SPRACHE: Max 15% Passiv, Satzlaenge 15-20 Woerter\n' +
    '10. FAQ: 5-8 relevante W-Fragen mit konkreten Antworten\n' +
    compliance +
    '\n\nDONTS: Keyword-Stuffing, Passiv, Fuellwoerter, lange Absaetze, leere Versprechen\n\n' +
    'AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport, guidelineValidation';
  }

  // VERSION 2: MARKETING-FIRST (Emotion > Technik)
  if (promptVersion === 'v2-marketing-first') {
    return 'Du bist kreativer Marketing-Texter mit SEO-Kenntnissen. Deine Prioritaet: BEGEISTERN, dann optimieren.\n\n' +
    '# MARKETING-FIRST PRINZIPIEN\n\n' +
    '1. HOOK: Starte mit emotionalem Aufhaenger, der Neugier weckt\n' +
    '2. STORYTELLING: Nutze Geschichten, Szenarien, reale Beispiele\n' +
    '3. NUTZEN-SPRACHE: "Du bekommst/erhaeltst/profitierst" statt technische Beschreibungen\n' +
    '4. POWER-WORDS: Nutze emotionale Trigger (revolutionaer, erstaunlich, bewaehrt, exklusiv)\n' +
    '5. CONVERSATIONAL TONE: Schreibe wie du sprichst - authentisch, direkt, menschlich\n' +
    '6. VISUELLE SPRACHE: Nutze Metaphern, bildhafte Vergleiche, sensorische Details\n' +
    '7. SOCIAL PROOF: Integriere Beispiele, Erfahrungen, Erfolgsgeschichten\n' +
    '\nSEO-BASICS (sekundaer): Fokus-Keyword in H1 + ersten 100 Woertern, max ' + maxPara + ' Woerter/Absatz, ' + addressStyle + '\n' +
    'TONALITAET: ' + tonality + ' - aber IMMER interessant und fesselnd bleiben!\n' +
    compliance +
    '\n\nZIEL: Texte die man GERNE liest, die im Gedaechtnis bleiben, die ueberzeugen. SEO ist Mittel, nicht Zweck.\n\n' +
    'AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport, guidelineValidation';
  }

  // VERSION 3: HYBRID-INTELLIGENT (Balance)
  if (promptVersion === 'v3-hybrid-intelligent') {
    return 'Du bist intelligenter Content-Stratege der SEO-Technik und kreatives Schreiben vereint.\n\n' +
    '# HYBRID-ANSATZ: DAS BESTE AUS BEIDEN WELTEN\n\n' +
    'STUFE 1 - FUNDAMENT (SEO-Basis):\n' +
    '- Fokus-Keyword in H1 und Intro (natuerlich integriert)\n' +
    '- Klare Struktur mit H2/H3 (logisch, nicht mechanisch)\n' +
    '- Max ' + maxPara + ' Woerter/Absatz, ' + addressStyle + '\n' +
    '- Tonalitaet: ' + tonality + '\n\n' +
    'STUFE 2 - INTELLIGENZ (Kontextverstaendnis):\n' +
    '- Erkenne Suchintention und bediene sie umfassend\n' +
    '- Beantworte nicht nur die Frage, sondern auch das WARUM dahinter\n' +
    '- Nutze Beispiele die zur Zielgruppe passen\n' +
    '- Variiere Satzlaenge und Struktur fuer Lesefluss\n\n' +
    'STUFE 3 - KREATIVITAET (Differenzierung):\n' +
    '- Beginne Abschnitte mit unerwarteten Insights\n' +
    '- Nutze Analogien die komplexes vereinfachen\n' +
    '- Integriere "Aha-Momente" die Mehrwert schaffen\n' +
    '- Schreibe so dass User den Text teilen wollen\n' +
    compliance +
    '\n\nPHILOSOPHIE: Exzellente SEO-Texte sind exzellente Texte, die zufaellig auch SEO-optimiert sind.\n\n' +
    'AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport, guidelineValidation';
  }

  // VERSION 4: MINIMAL-KREATIV (Maximum Freiheit)
  if (promptVersion === 'v4-minimal-kreativ') {
    return 'Du bist freier Autor mit SEO-Bewusstsein. Schreibe erstklassige Texte.\n\n' +
    '# NUR 5 NICHT-VERHANDELBARE REGELN\n\n' +
    '1. Fokus-Keyword muss in H1 und ersten 2 Absaetzen vorkommen (natuerlich!)\n' +
    '2. Ein Absatz = Eine Idee (max ' + maxPara + ' Woerter)\n' +
    '3. ' + addressStyle + '\n' +
    '4. Tonalitaet: ' + tonality + '\n' +
    '5. Schreibe fuer Menschen, nicht fuer Algorithmen\n' +
    compliance +
    '\n\nSONST: Totale kreative Freiheit. Ueberrasche. Experimentiere. Sei mutig.\n' +
    '- Breche mit Konventionen wenn es dem Text dient\n' +
    '- Nutze Cliffhanger, offene Fragen, provokante Thesen\n' +
    '- Schreibe Headlines die man anklicken MUSS\n' +
    '- Mache den Text unvergesslich\n\n' +
    'MANTRA: "Wenn der Text langweilig ist, ist er falsch -egal wie SEO-optimiert."\n\n' +
    'AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport, guidelineValidation';
  }

  // VERSION 5: AI-META-OPTIMIERT (durch AI-Analyse optimiert)
  if (promptVersion === 'v5-ai-meta-optimiert') {
    return 'Du bist Elite-SEO-Content-Creator. Befolge diese durch AI-Analyse optimierte Strategie.\n\n' +
    '# AI-OPTIMIERTE CONTENT-FORMEL\n\n' +
    'PHASE 1 - MAGNETISCHER EINSTIEG (erste 150 Woerter):\n' +
    '- Beginne mit konkretem Problem/Wunsch der Zielgruppe\n' +
    '- Fokus-Keyword in H1 (benefit-orientiert formuliert)\n' +
    '- Promise: Was lernt der Leser in diesem Text?\n' +
    '- Fokus-Keyword nochmal in ersten 100 Woertern (natuerlich!)\n\n' +
    'PHASE 2 - WERT-LIEFERUNG (Hauptteil):\n' +
    '- Pro Abschnitt: 1 Kernaussage + 1 Beispiel + 1 Benefit\n' +
    '- Wechsel zwischen Erklaerung und Anwendung\n' +
    '- Max ' + maxPara + ' Woerter/Absatz, aktive Sprache\n' +
    '- Nutze "Du/Sie-Benefits": zeige konkreten Nutzen auf\n' +
    '- Tonalitaet: ' + tonality + ', ' + addressStyle + '\n\n' +
    'PHASE 3 - VERTIEFUNG:\n' +
    '- Beantworte W-Fragen die Google suggieriert\n' +
    '- Zeige "Wie genau" statt nur "Was"\n' +
    '- Integriere Daten/Fakten wo sinnvoll (E-E-A-T)\n\n' +
    'PHASE 4 - RETENTION:\n' +
    '- Erstelle FAQ mit den 5-8 wichtigsten Fragen\n' +
    '- Schliesse mit klarem Takeaway oder naechstem Schritt\n' +
    compliance +
    '\n\nQUALITAETS-CHECK: Wuerde ein Experte UND ein Laie diesen Text wertvoll finden?\n\n' +
    'AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport, guidelineValidation';
  }

  // Fallback
  return buildSystemPrompt({ ...formData, promptVersion: 'v1-kompakt-seo' });
}

function buildUserPrompt(formData: any, briefingContent: string): string {
  const pageType = formData.pageType || 'product';
  const brandName = formData.brandName || formData.manufacturerName || '';
  const mainTopic = formData.mainTopic || formData.productName || '';
  const maxPara = formData.maxParagraphLength || 300;
  
  let info = '=== GRUNDINFORMATIONEN ===\n';
  if (brandName) info += 'Marke: ' + brandName + '\n';
  if (mainTopic) info += 'Thema: ' + mainTopic + '\n';
  if (formData.additionalInfo) info += 'Info: ' + formData.additionalInfo + '\n';
  if (formData.competitorData) info += '\nKONKURRENZ-ANALYSE:\n' + formData.competitorData + '\n';
  
  info += '\n=== ZIELGRUPPE ===\n';
  info += 'Audience: ' + (formData.targetAudience || 'mixed') + '\n';
  info += 'Anrede: ' + (formData.formOfAddress || 'du') + '\n';
  info += 'Tonalitaet: ' + (formData.tonality || 'balanced-mix') + '\n';
  
  info += '\n=== SEO-STRUKTUR ===\n';
  info += 'Fokus-Keyword: ' + formData.focusKeyword + '\n';
  if (formData.secondaryKeywords && formData.secondaryKeywords.length > 0) {
    info += 'Sekundaer-Keywords: ' + formData.secondaryKeywords.join(', ') + '\n';
  }
  if (formData.wQuestions && formData.wQuestions.length > 0) {
    info += 'W-FRAGEN (MUESSEN beantwortet werden):\n' + formData.wQuestions.map((q: string) => '- ' + q).join('\n') + '\n';
  }
  info += 'Wortanzahl: ' + (formData.wordCount || 'medium') + '\n';
  info += 'Max Absatz: ' + maxPara + ' Woerter (STRIKT!)\n';
  info += 'FAQ: ' + (formData.includeFAQ ? 'Ja' : 'Nein') + '\n';
  
  if (briefingContent) info += '\n' + briefingContent;
  
  info += '\n\n=== AUFGABE ===\nErstelle hochwertigen, SEO-optimierten Text der alle Vorgaben erfuellt.';
  
  return info;
}

function parseGeneratedContent(text: string, formData: any): any {
  const mainTopic = formData.mainTopic || formData.productName || formData.focusKeyword;
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Failed to parse JSON:', e);
  }

  return {
    seoText: '<h1>' + mainTopic + '</h1>\n<p>' + text + '</p>',
    faq: [{ question: 'Was ist ' + mainTopic + '?', answer: 'Weitere Informationen folgen.' }],
    title: mainTopic.substring(0, 60),
    metaDescription: text.substring(0, 155),
    internalLinks: [],
    technicalHints: 'Schema.org Product/Article empfohlen',
    qualityReport: { status: 'green', flags: [], evidenceTable: [] }
  };
}
