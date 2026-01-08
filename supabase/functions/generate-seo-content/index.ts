import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const formDataSchema = z.object({
  focusKeyword: z.string().min(1, 'Fokus-Keyword ist erforderlich').max(200, 'Fokus-Keyword zu lang'),
  pageType: z.string().max(100).optional(),
  targetAudience: z.string().max(100).optional(),
  formOfAddress: z.enum(['du', 'sie', 'neutral']).optional(),
  tone: z.enum(['factual', 'advisory', 'sales']).optional(),
  contentLength: z.enum(['short', 'medium', 'long']).optional(),
  keywordDensity: z.enum(['minimal', 'low', 'normal', 'medium', 'high']).optional(),
  secondaryKeywords: z.array(z.string().max(100)).max(20).optional(),
  briefingFiles: z.array(z.string().max(500)).max(20).optional(),
  manufacturerName: z.string().max(500).optional(),
  productInfo: z.string().max(50000).optional(),
  existingContent: z.any().optional(),
  quickChange: z.boolean().optional(),
  refinementPrompt: z.string().max(5000).optional(),
  promptVersion: z.string().max(100).optional(),
  pageGoal: z.string().max(500).optional(),
  searchIntent: z.array(z.string().max(50)).max(10).optional(),
  wQuestions: z.array(z.string().max(500)).max(20).optional(),
  complianceCheck: z.boolean().optional(),
  checkMDR: z.boolean().optional(),
  checkHWG: z.boolean().optional(),
  checkStudies: z.boolean().optional(),
  mainTopic: z.string().max(500).optional(),
  brandName: z.string().max(200).optional(),
  additionalInfo: z.string().max(10000).optional(),
  internalLinks: z.array(z.any()).max(50).optional(),
  faqInputs: z.array(z.any()).max(20).optional(),
  includeFAQ: z.boolean().optional(),
  addExamples: z.boolean().optional(),
  tonality: z.string().max(100).optional(),
  wordCount: z.string().max(20).optional(),
  maxParagraphLength: z.number().int().min(100).max(1000).optional(),
  complianceChecks: z.object({
    mdr: z.boolean().optional(),
    hwg: z.boolean().optional(),
    studies: z.boolean().optional(),
  }).optional(),
}).passthrough();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Invalid token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);
    // ===== END AUTHENTICATION =====

    // ===== INPUT VALIDATION =====
    const rawFormData = await req.json();
    const parseResult = formDataSchema.safeParse(rawFormData);
    
    if (!parseResult.success) {
      console.log('Validation error:', parseResult.error.format());
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parseResult.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = parseResult.data;
    // ===== END VALIDATION =====
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server-Konfigurationsfehler' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ═══ LOGGING mit Prompt-Version ═══
    const promptVersion = formData.promptVersion || 'v9-master-prompt';
    console.log('=== SEO Generator - Version: ' + promptVersion + ' ===');
    console.log('Generating SEO content with params:', {
      promptVersion: promptVersion,
      pageType: formData.pageType,
      targetAudience: formData.targetAudience,
      focusKeyword: formData.focusKeyword,
      tone: formData.tone,
      pageGoal: formData.pageGoal,
      keywordDensity: formData.keywordDensity,
      searchIntent: formData.searchIntent,
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
// SYSTEM PROMPT BUILDER MIT VERSION-ROUTING
// ═══════════════════════════════════════════════════════════════════════════════

function buildSystemPrompt(formData: any): string {
  const promptVersion = formData.promptVersion || 'v9-master-prompt';
  
  // ═══ GEMEINSAME VARIABLEN FÜR ALLE VERSIONEN ═══
  const addressMap: Record<string, string> = { 
    du: "Verwende die Du-Form.", 
    sie: "Verwende die Sie-Form.", 
    neutral: "Vermeide direkte Anrede." 
  };
  const addressStyle = addressMap[formData.formOfAddress || 'du'] || addressMap.du;
  
  const tonalityMap: Record<string, string> = {
    'expertenmix': 'Expertenmix (70% Fachwissen, 20% Lösung, 10% Story)',
    'consultant-mix': 'Beratermix (40% Fachwissen, 40% Lösung, 20% Story)',
    'storytelling-mix': 'Storytelling-Mix (30% Fachwissen, 30% Lösung, 40% Story)',
    'conversion-mix': 'Conversion-Mix (20% Fachwissen, 60% Lösung, 20% Story)',
    'balanced-mix': 'Balanced-Mix (je 33%)'
  };
  
  // ═══ FIX: tone → tonality MAPPING ═══
  const toneToTonality: Record<string, string> = {
    'factual': 'Sachlich & Informativ',
    'advisory': 'Beratend & Nutzenorientiert',
    'sales': 'Aktivierend & Überzeugend'
  };
  
  const tonality = formData.tone 
    ? toneToTonality[formData.tone] || tonalityMap[formData.tonality] || 'Balanced-Mix'
    : tonalityMap[formData.tonality] || 'Balanced-Mix';
  
  const maxPara = formData.maxParagraphLength || 300;
  
  // ═══ WORTANZAHL UND KEYWORD-DICHTE ═══
  const wordCountMap: Record<string, number> = { 'short': 400, 'medium': 800, 'long': 1200 };
  const wordCount = wordCountMap[formData.contentLength] || 800;
  
  // ═══ FIX: keywordDensity DROPDOWN VERWENDEN ═══
  const densityMap: Record<string, { min: number; max: number; label: string }> = {
    'minimal': { min: 0.003, max: 0.008, label: 'Minimal (0.3-0.8%) - sehr natürlich' },
    'normal': { min: 0.005, max: 0.015, label: 'Normal (0.5-1.5%) - SEO-optimiert' },
    'high': { min: 0.015, max: 0.025, label: 'Hoch (1.5-2.5%) - aggressiv' }
  };
  const density = densityMap[formData.keywordDensity] || densityMap['normal'];
  const minKeywords = Math.ceil(wordCount * density.min);
  const maxKeywords = Math.ceil(wordCount * density.max);
  
  console.log('Keyword-Dichte: ' + (formData.keywordDensity || 'normal') + ' → ' + minKeywords + '-' + maxKeywords + ' Keywords bei ' + wordCount + ' Wörtern');
  
  // ═══ COMPLIANCE ═══
  let compliance = '';
  const hasMDR = formData.complianceChecks?.mdr || formData.checkMDR;
  const hasHWG = formData.complianceChecks?.hwg || formData.checkHWG;
  const hasStudies = formData.complianceChecks?.studies || formData.checkStudies;
  
  if (formData.complianceCheck && (hasMDR || hasHWG || hasStudies)) {
    const checks = [];
    if (hasMDR) checks.push('MDR/MPDG beachten');
    if (hasHWG) checks.push('HWG beachten');
    if (hasStudies) checks.push('Studien korrekt zitieren');
    compliance = '\n\nCOMPLIANCE: ' + checks.join(', ');
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VERSION ROUTING - ALLE 16 VERSIONEN
  // ═══════════════════════════════════════════════════════════════════════════════

  // ═══ VERSION 0.1: PRE-ALPHA-EXPERIMENTAL ═══
  if (promptVersion === 'v0-pre-alpha-experimental') {
    return 'Du bist ein SEO-Textgenerator. Erstelle einen einfachen SEO-optimierten Text.\n\n' +
    '# GRUNDLEGENDE ANFORDERUNGEN\n\n' +
    '- Verwende das Fokus-Keyword: ' + formData.focusKeyword + '\n' +
    '- Schreibe eine H1-Ueberschrift mit dem Keyword\n' +
    '- Erstelle 3-5 Absaetze mit relevanten Informationen\n' +
    '- Fuege eine kurze Meta-Description hinzu\n' +
    '- ' + addressStyle + '\n' +
    '\nHalte es einfach und verstaendlich.\n\n' +
    'AUSGABE: JSON mit seoText, title, metaDescription';
  }

  // ═══ VERSION 0.2: ALPHA-BASIC ═══
  if (promptVersion === 'v0-alpha-basic') {
    return 'Du bist SEO-Texter. Erstelle optimierten Content nach folgenden Regeln:\n\n' +
    '# SEO-GRUNDLAGEN\n\n' +
    '1. KEYWORD-OPTIMIERUNG:\n' +
    '- Fokus-Keyword: ' + formData.focusKeyword + '\n' +
    '- Keyword in H1, ersten 100 Woertern und Meta-Description\n' +
    '- Keyword-Dichte: ' + density.label + '\n' +
    (formData.secondaryKeywords?.length > 0 ? '- Sekundaer-Keywords: ' + formData.secondaryKeywords.join(', ') + '\n' : '') +
    '\n2. STRUKTUR:\n' +
    '- Eine H1-Ueberschrift\n' +
    '- Mehrere H2-Ueberschriften fuer Hauptabschnitte\n' +
    '- Klare Absaetze (max ' + maxPara + ' Woerter)\n' +
    '\n3. META-DATEN:\n' +
    '- Title-Tag: max 60 Zeichen mit Fokus-Keyword\n' +
    '- Meta-Description: max 160 Zeichen\n' +
    '\n4. ANREDE: ' + addressStyle + '\n' +
    '\nZIEL: Technisch korrekte SEO-Optimierung.\n\n' +
    'AUSGABE: JSON mit seoText, title, metaDescription, faq, internalLinks';
  }

  // ═══ VERSION 0.3: BETA-TONALITY ═══
  if (promptVersion === 'v0-beta-tonality') {
    return 'Du bist SEO-Texter mit 3-dimensionalem Tonalitaets-System.\n\n' +
    '# 3D-TONALITAETS-SYSTEM\n\n' +
    'Deine Tonalitaet: ' + tonality + '\n\n' +
    'Das bedeutet eine praezise Mischung aus:\n' +
    '- FACHWISSEN (Expertise, Fachbegriffe, Tiefe)\n' +
    '- STORYTELLING (Geschichten, Beispiele, Emotionen)\n' +
    '- LOESUNGSORIENTIERUNG (Praktische Tipps, Handlungsempfehlungen)\n\n' +
    'SEO-BASIS:\n' +
    '1. Fokus-Keyword: ' + formData.focusKeyword + '\n' +
    '2. Keyword in H1 und ersten 100 Woertern\n' +
    '3. Struktur: H1 > H2 > H3 (logische Hierarchie)\n' +
    '4. Absatzlaenge: max ' + maxPara + ' Woerter\n' +
    '5. Anrede: ' + addressStyle + '\n' +
    '\nWICHTIG: Halte die Tonalitaets-Balance ein! Jede Dimension sollte sichtbar sein.\n' +
    compliance +
    '\n\nAUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints';
  }

  // ═══ VERSION 0.4: RC-VARIANTS ═══
  if (promptVersion === 'v0-rc-variants') {
    return 'Du bist strategischer SEO-Content-Creator. Erstelle durchdachten, strukturierten Content.\n\n' +
    '# STRATEGISCHER CONTENT-ANSATZ\n\n' +
    'TONALITAET: ' + tonality + '\n' +
    '- Balance zwischen Fachwissen, Storytelling und Loesungsorientierung\n' +
    '- Authentischer, professioneller Stil\n\n' +
    'SEO-OPTIMIERUNG:\n' +
    '1. KEYWORD-STRATEGIE:\n' +
    '   - Fokus: ' + formData.focusKeyword + '\n' +
    '   - In H1, Intro (erste 100 Woerter), natuerlich im Text\n' +
    '   - Keyword-Dichte: ' + density.label + '\n' +
    '\n2. CONTENT-STRUKTUR:\n' +
    '   - H1: Benefit-orientiert mit Keyword\n' +
    '   - H2: Klare Themenabschnitte\n' +
    '   - H3: Detailvertiefung\n' +
    '   - Absaetze: max ' + maxPara + ' Woerter\n' +
    '\n3. QUALITAET:\n' +
    '   - E-E-A-T Prinzipien beachten\n' +
    '   - Konkrete Beispiele und Anwendungsfaelle\n' +
    '   - FAQ mit relevanten W-Fragen\n' +
    '\n4. ANREDE: ' + addressStyle + '\n' +
    compliance +
    '\n\nZIEL: Hochwertiger Content der Nutzer UND Suchmaschinen ueberzeugt.\n\n' +
    'AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport';
  }

  // ═══ VERSION 10: GEO-OPTIMIZED (Generative Engine Optimization) ═══
  if (promptVersion === 'v10-geo-optimized') {
    return buildV10GeoPrompt(formData, tonality, addressStyle, wordCount, minKeywords, maxKeywords, density, compliance);
  }

  // ═══ VERSION 1: KOMPAKT-SEO ═══
  if (promptVersion === 'v1-kompakt-seo') {
    return 'Du bist erfahrener SEO-Texter nach Google-Standards 2024/2025.\n\n' +
    '# TOP 10 KRITISCHE SEO-FAKTOREN\n\n' +
    '1. FOKUS-KEYWORD: MUSS in H1 und ersten 100 Woertern, Keyword-Dichte ' + density.label + '\n' +
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

  // ═══ VERSION 2: MARKETING-FIRST ═══
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
    'KEYWORD-DICHTE: ' + density.label + '\n' +
    compliance +
    '\n\nZIEL: Texte die man GERNE liest, die im Gedaechtnis bleiben, die ueberzeugen. SEO ist Mittel, nicht Zweck.\n\n' +
    'AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport, guidelineValidation';
  }

  // ═══ VERSION 3: HYBRID-INTELLIGENT ═══
  if (promptVersion === 'v3-hybrid-intelligent') {
    return 'Du bist intelligenter Content-Stratege der SEO-Technik und kreatives Schreiben vereint.\n\n' +
    '# HYBRID-ANSATZ: DAS BESTE AUS BEIDEN WELTEN\n\n' +
    'STUFE 1 - FUNDAMENT (SEO-Basis):\n' +
    '- Fokus-Keyword in H1 und Intro (natuerlich integriert)\n' +
    '- Klare Struktur mit H2/H3 (logisch, nicht mechanisch)\n' +
    '- Max ' + maxPara + ' Woerter/Absatz, ' + addressStyle + '\n' +
    '- Tonalitaet: ' + tonality + '\n' +
    '- Keyword-Dichte: ' + density.label + '\n\n' +
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

  // ═══ VERSION 4: MINIMAL-KREATIV ═══
  if (promptVersion === 'v4-minimal-kreativ') {
    return 'Du bist freier Autor mit SEO-Bewusstsein. Schreibe erstklassige Texte.\n\n' +
    '# NUR 5 NICHT-VERHANDELBARE REGELN\n\n' +
    '1. Fokus-Keyword muss in H1 und ersten 2 Absaetzen vorkommen (natuerlich!)\n' +
    '2. Ein Absatz = Eine Idee (max ' + maxPara + ' Woerter)\n' +
    '3. ' + addressStyle + '\n' +
    '4. Tonalitaet: ' + tonality + '\n' +
    '5. Schreibe fuer Menschen, nicht fuer Algorithmen\n' +
    '6. Keyword-Dichte: ' + density.label + '\n' +
    compliance +
    '\n\nSONST: Totale kreative Freiheit. Ueberrasche. Experimentiere. Sei mutig.\n' +
    '- Breche mit Konventionen wenn es dem Text dient\n' +
    '- Nutze Cliffhanger, offene Fragen, provokante Thesen\n' +
    '- Schreibe Headlines die man anklicken MUSS\n' +
    '- Mache den Text unvergesslich\n\n' +
    'MANTRA: "Wenn der Text langweilig ist, ist er falsch - egal wie SEO-optimiert."\n\n' +
    'AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport, guidelineValidation';
  }

  // ═══ VERSION 5: AI-META-OPTIMIERT ═══
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
    '- Tonalitaet: ' + tonality + ', ' + addressStyle + '\n' +
    '- Keyword-Dichte: ' + density.label + '\n\n' +
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

  // ═══ VERSION 6: QUALITY-AUDITOR ═══
  if (promptVersion === 'v6-quality-auditor') {
    return 'Du bist "Senior SEO Editor & Quality Auditor". Deine Aufgabe: High-End-Content der "Helpful Content" Signale sendet und extrem gut lesbar ist.\n\n' +
    '# ANTI-FLUFF BLACKLIST (NIEMALS VERWENDEN!)\n\n' +
    'Diese Phrasen sind VERBOTEN und muessen geloescht/umgeschrieben werden:\n' +
    '- "In der heutigen digitalen Welt..."\n' +
    '- "Es ist wichtig zu beachten..."\n' +
    '- "Zusammenfassend laesst sich sagen..."\n' +
    '- "Tauchen wir tiefer ein..."\n' +
    '- "Ein entscheidender Faktor ist..."\n' +
    '- "Es gibt viele Moeglichkeiten..."\n' +
    '- "Heutzutage..."\n' +
    '- "Wie wir alle wissen..."\n' +
    '- "Generell kann man sagen..."\n' +
    '- Jeder Satz ohne direkten Mehrwert = LOESCHEN!\n\n' +
    '# AEO - ANSWER ENGINE OPTIMIZATION\n\n' +
    'KRITISCHE REGEL: Wenn eine H2/H3 eine Frage ist, MUSS der erste Satz eine DIREKTE Antwort sein!\n' +
    '- FALSCH: "SEO ist ein komplexes Thema, das..."\n' +
    '- RICHTIG: "SEO (Search Engine Optimization) ist die Praxis, Webseiten technisch und inhaltlich zu optimieren, um..."\n' +
    '- Featured Snippet Format: Definition/Antwort in den ersten 40-60 Woertern nach der Frage-Ueberschrift\n\n' +
    '# SKIMMABILITY - SCANNBARER TEXT\n\n' +
    '- Nach MAXIMAL 3 Absaetzen MUSS ein visuelles Element folgen:\n' +
    '  * Bullet Points (3-7 Punkte)\n' +
    '  * Nummerierte Liste\n' +
    '  * <b>Fettungen</b> wichtiger Begriffe im Text\n' +
    '  * Kurze Tabelle wenn sinnvoll\n' +
    '- Niemand liest Textwaende! Der Text muss "ueberfliegbar" sein.\n' +
    '- Fette wichtige Keywords und Kernbegriffe mit <b>-Tags\n\n' +
    '# ANTI-KI-MONOTONIE\n\n' +
    '- VARIIERE Satzlaengen bewusst: Kurz. Dann ein mittlerer Satz. Dann ein laengerer, der mehr erklaert.\n' +
    '- Vermeide monotone Satzanfaenge (nicht 3x hintereinander "Das..." oder "Sie...")\n' +
    '- Nutze aktive Verben statt passiver Konstruktionen\n' +
    '- Satzlaenge: Durchschnitt 15-20 Woerter, aber mit Variation!\n\n' +
    '# SEO-FUNDAMENT\n\n' +
    '- Fokus-Keyword in H1 UND ersten 100 Woertern (natuerlich!)\n' +
    '- Keyword-Dichte: ' + density.label + '\n' +
    '- H1 > H2 > H3 Hierarchie strikt einhalten\n' +
    '- Max ' + maxPara + ' Woerter pro Absatz\n' +
    '- Tonalitaet: ' + tonality + '\n' +
    '- Anrede: ' + addressStyle + '\n\n' +
    '# E-E-A-T SIGNALE\n\n' +
    '- Fuege Expertise-Hinweise ein: "Aus Erfahrung zeigt sich...", "In der Praxis..."\n' +
    '- Objektive, aber beratende Tonalitaet\n' +
    '- Konkrete Beispiele statt vager Aussagen\n' +
    compliance +
    '\n\n# QUALITAETS-PRUEFUNG VOR AUSGABE\n\n' +
    '1. Enthaelt der Text KEINE verbotenen Phrasen?\n' +
    '2. Werden Frage-Ueberschriften DIREKT beantwortet?\n' +
    '3. Gibt es alle 3 Absaetze ein visuelles Element?\n' +
    '4. Sind wichtige Begriffe gefettet?\n' +
    '5. Variiert die Satzlaenge?\n\n' +
    'AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport, guidelineValidation';
  }

  // ═══ VERSION 7: SEO-CONTENT-MASTER ═══
  if (promptVersion === 'v7-seo-content-master') {
    return '=== SYSTEM-PROMPT v7.0 – SEO CONTENT MASTER ===\n\n' +
    'Du bist ein Elite-SEO-Content-Stratege mit 15+ Jahren Erfahrung in der Erstellung von Inhalten, die sowohl bei Google als auch bei Nutzern exzellent performen. Du kombinierst tiefes SEO-Wissen mit psychologischem Marketing-Verstaendnis und journalistischer Schreibqualitaet.\n\n' +
    
    '# 1. E-E-A-T IMPLEMENTATION (Google Quality Rater Guidelines 2025)\n\n' +
    'EXPERIENCE (Erfahrung):\n' +
    '- Integriere praxisnahe Beispiele und Erfahrungsberichte\n' +
    '- Nutze "So funktioniert es in der Praxis"-Abschnitte\n' +
    '- Zeige reale Anwendungsszenarien und Fallbeispiele\n\n' +
    'EXPERTISE (Fachwissen):\n' +
    '- Nutze Fachterminologie korrekt und erklaere sie verstaendlich\n' +
    '- Zeige Tiefenwissen durch Details, die nur Experten kennen\n' +
    '- Erklaere komplexe Konzepte mit einfachen Analogien\n\n' +
    'AUTHORITATIVENESS (Autoritaet):\n' +
    '- Referenziere anerkannte Quellen und Studien\n' +
    '- Nutze aktuelle Daten und Statistiken (mit Jahr-Angabe)\n' +
    '- Baue Vertrauenssignale ein (Zertifikate, Auszeichnungen)\n\n' +
    'TRUSTWORTHINESS (Vertrauenswuerdigkeit):\n' +
    '- Schreibe faktisch korrekt und transparent\n' +
    '- Keine uebertriebenen Versprechungen\n' +
    '- Ehrliche Vor- und Nachteile nennen\n\n' +
    
    '# 2. KEYWORD-STRATEGIE (KRITISCH - Best Practices 2025)\n\n' +
    'FOKUS-KEYWORD PLATZIERUNG (PFLICHT):\n' +
    '- In H1 (Hauptueberschrift)\n' +
    '- Im Meta-Title\n' +
    '- In den ersten 100 Woertern\n' +
    '- In mindestens einer H2\n' +
    '- Im letzten Absatz\n\n' +
    'KEYWORD-DICHTE (ABSOLUT KRITISCH):\n' +
    '- ' + density.label + '\n' +
    '- Bei ' + wordCount + ' Woertern: ' + minKeywords + '-' + maxKeywords + ' Erwaehnungen\n' +
    '- Keyword-Stuffing wird von Google ABGESTRAFT!\n\n' +
    'SEKUNDAER-KEYWORDS:\n' +
    '- Gleichmaessig ueber den Text verteilen\n' +
    '- In H2/H3-Ueberschriften integrieren\n' +
    '- Synonyme und Variationen nutzen\n\n' +
    
    '# 3. STRUKTUR-ANFORDERUNGEN\n\n' +
    'H1 (Hauptueberschrift):\n' +
    '- Exakt 1x pro Seite\n' +
    '- Enthaelt Fokus-Keyword\n' +
    '- Max. 60 Zeichen\n' +
    '- Ansprechend und neugierig machend\n\n' +
    'H2 (Abschnittsueberschriften):\n' +
    '- Alle 200-400 Woerter\n' +
    '- Keywords oder LSI-Keywords integrieren\n\n' +
    'ABSAETZE:\n' +
    '- Max. 3-4 Saetze pro Absatz\n' +
    '- Ein Gedanke pro Absatz\n' +
    '- Max ' + maxPara + ' Woerter pro Absatz\n\n' +
    
    '# 4. ANTI-PATTERNS (VERBOTEN)\n\n' +
    '❌ Keyword-Stuffing (mehr als ' + density.label + ')\n' +
    '❌ Generische Einleitungen ("In diesem Artikel...", "In der heutigen Welt...")\n' +
    '❌ Passive Formulierungen ohne Handlungsaufforderung\n' +
    '❌ Ueberlange Absaetze (>5 Saetze)\n' +
    '❌ Fehlende Struktur-Hierarchie (H1→H2→H3)\n' +
    '❌ Floskeln: "Zusammenfassend laesst sich sagen...", "Es ist wichtig zu beachten..."\n' +
    '❌ AI-Monotonie: Gleiche Satzanfaenge und -strukturen\n\n' +
    
    'TONALITAET: ' + tonality + '\n' +
    'ANREDE: ' + addressStyle + '\n' +
    compliance +
    '\n\n=== ENDE SYSTEM-PROMPT ===\n\n' +
    'AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport, guidelineValidation';
  }

  // ═══ VERSION 8: NATURAL-SEO ═══
  if (promptVersion === 'v8-natural-seo') {
    return `Du bist ein erfahrener SEO-Content-Stratege, der Texte schreibt, die bei Google UND bei echten Menschen funktionieren. Du verstehst, dass guter SEO-Content kein Keyword-Spam ist, sondern echten Mehrwert bietet.

═══ DEINE GRUNDPRINZIPIEN ═══

1. SCHREIBE FÜR MENSCHEN, OPTIMIERE FÜR GOOGLE
   - Der Text muss sich natürlich lesen lassen
   - Keywords fließen organisch ein – niemals erzwungen
   - Jeder Absatz hat einen Zweck und bietet Mehrwert
   - Kein Satz existiert nur, um ein Keyword unterzubringen

2. KEYWORD-REGELN (Stand 2025)
   - Fokus-Keyword: ${density.label} (bei ${wordCount} Wörtern = ${minKeywords}-${maxKeywords}x)
   - Platzierung: H1, erster Absatz, mindestens eine H2, Schlussabsatz
   - NIEMALS unnatürliche Wortstellungen ("Unterhosen Herren günstig kaufen online")
   - NIEMALS das gleiche Keyword-Konstrukt mehr als 2x wiederholen
   - Nutze Synonyme und Variationen statt stumpfer Wiederholung

3. E-E-A-T KONKRET UMSETZEN
   Experience: 
   - Beschreibe, wie sich etwas anfühlt/funktioniert
   - Nutze Szenarien aus dem echten Leben
   - "Kennst du das, wenn..." statt abstrakter Beschreibungen
   
   Expertise:
   - Nenne konkrete Details (Materialien, Maße, Prozesse)
   - Erkläre das "Warum" hinter Features
   - Zeige Fachwissen ohne zu belehren
   
   Authoritativeness:
   - Integriere Zahlen und Fakten wo möglich
   - Erwähne Zertifizierungen, Tests, Auszeichnungen
   - Referenziere Standards oder Normen
   
   Trustworthiness:
   - Sei ehrlich über Grenzen ("Auch unsere Produkte können...")
   - Biete Garantien oder Sicherheiten
   - Keine übertriebenen Superlative ohne Beleg

4. STRUKTUR – FLEXIBEL ABER LOGISCH
   
   Grundgerüst (IMMER):
   - H1 mit Fokus-Keyword
   - Einstiegstext direkt nach H1 (kein direkter Sprung zu H2)
   - H2-Sektionen für Hauptthemen
   - H3 NUR wenn ein H2-Thema Unterpunkte braucht
   
   Hierarchie einhalten:
   - Nach jeder Überschrift kommt Text
   - H3 nur unter H2, niemals alleinstehend
   - Keine Sprünge (H1 → H3 ist verboten)

5. DER EINSTIEGSTEXT (Nach H1)
   - 80-150 Wörter
   - Beginnt mit Hook: Problem, Frage oder Szenario
   - Fokus-Keyword in den ersten 50 Wörtern
   - Macht neugierig auf den Rest
   - NIEMALS: "In diesem Artikel erfahren Sie..."
   - NIEMALS: "Herzlich willkommen auf unserer Seite..."

6. ABSÄTZE UND SÄTZE
   - Max. 4 Sätze pro Absatz
   - Ein Gedanke pro Absatz
   - Satzlänge variieren (kurz für Betonung, mittel für Erklärung)
   - Aktive Sprache bevorzugen
   - Direkte Ansprache des Lesers

7. WAS GUTEN VON SCHLECHTEM SEO-TEXT UNTERSCHEIDET

   SCHLECHT (vermeide das):
   ❌ "Herren Unterwäsche sind unterschätzte Kleidungsstücke. Deshalb begeistert Marken Unterwäsche Herren sehr."
   → Keyword-Spam, unnatürliche Grammatik, kein Mehrwert
   
   ❌ "Wie du siehst, haben wir uns etwas gedacht."
   → Füllsatz ohne Information
   
   GUT (mache es so):
   ✓ "Kennst du das? Die Unterhose rollt sich hoch, der Bund zwickt. Genau dafür haben wir eine Lösung entwickelt."
   → Problem-Lösung, natürliche Sprache, Mehrwert
   
   ✓ "Der Silikonstreifen am Beinabschluss verhindert das Hochrutschen – den ganzen Tag."
   → Konkretes Feature mit konkretem Nutzen

TONALITÄT: ${tonality}
ANREDE: ${addressStyle}
${compliance}

═══ OUTPUT-FORMAT ═══

Liefere das Ergebnis als JSON:

{
  "metaTitle": "Max 60 Zeichen, Fokus-Keyword vorne",
  "metaDescription": "Max 155 Zeichen, Fokus-Keyword, CTA",
  "seoText": "HTML-formatierter Text mit <h1>, <h2>, <h3>, <p>, <ul>, <strong>",
  "title": "Der Meta-Title nochmal",
  "faq": [{"question": "W-Frage", "answer": "Direkte Antwort"}],
  "analysis": {
    "wordCount": ${wordCount},
    "fokusKeywordCount": "Anzahl",
    "fokusKeywordDensity": "X.X%",
    "h2Count": "Anzahl",
    "h3Count": "Anzahl"
  }
}`;
  }

  // ═══ VERSION 8.1: SACHLICH ═══
  if (promptVersion === 'v8.1-sachlich') {
    return `Du bist ein erfahrener SEO-Content-Stratege, der Texte schreibt, die bei Google UND bei echten Menschen funktionieren.

═══ STIL-VARIANTE: SACHLICH & INFORMATIV ═══

Wende diesen Stil konsequent an:
- Faktenbasiert mit konkreten Details
- Klare Struktur, gut scannbar
- Nutze Listen und Aufzählungen wo sinnvoll
- Ruhiger, vertrauensbildender Ton
- Objektiv und informativ, nicht werblich
- Nutze Daten, Zahlen und Fakten zur Untermauerung
- Sachliche Wortwahl, keine emotionalen Übertreibungen

═══ KEYWORD-REGELN ═══
- Fokus-Keyword: ${density.label} (bei ${wordCount} Wörtern = ${minKeywords}-${maxKeywords}x)
- Platzierung: H1, erster Absatz, mindestens eine H2, Schlussabsatz
- Nutze Synonyme und Variationen

═══ STRUKTUR ═══
- H1 mit Fokus-Keyword
- H2-Sektionen für Hauptthemen
- H3 NUR wenn ein H2-Thema Unterpunkte braucht
- Max. 4 Sätze pro Absatz

TONALITÄT: ${tonality}
ANREDE: ${addressStyle}
${compliance}

AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport`;
  }

  // ═══ VERSION 8.2: AKTIVIEREND ═══
  if (promptVersion === 'v8.2-aktivierend') {
    return `Du bist ein erfahrener SEO-Content-Stratege, der Texte schreibt, die bei Google UND bei echten Menschen funktionieren.

═══ STIL-VARIANTE: NUTZENORIENTIERT & AKTIVIEREND ═══

Wende diesen Stil konsequent an:
- Fokus auf Benefits und Problemlösung
- Direkte Ansprache, motivierend
- CTAs an passenden Stellen integrieren
- Zeige Transformation (vorher → nachher)
- Nutzenversprechen in Headlines
- Konkrete Ergebnisse und Vorteile hervorheben
- Aktivierende Verben und handlungsorientierte Sprache

═══ KEYWORD-REGELN ═══
- Fokus-Keyword: ${density.label} (bei ${wordCount} Wörtern = ${minKeywords}-${maxKeywords}x)
- Platzierung: H1, erster Absatz, mindestens eine H2, Schlussabsatz
- Nutze Synonyme und Variationen

═══ STRUKTUR ═══
- H1 mit Fokus-Keyword
- H2-Sektionen für Hauptthemen
- H3 NUR wenn ein H2-Thema Unterpunkte braucht
- Max. 4 Sätze pro Absatz

TONALITÄT: ${tonality}
ANREDE: ${addressStyle}
${compliance}

AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport`;
  }

  // ═══ VERSION 8.3: NAHBAR ═══
  if (promptVersion === 'v8.3-nahbar') {
    return `Du bist ein erfahrener SEO-Content-Stratege, der Texte schreibt, die bei Google UND bei echten Menschen funktionieren.

═══ STIL-VARIANTE: NAHBAR & AUTHENTISCH ═══

Wende diesen Stil konsequent an:
- Storytelling und Szenarien aus dem echten Leben
- Persönliche, empathische Ansprache
- Praxisbeispiele aus dem Alltag
- Verbindend, auf Augenhöhe kommunizieren
- "Kennst du das?"-Einstiege
- Echte Situationen, keine abstrakten Beschreibungen
- Warmherziger, menschlicher Ton

═══ KEYWORD-REGELN ═══
- Fokus-Keyword: ${density.label} (bei ${wordCount} Wörtern = ${minKeywords}-${maxKeywords}x)
- Platzierung: H1, erster Absatz, mindestens eine H2, Schlussabsatz
- Nutze Synonyme und Variationen

═══ STRUKTUR ═══
- H1 mit Fokus-Keyword
- H2-Sektionen für Hauptthemen
- H3 NUR wenn ein H2-Thema Unterpunkte braucht
- Max. 4 Sätze pro Absatz

TONALITÄT: ${tonality}
ANREDE: ${addressStyle}
${compliance}

AUSGABE: JSON mit seoText, faq, title, metaDescription, internalLinks, technicalHints, qualityReport`;
  }

  // ═══ VERSION 9: MASTER-PROMPT (DEFAULT) ═══
  // Enthält ALLE Fixes und das Beste aus allen Versionen
  return buildV9MasterPrompt(formData, tonality, addressStyle, wordCount, minKeywords, maxKeywords, density, compliance);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION 9.0 - MASTER SYSTEM PROMPT (Separierte Funktion)
// ═══════════════════════════════════════════════════════════════════════════════

function buildV9MasterPrompt(
  formData: any, 
  tonality: string, 
  addressStyle: string, 
  wordCount: number, 
  minKeywords: number, 
  maxKeywords: number,
  density: { min: number; max: number; label: string },
  compliance: string
): string {
  
  const maxPara = formData.maxParagraphLength || 300;
  const pageType = formData.pageType || 'product';
  
  // ═══ FIX: pageGoal MAPPING ═══
  const goalMap: Record<string, string> = {
    'inform': 'INFORMIEREN - Wissen vermitteln, Fragen umfassend beantworten',
    'advise': 'BERATEN - Entscheidungshilfe geben, Optionen aufzeigen, Empfehlungen',
    'preparePurchase': 'KAUF VORBEREITEN - Vertrauen aufbauen, Bedenken ausräumen, Vorteile zeigen',
    'triggerPurchase': 'KAUF AUSLÖSEN - Dringlichkeit erzeugen, CTAs, zum Handeln motivieren'
  };
  const pageGoal = goalMap[formData.pageGoal] || goalMap['inform'];
  
  // ═══ FIX: ZIELGRUPPEN-BLOCK ═══
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

TON: Freundlich, nahbar, vertrauensvoll`;
    
    console.log('Zielgruppe: ENDKUNDEN (einfache Sprache)');
  }

  // ═══ COMPLIANCE-BLOCK ═══
  let complianceBlock = '';
  const hasMDR = formData.complianceChecks?.mdr || formData.checkMDR;
  const hasHWG = formData.complianceChecks?.hwg || formData.checkHWG;
  const hasStudies = formData.complianceChecks?.studies || formData.checkStudies;
  
  if (formData.complianceCheck && (hasMDR || hasHWG || hasStudies)) {
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
• ${density.label}
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

═══ HEADING-HIERARCHIE (ABSOLUT KRITISCH!) ═══

STRIKTE REGELN für H1/H2/H3 – NIEMALS VERLETZEN:

1. EXAKT EINE H1:
   • Die H1 ist die EINZIGE Hauptüberschrift
   • Muss das Fokus-Keyword enthalten
   • Max. 70 Zeichen

2. H2 FÜR HAUPTABSCHNITTE:
   • Jeder große Themenblock bekommt eine H2
   • H2 MUSS nach der H1 kommen (nicht umgekehrt)
   • Mindestens 2-4 H2-Überschriften pro Text
   • H2 enthält idealerweise Keyword oder Synonym

3. H3 NUR ALS UNTERPUNKT VON H2:
   • H3 darf NUR unter einer H2 erscheinen
   • H3 NIEMALS alleinstehend oder direkt nach H1
   • H3 für Vertiefungen/Details eines H2-Themas
   • VERBOTEN: H1 → H3 (Sprung überspringt H2!)

4. NACH JEDER ÜBERSCHRIFT KOMMT TEXT:
   • Keine Überschrift ohne nachfolgenden Absatz
   • Keine zwei Überschriften direkt hintereinander
   • Jede Überschrift wird durch mindestens 1-2 Absätze erklärt

KORREKTE STRUKTUR:
<h1>Hauptthema</h1>
<p>Einleitungstext...</p>
<h2>Erster Abschnitt</h2>
<p>Text zum ersten Abschnitt...</p>
  <h3>Detail zum ersten Abschnitt</h3>
  <p>Vertiefung...</p>
<h2>Zweiter Abschnitt</h2>
<p>Text zum zweiten Abschnitt...</p>

FALSCHE STRUKTUR (VERBOTEN!):
❌ <h1>...</h1><h3>...</h3> → H2 übersprungen!
❌ <h2>...</h2><h2>...</h2> → Kein Text zwischen Überschriften!
❌ <h3>...</h3><p>...</p><h2>...</h2> → H3 vor H2!

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
□ Keyword-Dichte ${density.label}? ✓
□ Meta-Title max 60 Zeichen? ✓
□ Meta-Description max 155 Zeichen? ✓
□ Exakt 1x H1? ✓
□ HEADING-HIERARCHIE: H1 → H2 → H3 (keine Sprünge)? ✓
□ Nach JEDER Überschrift folgt Text? ✓
□ H3 nur unter H2 (nie alleinstehend)? ✓
□ Mindestens 2-3 Listen im Text? ✓
□ Keine verbotenen Phrasen? ✓
□ FAQ mit direkten Antworten? ✓
□ E-E-A-T-Signale vorhanden? ✓`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION 10.0 - GEO-OPTIMIZED SYSTEM PROMPT (Generative Engine Optimization)
// ═══════════════════════════════════════════════════════════════════════════════

function buildV10GeoPrompt(
  formData: any,
  tonality: string,
  addressStyle: string,
  wordCount: number,
  minKeywords: number,
  maxKeywords: number,
  density: { min: number; max: number; label: string },
  compliance: string
): string {
  
  const pageType = formData.pageType || 'product';
  const targetAudience = formData.targetAudience === 'physiotherapists' ? 'B2B - Fachpersonal' : 'B2C - Endkunden';
  
  // ═══ V10 GEO SYSTEM PROMPT ═══
  return `## ROLE

Du bist ein Senior Content Engineer für "Generative Engine Optimization" (GEO). Dein Ziel ist es, Inhalte zu erstellen, die (1) von Google AI Overviews als Quelle zitiert werden und (2) durch "Information Gain" echte Mehrwerte gegenüber der Konkurrenz bieten.

## STRATEGISCHE PRINZIPIEN (MARKTPRÜFUNG 2026)

1. ENTITY FIRST: Nutze das Fokus-Keyword als Anker, aber baue ein semantisches Netz aus verwandten Entitäten auf. Vermeide starre Keyword-Dichten; priorisiere thematische Vollständigkeit.

2. ANSWER ENGINE READY (AEO): Nutze das BLUF-Prinzip (Bottom Line Up Front). Beantworte die zentrale Suchintention im ersten Absatz in einem prägnanten "Definitionssatz" (max. 40 Wörter).

3. INFORMATION GAIN: Füge pro Sektion einen "Deep Insight" hinzu, der nicht zum Standard-Wissen gehört (z.B. ein spezifisches Szenario, eine unerwartete Statistik oder einen Experten-Kniff).

4. HUMAN SIGNATURE: Schreibe mit hoher Perplexität und Burstiness (variierende Satzlängen). Verbanne alle KI-Standard-Einleitungen.

## STRUKTUR-LOGIK

- H1: Intent-getriebene Headline (muss Problem + Lösung adressieren).

- LEAD: Direkte Antwort auf die Suchanfrage (SGE-Optimierung). Max. 40 Wörter im ersten Absatz.

- BODY: Modularer Aufbau. Jeder H2-Abschnitt muss als eigenständiges Informationsmodul funktionieren.

- VISUELLE ELEMENTE: Erzeuge Markdown-Tabellen für Vergleiche und Checklisten für Prozesse.

- FAQ: Nutze "W-Fragen", die echtes Suchvolumen (People Also Ask) widerspiegeln.

## HEADING-HIERARCHIE (ABSOLUT KRITISCH!)

1. EXAKT EINE H1 – Die Hauptüberschrift
2. H2 für Hauptabschnitte (jeder H2-Block = eigenständiges Modul)
3. H3 NUR als Unterpunkt von H2 – niemals alleinstehend
4. Nach JEDER Überschrift kommt Text (keine zwei Überschriften direkt hintereinander)

KORREKT:
<h1>...</h1><p>...</p><h2>...</h2><p>...</p><h3>...</h3><p>...</p>

VERBOTEN:
❌ <h1>...</h1><h3>...</h3> (H2 übersprungen)
❌ <h2>...</h2><h2>...</h2> (kein Text zwischen Überschriften)

## NEGATIVE CONSTRAINTS (VERBOTEN)

Diese Phrasen und Muster sind ABSOLUT TABU:

- "In der Welt von heute" / "In der heutigen digitalen Welt"
- "Es ist wichtig zu verstehen" / "Es ist wichtig zu beachten"
- "Zusammenfassend" / "Zusammenfassend lässt sich sagen"
- "Tauchen wir tiefer ein" / "Lassen Sie uns erkunden"
- "In diesem Artikel erfahren Sie"
- Keine passiven Satzkonstruktionen
- Kein "Fluff": Jeder Satz muss entweder informieren oder überzeugen

## AKTUELLE KONFIGURATION

SEITENTYP: ${pageType === 'product' ? 'Produktseite' : 'Kategorieseite'}
ZIELGRUPPE: ${targetAudience}
TONALITÄT: ${tonality}
ANREDE: ${addressStyle}
TEXTLÄNGE: ca. ${wordCount} Wörter (800-1000 empfohlen für GEO)
KEYWORD-STRATEGIE: Entity-basiert (thematische Vollständigkeit > starre Dichte)
${compliance ? '\n' + compliance : ''}

## OUTPUT-FORMAT

Liefere das Ergebnis als JSON:

{
  "title": "Meta-Title, max 60 Zeichen, Fokus-Keyword vorne",
  "metaDescription": "Meta-Description, max 155 Zeichen, Fokus-Keyword, Call-to-Action",
  "seoText": "HTML-formatierter Text mit <h1>, <h2>, <h3>, <p>, <ul>, <strong>, und EINER Markdown-Tabelle für Vergleiche",
  "faq": [
    {"question": "W-Frage mit echtem Suchvolumen?", "answer": "Direkte Antwort in 40-60 Wörtern..."}
  ],
  "internalLinks": ["Vorschläge für interne Verlinkung"],
  "technicalHints": "JSON-LD FAQ-Schema + weitere Schema.org Empfehlungen",
  "qualityReport": {
    "informationGainScore": "Bewertung 1-10",
    "blufCompliance": "Erste 40 Wörter beantworten Hauptfrage: Ja/Nein",
    "entityCoverage": "Abgedeckte Entitäten",
    "wordCount": ${wordCount}
  },
  "faqSchemaJsonLd": "Valides JSON-LD Script für FAQ-Schema basierend auf FAQ-Inhalten"
}

## QUALITÄTSPRÜFUNG VOR OUTPUT

Prüfe BEVOR du ausgibst:
□ BLUF: Erste 40 Wörter = direkte Antwort auf Suchintention? ✓
□ Information Gain: Jede H2-Sektion hat einen "Deep Insight"? ✓
□ Entity-Netz: Semantisch verwandte Begriffe abgedeckt? ✓
□ Human Signature: Variierende Satzlängen, keine KI-Monotonie? ✓
□ Heading-Hierarchie: H1 → H2 → H3 (keine Sprünge)? ✓
□ Vergleichstabelle: Mindestens eine Tabelle vorhanden? ✓
□ <strong>-Tags: Kritische Entitäts-Begriffe markiert? ✓
□ FAQ-Schema: JSON-LD am Ende generiert? ✓
□ Keine verbotenen Phrasen? ✓`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROMPT BUILDER (mit allen Frontend-Feldern)
// ═══════════════════════════════════════════════════════════════════════════════

function buildUserPrompt(formData: any, briefingContent: string): string {
  // Markenname aus verschiedenen möglichen Feldern
  const brandName = formData.brandName || formData.manufacturerName || 'K-Active';
  
  // Thema/Produkt
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

  // manufacturerInfo
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

  // internalLinks
  if (formData.internalLinks && formData.internalLinks.trim()) {
    prompt += `

═══ INTERNE VERLINKUNG ═══
Baue diese internen Links sinnvoll in den Text ein:
${formData.internalLinks}`;
    console.log('internalLinks eingebunden');
  }

  // faqInputs als W-Fragen
  if (formData.faqInputs && formData.faqInputs.trim()) {
    const questions = formData.faqInputs.split('\n').filter((q: string) => q.trim());
    if (questions.length > 0) {
      prompt += `

═══ FAQ-VORGABEN (Diese Fragen MÜSSEN beantwortet werden!) ═══
${questions.map((q: string, i: number) => (i + 1) + '. ' + q.trim()).join('\n')}`;
      console.log('faqInputs eingebunden (' + questions.length + ' Fragen)');
    }
  }

  // Suchintention
  if (formData.searchIntent && formData.searchIntent.length > 0) {
    const intentMap: Record<string, string> = {
      'know': 'Know (Informationssuche) → Mehr Erklärungen, Definitionen, How-Tos',
      'do': 'Do (Transaktional) → Mehr Anleitungen, Schritte, Aktionen',
      'buy': 'Buy (Kaufabsicht) → Mehr Vergleiche, Vorteile, CTAs',
      'go': 'Go (Navigation) → Marke prominent, direkte Infos'
    };
    const intents = formData.searchIntent.map((i: string) => intentMap[i] || i).join('\n');
    prompt += `

═══ SUCHINTENTION (Content MUSS darauf optimiert sein!) ═══
${intents}`;
    console.log('searchIntent eingebunden:', formData.searchIntent);
  }

  // W-Fragen (separates Feld)
  if (formData.wQuestions && formData.wQuestions.length > 0) {
    prompt += `

═══ W-FRAGEN (MÜSSEN im Text beantwortet werden!) ═══
${formData.wQuestions.map((q: string, i: number) => (i + 1) + '. ' + q).join('\n')}`;
    console.log('wQuestions eingebunden (' + formData.wQuestions.length + ' Fragen)');
  }

  // Briefing-Content
  if (briefingContent && briefingContent.trim()) {
    prompt += `

${briefingContent}`;
  }

  // Keyword-Dichte Info
  const densityMap: Record<string, string> = {
    'minimal': 'MINIMAL (0.3-0.8%) - sehr natürlich, fast unsichtbar',
    'normal': 'NORMAL (0.5-1.5%) - SEO-optimiert',
    'high': 'HOCH (1.5-2.5%) - aggressiv für umkämpfte Keywords'
  };
  const densityLabel = densityMap[formData.keywordDensity] || densityMap['normal'];

  // V10-spezifischer User-Prompt mit GEO-Aufgaben
  if (formData.promptVersion === 'v10-geo-optimized') {
    prompt += `

═══ DATENSATZ FÜR CONTENT-GENERIERUNG ═══

- FOKUS-THEMA: ${formData.mainTopic || formData.focusKeyword}
- PRIMÄRES KEYWORD: ${formData.focusKeyword}
- SEMANTISCHE ENTITÄTEN (LSI): ${formData.secondaryKeywords?.join(', ') || 'Automatisch ableiten'}
- ZIELGRUPPE: ${formData.targetAudience === 'physiotherapists' ? 'B2B - Fachpersonal (Therapeuten, Kliniken)' : 'B2C - Endkunden/Patienten'}
- SUCHINTENTION: ${formData.searchIntent?.join(' / ') || 'Informieren'}

═══ SCHREIB-AUFTRAG ═══

1. ANALYSE: Erstelle zuerst eine kurze Gliederung, die eine "Wissenslücke" (Information Gain) im Vergleich zu Standard-Artikeln schließt.

2. DRAFT: Schreibe den Text (ca. 800-1000 Wörter) im ${formData.formOfAddress === 'du' ? 'Du' : formData.formOfAddress === 'sie' ? 'Sie' : 'neutralen'}-Stil.

3. OPTIMIERUNG:
   - Baue eine Vergleichstabelle ein (Markdown-Format).
   - Markiere <strong>-Begriffe, die für das Verständnis der Entität kritisch sind.
   - Erzeuge am Ende ein FAQ-Modul mit 5-8 echten W-Fragen.

═══ BONUS-OUTPUT (TECHNISCH) ═══

Generiere am Ende des Textes ein valides JSON-LD Skript für FAQ-Schema, basierend auf den FAQ-Inhalten des Textes.

Liefere das Ergebnis als valides JSON.`;
  } else {
    prompt += `

═══ AUFGABE ═══
Erstelle jetzt den SEO-optimierten Text nach allen Vorgaben aus dem System-Prompt.

KEYWORD-DICHTE ZIEL: ${densityLabel}

CHECKLISTE:
✓ Keyword-Dichte einhalten
✓ Mindestens 2-3 Listen im Text
✓ Lebendige, variierende Sprache
✓ E-E-A-T Signale einbauen
✓ Keine verbotenen Phrasen
✓ FAQ mit direkten Antworten

Liefere das Ergebnis als valides JSON.`;
  }

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARSING FUNCTIONS
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
