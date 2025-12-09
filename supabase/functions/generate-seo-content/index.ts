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

    console.log('=== SEO Generator v9.0 ===');
    console.log('Generating SEO content with params:', {
      pageType: formData.pageType,
      targetAudience: formData.targetAudience,
      focusKeyword: formData.focusKeyword,
      tone: formData.tone,
      pageGoal: formData.pageGoal,
      complianceCheck: formData.complianceCheck,
      checkMDR: formData.checkMDR,
      checkHWG: formData.checkHWG,
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
      
      if (formData.tonality || formData.tone) {
        hasChanges = true;
        changeInstructions += '- Aendere Tonalitaet\n';
      }
      if (formData.formOfAddress) {
        hasChanges = true;
        changeInstructions += '- Aendere Anredeform zu: ' + formData.formOfAddress + '\n';
      }
      if (formData.wordCount || formData.contentLength) {
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
        const isB2B = formData.targetAudience === 'b2b' || formData.targetAudience === 'physiotherapists';
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
      
      // v9.0 Varianten-Stile
      const variantApproaches = [
        { 
          name: 'Variante A', 
          description: 'Sachlich & Strukturiert', 
          instruction: 'STIL: SACHLICH & STRUKTURIERT\n- Faktenbasiert mit klarer Hierarchie\n- Nutze Listen und Aufzählungen wo sinnvoll\n- Ruhiger, vertrauensbildender Ton\n- Daten und Fakten zur Untermauerung\n- Objektiv und informativ' 
        },
        { 
          name: 'Variante B', 
          description: 'Nutzenorientiert & Aktivierend', 
          instruction: 'STIL: NUTZENORIENTIERT & AKTIVIEREND\n- Starte Abschnitte mit Nutzenversprechen\n- Zeige Transformation (vorher → nachher)\n- Integriere CTAs an passenden Stellen\n- Konkrete Ergebnisse hervorheben\n- Aktivierende Verben und Sprache' 
        },
        { 
          name: 'Variante C', 
          description: 'Nahbar & Authentisch', 
          instruction: 'STIL: NAHBAR & AUTHENTISCH\n- Beginne mit realem Szenario aus dem Alltag\n- "Kennst du das?"-Einstiege\n- Nutze bildhafte, sensorische Sprache\n- Zeige Empathie für Nutzerbedürfnisse\n- Warmherziger, menschlicher Ton' 
        }
      ];
      
      const generateVariant = async (variantIndex: number): Promise<any> => {
        const approach = variantApproaches[variantIndex];
        
        // Kombiniere System-Prompt mit Varianten-Stil
        const enhancedUserPrompt = approach.instruction + '\n\n' + userPrompt;
        
        const variantMessages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enhancedUserPrompt }
        ];
        
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log('Variant ' + (variantIndex + 1) + ' (' + approach.name + '): attempt ' + attempt);
            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + LOVABLE_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                model: 'google/gemini-2.5-pro', 
                messages: variantMessages, 
                temperature: 0.55
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const rawContent = data.choices[0].message.content;
              console.log('Variant ' + (variantIndex + 1) + ' raw response length:', rawContent?.length || 0);
              
              const parsed = parseGeneratedContent(rawContent, formData);
              
              if (!parsed.seoText || parsed.seoText.length < 50) {
                console.error('CRITICAL: Variant ' + (variantIndex + 1) + ' has empty or too short seoText:', parsed.seoText?.length || 0);
                if (attempt < maxRetries) {
                  console.log('Retrying variant ' + (variantIndex + 1) + ' due to empty content...');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  continue;
                }
              }
              
              parsed._variantInfo = { name: approach.name, description: approach.description, index: variantIndex };
              console.log('Variant ' + (variantIndex + 1) + ' successfully parsed. seoText length:', parsed.seoText?.length || 0);
              return parsed;
            }
            
            if (response.status === 429 || response.status === 402) {
              throw new Error(response.status === 429 ? 'Rate limit exceeded' : 'Payment required');
            }
            
            if (response.status >= 500 && attempt < maxRetries) {
              console.log('Server error for variant ' + (variantIndex + 1) + ', retrying...');
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
              continue;
            }
            
            throw new Error('AI Gateway error: ' + response.status);
          } catch (err) {
            console.error('Error generating variant ' + (variantIndex + 1) + ':', err);
            if (attempt === maxRetries) throw err;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
        throw new Error('Failed to generate variant ' + variantIndex + ' after ' + maxRetries + ' attempts');
      };
      
      const variants = await Promise.all([generateVariant(0), generateVariant(1), generateVariant(2)]);
      console.log('Successfully generated 3 variants');
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

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION 9.0 - MASTER SYSTEM PROMPT
// Kombiniert das Beste aus allen Versionen + ALLE Frontend-Backend Fixes
// ═══════════════════════════════════════════════════════════════════════════════

function buildSystemPrompt(formData: any): string {
  
  // ═══ FIX #1: FRONTEND-BACKEND MAPPING für tone → tonality ═══
  // Frontend sendet 'tone': "factual" | "advisory" | "sales"
  // Backend brauchte 'tonality' mit anderen Werten - JETZT GEFIXT!
  const toneToTonality: Record<string, string> = {
    'factual': 'Sachlich & Informativ',
    'advisory': 'Beratend & Nutzenorientiert',
    'sales': 'Aktivierend & Überzeugend'
  };
  
  // Prüfe beide Varianten (Frontend: tone, Alt: tonality)
  const tonality = formData.tone 
    ? toneToTonality[formData.tone] || 'Balanced-Mix'
    : formData.tonality || 'Balanced-Mix';
  
  console.log('Tonality mapping: tone=' + formData.tone + ' → tonality=' + tonality);
  
  // ═══ FIX #2: pageGoal MAPPING (war komplett ignoriert!) ═══
  const goalMap: Record<string, string> = {
    'inform': 'INFORMIEREN - Wissen vermitteln, Fragen umfassend beantworten',
    'advise': 'BERATEN - Entscheidungshilfe geben, Optionen aufzeigen, Empfehlungen',
    'preparePurchase': 'KAUF VORBEREITEN - Vertrauen aufbauen, Bedenken ausräumen, Vorteile zeigen',
    'triggerPurchase': 'KAUF AUSLÖSEN - Dringlichkeit erzeugen, CTAs, zum Handeln motivieren'
  };
  const pageGoal = goalMap[formData.pageGoal] || goalMap['inform'];
  
  // ═══ Anrede ═══
  const addressMap: Record<string, string> = { 
    du: "Du-Form (persönlich, nahbar)", 
    sie: "Sie-Form (respektvoll, professionell)", 
    neutral: "Neutrale Anrede (keine direkte Ansprache)" 
  };
  const addressStyle = addressMap[formData.formOfAddress || 'du'] || addressMap.du;
  
  // ═══ Wortanzahl und Keyword-Dichte berechnen ═══
  const wordCountMap: Record<string, number> = { 'short': 400, 'medium': 800, 'long': 1200 };
  const wordCount = wordCountMap[formData.contentLength] || 800;
  const minKeywords = Math.ceil(wordCount * 0.005); // 0.5%
  const maxKeywords = Math.ceil(wordCount * 0.015); // 1.5%
  
  const maxPara = formData.maxParagraphLength || 300;
  const pageType = formData.pageType || 'product';
  
  // ═══ FIX #3: COMPLIANCE-STRUKTUR (war komplett broken!) ═══
  // Frontend sendet: checkMDR, checkHWG, checkStudies (direkt)
  // Alte Version suchte: complianceChecks.mdr, .hwg, .studies (Objekt)
  // JETZT: Beide Varianten unterstützt!
  let complianceBlock = '';
  
  const hasComplianceEnabled = formData.complianceCheck === true;
  const hasMDR = formData.complianceChecks?.mdr || formData.checkMDR;
  const hasHWG = formData.complianceChecks?.hwg || formData.checkHWG;
  const hasStudies = formData.complianceChecks?.studies || formData.checkStudies;
  
  if (hasComplianceEnabled && (hasMDR || hasHWG || hasStudies)) {
    const checks = [];
    if (hasMDR) checks.push('MDR/MPDG (Medizinprodukte-Verordnung)');
    if (hasHWG) checks.push('HWG (Heilmittelwerbegesetz)');
    if (hasStudies) checks.push('Studien korrekt zitieren mit Quellenangabe');
    
    complianceBlock = `

═══ COMPLIANCE-ANFORDERUNGEN (AKTIV!) ═══
WICHTIG - Diese Regularien MÜSSEN beachtet werden:
${checks.map(c => '• ' + c).join('\n')}

VERBOTEN:
- Keine Heilversprechen oder absolute Wirkaussagen
- Keine "heilt", "beseitigt", "garantiert" ohne Einschränkung
- Keine irreführenden Vorher-Nachher-Versprechen

ERLAUBT:
- "kann unterstützen", "trägt bei zu", "wurde entwickelt für"
- Bei Studienverweisen: Autor, Jahr, ggf. DOI angeben
- Hinweis auf individuelle Ergebnisse`;
    
    console.log('Compliance AKTIV:', checks.join(', '));
  }
  
  // ═══ FIX #4: ZIELGRUPPEN-BLOCK (targetAudience wurde ignoriert!) ═══
  // Frontend sendet: "endCustomers" | "physiotherapists"
  // Jetzt: Echter Unterschied im Prompt!
  let audienceBlock = '';
  
  if (formData.targetAudience === 'physiotherapists') {
    audienceBlock = `

═══ ZIELGRUPPE: THERAPEUTEN / FACHPERSONAL ═══

EXPERTISE-LEVEL: Hoch - Schreibe für medizinisches Fachpersonal!

FACHSPRACHE VERWENDEN:
• Anatomische Terminologie (M. trapezius, Fascia thoracolumbalis, etc.)
• Biomechanische Begriffe (Propriozeption, neuromuskuläre Kontrolle)
• Evidenzlevel angeben (Level I-V nach Oxford)
• ICD-10 / ICF-Klassifikationen wo relevant
• AWMF-Leitlinien referenzieren

ARGUMENTATION:
• Studienlage und Evidenz betonen
• Wirkmechanismen erklären (nicht nur "funktioniert")
• Indikationen und Kontraindikationen nennen
• Messinstrumente erwähnen (VAS, ROM, DASH, SF-36)
• Praxisrelevanz für den Behandlungsalltag

BEISPIEL-FORMULIERUNGEN:
✓ "Die propriozeptive Stimulation durch das kinesiologische Tape..."
✓ "Laut aktueller Studienlage (Kase et al., 2003)..."
✓ "Indiziert bei funktionellen Instabilitäten des OSG..."

TON: Fachlich-kollegial, auf Augenhöhe mit Therapeuten`;
    
    console.log('Zielgruppe: THERAPEUTEN (Fachsprache aktiviert)');
  } else {
    audienceBlock = `

═══ ZIELGRUPPE: ENDKUNDEN / PATIENTEN ═══

EXPERTISE-LEVEL: Laienverständlich - Erkläre Fachbegriffe!

SPRACHE:
• Einfach und verständlich, keine Fachbegriffe ohne Erklärung
• Emotionale Verbindung aufbauen
• Alltagsszenarien und praktische Beispiele
• "Kennst du das?" - Situationen

ARGUMENTATION:
• Nutzen und Vorteile in den Vordergrund
• Problemlösung konkret beschreiben
• Anwendung einfach erklären (Schritt-für-Schritt)
• Vertrauen durch Transparenz

BEISPIEL-FORMULIERUNGEN:
✓ "Kennst du das? Nach dem Sport zieht es im Knie..."
✓ "Das Tape unterstützt deine Muskulatur, ohne einzuschränken"
✓ "Einfach aufkleben und bis zu 7 Tage tragen"

TON: Freundlich, nahbar, vertrauensvoll`;
    
    console.log('Zielgruppe: ENDKUNDEN (einfache Sprache)');
  }

  // ═══ STRUKTUR-VORLAGEN ═══
  let structureTemplates = '';
  if (pageType === 'product') {
    structureTemplates = `

═══ STRUKTUR-VORLAGE: PRODUKTSEITE ═══

<h1>[Produktname] – [Hauptnutzen/USP]</h1>
<p>Einleitungstext mit Fokus-Keyword in ersten 50 Wörtern...</p>

<h2>Was ist [Produkt] und wie funktioniert es?</h2>
<p>Erklärung mit E-E-A-T Signalen...</p>

  <h3>Die Technologie dahinter</h3>
  <p>Details zur Funktionsweise...</p>
  
  <h3>Vorteile auf einen Blick</h3>
  <ul>
    <li><strong>Vorteil 1:</strong> Beschreibung</li>
    <li><strong>Vorteil 2:</strong> Beschreibung</li>
  </ul>

<h2>Für wen eignet sich [Produkt]?</h2>
<p>Zielgruppen und Anwendungsfälle...</p>

<h2>[Produkt] richtig anwenden</h2>
<p>Schritt-für-Schritt oder Tipps...</p>

<h2>Häufige Fragen zu [Produkt]</h2>
<!-- FAQ-Sektion -->`;
  } else {
    structureTemplates = `

═══ STRUKTUR-VORLAGE: KATEGORIESEITE ═══

<h1>[Kategorie] – [Nutzenversprechen/Überblick]</h1>
<p>Einleitungstext mit Fokus-Keyword, Überblick über die Kategorie...</p>

<h2>Was sind [Kategorie] und wofür werden sie verwendet?</h2>
<p>Grundlegende Erklärung der Produktkategorie...</p>

<h2>Die verschiedenen Arten von [Kategorie]</h2>
<p>Übersicht der Unterkategorien/Varianten...</p>

  <h3>[Unterkategorie 1]</h3>
  <p>Beschreibung, Vorteile, Anwendung...</p>
  
  <h3>[Unterkategorie 2]</h3>
  <p>Beschreibung, Vorteile, Anwendung...</p>

<h2>So findest du [das richtige Produkt]</h2>
<p>Kaufberatung, Auswahlkriterien...</p>

<h2>Häufige Fragen zu [Kategorie]</h2>
<!-- FAQ-Sektion -->`;
  }

  // ═══ MASTER SYSTEM PROMPT v9.0 ═══
  return `Du bist ein Elite-SEO-Content-Stratege für K-Active, spezialisiert auf kinesiologische Tapes und Physiotherapie-Produkte. Du kombinierst tiefes SEO-Wissen mit medizinischem Fachwissen und exzellentem Schreibstil.

═══ AKTUELLE AUFGABE ═══
SEITENTYP: ${pageType === 'product' ? 'Produktseite' : 'Kategorieseite'}
ZIEL DER SEITE: ${pageGoal}
TONALITÄT: ${tonality}
ANREDE: ${addressStyle}
TEXTLÄNGE: ca. ${wordCount} Wörter
${audienceBlock}
${complianceBlock}

═══ GRUNDPRINZIPIEN ═══

1. SCHREIBE FÜR MENSCHEN, OPTIMIERE FÜR GOOGLE
   - Jeder Satz muss Mehrwert bieten
   - Keywords fließen natürlich ein – niemals erzwungen
   - Kein Satz existiert nur, um ein Keyword unterzubringen

2. LEBENDIGE, AKTIVIERENDE SPRACHE
   - Variiere Satzlängen bewusst: Kurz. Dann mittel. Dann ein längerer Satz, der mehr erklärt.
   - Vermeide monotone Satzanfänge (nicht 3x "Das..." oder "Die...")
   - Aktive Verben statt passiver Konstruktionen
   - Direkte Ansprache des Lesers

═══ KEYWORD-STRATEGIE (KRITISCH - Google 2025) ═══

FOKUS-KEYWORD PLATZIERUNG (PFLICHT):
✓ In der H1 (Hauptüberschrift)
✓ In den ersten 100 Wörtern
✓ In mindestens einer H2
✓ Im letzten Absatz
✓ Im Meta-Title und Meta-Description

KEYWORD-DICHTE (ABSOLUT KRITISCH):
• Erlaubt: 0.5% - 1.5% – NIEMALS höher!
• Bei ${wordCount} Wörtern = ${minKeywords}-${maxKeywords} Erwähnungen des Fokus-Keywords
• Keyword-Stuffing wird von Google ABGESTRAFT!
• Nutze Synonyme und Variationen statt stumpfer Wiederholung

═══ E-E-A-T KONKRET UMSETZEN ═══

EXPERIENCE (Erfahrung):
→ "Aus der Praxis zeigt sich...", "Anwender berichten..."
→ Konkrete Anwendungsszenarien beschreiben
→ Typische Situationen aus dem Alltag

EXPERTISE (Fachwissen):
→ Fachbegriffe korrekt verwenden (und ggf. erklären)
→ Das "Warum" hinter Features erklären
→ Technische Details wo relevant

AUTHORITATIVENESS (Autorität):
→ Zertifizierungen nennen (OEKO-TEX®, CE, etc.)
→ Studien oder Normen referenzieren
→ "Entwickelt in Deutschland", "ISO-zertifiziert"

TRUSTWORTHINESS (Vertrauen):
→ Ehrlich über Grenzen: "Ersetzt nicht die ärztliche Beratung"
→ Keine übertriebenen Heilversprechen
→ Garantien und Qualitätsversprechen
${structureTemplates}

═══ MULTIMEDIALE GESTALTUNG (PFLICHT!) ═══

Der Text MUSS folgende Elemente enthalten:
• Mindestens 2-3 Bullet-Listen (für Vorteile, Features, Tipps)
• <strong>-Tags für wichtige Keywords und Begriffe
• Nach maximal 3 Absätzen MUSS ein visuelles Element folgen (Liste, Fettung, Zwischenüberschrift)
• Tabellen bei Vergleichen oder technischen Daten

NIEMAND liest Textwände! Der Text muss "überfliegbar" sein.

═══ ANTI-PATTERNS – VERBOTEN! ═══

Diese Phrasen/Muster sind TABU und dürfen NICHT verwendet werden:

❌ "In der heutigen Zeit..." / "In der modernen Welt..."
❌ "Es ist wichtig zu beachten, dass..."
❌ "Zusammenfassend lässt sich sagen..."
❌ "Tauchen wir tiefer ein..."
❌ "In diesem Artikel erfahren Sie..."
❌ "Herzlich willkommen auf unserer Seite..."
❌ "Wie wir alle wissen..."
❌ "Es gibt viele verschiedene..."

NEGATIV-BEISPIELE (so NICHT):
❌ "Kinesiologie Tape sind unterschätzte Hilfsmittel. Deshalb begeistert K-Active Tape Therapeuten sehr."
→ Keyword-Spam, unnatürliche Grammatik

❌ "Wie du siehst, haben wir uns etwas gedacht."
→ Füllsatz ohne Information

POSITIV-BEISPIELE (so JA):
✓ "Kennst du das? Das Tape löst sich nach dem Sport. K-Active PreCut haftet bis zu 7 Tage."
→ Problem-Lösung, konkret, natürlich

✓ "Der wasserfeste Acrylkleber reagiert mit der Körperwärme und aktiviert sich nach 20 Minuten vollständig."
→ Feature + Erklärung + konkretes Detail

═══ FAQ-SEKTION ═══

Erstelle 5-8 W-Fragen mit DIREKTEN Antworten:
• Die Antwort MUSS im ersten Satz nach der Frage stehen
• Keine Einleitungen wie "Das ist eine gute Frage..."
• Featured-Snippet-Format: Antwort in 40-60 Wörtern

═══ OUTPUT-FORMAT ═══

Liefere das Ergebnis als JSON:

{
  "title": "Meta-Title, max 60 Zeichen, Fokus-Keyword vorne",
  "metaDescription": "Meta-Description, max 155 Zeichen, Fokus-Keyword, Call-to-Action",
  "seoText": "HTML-formatierter Text mit <h1>, <h2>, <h3>, <p>, <ul>, <strong>",
  "faq": [
    {"question": "W-Frage mit Keyword?", "answer": "Direkte Antwort..."}
  ],
  "internalLinks": ["Vorschläge für interne Verlinkung"],
  "technicalHints": "Schema.org Empfehlungen",
  "qualityReport": {
    "keywordDensity": "X.X%",
    "wordCount": ${wordCount},
    "h2Count": "Anzahl",
    "readabilityScore": "Einschätzung"
  }
}

═══ QUALITÄTSPRÜFUNG VOR OUTPUT ═══

Prüfe BEVOR du ausgibst:
□ Fokus-Keyword in H1? ✓
□ Fokus-Keyword in ersten 100 Wörtern? ✓
□ Keyword-Dichte zwischen 0.5% und 1.5%? ✓
□ Meta-Title max 60 Zeichen? ✓
□ Meta-Description max 155 Zeichen? ✓
□ Exakt 1x H1? ✓
□ Mindestens 2-3 Listen im Text? ✓
□ Keine verbotenen Phrasen? ✓
□ FAQ mit direkten Antworten? ✓
□ E-E-A-T-Signale vorhanden? ✓`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION 9.0 - USER PROMPT (mit allen Frontend-Feldern!)
// ═══════════════════════════════════════════════════════════════════════════════

function buildUserPrompt(formData: any, briefingContent: string): string {
  // Markenname aus verschiedenen möglichen Feldern
  const brandName = formData.brandName || formData.manufacturerName || 'K-Active';
  
  // Thema/Produkt - Frontend hat kein mainTopic, also aus Keyword ableiten
  const mainTopic = formData.mainTopic || formData.productName || formData.focusKeyword || '';
  
  let prompt = `═══ CONTENT-BRIEF ═══

MARKE: ${brandName}
THEMA/PRODUKT: ${mainTopic}
FOKUS-KEYWORD: ${formData.focusKeyword}`;

  // Sekundär-Keywords
  if (formData.secondaryKeywords && formData.secondaryKeywords.length > 0) {
    prompt += `
SEKUNDÄR-KEYWORDS: ${formData.secondaryKeywords.join(', ')}`;
  }

  // ═══ FIX #5: manufacturerInfo EINBINDEN (wurde ignoriert!) ═══
  if (formData.manufacturerInfo && formData.manufacturerInfo.trim()) {
    prompt += `

═══ HERSTELLER-/PRODUKTDATEN ═══
${formData.manufacturerInfo.substring(0, 3000)}`;
    console.log('manufacturerInfo eingebunden (' + formData.manufacturerInfo.length + ' Zeichen)');
  }

  // Zusätzliche Infos / USPs
  if (formData.additionalInfo && formData.additionalInfo.trim()) {
    prompt += `

═══ ZUSATZINFOS / USPs ═══
${formData.additionalInfo}`;
  }

  // ═══ FIX #6: internalLinks VERWENDEN (wurde ignoriert!) ═══
  if (formData.internalLinks && formData.internalLinks.trim()) {
    prompt += `

═══ INTERNE VERLINKUNG ═══
Baue diese internen Links sinnvoll in den Text ein:
${formData.internalLinks}`;
    console.log('internalLinks eingebunden');
  }

  // ═══ FIX #7: faqInputs als W-Fragen VERWENDEN ═══
  if (formData.faqInputs && formData.faqInputs.trim()) {
    const questions = formData.faqInputs.split('\n').filter((q: string) => q.trim());
    if (questions.length > 0) {
      prompt += `

═══ FAQ-VORGABEN (Diese Fragen MÜSSEN beantwortet werden!) ═══
${questions.map((q: string, i: number) => (i + 1) + '. ' + q.trim()).join('\n')}`;
      console.log('faqInputs eingebunden (' + questions.length + ' Fragen)');
    }
  }

  // Suchintention (falls vorhanden)
  if (formData.searchIntent && formData.searchIntent.length > 0) {
    const intentMap: Record<string, string> = {
      'know': 'Know (Informationssuche)',
      'do': 'Do (Transaktional)',
      'buy': 'Buy (Kaufabsicht)',
      'go': 'Go (Navigation)'
    };
    const intents = formData.searchIntent.map((i: string) => intentMap[i] || i).join(', ');
    prompt += `

SUCHINTENTION: ${intents}
→ Struktur und Inhalt MÜSSEN zur Suchintention passen!`;
  }

  // W-Fragen (falls separat vorhanden)
  if (formData.wQuestions && formData.wQuestions.length > 0) {
    prompt += `

W-FRAGEN (MÜSSEN im Text beantwortet werden):
${formData.wQuestions.map((q: string) => '• ' + q).join('\n')}`;
  }

  // Briefing-Content (aus hochgeladenen Dateien)
  if (briefingContent && briefingContent.trim()) {
    prompt += `

${briefingContent}`;
  }

  prompt += `

═══ AUFGABE ═══
Erstelle jetzt den SEO-optimierten Text nach allen Vorgaben aus dem System-Prompt.

CHECKLISTE:
✓ Keyword-Dichte 0.5-1.5% (nicht höher!)
✓ Mindestens 2-3 Listen im Text
✓ Lebendige, variierende Sprache
✓ E-E-A-T Signale einbauen
✓ Keine verbotenen Phrasen
✓ FAQ mit direkten Antworten

Liefere das Ergebnis als valides JSON.`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARSING FUNCTIONS (unverändert)
// ═══════════════════════════════════════════════════════════════════════════════

function parseGeneratedContent(text: string, formData: any): any {
  const mainTopic = formData.mainTopic || formData.productName || formData.focusKeyword;
  
  console.log('Parsing content, raw length:', text.length);
  
  // Method 1: Direct JSON parse
  try {
    const parsed = JSON.parse(text);
    if (parsed.seoText || parsed.text) {
      console.log('Successfully parsed direct JSON');
      return validateAndFixContent(parsed, mainTopic);
    }
  } catch (e) {
    // Continue to next method
  }

  // Method 2: JSON in markdown code block
  try {
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      console.log('Found JSON in code block');
      const parsed = JSON.parse(codeBlockMatch[1]);
      return validateAndFixContent(parsed, mainTopic);
    }
  } catch (e) {
    console.error('Code block parsing failed:', e);
  }

  // Method 3: Find largest JSON object
  const jsonMatches = Array.from(text.matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g));
  if (jsonMatches.length > 0) {
    const sortedMatches = jsonMatches.sort((a, b) => b[0].length - a[0].length);
    for (const match of sortedMatches) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed.seoText || parsed.text) {
          console.log('Successfully parsed JSON object from text');
          return validateAndFixContent(parsed, mainTopic);
        }
      } catch (e) {
        // Try next match
      }
    }
  }

  // Method 4: Nested JSON
  try {
    const nestedMatch = text.match(/"(?:content|result|output)":\s*(\{[\s\S]*?\})\s*[,}]/);
    if (nestedMatch) {
      console.log('Found nested JSON');
      const parsed = JSON.parse(nestedMatch[1]);
      return validateAndFixContent(parsed, mainTopic);
    }
  } catch (e) {
    console.error('Nested JSON parsing failed:', e);
  }

  // Fallback: HTML without JSON wrapper
  if (text.includes('<h1>') && text.includes('</h1>') && text.length > 500) {
    console.warn('No JSON found but HTML detected, using as seoText');
    return {
      seoText: text,
      faq: [{ question: 'Was ist ' + mainTopic + '?', answer: 'Weitere Informationen folgen.' }],
      title: mainTopic.substring(0, 60),
      metaDescription: text.replace(/<[^>]*>/g, '').substring(0, 155),
      internalLinks: [],
      technicalHints: 'Schema.org Product/Article empfohlen',
      qualityReport: { status: 'warning', flags: ['No JSON structure returned'], evidenceTable: [] }
    };
  }

  // Last resort
  console.error('CRITICAL: All parsing methods failed, creating minimal fallback');
  return {
    seoText: '',
    faq: [],
    title: mainTopic.substring(0, 60),
    metaDescription: '',
    internalLinks: [],
    technicalHints: '',
    qualityReport: { status: 'error', flags: ['Parsing failed'], evidenceTable: [] }
  };
}

function validateAndFixContent(content: any, mainTopic: string): any {
  const seoText = content.seoText || content.text || '';
  const faq = Array.isArray(content.faq) ? content.faq : [];
  
  if (!seoText || seoText.length < 100) {
    console.error('VALIDATION FAILED: seoText too short or empty:', seoText.length);
    return {
      seoText: '',
      faq: [],
      title: '',
      metaDescription: '',
      internalLinks: [],
      technicalHints: '',
      qualityReport: { status: 'error', flags: ['Content too short'], evidenceTable: [] }
    };
  }
  
  const validated = {
    seoText: seoText,
    faq: faq.length > 0 ? faq : [{ 
      question: 'Was zeichnet ' + mainTopic + ' aus?', 
      answer: 'Detaillierte Informationen finden Sie im Text oben.' 
    }],
    title: content.title || mainTopic.substring(0, 60),
    metaDescription: content.metaDescription || content.meta_description || seoText.replace(/<[^>]*>/g, '').substring(0, 155),
    internalLinks: Array.isArray(content.internalLinks) ? content.internalLinks : [],
    technicalHints: content.technicalHints || 'Schema.org Product/Article Markup empfohlen',
    qualityReport: content.qualityReport || { status: 'green', flags: [], evidenceTable: [] }
  };
  
  console.log('Content validated successfully. seoText length:', validated.seoText.length);
  return validated;
}
