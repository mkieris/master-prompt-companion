import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI MODEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

type AIModelId = 'gemini-flash' | 'gemini-pro' | 'claude-sonnet';

interface ModelConfig {
  id: AIModelId;
  modelName: string;
  provider: 'lovable' | 'anthropic';
  temperature: number;
  costPerMillionInput: number;  // in USD
  costPerMillionOutput: number; // in USD
}

const AI_MODELS: Record<AIModelId, ModelConfig> = {
  'gemini-flash': {
    id: 'gemini-flash',
    modelName: 'google/gemini-2.5-flash',
    provider: 'lovable',
    temperature: 0.55,
    costPerMillionInput: 0.15,
    costPerMillionOutput: 3.50,
  },
  'gemini-pro': {
    id: 'gemini-pro',
    modelName: 'google/gemini-2.5-pro',
    provider: 'lovable',
    temperature: 0.55,
    costPerMillionInput: 1.25,
    costPerMillionOutput: 10.00,
  },
  'claude-sonnet': {
    id: 'claude-sonnet',
    modelName: 'anthropic/claude-sonnet-4',
    provider: 'lovable', // Using Lovable gateway for Claude
    temperature: 0.6,
    costPerMillionInput: 3.00,
    costPerMillionOutput: 15.00,
  },
};

function getModelConfig(modelId?: string): ModelConfig {
  if (modelId && modelId in AI_MODELS) {
    return AI_MODELS[modelId as AIModelId];
  }
  return AI_MODELS['gemini-flash']; // Default
}

function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English, ~3 for German
  return Math.ceil(text.length / 3.5);
}

function calculateCost(model: ModelConfig, inputTokens: number, outputTokens: number): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  formatted: string;
} {
  const inputCost = (inputTokens / 1_000_000) * model.costPerMillionInput;
  const outputCost = (outputTokens / 1_000_000) * model.costPerMillionOutput;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    formatted: totalCost < 0.01
      ? `${(totalCost * 100).toFixed(2)} Cent`
      : `$${totalCost.toFixed(4)}`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEYWORD ANALYSIS (integrated mode)
// ═══════════════════════════════════════════════════════════════════════════════

interface KeywordAnalysis {
  secondaryKeywords: string[];
  wQuestions: string[];
  searchIntent: "know" | "do" | "buy" | "go";
  suggestedTopics: string[];
}

async function handleKeywordAnalysis(
  focusKeyword: string,
  targetAudience: string | undefined,
  language: string,
  apiKey: string
): Promise<KeywordAnalysis> {
  const audienceContext = targetAudience === 'physiotherapists'
    ? 'B2B-Zielgruppe (Fachpersonal, Therapeuten, medizinische Fachkräfte)'
    : 'B2C-Zielgruppe (Endkunden, Verbraucher)';

  const analysisPrompt = `Du bist ein SEO-Keyword-Experte. Analysiere das folgende Fokus-Keyword und generiere passende Vorschläge.

FOKUS-KEYWORD: "${focusKeyword}"
ZIELGRUPPE: ${audienceContext}
SPRACHE: ${language === 'de' ? 'Deutsch' : 'Englisch'}

AUFGABEN:

1. **Sekundäre Keywords (8-12)**: Semantisch verwandte Begriffe, Long-Tail-Varianten und LSI-Keywords die zum Fokus-Keyword passen. Diese sollten natürlich in einem SEO-Text eingebaut werden können.

2. **W-Fragen (5-8)**: Typische Fragen die Nutzer zu diesem Thema stellen würden. Beginne mit "Was", "Wie", "Warum", "Wann", "Welche", "Wo". Diese Fragen sollten für FAQ-Abschnitte geeignet sein.

3. **Suchintention**: Bestimme die wahrscheinlichste Suchintention:
   - "know": Informationssuche (Nutzer will etwas lernen/verstehen)
   - "do": Transaktional (Nutzer will eine Aktion durchführen)
   - "buy": Kaufabsicht (Nutzer will kaufen/bestellen)
   - "go": Navigation (Nutzer sucht eine bestimmte Website)

4. **Themen-Vorschläge (3-5)**: Hauptthemen/Abschnitte die in einem umfassenden Text zu diesem Keyword behandelt werden sollten.

Antworte NUR mit validem JSON in diesem Format:
{
  "secondaryKeywords": ["keyword1", "keyword2", ...],
  "wQuestions": ["Wie funktioniert...?", "Was ist...?", ...],
  "searchIntent": "know",
  "suggestedTopics": ["Thema 1", "Thema 2", ...]
}`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Du bist ein SEO-Keyword-Analyse-Experte. Antworte nur mit validem JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('AI API error:', aiResponse.status, errorText);

    if (aiResponse.status === 429) {
      throw new Error('Rate limit erreicht. Bitte versuche es später erneut.');
    }
    if (aiResponse.status === 402) {
      throw new Error('AI-Credits aufgebraucht. Bitte Guthaben aufladen.');
    }
    throw new Error(`AI analysis failed: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const analysisText = aiData.choices?.[0]?.message?.content || '';

  // Parse AI response
  let analysis: KeywordAnalysis = {
    secondaryKeywords: [],
    wQuestions: [],
    searchIntent: "know",
    suggestedTopics: [],
  };

  try {
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      analysis = {
        secondaryKeywords: parsed.secondaryKeywords || [],
        wQuestions: parsed.wQuestions || [],
        searchIntent: ['know', 'do', 'buy', 'go'].includes(parsed.searchIntent) ? parsed.searchIntent : 'know',
        suggestedTopics: parsed.suggestedTopics || [],
      };
    }
  } catch (e) {
    console.error('Failed to parse AI analysis:', e);
  }

  return analysis;
}

// Input validation schema
const formDataSchema = z.object({
  mode: z.enum(['generate', 'analyze-keyword']).optional().default('generate'),
  focusKeyword: z.string().min(1, 'Fokus-Keyword ist erforderlich').max(200, 'Fokus-Keyword zu lang'),
  language: z.string().optional().default('de'),
  pageType: z.string().max(100).optional(),
  targetAudience: z.string().max(100).optional(),
  formOfAddress: z.enum(['du', 'sie', 'neutral']).optional(),
  tone: z.enum(['factual', 'advisory', 'sales', 'sachlich', 'beratend', 'aktivierend']).optional(),
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
  aiModel: z.enum(['gemini-flash', 'gemini-pro', 'claude-sonnet']).optional(),
  complianceChecks: z.object({
    mdr: z.boolean().optional(),
    hwg: z.boolean().optional(),
    studies: z.boolean().optional(),
  }).optional(),
  serpContext: z.string().max(10000).optional(),
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

    // ═══ MODE: KEYWORD ANALYSIS ═══
    if (formData.mode === 'analyze-keyword') {
      console.log('Mode: analyze-keyword for:', formData.focusKeyword);

      const analysis = await handleKeywordAnalysis(
        formData.focusKeyword,
        formData.targetAudience,
        formData.language || 'de',
        LOVABLE_API_KEY
      );

      console.log('Keyword analysis completed:', {
        secondaryKeywordsCount: analysis.secondaryKeywords?.length,
        wQuestionsCount: analysis.wQuestions?.length,
        searchIntent: analysis.searchIntent,
      });

      return new Response(JSON.stringify({
        success: true,
        focusKeyword: formData.focusKeyword,
        analysis,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ MODE: GENERATE (default) ═══
    // ═══ LOGGING mit Prompt-Version ═══
    const promptVersion = formData.promptVersion || 'v9-master-prompt';
    const modelConfig = getModelConfig(formData.aiModel);

    console.log('=== SEO Generator - Version: ' + promptVersion + ' ===');
    console.log('=== AI Model: ' + modelConfig.modelName + ' ===');
    console.log('Generating SEO content with params:', {
      promptVersion: promptVersion,
      aiModel: modelConfig.id,
      modelName: modelConfig.modelName,
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
      // Single content generation based on tone
      console.log('Generating single content with tone:', formData.tone);

      // Map tone to writing style instruction
      const toneInstructions: Record<string, string> = {
        'sachlich': 'SCHREIBSTIL: SACHLICH & STRUKTURIERT\n- Faktenbasiert mit klarer Hierarchie\n- Nutze Listen und Aufzählungen wo sinnvoll\n- Ruhiger, vertrauensbildender Ton\n- Daten und Fakten zur Untermauerung\n- Objektiv und informativ',
        'beratend': 'SCHREIBSTIL: BERATEND & NUTZENORIENTIERT\n- Fokus auf praktischen Nutzen und Lösungen\n- Empathisch und hilfreich\n- "Du fragst dich..."-Einstiege\n- Konkrete Empfehlungen und Tipps\n- Vertrauensaufbauend und unterstützend',
        'aktivierend': 'SCHREIBSTIL: AKTIVIEREND & ÜBERZEUGEND\n- Starte mit starkem Nutzenversprechen\n- Zeige Transformation (vorher → nachher)\n- Integriere CTAs an passenden Stellen\n- Konkrete Ergebnisse hervorheben\n- Aktivierende Verben und überzeugende Sprache'
      };

      const toneInstruction = toneInstructions[formData.tone] || toneInstructions['beratend'];
      const enhancedUserPrompt = toneInstruction + '\n\n' + userPrompt;

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhancedUserPrompt }
      ];
    }

    // Single generation (for new content and refinement/quick change)
    const maxRetries = 3;
    let response: Response | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + LOVABLE_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelConfig.modelName, messages: messages, temperature: modelConfig.temperature }),
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

  // ═══ SERP-ANALYSE KONTEXT ═══
  let serpBlock = '';
  if (formData.serpContext && formData.serpContext.trim().length > 0) {
    serpBlock = '\n\n# SERP-ANALYSE (Google Top-10)\n\n' + formData.serpContext.trim() + '\n\nWICHTIG: Integriere die PFLICHT-BEGRIFFE natürlich in den Text. Die EMPFOHLENEN BEGRIFFE sollten ebenfalls vorkommen. Nutze die HÄUFIGEN FRAGEN als Inspiration für FAQ und Zwischenüberschriften.';
    console.log('SERP-Kontext integriert: ' + formData.serpContext.length + ' Zeichen');
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VERSION ROUTING - AKTIVE VERSIONEN: v1, v2, v6, v8, v9 (default), v10
  // ═══════════════════════════════════════════════════════════════════════════════

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

  // ═══ VERSION 9: MASTER-PROMPT (DEFAULT) ═══
  // Enthält ALLE Fixes und das Beste aus allen Versionen
  return buildV9MasterPrompt(formData, tonality, addressStyle, wordCount, minKeywords, maxKeywords, density, compliance, serpBlock);
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
  compliance: string,
  serpBlock: string = ''
): string {

  const maxPara = formData.maxParagraphLength || 300;
  const pageType = formData.pageType || 'product';
  const brandName = formData.brandName || formData.manufacturerName || 'das Unternehmen';
  
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
  return `Du bist ein Elite-SEO-Content-Stratege für ${brandName}. Du kombinierst tiefes SEO-Wissen mit Marketing-Expertise und exzellentem Schreibstil.

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
❌ "Produkte sind unterschätzte Hilfsmittel. Deshalb begeistert unser Angebot Kunden sehr."
→ Keyword-Spam, unnatürliche Grammatik

❌ "Wie du siehst, haben wir uns etwas gedacht."
→ Füllsatz ohne Information

POSITIV-BEISPIELE (so JA):
✓ "Kennst du das? Das Problem tritt immer wieder auf. Unsere Lösung schafft Abhilfe."
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
□ E-E-A-T-Signale vorhanden? ✓${serpBlock}`;
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
  
  // ═══ V10 GEO SYSTEM PROMPT - EXAKT NACH VORLAGE ═══
  return `## ROLE

Du bist ein Senior Content Engineer für "Generative Engine Optimization" (GEO). Dein Ziel ist es, Inhalte zu erstellen, die (1) von Google AI Overviews als Quelle zitiert werden und (2) durch "Information Gain" echte Mehrwerte gegenüber der Konkurrenz bieten.

## STRATEGISCHE PRINZIPIEN (MARKTPRÜFUNG 2026)

1. ENTITY FIRST: Nutze das Fokus-Keyword als Anker, aber baue ein semantisches Netz aus verwandten Entitäten auf. Vermeide starre Keyword-Dichten; priorisiere thematische Vollständigkeit.

2. ANSWER ENGINE READY (AEO): Nutze das BLUF-Prinzip (Bottom Line Up Front). Beantworte die zentrale Suchintention im ersten Absatz in einem prägnanten "Definitionssatz" (max. 40 Wörter).

3. INFORMATION GAIN: Füge pro Sektion einen "Deep Insight" hinzu, der nicht zum Standard-Wissen gehört (z.B. ein spezifisches Szenario, eine unerwartete Statistik oder einen Experten-Kniff).

4. HUMAN SIGNATURE: Schreibe mit hoher Perplexität und Burstiness (variierende Satzlängen). Verbanne alle KI-Standard-Einleitungen.

## STRUKTUR-LOGIK

- H1: Intent-getriebene Headline (muss Problem + Lösung adressieren).

- LEAD: Direkte Antwort auf die Suchanfrage (SGE-Optimierung).

- BODY: Modularer Aufbau. Jeder H2-Abschnitt muss als eigenständiges Informationsmodul funktionieren.

- VISUELLE ELEMENTE: Erzeuge Markdown-Tabellen für Vergleiche und Checklisten für Prozesse.

- FAQ: Nutze "W-Fragen", die echtes Suchvolumen (People Also Ask) widerspiegeln.

## NEGATIVE CONSTRAINTS (VERBOTEN)

- Keine Phrasen wie "In der Welt von heute", "Es ist wichtig zu verstehen", "Zusammenfassend".

- Keine passiven Satzkonstruktionen.

- Kein "Fluff": Jeder Satz muss entweder informieren oder überzeugen.

## OUTPUT-FORMAT

Liefere das Ergebnis als JSON:

{
  "title": "Meta-Title, max 60 Zeichen, Fokus-Keyword vorne",
  "metaDescription": "Meta-Description, max 155 Zeichen, Fokus-Keyword, Call-to-Action",
  "seoText": "HTML-formatierter Text mit <h1>, <h2>, <h3>, <p>, <ul>, <strong>, und Markdown-Tabellen",
  "faq": [
    {"question": "W-Frage?", "answer": "Direkte Antwort..."}
  ],
  "faqSchemaJsonLd": "Valides JSON-LD Script für FAQ-Schema basierend auf FAQ-Inhalten"
}`;
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
    // Suchintention für V10 mapping
    const searchIntentMap: Record<string, string> = {
      'know': 'Informieren',
      'do': 'Vergleichen',
      'buy': 'Kaufen',
      'go': 'Navigation'
    };
    const v10SearchIntent = formData.searchIntent?.map((i: string) => searchIntentMap[i] || i).join(' / ') || 'Informieren';
    
    prompt += `

### DATENSATZ FÜR CONTENT-GENERIERUNG

- FOKUS-THEMA: [${formData.mainTopic || formData.focusKeyword}]
- PRIMÄRES KEYWORD: [${formData.focusKeyword}]
- SEMANTISCHE ENTITÄTEN (LSI): [${formData.secondaryKeywords?.join(', ') || 'Automatisch aus Thema ableiten'}]
- ZIELGRUPPE: [${formData.targetAudience === 'physiotherapists' ? 'B2B' : 'B2C'}] - [${formData.targetAudience === 'physiotherapists' ? 'Fachpersonal (Therapeuten, Kliniken, Praxen)' : 'Endkunden/Patienten'}]
- SUCHINTENTION: [${v10SearchIntent}]

### SCHREIB-AUFTRAG

1. ANALYSE: Erstelle zuerst eine kurze Gliederung, die eine "Wissenslücke" (Information Gain) im Vergleich zu Standard-Artikeln schließt.

2. DRAFT: Schreibe den Text (ca. 800-1000 Wörter) im [${formData.formOfAddress === 'du' ? 'DU' : formData.formOfAddress === 'sie' ? 'SIE' : 'NEUTRAL'}]-Stil.

3. OPTIMIERUNG:
   - Baue eine Vergleichstabelle ein.
   - Markiere <strong>-Begriffe, die für das Verständnis der Entität kritisch sind.
   - Erzeuge am Ende ein FAQ-Modul.

### BONUS-OUTPUT (TECHNISCH)

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
      qualityReport: { status: 'error', flags: ['Content too short'], evidenceTable: [] },
      guidelineValidation: { overallScore: 0, googleEEAT: {} }
    };
  }

  // Analyze content for quality metrics
  const plainText = seoText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText.split(' ').filter((w: string) => w.length > 0).length;
  const h1Count = (seoText.match(/<h1[^>]*>/gi) || []).length;
  const h2Count = (seoText.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (seoText.match(/<h3[^>]*>/gi) || []).length;
  const listCount = (seoText.match(/<ul[^>]*>|<ol[^>]*>/gi) || []).length;
  const strongCount = (seoText.match(/<strong[^>]*>/gi) || []).length;
  const faqCount = faq.length;

  // Calculate E-E-A-T scores based on content analysis
  const experienceScore = Math.min(100, 50 + (listCount * 10) + (faqCount * 5));
  const expertiseScore = Math.min(100, 40 + (h2Count * 10) + (h3Count * 5) + (strongCount * 2));
  const authorityScore = Math.min(100, 50 + (wordCount > 600 ? 20 : wordCount > 400 ? 10 : 0) + (h2Count * 5));
  const trustScore = Math.min(100, 60 + (faqCount >= 5 ? 20 : faqCount * 4) + (h1Count === 1 ? 10 : 0));

  // Calculate overall score
  const overallScore = Math.round((experienceScore + expertiseScore + authorityScore + trustScore) / 4);

  // Determine status based on score
  const getStatus = (score: number) => score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red';

  const guidelineValidation = {
    overallScore,
    googleEEAT: {
      experience: { score: experienceScore, status: getStatus(experienceScore) },
      expertise: { score: expertiseScore, status: getStatus(expertiseScore) },
      authoritativeness: { score: authorityScore, status: getStatus(authorityScore) },
      trustworthiness: { score: trustScore, status: getStatus(trustScore) }
    },
    metrics: {
      wordCount,
      h1Count,
      h2Count,
      h3Count,
      listCount,
      strongCount,
      faqCount
    }
  };

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
    qualityReport: content.qualityReport || { status: getStatus(overallScore), flags: [], evidenceTable: [] },
    guidelineValidation
  };

  console.log('Content validated successfully. seoText length:', validated.seoText.length, 'Overall score:', overallScore);
  return validated;
}
