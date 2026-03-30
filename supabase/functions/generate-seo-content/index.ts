import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

import { getCorsHeaders } from '../_shared/cors.ts';
import { sanitizePromptInput, sanitizePromptArray } from '../_shared/sanitize-prompt-input.ts';
import { runComplianceCheck } from '../_shared/compliance-check.ts';
import type { ComplianceResult } from '../_shared/compliance-check.ts';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limit.ts';

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE AI CLIENT - calls Anthropic directly or Lovable Gateway
// ═══════════════════════════════════════════════════════════════════════════════

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIRequestOptions {
  model: string;
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  signal?: AbortSignal;
}

interface AIResponse {
  content: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

class AIError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AIError';
    this.statusCode = statusCode;
  }
}

async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  const model = options.model;
  const isAnthropic = model.startsWith('anthropic/') || model.startsWith('claude-');

  if (isAnthropic) {
    // ── ANTHROPIC DIRECT API ──
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new AIError('ANTHROPIC_API_KEY nicht konfiguriert.', 500);
    }

    const systemMsg = options.messages.find(m => m.role === 'system');
    const otherMsgs = options.messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: model.replace('anthropic/', ''),
      messages: otherMsgs.map(m => ({ role: m.role, content: m.content })),
      max_tokens: options.max_tokens || 4096,
      temperature: options.temperature ?? 0.6,
    };
    if (systemMsg) {
      body.system = systemMsg.content;
    }

    console.log('[AI] Calling Anthropic API for model:', model);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Anthropic] API error:', response.status, errorText);
      throw new AIError('Anthropic API Fehler: ' + response.status + ' - ' + errorText.substring(0, 200), response.status);
    }

    const data = await response.json();
    const content = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    return {
      content,
      model: data.model || model,
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
    };
  } else {
    // ── LOVABLE GATEWAY (OpenAI-compatible) ──
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new AIError('LOVABLE_API_KEY nicht konfiguriert.', 500);
    }

    console.log('[AI] Calling Lovable Gateway for model:', model);
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: options.messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options.temperature,
        max_tokens: options.max_tokens,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LovableGateway] API error:', response.status, errorText);
      throw new AIError('AI Gateway Fehler: ' + response.status, response.status);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      model: data.model || model,
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI MODEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

type AIModelId = 'gemini-flash' | 'gemini-pro' | 'claude-sonnet';

interface ModelConfig {
  id: AIModelId;
  modelName: string;
  provider: 'lovable' | 'anthropic';
  temperature: number;
  costPerMillionInput: number;
  costPerMillionOutput: number;
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
    modelName: 'anthropic/claude-sonnet-4-20250514',
    provider: 'anthropic',
    temperature: 0.6,
    costPerMillionInput: 3.00,
    costPerMillionOutput: 15.00,
  },
};

function getModelConfig(modelId?: string): ModelConfig {
  if (modelId && modelId in AI_MODELS) {
    return AI_MODELS[modelId as AIModelId];
  }
  return AI_MODELS['gemini-flash'];
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
// KEYWORD ANALYSIS (integrated mode) - PROFESSIONAL GRADE
// ═══════════════════════════════════════════════════════════════════════════════

interface KeywordAnalysis {
  secondaryKeywords: string[];
  wQuestions: string[];
  searchIntent: "know" | "do" | "buy" | "go";
  suggestedTopics: string[];
}

/**
 * Extracts JSON from AI response text using multiple strategies
 */
function extractJsonFromText(text: string): any | null {
  // Strategy 1: Direct parse (if response is pure JSON)
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 2: Extract from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {
      // Continue to next strategy
    }
  }

  // Strategy 3: Find JSON object with greedy match
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Continue to next strategy
    }
  }

  // Strategy 4: Find JSON by looking for opening/closing braces more carefully
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      return JSON.parse(text.substring(startIdx, endIdx + 1));
    } catch (e) {
      // All strategies failed
    }
  }

  return null;
}

/**
 * Validates and sanitizes keyword analysis results
 */
function validateKeywordAnalysis(parsed: any, focusKeyword: string): KeywordAnalysis {
  const validIntents = ['know', 'do', 'buy', 'go'];

  // Extract arrays safely
  const extractStringArray = (arr: any, fallback: string[] = []): string[] => {
    if (!Array.isArray(arr)) return fallback;
    return arr.filter((item: any) => typeof item === 'string' && item.trim().length > 0).slice(0, 15);
  };

  const secondaryKeywords = extractStringArray(parsed.secondaryKeywords);
  const wQuestions = extractStringArray(parsed.wQuestions);
  const suggestedTopics = extractStringArray(parsed.suggestedTopics);

  // Validate search intent
  let searchIntent: "know" | "do" | "buy" | "go" = 'know';
  if (parsed.searchIntent && validIntents.includes(parsed.searchIntent)) {
    searchIntent = parsed.searchIntent;
  }

  return {
    secondaryKeywords,
    wQuestions,
    searchIntent,
    suggestedTopics,
  };
}

/**
 * Generates fallback keyword suggestions when AI fails
 */
function generateFallbackAnalysis(focusKeyword: string, targetAudience: string | undefined): KeywordAnalysis {
  const keyword = focusKeyword.toLowerCase();
  const isB2B = targetAudience === 'physiotherapists';

  // Generate basic secondary keywords
  const secondaryKeywords = [
    `${focusKeyword} kaufen`,
    `${focusKeyword} Anwendung`,
    `${focusKeyword} Vorteile`,
    `beste ${focusKeyword}`,
    `${focusKeyword} Erfahrungen`,
    `${focusKeyword} Test`,
    isB2B ? `${focusKeyword} Therapie` : `${focusKeyword} Tipps`,
    isB2B ? `${focusKeyword} Indikation` : `${focusKeyword} für Anfänger`,
  ];

  // Generate basic W-questions
  const wQuestions = [
    `Was ist ${focusKeyword}?`,
    `Wie funktioniert ${focusKeyword}?`,
    `Wann sollte man ${focusKeyword} verwenden?`,
    `Welche Vorteile hat ${focusKeyword}?`,
    `Wo kann man ${focusKeyword} kaufen?`,
    isB2B ? `Welche Kontraindikationen gibt es bei ${focusKeyword}?` : `Wie wendet man ${focusKeyword} richtig an?`,
  ];

  // Generate basic topics
  const suggestedTopics = [
    `Was ist ${focusKeyword}`,
    `Anwendungsbereiche`,
    `Vorteile und Nutzen`,
    isB2B ? 'Evidenz und Studien' : 'Tipps zur Anwendung',
    'Häufige Fragen',
  ];

  return {
    secondaryKeywords,
    wQuestions,
    searchIntent: 'know',
    suggestedTopics,
  };
}

async function handleKeywordAnalysis(
  focusKeyword: string,
  targetAudience: string | undefined,
  language: string,
): Promise<KeywordAnalysis> {
  console.log('=== KEYWORD ANALYSIS START ===');
  console.log('Focus Keyword:', focusKeyword);
  console.log('Target Audience:', targetAudience);
  console.log('Language:', language);

  const audienceContext = targetAudience === 'physiotherapists'
    ? 'B2B-Zielgruppe: Therapeuten, Ärzte, medizinisches Fachpersonal. Verwende Fachterminologie.'
    : 'B2C-Zielgruppe: Endkunden, Patienten, Verbraucher. Verwende allgemeinverständliche Sprache.';

  const analysisPrompt = `Analysiere das Fokus-Keyword für SEO-Content-Erstellung.

FOKUS-KEYWORD: "${focusKeyword}"
ZIELGRUPPE: ${audienceContext}
SPRACHE: ${language === 'de' ? 'Deutsch' : 'Englisch'}

Generiere:

1. SEKUNDÄRE KEYWORDS (10-12 Stück):
   - Long-Tail-Varianten (z.B. "${focusKeyword} kaufen", "${focusKeyword} Anwendung")
   - LSI-Keywords (semantisch verwandte Begriffe)
   - Synonyme und verwandte Suchbegriffe
   - Kombinationen mit Adjektiven (beste, günstige, professionelle)

2. W-FRAGEN (6-8 Stück):
   - Beginne mit: Was, Wie, Warum, Wann, Welche, Wo, Wer
   - Typische Fragen die Nutzer bei Google stellen
   - Fragen die im FAQ beantwortet werden können

3. SUCHINTENTION (eine der folgenden):
   - "know": Nutzer sucht Informationen/Wissen
   - "do": Nutzer will etwas tun/anwenden
   - "buy": Nutzer hat Kaufabsicht
   - "go": Nutzer sucht bestimmte Website/Marke

4. THEMEN-VORSCHLÄGE (4-6 Stück):
   - Hauptabschnitte für einen umfassenden Artikel
   - Logische Gliederung des Themas

WICHTIG: Antworte AUSSCHLIESSLICH mit diesem JSON-Format, KEIN anderer Text:
{"secondaryKeywords":["keyword1","keyword2"],"wQuestions":["Frage 1?","Frage 2?"],"searchIntent":"know","suggestedTopics":["Thema 1","Thema 2"]}`;

  let lastError: Error | null = null;

  // Try up to 2 times with different temperatures
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`API Attempt ${attempt}/2...`);

      const aiResult = await callAI({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein SEO-Experte. Antworte NUR mit validem JSON, ohne Erklärungen oder Markdown.'
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: attempt === 1 ? 0.3 : 0.5,
      });

      const analysisText = aiResult.content;

      console.log('Raw AI Response (first 500 chars):', analysisText.substring(0, 500));

      if (!analysisText || analysisText.trim().length < 10) {
        console.error('Empty or too short AI response');
        lastError = new Error('AI-Antwort war leer');
        continue;
      }

      // Try to extract JSON
      const parsed = extractJsonFromText(analysisText);

      if (!parsed) {
        console.error('Failed to extract JSON from response');
        console.error('Full response:', analysisText);
        lastError = new Error('JSON-Parsing fehlgeschlagen');
        continue;
      }

      // Validate and sanitize
      const analysis = validateKeywordAnalysis(parsed, focusKeyword);

      // Check if we got meaningful results
      if (analysis.secondaryKeywords.length === 0 && analysis.wQuestions.length === 0) {
        console.error('Parsed JSON but arrays are empty');
        lastError = new Error('Keine Keywords in der Analyse gefunden');
        continue;
      }

      console.log('=== KEYWORD ANALYSIS SUCCESS ===');
      console.log('Secondary Keywords:', analysis.secondaryKeywords.length);
      console.log('W-Questions:', analysis.wQuestions.length);
      console.log('Search Intent:', analysis.searchIntent);
      console.log('Suggested Topics:', analysis.suggestedTopics.length);

      return analysis;

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Wait before retry
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // All attempts failed - use fallback
  console.warn('=== USING FALLBACK ANALYSIS ===');
  console.warn('Reason:', lastError?.message || 'Unknown error');

  const fallback = generateFallbackAnalysis(focusKeyword, targetAudience);
  console.log('Fallback generated:', fallback.secondaryKeywords.length, 'keywords,', fallback.wQuestions.length, 'questions');

  return fallback;
}

// Input validation schema
const formDataSchema = z.object({
  mode: z.enum(['generate', 'generate-outline', 'analyze-keyword']).optional().default('generate'),
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
  serpTermsStructured: z.object({
    mustHave: z.array(z.string()).optional(),
    shouldHave: z.array(z.string()).optional(),
    niceToHave: z.array(z.string()).optional(),
  }).optional(),
}).passthrough();

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ═══ SUPABASE CLIENT (einmalig erstellen, überall verwenden) ═══
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // ===== RATE LIMITING =====
    const rateResult = await checkRateLimit(supabase, user.id, RATE_LIMITS.generate_content);
    if (!rateResult.allowed) {
      return rateLimitResponse(corsHeaders, rateResult);
    }
    // ===== END RATE LIMITING =====

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

    // LOVABLE_API_KEY is still used for compliance checks (via Gemini)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.warn('LOVABLE_API_KEY not configured - compliance checks will be skipped');
    }

    // ═══ MODE: KEYWORD ANALYSIS ═══
    if (formData.mode === 'analyze-keyword') {
      console.log('Mode: analyze-keyword for:', formData.focusKeyword);

      const analysis = await handleKeywordAnalysis(
        formData.focusKeyword,
        formData.targetAudience,
        formData.language || 'de',
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

    // ═══ MODE: GENERATE OUTLINE ═══
    if (formData.mode === 'generate-outline') {
      console.log('=== OUTLINE GENERATION START ===');
      console.log('Keyword:', formData.focusKeyword);
      console.log('PageType:', formData.pageType);
      console.log('WordCount:', formData.wordCount);

      const targetWordCount = parseInt(formData.wordCount) || 1500;

      const outlinePrompt = `Du bist ein SEO Content Stratege. Erstelle eine detaillierte Gliederung (Outline) für einen SEO-Text.

FOKUS-KEYWORD: ${sanitizePromptInput(formData.focusKeyword, 200)}
SEITENTYP: ${formData.pageType || 'product'}
ZIELGRUPPE: ${formData.targetAudience || 'b2c'}
TEXTLÄNGE: ca. ${targetWordCount} Wörter

${formData.serpTermsStructured ? `
WICHTIGE BEGRIFFE AUS SERP-ANALYSE:
- Pflicht: ${sanitizePromptArray(formData.serpTermsStructured.mustHave).join(', ') || 'keine'}
- Empfohlen: ${sanitizePromptArray(formData.serpTermsStructured.shouldHave).slice(0, 5).join(', ') || 'keine'}
` : ''}

ERSTELLE EINE GLIEDERUNG MIT:
1. H1 (Hauptüberschrift mit Fokus-Keyword)
2. 4-6 H2 Abschnitte (logische Struktur)
3. Optional H3 unter H2
4. Kurze Beschreibung was in jedem Abschnitt behandelt wird
5. FAQ-Vorschläge (3-5 Fragen)

AUSGABE ALS JSON:
{
  "h1": "Vorgeschlagene H1",
  "sections": [
    {
      "h2": "Überschrift",
      "description": "Was hier behandelt wird",
      "h3s": ["Optional H3 1", "Optional H3 2"]
    }
  ],
  "faqs": ["Frage 1?", "Frage 2?"],
  "estimatedWordCount": ${targetWordCount}
}`;

      try {
        console.log('Calling AI for outline...');
        const outlineResult = await callAI({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Du erstellst SEO-optimierte Content-Gliederungen. Antworte NUR mit validem JSON.' },
            { role: 'user', content: outlinePrompt }
          ],
          temperature: 0.5,
        });

        const outlineContent = outlineResult.content;
        console.log('Outline raw content length:', outlineContent.length);

        // Parse JSON from response
        let outline;
        const jsonMatch = outlineContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            outline = JSON.parse(jsonMatch[0]);
            console.log('Outline parsed successfully');
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            outline = {
              error: 'JSON parsing failed',
              raw: outlineContent.substring(0, 500),
              h1: formData.focusKeyword,
              sections: [{ h2: 'Fehler beim Parsen', description: 'Bitte erneut versuchen' }],
              faqs: []
            };
          }
        } else {
          console.error('No JSON found in outline response');
          outline = {
            error: 'No JSON in response',
            raw: outlineContent.substring(0, 500),
            h1: formData.focusKeyword,
            sections: [{ h2: 'Keine Struktur gefunden', description: 'Bitte erneut versuchen' }],
            faqs: []
          };
        }

        console.log('=== OUTLINE GENERATION COMPLETE ===');

        return new Response(JSON.stringify({
          success: true,
          outline,
          focusKeyword: formData.focusKeyword,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (outlineError) {
        console.error('=== OUTLINE GENERATION ERROR ===');
        console.error('Error:', outlineError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Outline-Generierung fehlgeschlagen',
          details: outlineError instanceof Error ? outlineError.message : String(outlineError)
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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
      // Reuse existing supabase client from authentication (line 430)
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
        
        try {
          const summaryResult = await callAI({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Du bist ein Experte fuer die Zusammenfassung von Briefing-Dokumenten.' },
              { role: 'user', content: 'Fasse folgende Briefing-Dokumente zusammen:\n\n' + sanitizePromptInput(briefingContent, 50000) }
            ],
            temperature: 0.3,
          });
          briefingContent = '\n\n=== ZUSAMMENFASSUNG DER BRIEFING-DOKUMENTE ===\n' + summaryResult.content + '\n';
          console.log('Briefing successfully summarized');
        } catch (summaryErr) {
          console.error('Briefing summary failed, using raw content:', summaryErr);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // V14 TWO-STAGE HANDLER (Brand Voice + Compliance Audit)
    // ═══════════════════════════════════════════════════════════════════════════════
    if (promptVersion === 'v14-two-stage') {
      console.log('=== V14 TWO-STAGE GENERATION START ===');

      const wordCount = parseInt(formData.wordCount) || 1500;
      const brandName = formData.brandName || formData.manufacturerName || 'K-Active';
      const pageType = formData.pageType || 'product';

      // Density config
      const densityMap: Record<string, {min: number; max: number; label: string}> = {
        minimal:  { min: 0.3, max: 0.8, label: 'minimal (0.3–0.8%)' },
        normal:   { min: 0.5, max: 1.5, label: 'normal (0.5–1.5%)' },
        high:     { min: 1.5, max: 2.5, label: 'hoch (1.5–2.5%)' },
      };
      const density = densityMap[formData.keywordDensity] || densityMap.normal;
      const minKeywords = Math.ceil((wordCount / 100) * density.min);
      const maxKeywords = Math.ceil((wordCount / 100) * density.max);

      // Build context block (reuse existing logic)
      const contextBlock = buildContextBlock(formData);
      const dynamicStructure = buildDynamicStructure(wordCount, pageType);

      // ═══ STAGE 1: CREATIVE WRITER ═══
      console.log('[V14] Stage 1: Creative Writer starting...');
      const stage1System = buildV14Stage1SystemPrompt({
        brandName,
        audience: formData.targetAudience || 'b2c',
        dynamicStructure,
        minKeywords,
        maxKeywords,
        contextBlock,
      });

      const stage1User = buildV14Stage1UserPrompt({
        brandName: sanitizePromptInput(brandName, 100),
        mainTopic: sanitizePromptInput(formData.mainTopic || formData.productName || formData.focusKeyword, 200),
        focusKeyword: sanitizePromptInput(formData.focusKeyword, 200),
        secondaryKeywords: sanitizePromptArray(formData.secondaryKeywords),
        searchIntent: sanitizePromptInput(formData.searchIntent || '', 500),
        manufacturerInfo: sanitizePromptInput(formData.manufacturerInfo || '', 10000),
        additionalInfo: sanitizePromptInput(formData.additionalInfo || '', 10000),
        internalLinks: sanitizePromptInput(formData.internalLinks || '', 5000),
        faqInputs: sanitizePromptInput(formData.faqInputs || '', 5000),
        wQuestions: sanitizePromptInput(formData.wQuestions?.join?.('\n') || formData.wQuestions || '', 5000),
        briefingContent: sanitizePromptInput(briefingContent, 50000),
        densityLabel: density.label,
      });

      const stage1MaxTokens = calculateV14MaxTokens(wordCount);
      const TIMEOUT_MS = 50000; // 50s per stage

      // Stage 1 API call
      let stage1Content: string;
      try {
        const controller1 = new AbortController();
        const timeout1 = setTimeout(() => controller1.abort(), TIMEOUT_MS);

        const stage1Result = await callAI({
          model: modelConfig.modelName,
          messages: [
            { role: 'system', content: stage1System },
            { role: 'user', content: stage1User }
          ],
          temperature: 0.8,
          max_tokens: stage1MaxTokens,
          signal: controller1.signal,
        });
        clearTimeout(timeout1);
        stage1Content = stage1Result.content;
      } catch (err) {
        console.error('[V14] Stage 1 failed:', err);
        const statusCode = err instanceof AIError ? err.statusCode : 500;
        return new Response(JSON.stringify({
          error: 'V14 Stage 1 fehlgeschlagen',
          details: String(err)
        }), { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const stage1Result = extractJsonFromText(stage1Content);

      if (!stage1Result || !stage1Result.seoText) {
        console.error('[V14] Stage 1 JSON parse failed');
        return new Response(JSON.stringify({
          error: 'V14 Stage 1 JSON ungültig',
          rawContent: stage1Content.substring(0, 500)
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      console.log(`[V14] Stage 1 done. Words: ${stage1Result.qualityReport?.wordCount || 'unknown'}`);

      // ═══ STAGE 2: COMPLIANCE AUDITOR ═══
      console.log('[V14] Stage 2: Compliance Auditor starting...');
      const stage2System = buildV14Stage2SystemPrompt(brandName);
      const stage2User = buildV14Stage2UserPrompt({
        brandName: sanitizePromptInput(brandName, 100),
        pageType,
        mainTopic: sanitizePromptInput(formData.mainTopic || formData.focusKeyword, 200),
        seoText: stage1Result.seoText,
        faq: stage1Result.faq || [],
      });

      const stage2MaxTokens = calculateV14Stage2MaxTokens(stage1MaxTokens);

      let stage2Content: string;
      try {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);

        const stage2Result = await callAI({
          model: modelConfig.modelName,
          messages: [
            { role: 'system', content: stage2System },
            { role: 'user', content: stage2User }
          ],
          temperature: 0.2,
          max_tokens: stage2MaxTokens,
          signal: controller2.signal,
        });
        clearTimeout(timeout2);
        stage2Content = stage2Result.content;
      } catch (err) {
        console.error('[V14] Stage 2 failed:', err);
        // Fallback: Return Stage 1 result without compliance check
        return new Response(JSON.stringify({
          success: true,
          title: stage1Result.title,
          metaDescription: stage1Result.metaDescription,
          seoText: stage1Result.seoText,
          faq: stage1Result.faq || [],
          internalLinks: stage1Result.internalLinks || [],
          technicalHints: stage1Result.technicalHints || [],
          qualityReport: stage1Result.qualityReport,
          auditReport: { totalIssues: -1, issues: [], complianceScore: -1, error: 'Stage 2 failed - using unchecked content' },
          _meta: { version: 'v14-two-stage', stage2Error: true },
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const stage2Result = extractJsonFromText(stage2Content);

      console.log(`[V14] Stage 2 done. Issues: ${stage2Result?.auditReport?.totalIssues || 0}`);
      console.log('=== V14 TWO-STAGE GENERATION COMPLETE ===');

      // Final response
      return new Response(JSON.stringify({
        success: true,
        title: stage1Result.title,
        metaDescription: stage1Result.metaDescription,
        seoText: stage2Result?.seoText || stage1Result.seoText,
        faq: stage1Result.faq || [],
        internalLinks: stage1Result.internalLinks || [],
        technicalHints: stage1Result.technicalHints || [],
        qualityReport: {
          ...stage1Result.qualityReport,
          wordCountAfterCompliance: stage2Result?.auditReport?.wordCountAfter,
        },
        auditReport: stage2Result?.auditReport || { totalIssues: 0, issues: [], complianceScore: 100 },
        _meta: { version: 'v14-two-stage' },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // ═══════════════════════════════════════════════════════════════════════════════

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
      console.log('Processing refinement request with FULL system prompt');

      // WICHTIG: Nutze den vollständigen System-Prompt auch bei Refinement!
      // So bleibt die Qualität und alle Regeln (E-E-A-T, Compliance, etc.) erhalten.
      const refinementSystemPrompt = systemPrompt + `

═══ REFINEMENT-MODUS AKTIV ═══

Du überarbeitest BESTEHENDEN Content. Behalte:
- Die bestehende Struktur und Überschriften (sofern nicht explizit anders gewünscht)
- Die SEO-Optimierungen (Keyword-Platzierung, Meta-Daten)
- Die Tonalität und Anredeform

Ändere NUR was in der Anweisung explizit verlangt wird.
Gib den kompletten Text zurück, nicht nur die geänderten Teile.`;

      messages = [
        { role: 'system', content: refinementSystemPrompt },
        { role: 'user', content: `AKTUELLER TEXT ZUR ÜBERARBEITUNG:

${JSON.stringify(formData.existingContent, null, 2)}

═══ ÄNDERUNGSWUNSCH ═══
${formData.refinementPrompt}

═══ AUSGABE ═══
Gib den VOLLSTÄNDIGEN überarbeiteten Text im gleichen JSON-Format zurück (seoText, title, metaDescription, faq).` }
      ];
    } else {
      // Single content generation based on tone
      console.log('Generating single content with tone:', formData.tone);

      // Map tone to writing style instruction (supports both old German keys and new English keys)
      // WICHTIG: Fließtext bevorzugen, Bullet Points nur bei echten Aufzählungen (z.B. Vorteile-Liste am Ende)
      const toneInstructions: Record<string, string> = {
        'sachlich': 'SCHREIBSTIL: SACHLICH & STRUKTURIERT\n- Faktenbasiert mit klarer Hierarchie\n- Schreibe in FLIEẞTEXT, KEINE Bullet Points im Haupttext\n- Ruhiger, vertrauensbildender Ton\n- Daten und Fakten in Sätze einbauen\n- Objektiv und informativ',
        'factual': 'SCHREIBSTIL: SACHLICH & STRUKTURIERT\n- Faktenbasiert mit klarer Hierarchie\n- Schreibe in FLIEẞTEXT, KEINE Bullet Points im Haupttext\n- Ruhiger, vertrauensbildender Ton\n- Daten und Fakten in Sätze einbauen\n- Objektiv und informativ',
        'beratend': 'SCHREIBSTIL: BERATEND & NUTZENORIENTIERT\n- Fokus auf praktischen Nutzen und Lösungen\n- Schreibe in FLIEẞTEXT, KEINE Bullet Points im Haupttext\n- Empathisch und hilfreich im Erzählstil\n- Konkrete Empfehlungen als Fließtext formulieren\n- Vertrauensaufbauend und unterstützend',
        'advisory': 'SCHREIBSTIL: BERATEND & NUTZENORIENTIERT\n- Fokus auf praktischen Nutzen und Lösungen\n- Schreibe in FLIEẞTEXT, KEINE Bullet Points im Haupttext\n- Empathisch und hilfreich im Erzählstil\n- Konkrete Empfehlungen als Fließtext formulieren\n- Vertrauensaufbauend und unterstützend',
        'aktivierend': 'SCHREIBSTIL: AKTIVIEREND & ÜBERZEUGEND\n- Starte mit starkem Nutzenversprechen\n- Schreibe in FLIEẞTEXT, KEINE Bullet Points im Haupttext\n- Zeige Transformation (vorher → nachher) als Geschichte\n- CTAs natürlich in den Text einbauen\n- Aktivierende Verben und überzeugende Sprache',
        'sales': 'SCHREIBSTIL: AKTIVIEREND & ÜBERZEUGEND\n- Starte mit starkem Nutzenversprechen\n- Schreibe in FLIEẞTEXT, KEINE Bullet Points im Haupttext\n- Zeige Transformation (vorher → nachher) als Geschichte\n- CTAs natürlich in den Text einbauen\n- Aktivierende Verben und überzeugende Sprache'
      };

      const toneInstruction = toneInstructions[formData.tone || 'advisory'] || toneInstructions['advisory'];
      const enhancedUserPrompt = toneInstruction + '\n\n' + userPrompt;

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhancedUserPrompt }
      ];
    }

    // Single generation (for new content and refinement/quick change)
    // IMPORTANT: Supabase Edge Functions have ~120s timeout
    // We must complete within that time, so use shorter API timeout and fewer retries
    const maxRetries = 2;
    const TIMEOUT_MS = 55000; // 55 seconds per attempt (2 attempts + processing = ~115s max)

    // FIX: max_tokens berechnen basierend auf Wortanzahl
    // 1 deutsches Wort ≈ 1.8 Token (inkl. HTML) + JSON-Overhead + 20% Puffer
    const requestedWordCount = parseInt(formData.wordCount) || 1500;
    const calculatedMaxTokens = Math.ceil(requestedWordCount * 1.8) + 500 + Math.ceil(requestedWordCount * 0.4);
    console.log(`Calculated max_tokens: ${calculatedMaxTokens} for ${requestedWordCount} words`);
    let aiContent: string | null = null;

    const startTime = Date.now();
    console.log('=== STARTING CONTENT GENERATION ===');
    console.log('Max retries:', maxRetries, 'Timeout per attempt:', TIMEOUT_MS, 'ms');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const attemptStart = Date.now();
      try {
        console.log(`API attempt ${attempt}/${maxRetries} starting at ${attemptStart - startTime}ms...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`Timeout triggered for attempt ${attempt}`);
          controller.abort();
        }, TIMEOUT_MS);

        try {
          const result = await callAI({
            model: modelConfig.modelName,
            messages: messages as AIMessage[],
            temperature: modelConfig.temperature,
            max_tokens: calculatedMaxTokens,
            signal: controller.signal,
          });
          aiContent = result.content;
        } finally {
          clearTimeout(timeoutId);
        }

        const attemptDuration = Date.now() - attemptStart;
        console.log(`API attempt ${attempt} completed in ${attemptDuration}ms`);
        console.log('=== API CALL SUCCESSFUL ===');
        break;
      } catch (err) {
        const attemptDuration = Date.now() - attemptStart;

        if (err instanceof AIError) {
          console.error(`API attempt ${attempt} failed after ${attemptDuration}ms: ${err.message} (${err.statusCode})`);
          if (err.statusCode === 429 || err.statusCode === 401 || err.statusCode === 402) {
            return new Response(JSON.stringify({ error: err.message }), { status: err.statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          if (err.statusCode >= 500 && attempt < maxRetries) {
            console.log(`Server error, retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }

        if (err instanceof Error && err.name === 'AbortError') {
          console.error(`API attempt ${attempt} TIMED OUT after ${attemptDuration}ms`);
          if (attempt === maxRetries) {
            throw new Error('Zeitüberschreitung bei AI-Generierung (55s). Versuche es mit kürzerem Text oder erneut.');
          }
          console.log('Waiting 2s before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.error(`API attempt ${attempt} failed after ${attemptDuration}ms:`, err);
          if (attempt === maxRetries) throw err;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!aiContent) {
      throw new Error('AI-Generierung fehlgeschlagen. Bitte erneut versuchen.');
    }

    console.log('=== PARSING RESPONSE ===');
    console.log('AI content received, length:', aiContent.length);

    const parsedContent = parseGeneratedContent(aiContent, formData);

    const totalDuration = Date.now() - startTime;
    console.log(`=== GENERATION COMPLETE in ${totalDuration}ms ===`);

    // ═══ ANALYTICS LOGGING ═══
    let generationId: string | null = null;
    try {
      // Reuse existing supabase client from authentication (line 430)
      const wordCount = parsedContent.seoText?.split(/\s+/).filter((w: string) => w.length > 0).length || 0;
      const faqCount = parsedContent.faq?.length || 0;

      const { data: genRow } = await supabase.from('content_generations').insert({
        user_id: user.id,
        organization_id: formData.organizationId || null,
        focus_keyword: formData.focusKeyword,
        secondary_keywords: formData.secondaryKeywords || [],
        page_type: formData.pageType || null,
        target_audience: formData.targetAudience || null,
        word_count_target: formData.wordCount ? parseInt(formData.wordCount) : null,
        tonality: formData.tone || formData.tonality || null,
        form_of_address: formData.formOfAddress || null,
        ai_model: modelConfig.id,
        prompt_version: promptVersion,
        serp_used: !!(formData.serpContext && formData.serpContext.length > 0),
        serp_terms_count: formData.serpContext ? (formData.serpContext.match(/PFLICHT|EMPFOHLEN|OPTIONAL/g) || []).length : 0,
        domain_knowledge_used: !!(formData.additionalInfo || formData.manufacturerInfo),
        compliance_mdr: formData.complianceChecks?.mdr || formData.checkMDR || false,
        compliance_hwg: formData.complianceChecks?.hwg || formData.checkHWG || false,
        output_word_count: wordCount,
        output_has_faq: faqCount > 0,
        output_faq_count: faqCount,
        generation_time_ms: totalDuration,
        success: true,
      }).select('id').single();
      generationId = genRow?.id || null;
      console.log('Analytics logged successfully, generation_id:', generationId);
    } catch (analyticsError) {
      // Don't fail the request if analytics logging fails
      console.error('Analytics logging failed:', analyticsError);
    }

    // ═══ AUTO COMPLIANCE CHECK ═══
    let complianceData: ComplianceResult | null = null;
    const shouldRunCompliance = formData.complianceChecks?.mdr || formData.complianceChecks?.hwg || formData.checkMDR || formData.checkHWG;

    if (shouldRunCompliance && parsedContent.seoText && LOVABLE_API_KEY) {
      try {
        console.log('[Compliance] Starting auto compliance check...');
        const checkStart = Date.now();
        complianceData = await runComplianceCheck(parsedContent.seoText, LOVABLE_API_KEY);
        const checkDuration = Date.now() - checkStart;
        console.log(`[Compliance] Done in ${checkDuration}ms: ${complianceData.overall_status} (score: ${complianceData.compliance_score})`);

        // Save compliance check to DB
        const { data: complianceRow } = await supabase.from('compliance_checks').insert({
          generation_id: generationId,
          user_id: user.id,
          organization_id: formData.organizationId || null,
          ai_model: 'gemini-flash',
          prompt_version: promptVersion,
          check_trigger: 'auto',
          overall_status: complianceData.overall_status,
          hwg_status: complianceData.hwg_status,
          mdr_status: complianceData.mdr_status,
          compliance_score: complianceData.compliance_score,
          violations: complianceData.findings,
          medical_claims: complianceData.medical_claims,
          critical_count: complianceData.critical_count,
          warning_count: complianceData.warning_count,
          info_count: complianceData.info_count,
          check_duration_ms: checkDuration,
          raw_ai_response: { response: complianceData.raw_response },
        }).select('id').single();

        // Update generation with compliance reference
        if (generationId && complianceRow?.id) {
          await supabase.from('content_generations')
            .update({
              latest_compliance_check_id: complianceRow.id,
              compliance_status: complianceData.overall_status,
            })
            .eq('id', generationId);
        }

        console.log('[Compliance] Audit trail saved:', complianceRow?.id);
      } catch (complianceError) {
        // Don't fail the request if compliance check fails
        console.error('[Compliance] Auto check failed:', complianceError);
      }
    }

    // ═══ RESPONSE ═══
    const responseData = {
      ...parsedContent,
      compliance: complianceData ? {
        status: complianceData.overall_status,
        score: complianceData.compliance_score,
        hwg_status: complianceData.hwg_status,
        mdr_status: complianceData.mdr_status,
        findings: complianceData.findings,
        medical_claims: complianceData.medical_claims,
        critical_count: complianceData.critical_count,
        warning_count: complianceData.warning_count,
      } : null,
      generation_id: generationId,
    };

    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('=== GENERATION ERROR ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));

    // ═══ ERROR ANALYTICS LOGGING ═══
    try {
      // Reuse shared supabase client (created at function start)
      await supabase.from('content_generations').insert({
        user_id: null, // May not have user context in error
        focus_keyword: 'error',
        ai_model: 'unknown',
        prompt_version: 'unknown',
        success: false,
        error_message: error instanceof Error ? error.message : String(error),
        generation_time_ms: 0,
      });
    } catch (analyticsError) {
      console.error('Error analytics logging failed:', analyticsError);
    }

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unbekannter Fehler' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT BLOCK BUILDER (für V14 und andere Versionen)
// ═══════════════════════════════════════════════════════════════════════════════

function buildContextBlock(formData: any): string {
  // ═══ SERP-ANALYSE KONTEXT ═══
  let serpBlock = '';
  if (formData.serpContext && formData.serpContext.trim().length > 0) {
    serpBlock = '\n\n# SERP-ANALYSE (Google Top-10)\n\n' + formData.serpContext.trim();
  }

  // ═══ STRUKTURIERTE SERP-TERMS (Gewichtet) ═══
  if (formData.serpTermsStructured) {
    const { mustHave, shouldHave, niceToHave } = formData.serpTermsStructured;

    if (mustHave?.length > 0 || shouldHave?.length > 0) {
      serpBlock += '\n\n# KEYWORD-INTEGRATION (PFLICHT)\n\n';

      if (mustHave?.length > 0) {
        serpBlock += '## PFLICHT-BEGRIFFE (MÜSSEN im Text vorkommen):\n';
        serpBlock += mustHave.map((term: string) => `- "${term}"`).join('\n');
        serpBlock += '\n\n';
      }

      if (shouldHave?.length > 0) {
        serpBlock += '## EMPFOHLENE BEGRIFFE (SOLLTEN vorkommen):\n';
        serpBlock += shouldHave.slice(0, 10).map((term: string) => `- "${term}"`).join('\n');
        serpBlock += '\n\n';
      }

      if (niceToHave?.length > 0) {
        serpBlock += '## OPTIONALE BEGRIFFE (können vorkommen):\n';
        serpBlock += niceToHave.slice(0, 5).map((term: string) => `- "${term}"`).join('\n');
        serpBlock += '\n\n';
      }

      serpBlock += `ANWEISUNG FÜR TERM-INTEGRATION:

1. ALLE Pflicht-Begriffe MÜSSEN im Text vorkommen (natürlich eingebaut)
2. Mindestens 70% der empfohlenen Begriffe sollten vorkommen
3. Diese Terms erscheinen in den Top-10 Google-Ergebnissen!
`;
    }
  }

  // ═══ DOMAIN KNOWLEDGE INTEGRATION ═══
  let domainBlock = '';
  if (formData.domainKnowledge) {
    const dk = formData.domainKnowledge;
    domainBlock = '\n\n# MARKEN-WISSEN\n\n';

    if (dk.companyName) {
      domainBlock += `Unternehmen: ${dk.companyName}\n`;
    }
    if (dk.brandVoice) {
      domainBlock += `\n## BRAND VOICE:\n${dk.brandVoice}\n`;
    }
    if (dk.uniqueSellingPoints?.length > 0) {
      domainBlock += `\n## USPs:\n`;
      dk.uniqueSellingPoints.forEach((usp: string) => {
        domainBlock += `- ${usp}\n`;
      });
    }
    if (dk.aiSummary) {
      domainBlock += `\n## UNTERNEHMENSPROFIL:\n${dk.aiSummary}\n`;
    }
  }

  // ═══ MANAGEMENT INFO ═══
  let managementBlock = '';
  if (formData.managementInfo && formData.managementInfo.trim()) {
    managementBlock = `\n\n# GESCHÄFTSFÜHRUNG\n\n${formData.managementInfo.trim()}\n`;
  }

  // ═══ RESEARCH CONTENT ═══
  let researchBlock = '';
  if (formData.researchContent && Array.isArray(formData.researchContent) && formData.researchContent.length > 0) {
    researchBlock = '\n\n# RECHERCHIERTE INHALTE\n\n';
    formData.researchContent.forEach((research: { url: string; title: string; content: string }, idx: number) => {
      researchBlock += `## Quelle ${idx + 1}: ${research.title || research.url}\n`;
      researchBlock += research.content.substring(0, 2000) + '\n\n';
    });
  }

  return serpBlock + domainBlock + managementBlock + researchBlock;
}

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
  
  // ═══ TONALITÄT-MAPPING (UNIFIED) ═══
  // Unterstützt alle UI-Varianten: ConfigPanel, BasicVersion, etc.
  const tonalityMap: Record<string, string> = {
    // ConfigPanel UI values (mit Bindestrich)
    'expert-mix': 'Expertenmix (70% Fachwissen, 20% Lösung, 10% Story)',
    'consultant-mix': 'Beratermix (40% Fachwissen, 40% Lösung, 20% Story)',
    'storytelling-mix': 'Storytelling-Mix (30% Fachwissen, 30% Lösung, 40% Story)',
    'conversion-mix': 'Conversion-Mix (20% Fachwissen, 60% Lösung, 20% Story)',
    'balanced-mix': 'Balanced-Mix (je 33%)',
    // Legacy values (ohne Bindestrich)
    'expertenmix': 'Expertenmix (70% Fachwissen, 20% Lösung, 10% Story)',
    // BasicVersion tone values
    'factual': 'Sachlich & Informativ',
    'advisory': 'Beratend & Nutzenorientiert',
    'sales': 'Aktivierend & Überzeugend',
    'sachlich': 'Sachlich & Informativ',
    'beratend': 'Beratend & Nutzenorientiert',
    'aktivierend': 'Aktivierend & Überzeugend'
  };

  // Nimm tonality ODER tone, mit sinnvollem Default
  const tonalityInput = formData.tonality || formData.tone || 'consultant-mix';
  const tonality = tonalityMap[tonalityInput] || 'Beratermix (40% Fachwissen, 40% Lösung, 20% Story)';

  console.log('Tonalität:', tonalityInput, '→', tonality);
  
  const maxPara = formData.maxParagraphLength || 300;
  
  // ═══ WORTANZAHL UND KEYWORD-DICHTE ═══
  // FIX: Verwende direkt wordCount vom Frontend (UI sendet "500", "1000", "1500", etc.)
  const wordCount = parseInt(formData.wordCount) || 1500;

  console.log('Wortanzahl vom Frontend:', formData.wordCount, '→ Parsed:', wordCount);
  
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
    serpBlock = '\n\n# SERP-ANALYSE (Google Top-10)\n\n' + formData.serpContext.trim();
    console.log('SERP-Kontext integriert: ' + formData.serpContext.length + ' Zeichen');
  }

  // ═══ STRUKTURIERTE SERP-TERMS (Gewichtet) ═══
  if (formData.serpTermsStructured) {
    const { mustHave, shouldHave, niceToHave } = formData.serpTermsStructured;

    if (mustHave?.length > 0 || shouldHave?.length > 0) {
      serpBlock += '\n\n# KEYWORD-INTEGRATION (PFLICHT)\n\n';

      if (mustHave?.length > 0) {
        serpBlock += '## PFLICHT-BEGRIFFE (MÜSSEN im Text vorkommen):\n';
        serpBlock += mustHave.map((term: string) => `- "${term}"`).join('\n');
        serpBlock += '\n\n';
      }

      if (shouldHave?.length > 0) {
        serpBlock += '## EMPFOHLENE BEGRIFFE (SOLLTEN vorkommen):\n';
        serpBlock += shouldHave.slice(0, 10).map((term: string) => `- "${term}"`).join('\n');
        serpBlock += '\n\n';
      }

      if (niceToHave?.length > 0) {
        serpBlock += '## OPTIONALE BEGRIFFE (können vorkommen):\n';
        serpBlock += niceToHave.slice(0, 5).map((term: string) => `- "${term}"`).join('\n');
        serpBlock += '\n\n';
      }

      serpBlock += `ANWEISUNG FÜR TERM-INTEGRATION:

1. ALLE Pflicht-Begriffe MÜSSEN im Text vorkommen (natürlich eingebaut)
2. Mindestens 70% der empfohlenen Begriffe sollten vorkommen
3. Diese Terms erscheinen in den Top-10 Google-Ergebnissen!

BEISPIEL für natürliche Integration:
❌ FALSCH: "Kinesio Tape ist gut. Kinesio Tape hilft. Kinesio Tape kaufen."
✓ RICHTIG: "Das elastische Kinesio Tape unterstützt die Muskulatur und fördert den Heilungsprozess durch sanfte Stimulation."

REGEL: Jeder Pflicht-Begriff sollte in einem SINNVOLLEN Kontext stehen, nicht isoliert.
`;

      console.log('Strukturierte SERP-Terms: ' + (mustHave?.length || 0) + ' Pflicht, ' + (shouldHave?.length || 0) + ' Empfohlen');
    }
  }

  // ═══ DOMAIN KNOWLEDGE INTEGRATION ═══
  let domainBlock = '';
  if (formData.domainKnowledge) {
    const dk = formData.domainKnowledge;
    domainBlock = '\n\n# MARKEN-WISSEN\n\n';

    if (dk.companyName) {
      domainBlock += `Unternehmen: ${dk.companyName}\n`;
    }

    if (dk.brandVoice) {
      domainBlock += `\n## BRAND VOICE (Schreibstil der Marke):\n${dk.brandVoice}\n`;
      domainBlock += '\nWICHTIG: Passe den Schreibstil an diese Brand Voice an!\n';
    }

    if (dk.uniqueSellingPoints?.length > 0) {
      domainBlock += `\n## UNIQUE SELLING POINTS (USPs):\n`;
      dk.uniqueSellingPoints.forEach((usp: string) => {
        domainBlock += `- ${usp}\n`;
      });
      domainBlock += '\nWICHTIG: Integriere diese USPs natürlich in den Text!\n';
    }

    if (dk.aiSummary) {
      domainBlock += `\n## UNTERNEHMENSPROFIL:\n${dk.aiSummary}\n`;
    }

    console.log('Domain Knowledge integriert: ' + (dk.companyName || 'Kein Name'));
  }

  // ═══ MANAGEMENT INFO (CEO-Zitate, Philosophie) ═══
  let managementBlock = '';
  if (formData.managementInfo && formData.managementInfo.trim()) {
    managementBlock = `

# GESCHÄFTSFÜHRUNG / MANAGEMENT

Die folgenden Informationen stammen von der Geschäftsführung des Unternehmens.
Nutze diese Aussagen, um dem Text mehr Authentizität und Persönlichkeit zu verleihen.
Du kannst Zitate einbauen oder die Philosophie in den Text einfließen lassen.

${formData.managementInfo.trim()}

HINWEIS: Integriere Management-Aussagen NATÜRLICH in den Fließtext, nicht als separate Zitat-Blöcke.
`;
    console.log('Management-Info integriert: ' + formData.managementInfo.length + ' Zeichen');
  }

  // ═══ RESEARCH CONTENT (Gecrawlte URLs) ═══
  let researchBlock = '';
  if (formData.researchContent && Array.isArray(formData.researchContent) && formData.researchContent.length > 0) {
    researchBlock = `

# RECHERCHIERTE INHALTE (aus gecrawlten URLs)

Die folgenden Inhalte wurden von relevanten Webseiten extrahiert.
Nutze diese Informationen als Faktengrundlage für deinen Text.
Kombiniere sie intelligent mit den anderen Quellen.

`;
    formData.researchContent.forEach((research: { url: string; title: string; content: string }, idx: number) => {
      researchBlock += `## Quelle ${idx + 1}: ${research.title || research.url}\n`;
      researchBlock += `URL: ${research.url}\n\n`;
      researchBlock += research.content.substring(0, 2000) + '\n\n';
    });

    researchBlock += `
ANWEISUNG FÜR RESEARCH-INTEGRATION:
- Nutze die recherchierten Inhalte als FAKTENGRUNDLAGE
- Kombiniere sie mit SERP-Daten, Brand Voice und Management-Infos
- Schreibe EIGENEN Text, kopiere NICHT wörtlich
- Ziehe relevante Details heraus und formuliere sie neu
`;
    console.log('Research Content integriert: ' + formData.researchContent.length + ' URLs');
  }

  // Kombiniere SERP + Domain + Management + Research für alle Versionen
  const contextBlock = serpBlock + domainBlock + managementBlock + researchBlock;

  // ═══════════════════════════════════════════════════════════════════════════════
  // VERSION ROUTING - AKTIVE VERSIONEN: v13 (default), v12, v11, v10, v9, v8, v6
  // ═══════════════════════════════════════════════════════════════════════════════

  // ═══ VERSION 13: CLEAN PRIORITY PROMPT (NEU - Default) ═══
  if (promptVersion === 'v13-priority-prompt' || promptVersion === 'v9-master') {
    // v9 wird auf v13 umgeleitet (neuer Standard)
    return buildV13PriorityPrompt(formData, tonality, addressStyle, wordCount, minKeywords, maxKeywords, density, compliance, contextBlock);
  }

  // ═══ VERSION 12: K-ACTIVE HEALTHCARE MASTER (Legacy) ═══
  if (promptVersion === 'v12-healthcare-master') {
    return buildV12HealthcareMasterPrompt(formData, tonality, addressStyle, wordCount, minKeywords, maxKeywords, density, compliance, contextBlock);
  }

  // ═══ VERSION 11: SURFER-STYLE (Weighted Terms, No Hallucination) ═══
  if (promptVersion === 'v11-surfer-style') {
    return buildV11SurferStylePrompt(formData, tonality, addressStyle, wordCount, minKeywords, maxKeywords, density, compliance, contextBlock);
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
  return buildV9MasterPrompt(formData, tonality, addressStyle, wordCount, minKeywords, maxKeywords, density, compliance, contextBlock);
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
  contextBlock: string = '' // SERP + Domain Knowledge combined
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
${contextBlock}

═══ INFORMATION GAIN (KRITISCH FÜR 2025!) ═══

Dein Content MUSS sich von der Konkurrenz abheben durch:
1. EINZIGARTIGE PERSPEKTIVE: Was kann nur ${brandName} bieten?
2. TIEFERE DETAILS: Gehe über die SERP-Oberflächeninfos hinaus
3. PRAKTISCHE TIPPS: Konkrete Handlungsanweisungen die Konkurrenten nicht haben
4. AKTUELLE DATEN: Nutze Jahr 2025/2026 Kontext wo relevant
5. EXPERTEN-INSIGHTS: Zeige Fachwissen das nicht überall steht

FRAGE DICH: "Würde ein Nutzer nach dem Lesen meines Textes noch einen Konkurrenten besuchen müssen?"
→ Wenn JA, dann fehlt Information Gain!

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
• FLIEẞTEXT bevorzugen - Bullet-Liste NUR für "Vorteile auf einen Blick" am Ende
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
□ Fließtext statt Bullet Points (außer Vorteile-Liste am Ende)? ✓
□ Keine verbotenen Phrasen? ✓
□ FAQ mit direkten Antworten? ✓
□ E-E-A-T-Signale vorhanden? ✓
□ Information Gain vorhanden? ✓`;
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
// VERSION 11.0 - SURFER-STYLE PROMPT (Weighted Terms, No Hallucination)
// Inspiriert von Surfer SEO, Clearscope - Term Importance statt Keyword-Stuffing
// ═══════════════════════════════════════════════════════════════════════════════

function buildV11SurferStylePrompt(
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

  const brandName = formData.brandName || formData.manufacturerName || 'das Unternehmen';
  const pageType = formData.pageType || 'product';

  // ═══ ZIELGRUPPEN-BLOCK ═══
  let audienceBlock = '';
  if (formData.targetAudience === 'physiotherapists') {
    audienceBlock = `
ZIELGRUPPE: Therapeuten/Fachpersonal
→ Fachsprache erlaubt, evidenzbasiert argumentieren`;
  } else {
    audienceBlock = `
ZIELGRUPPE: Endkunden (B2C)
→ Einfache Sprache, Nutzen in den Vordergrund`;
  }

  // ═══ COMPLIANCE ═══
  let complianceBlock = '';
  const hasMDR = formData.complianceChecks?.mdr || formData.checkMDR;
  const hasHWG = formData.complianceChecks?.hwg || formData.checkHWG;
  if (formData.complianceCheck && (hasMDR || hasHWG)) {
    complianceBlock = `

═══ COMPLIANCE (AKTIV!) ═══
${hasMDR ? '• MDR/MPDG: Keine Heilversprechen\n' : ''}${hasHWG ? '• HWG: Keine irreführenden Aussagen\n' : ''}
→ Erlaubt: "kann unterstützen", "trägt bei zu"
→ Verboten: "heilt", "garantiert", absolute Wirkaussagen`;
  }

  return `Du bist ein Content-Stratege, der Texte wie Surfer SEO / Clearscope optimiert:
Basierend auf SERP-Daten, gewichteten Terms, und ohne erfundene Fakten.

═══ GRUNDPRINZIP ═══

Dieses System arbeitet wie professionelle SEO-Tools:
• Terms werden nach WICHTIGKEIT gewichtet (nicht alle gleich behandelt)
• Long-Tail Keywords sind VARIATIONEN, nicht separate Pflicht-Keywords
• Information Gain kommt aus SERP-Lücken, nicht aus Erfindung
• Content Score > Keyword-Dichte

═══ AKTUELLE AUFGABE ═══

MARKE: ${brandName}
SEITENTYP: ${pageType === 'product' ? 'Produktseite' : 'Kategorieseite'}
TONALITÄT: ${tonality}
ANREDE: ${addressStyle}
TEXTLÄNGE: ~${wordCount} Wörter${audienceBlock}${complianceBlock}

═══ KEYWORD-STRATEGIE (SURFER-STYLE) ═══

FOKUS-KEYWORD: Muss enthalten sein in:
✓ H1-Überschrift
✓ Ersten 100 Wörtern
✓ Mind. 1x H2
✓ Letztem Absatz
✓ Meta-Title & Description

ZIEL-HÄUFIGKEIT: ${minKeywords}-${maxKeywords}x (bei ${wordCount} Wörtern)

AGGREGATIONS-REGEL (KRITISCH!):
┌─────────────────────────────────────────────────────────────┐
│ "Jako Trainingshose Herren" = 1 Erwähnung, NICHT 2!        │
│                                                             │
│ Long-Tail Keywords sind VARIATIONEN des Fokus-Keywords.    │
│ Sie zählen NICHT separat!                                  │
│                                                             │
│ FALSCH: "Jako Trainingshose" (1) + "Jako Trainingshose     │
│         Herren" (2) + "Jako Trainingshose Damen" (3) = 3x  │
│                                                             │
│ RICHTIG: Alles zusammen = max. ${maxKeywords}x im Text            │
└─────────────────────────────────────────────────────────────┘

VARIATIONEN NUTZEN statt Wiederholung:
• "die Trainingshose" / "die Hose" / "das Modell"
• "Jako Sporthose" / "Jako Jogginghose" (wenn passend)
• Pronomen: "sie", "diese", "damit"
${serpBlock ? `
═══ SERP-ANALYSE (Google Top-10) ═══
${serpBlock}

WICHTIG zur SERP-Analyse:
• PFLICHT-BEGRIFFE: Müssen vorkommen (natürlich eingebaut)
• EMPFOHLENE BEGRIFFE: Sollten vorkommen wo passend
• OPTIONALE BEGRIFFE: Für Differenzierung, nicht erzwingen

Die Begriffe stammen aus echten Top-10 Seiten.
Nutze sie als Inspiration, nicht als Checkliste zum Abhaken.` : ''}

═══ INFORMATION GAIN (OHNE ERFINDUNG!) ═══

Du sollst Mehrwert bieten, aber NICHTS ERFINDEN!

✅ ERLAUBT - Allgemeine Aussagen:
• "Jako bietet verschiedene Modelle und Serien"
• "Die genauen Größen findest du in der Größentabelle"
• "Preise variieren je nach Modell und Ausstattung"
• "Im Shop findest du die aktuelle Produktübersicht"
• Allgemeine Materialeigenschaften (Polyester ist atmungsaktiv)
• Allgemeine Anwendungstipps

❌ VERBOTEN - Konkrete erfundene Fakten:
• Konkrete Preise (z.B. "29,99€")
• Spezifische Modellnamen die nicht verifiziert sind
• Exakte technische Specs (z.B. "78% Polyester, 22% Elasthan")
• Konkrete Lieferzeiten oder Verfügbarkeiten

DIFFERENZIERUNG durch:
• Ausführlichere Erklärungen als Wettbewerber
• Bessere Struktur und Lesbarkeit
• Mehr hilfreiche Fragen im FAQ
• Praktische Anwendungstipps (allgemein gehalten)

═══ ANTI-PATTERNS (STRIKT VERBOTEN!) ═══

FLUFF-PHRASEN (klingen nach KI):
❌ "Kennst du das Gefühl, wenn..." → Max. 1x im gesamten Text!
❌ "In der heutigen Zeit..."
❌ "Es ist wichtig zu beachten..."
❌ "Zusammenfassend lässt sich sagen..."
❌ "Weit mehr als nur..."
❌ "Optimal unterstützen..."
❌ Jeder Satz ohne konkreten Informationswert

KEYWORD-STUFFING:
❌ Mehr als ${maxKeywords}x das Fokus-Keyword
❌ Unnatürliche Wortstellungen ("Hosen Herren günstig kaufen online")
❌ Jedes Long-Tail als separates Muss-Keyword behandeln

ERFUNDENE FAKTEN:
❌ Konkrete Preise ohne Quelle
❌ Spezifische Produktnamen ohne Verifizierung
❌ Technische Details ohne Beleg

═══ STRUKTUR ═══

1. H1: Mit Fokus-Keyword + Nutzenversprechen (max. 70 Zeichen)

2. EINSTIEG (80-120 Wörter):
   • Fokus-Keyword in ersten 50 Wörtern
   • Problem oder Bedürfnis ansprechen
   • KEIN "Kennst du das Gefühl" als Einstieg

3. H2-SEKTIONEN:
   • Was ist [Produkt]?
   • Vorteile / Für wen geeignet?
   • Worauf achten beim Kauf?
   • Pflege / Anwendung

4. VISUELLE ELEMENTE (Pflicht!):
   • Mind. 2-3 Bullet-Listen
   • <strong> für wichtige Begriffe
   • Tabelle bei Vergleichen (optional)

5. FAQ-SEKTION:
   • 5-8 W-Fragen
   • DIREKTE Antwort im ersten Satz (40-60 Wörter)
   • Featured-Snippet-tauglich

═══ LESBARKEIT ═══

• Satzlänge variieren: Kurz. Dann mittel. Dann ein längerer.
• Keine 3x gleicher Satzanfang hintereinander
• Max. 4 Sätze pro Absatz
• Aktive Sprache (max. 15% Passiv)
• Alle 3 Absätze ein visuelles Element

═══ OUTPUT-FORMAT ═══

{
  "title": "Meta-Title, max 60 Zeichen, Fokus-Keyword vorne",
  "metaDescription": "Meta-Description, max 155 Zeichen, mit CTA",
  "seoText": "HTML mit <h1>, <h2>, <h3>, <p>, <ul>, <strong>",
  "faq": [{"question": "W-Frage?", "answer": "Direkte Antwort..."}],
  "internalLinks": ["Verlinkungsvorschläge"],
  "qualityReport": {
    "fokusKeywordCount": "Anzahl (Ziel: ${minKeywords}-${maxKeywords})",
    "wordCount": ${wordCount},
    "contentScore": "Einschätzung 0-100",
    "informationGainNotes": "Was macht diesen Text besser als Top-10?"
  }
}

═══ QUALITÄTS-CHECK VOR OUTPUT ═══

□ Fokus-Keyword ${minKeywords}-${maxKeywords}x? (NICHT mehr!)
□ Long-Tails als Variationen gezählt (nicht separat)?
□ Keine erfundenen Preise/Modellnamen?
□ Keine Fluff-Phrasen?
□ Fließtext (keine Bullet Points im Haupttext)?
□ FAQ mit direkten Antworten?
□ Satzlängen variiert?`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION 12.0 - K-ACTIVE HEALTHCARE MASTER PROMPT
// Kombiniert: v11 SERP-Integration + v9 Zielgruppen + v8 E-E-A-T + v6 Anti-Fluff
// Speziell für Healthcare/Medtech mit MDR + HWG Compliance IMMER AKTIV
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION 13: CLEAN PRIORITY PROMPT (NEU - Klare P1/P2/P3 Struktur)
// ═══════════════════════════════════════════════════════════════════════════════

function buildV13PriorityPrompt(
  formData: any,
  tonality: string,
  addressStyle: string,
  wordCount: number,
  minKeywords: number,
  maxKeywords: number,
  density: { min: number; max: number; label: string },
  compliance: string,
  contextBlock: string = ''
): string {

  const pageType = formData.pageType || 'product';
  const brandName = formData.brandName || formData.manufacturerName || 'K-Active';
  // FIX: minWordCount = wordCount - 200, aber mindestens 80% der Zielwortanzahl
  const minWordCount = Math.max(Math.round(wordCount * 0.8), wordCount - 200);
  const absatzCount = Math.round(wordCount / 100); // ca. 100 Wörter pro Absatz

  // ═══ ZIELGRUPPEN-BLOCK ═══
  let audienceBlock = '';
  if (formData.targetAudience === 'b2b' || formData.targetAudience === 'physiotherapists') {
    audienceBlock = `
**Zielgruppe:** Therapeuten / Fachpersonal (B2B)
- Anatomische Fachbegriffe verwenden
- Biomechanische Konzepte, Evidenzlevel
- Ton: Fachlich-kollegial`;
  } else {
    audienceBlock = `
**Zielgruppe:** Endkunden / Patienten (B2C)
- Fachbegriffe immer erklären
- Alltagsszenarien und praktische Beispiele
- Ton: Freundlich, nahbar`;
  }

  // ═══ TONALITÄT-INSTRUKTIONEN ═══
  const tonalityInstructionsMap: Record<string, string> = {
    'Expertenmix (70% Fachwissen, 20% Lösung, 10% Story)': '**Tonalität:** Expertenmix – 70% Fachwissen, 20% Lösung, 10% Story',
    'Beratermix (40% Fachwissen, 40% Lösung, 20% Story)': '**Tonalität:** Beratermix – 40% Fachwissen, 40% Lösung, 20% Story',
    'Storytelling-Mix (30% Fachwissen, 30% Lösung, 40% Story)': '**Tonalität:** Storytelling-Mix – 30% Fachwissen, 30% Lösung, 40% Story',
    'Conversion-Mix (20% Fachwissen, 60% Lösung, 20% Story)': '**Tonalität:** Conversion-Mix – 20% Fachwissen, 60% Lösung, 20% Story',
    'Balanced-Mix (je 33%)': '**Tonalität:** Balanced-Mix – je 33%',
    'Sachlich & Informativ': '**Tonalität:** Sachlich & Informativ',
    'Beratend & Nutzenorientiert': '**Tonalität:** Beratend & Nutzenorientiert',
    'Aktivierend & Überzeugend': '**Tonalität:** Aktivierend & Überzeugend'
  };
  const tonalityInstructions = tonalityInstructionsMap[tonality] || '**Tonalität:** Beratermix – 40% Fachwissen, 40% Lösung, 20% Story';

  // ═══ SEITENTYP-LABEL ═══
  const pageTypeLabels: Record<string, string> = {
    'product': 'Produktseite',
    'category': 'Kategorieseite',
    'guide': 'Ratgeber'
  };

  // ═══ STRUKTUR-TEMPLATE ═══
  let structureTemplate = '';
  if (pageType === 'product') {
    structureTemplate = `
### Produktseiten-Struktur
- H1: Produkt + emotionaler Benefit
- H2: Haupt-USP / Was macht es besonders?
- H2: Für wen? Anwendungsszenarien
- H2: Trust / Qualität / Wissenschaft
- H2: Vorteile auf einen Blick (hier Liste OK)
- H2: Häufige Fragen (FAQ)`;
  } else if (pageType === 'category') {
    structureTemplate = `
### Kategorieseiten-Struktur
- H1: Kategorie + Benefit
- H2: Was sind [Kategorie]?
- H2: Die verschiedenen Arten
- H2: Kaufberatung
- H2: Häufige Fragen`;
  } else {
    structureTemplate = `
### Ratgeber-Struktur
- H1: Thema – Der komplette Ratgeber
- H2: Was ist [Thema]?
- H2: Wie funktioniert es?
- H2: Schritt-für-Schritt Anwendung
- H2: Vorteile
- H2: Häufige Fehler vermeiden
- H2: FAQ`;
  }

  return `Du bist Healthcare Content Writer für ${brandName} (Medtech).
Du schreibst SEO-Texte, die sich lesen wie vom besten Marketing-Texter der Branche – fachlich fundiert, lebendig, überzeugend.

## AUFGABE
Schreibe einen SEO-Text mit EXAKT ca. ${wordCount} Wörtern.
Seitentyp: ${pageTypeLabels[pageType] || 'Produktseite'}
Anrede: ${addressStyle}
${tonalityInstructions}
${audienceBlock}

## PRIORITÄTEN (in dieser Reihenfolge!)

### P1 – NICHT VERHANDELBAR
Diese Regeln gelten immer. Kein Text darf sie verletzen.

**TEXTLÄNGE – ABSOLUTE PFLICHT:**
┌────────────────────────────────────────────────┐
│  ZIEL: ${wordCount} Wörter                     │
│  MINIMUM: ${minWordCount} Wörter               │
│  MAXIMUM: ${wordCount + 300} Wörter            │
└────────────────────────────────────────────────┘

Du brauchst ca. ${absatzCount} Absätze für ${wordCount} Wörter!
Wenn der Text zu kurz wird:
→ Mehr Anwendungsszenarien (Sport, Alltag, Therapie)
→ Zusätzliche H2-Abschnitte einbauen
→ FAQ auf 6-8 Fragen erweitern
→ Fachbegriffe ausführlicher erklären

WARNUNG: Texte unter ${minWordCount} Wörtern werden ABGELEHNT!

**Healthcare Compliance (MDR/HWG):**
- Medizinprodukte nur mit zugelassener Zweckbestimmung
- Statt "heilt/beseitigt/garantiert" → "kann unterstützen bei...", "wurde entwickelt für...", "Anwender berichten..."
- Bei Medizinprodukten: Kontraindikationen erwähnen (Herzschrittmacher, Schwangerschaft, offene Wunden etc.)

**Keine Konkurrenznennung:** Keine Markennamen von Wettbewerbern, Händlern oder Plattformen. Auch nicht vergleichend.

### P2 – SEO-FUNDAMENT
Diese Regeln sorgen für gute Rankings.

**Fokus-Keyword Platzierung:**
- In der H1-Überschrift
- In den ersten 100 Wörtern
- In mindestens einer H2
- Im Meta-Title und Meta-Description

**Keyword-Häufigkeit:** ${minKeywords}–${maxKeywords}× bei ${wordCount} Wörtern. Long-Tail-Variationen zählen mit.

**Heading-Hierarchie:** Exakt 1× H1. Danach H2 → H3 (keine Ebene überspringen). Nach jeder Überschrift kommt Text.

**SERP-Terms:** Integriere die mustHave-Terms aus dem Context-Block natürlich in den Text.

### P3 – STIL-LEITPLANKEN (Orientierung)
Diese Regeln machen den Text besser. Wenn sie dem Lesefluss widersprechen, gewinnt der Lesefluss.

**Schreibhaltung:**
- Schreibe für Menschen, optimiere für Google
- Variiere Satzlängen: Kurz. Dann mittel. Dann ein längerer Satz, der einen Gedanken ausführt.
- Aktive Verben bevorzugen. Konkrete Zahlen statt vager Aussagen.
- Max. 4 Sätze pro Absatz
- Fließtext bevorzugen. Bullet-Listen nur für "Vorteile auf einen Blick" (max. 1×) oder Schritt-für-Schritt-Anleitungen.

**Vermeide diese KI-typischen Phrasen:**
"In der heutigen Zeit", "Es ist wichtig zu beachten", "Zusammenfassend lässt sich sagen", "In diesem Artikel erfahren Sie", "Nicht umsonst", "Zweifellos"

**Rhetorische Fragen:** Maximal 1× im gesamten Text.

**E-E-A-T Signale einbauen:**
- Experience: Praxisszenarien, Alltagsbeispiele
- Expertise: Fachbegriffe (bei B2C erklärt), das "Warum" hinter Empfehlungen
- Authority: Zertifizierungen, Normen, Studienhinweise
- Trust: Ehrlich über Grenzen, keine Superlative ohne Beleg

## STRUKTUR
${structureTemplate}

Grundregeln:
- H1 mit Fokus-Keyword (max. 70 Zeichen)
- Mind. 3–4 H2-Abschnitte
- Einstieg: 80–150 Wörter, Hook + Fokus-Keyword in ersten 50 Wörtern
- FAQ: 5–8 W-Fragen, direkte Antworten (40–60 Wörter pro Antwort)
- <strong> für wichtige Keywords im Fließtext

## OUTPUT-FORMAT
Antworte ausschließlich mit validem JSON:
{
  "title": "Meta-Title, max 60 Zeichen, Fokus-Keyword vorne",
  "metaDescription": "Meta-Description, max 155 Zeichen, mit CTA",
  "seoText": "Vollständiger HTML-Text mit <h1>, <h2>, <h3>, <p>, <ul>, <strong>",
  "faq": [{"question": "...", "answer": "..."}],
  "internalLinks": ["Vorschläge für interne Verlinkung"],
  "technicalHints": ["Technische SEO-Hinweise"],
  "qualityReport": {
    "wordCount": 0,
    "keywordCount": 0,
    "keywordDensity": "0.0%",
    "h2Count": 0,
    "readabilityScore": "gut/mittel/schwach"
  }
}

## FINALE CHECKLISTE VOR OUTPUT
□ seoText hat mindestens ${minWordCount} Wörter? (PFLICHT!)
□ Fokus-Keyword in H1, ersten 100 Wörtern, Meta-Title?
□ Keine Heilversprechen (MDR/HWG)?
□ Keine Konkurrenz-Markennamen?
□ ${absatzCount}+ Absätze vorhanden?

**DER USER HAT ${wordCount} WÖRTER BESTELLT – LIEFERE SIE!**

${contextBlock}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION 14: TWO-STAGE SEO CONTENT (Brand Voice + Compliance Audit)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Baut eine strukturelle Längenvorgabe statt einer Wortanzahl-Instruktion.
 * Statt "Schreibe 1500 Wörter" (LLM kann nicht zählen) gibt es
 * "6× H2-Sektion je 170 Wörter" (LLM kann Struktur füllen).
 */
function buildDynamicStructure(wordCount: number, pageType: string): string {
  // Feste Blöcke
  const introWords = 150;
  const faqCount = wordCount >= 1500 ? 7 : 5;
  const faqWords = faqCount * 50;
  const outroWords = 80;

  // Restliche Wörter auf H2-Sektionen verteilen
  const bodyWords = wordCount - introWords - faqWords - outroWords;
  const wordsPerSection = 170;
  const h2Count = Math.max(3, Math.round(bodyWords / wordsPerSection));
  const actualWordsPerSection = Math.round(bodyWords / h2Count);

  return `EINLEITUNG: ca. ${introWords} Wörter (3 Absätze)
- Hook: Problem, Alltagsszenario oder überraschender Fakt
- Fokus-Keyword in den ersten 50 Wörtern
- Kein Bullet-Point, nur Fließtext

${h2Count}× H2-SEKTION: je ca. ${actualWordsPerSection} Wörter
- Pro Sektion: 3–4 Absätze mit je 3–4 Sätzen
- Nach jeder H2 kommt Fließtext, keine Liste
- H3 nur wenn die Sektion ein Unterthema braucht
- <strong> für wichtige Begriffe
- Jede Sektion muss eigenständig Mehrwert liefern

FAQ: ${faqCount} W-Fragen
- Direkte Antwort, 40–60 Wörter pro Antwort
- Echte Fragen die Nutzer stellen würden

ABSCHLUSS: ca. ${outroWords} Wörter
- "Vorteile auf einen Blick" als kurze Bullet-Liste ODER Fazit-Absatz

HEADING-REGELN:
- Exakt 1× H1 (Fokus-Keyword, max. 70 Zeichen)
- H2 für die ${h2Count} Hauptsektionen
- H3 nur als Unterpunkt von H2, keine Ebene überspringen

GESAMT: ca. ${wordCount} Wörter verteilt auf ${h2Count} Sektionen + Intro + FAQ + Abschluss`;
}

function buildV14AudienceToggle(audience: string): string {
  if (audience === 'b2b' || audience === 'physiotherapists') {
    return 'Zielgruppe: Therapeuten / Fachpersonal. Schreibe wie ein Kollege zum Kollegen. Fachbegriffe nutzen, weil sie präziser sind.';
  }
  return 'Zielgruppe: Endkunden / Patienten. Schreibe wie ein Therapeut zum Patienten. Fachbegriffe beiläufig übersetzen, nie vermeiden.';
}

function calculateV14MaxTokens(wordCount: number): number {
  // 1 deutsches Wort ≈ 1.8 Token (inkl. HTML-Tags) + JSON-Overhead + Puffer
  const textTokens = Math.ceil(wordCount * 1.8);
  const jsonOverhead = 500;
  const buffer = Math.ceil((textTokens + jsonOverhead) * 0.2);
  return textTokens + jsonOverhead + buffer;
}

function calculateV14Stage2MaxTokens(stage1Tokens: number): number {
  return Math.ceil(stage1Tokens * 1.3);
}

function buildV14Stage1SystemPrompt(vars: {
  brandName: string;
  audience: string;
  dynamicStructure: string;
  minKeywords: number;
  maxKeywords: number;
  contextBlock: string;
}): string {
  const audienceToggle = buildV14AudienceToggle(vars.audience);

  return `Du schreibst als ${vars.brandName} — ein erfahrener Therapeut, der sein Wissen teilt. Nicht Konzern, nicht Verkäufer, nicht Lehrbuch. Aus der Therapie, für die Therapie.

Charakter: Erfahren, nicht belehrend. Ehrlich, nicht vorsichtig. Praktisch, nicht theoretisch. Sachlich-warm, nie kitschig.

${audienceToggle}

Ansprache: Du-Form. Erste Person Plural für das Unternehmen ("Wir empfehlen"). Denke jede Produktaussage von der Anwendung her — nicht vom Datenblatt.

Dein Text wird von einem Compliance-Team geprüft. Vermeide absolute Heilversprechen ("heilt", "garantiert"), formuliere stattdessen unterstützend ("kann unterstützen bei", "wurde entwickelt für"). Den Rest übernimmt das Team.

## TEXTAUFBAU

Halte dich exakt an diese Struktur. Jeder Block muss die angegebene Länge erreichen.

${vars.dynamicStructure}

## KEYWORDS

Fokus-Keyword in: H1, erste 100 Wörter, mind. 1× H2, Meta-Title, Meta-Description. Häufigkeit: ${vars.minKeywords}–${vars.maxKeywords}×. Long-Tail-Variationen zählen mit.

## STIL

Satzlängen variieren. Aktiv statt Passiv. Konkret statt vage. Max. 4 Sätze pro Absatz. Einordnung statt Behauptung: "In der Praxis zeigt sich..." statt "Es ist bewiesen..."

Nie: "In der heutigen Zeit", "Es ist wichtig zu beachten", "Zusammenfassend lässt sich sagen", "revolutionär", "perfekt für jeden", "du musst unbedingt".

## SERP-TERMS

Integriere jeden mustHave-Term mindestens 1× natürlich in den Text.

${vars.contextBlock}

## OUTPUT

Nur valides JSON:
{
  "title": "Max 60 Zeichen, Keyword vorne",
  "metaDescription": "Max 155 Zeichen, mit CTA",
  "seoText": "HTML mit <h1>, <h2>, <h3>, <p>, <ul>, <strong>",
  "faq": [{"question": "...", "answer": "..."}],
  "internalLinks": ["..."],
  "qualityReport": {"wordCount": 0, "keywordCount": 0, "keywordDensity": "0%", "h2Count": 0}
}`;
}

function buildV14Stage1UserPrompt(vars: {
  brandName: string;
  mainTopic: string;
  focusKeyword: string;
  secondaryKeywords?: string[];
  searchIntent?: string;
  manufacturerInfo?: string;
  additionalInfo?: string;
  internalLinks?: string;
  faqInputs?: string;
  wQuestions?: string;
  briefingContent?: string;
  densityLabel: string;
}): string {
  let prompt = `## CONTENT-BRIEF

**Marke:** ${vars.brandName}
**Thema/Produkt:** ${vars.mainTopic}
**Fokus-Keyword:** ${vars.focusKeyword}`;

  if (vars.secondaryKeywords?.length) {
    prompt += `\n**Sekundär-Keywords:** ${vars.secondaryKeywords.join(', ')}`;
  }
  if (vars.searchIntent) {
    prompt += `\n**Suchintention:** ${vars.searchIntent}`;
  }
  if (vars.manufacturerInfo) {
    prompt += `\n\n### HERSTELLER-/PRODUKTDATEN\n${vars.manufacturerInfo}`;
  }
  if (vars.additionalInfo) {
    prompt += `\n\n### USPs & ZUSATZINFOS\n${vars.additionalInfo}`;
  }
  if (vars.internalLinks) {
    prompt += `\n\n### INTERNE VERLINKUNG\n${vars.internalLinks}`;
  }
  if (vars.faqInputs) {
    prompt += `\n\n### FAQ-VORGABEN\n${vars.faqInputs}`;
  }
  if (vars.wQuestions) {
    prompt += `\n\n### W-FRAGEN\n${vars.wQuestions}`;
  }
  if (vars.briefingContent) {
    prompt += `\n\n${vars.briefingContent}`;
  }

  prompt += `

---

Schreibe den SEO-Text jetzt. Keyword-Dichte: ${vars.densityLabel}. Fülle jeden Strukturblock vollständig aus. Nur valides JSON.`;

  return prompt;
}

function buildV14Stage2SystemPrompt(brandName: string): string {
  return `Du bist Healthcare Compliance Auditor für ${brandName} (Medtech). Dein Job: Texte auf regulatorische Verstöße prüfen und minimal-invasiv korrigieren.

## PRÜF-BEREICHE

### 1. MDR (Medical Device Regulation)
- Medizinprodukte nur mit zugelassener Zweckbestimmung
- Keine Erweiterung über CE-Kennzeichnung hinaus

### 2. HWG (Heilmittelwerbegesetz)
VERBOTEN: "heilt", "beseitigt", "garantiert Schmerzfreiheit", absolut formulierte Wirkaussagen, "Klinisch getestet" ohne Quelle
ERLAUBT: "kann unterstützen bei", "wurde entwickelt für", "Anwender berichten", "In Studien zeigte sich" (mit Quelle)

Korrekturen:
- "heilt Rückenschmerzen" → "kann bei Rückenbeschwerden unterstützend wirken"
- "beseitigt Verspannungen" → "wurde entwickelt, um Verspannungen zu adressieren"
- "lindert Schmerzen" → "kann zur Linderung von Beschwerden beitragen"

### 3. Konkurrenz-Erwähnung
Keine Nennung von Wettbewerbern, Händlern, Plattformen oder anderen Marken. Auch nicht vergleichend.

### 4. Heading-Hierarchie
Exakt 1× <h1>. Kein Ebenen-Sprung. Nach jeder Überschrift steht <p>.

### 5. Kontraindikationen (bei Medizinprodukten)
Falls nicht vorhanden, ergänze im FAQ: Herzschrittmacher, Schwangerschaft, offene Wunden, akute Entzündungen, Epilepsie. Bei Unsicherheit: "Rücksprache mit Arzt oder Therapeut".

## KORREKTUR-REGELN

- Ändere NUR problematische Stellen
- KÜRZE DEN TEXT NICHT
- Behalte Stil, Ton und Struktur bei
- Wortanzahl-Differenz max. ±50 Wörter

## OUTPUT

Nur valides JSON:
{
  "seoText": "Korrigierter vollständiger HTML-Text",
  "auditReport": {
    "totalIssues": 0,
    "issues": [
      {
        "type": "HWG|MDR|KONKURRENZ|HEADING|KONTRAINDIKATION",
        "severity": "critical|warning",
        "original": "...",
        "corrected": "...",
        "rule": "..."
      }
    ],
    "complianceScore": 100,
    "wordCountBefore": 0,
    "wordCountAfter": 0
  }
}`;
}

function buildV14Stage2UserPrompt(vars: {
  brandName: string;
  pageType: string;
  mainTopic: string;
  seoText: string;
  faq: Array<{question: string; answer: string}>;
}): string {
  return `Marke: ${vars.brandName}
Seitentyp: ${vars.pageType}
Produkt-Kategorie: ${vars.mainTopic}

### SEO-TEXT:
${vars.seoText}

### FAQ:
${JSON.stringify(vars.faq, null, 2)}

Prüfe auf MDR, HWG, Konkurrenz, Headings, Kontraindikationen. Korrigiere minimal-invasiv. Kürze NICHTS. Nur valides JSON.`;
}

function buildV12HealthcareMasterPrompt(
  formData: any,
  tonality: string,
  addressStyle: string,
  wordCount: number,
  minKeywords: number,
  maxKeywords: number,
  density: { min: number; max: number; label: string },
  compliance: string,
  contextBlock: string = ''
): string {

  const maxPara = formData.maxParagraphLength || 300;
  const pageType = formData.pageType || 'product';
  const brandName = formData.brandName || formData.manufacturerName || 'K-Active';

  // ═══ ZIELGRUPPEN-BLOCK (Therapeuten vs. Endkunden) ═══
  let audienceBlock = '';
  if (formData.targetAudience === 'b2b' || formData.targetAudience === 'physiotherapists') {
    audienceBlock = `
═══ ZIELGRUPPE: THERAPEUTEN / FACHPERSONAL (B2B) ═══

SPRACHE & TERMINOLOGIE:
• Anatomische Fachbegriffe verwenden (M. trapezius, Fascia thoracolumbalis)
• Biomechanische Konzepte (Propriozeption, neuromuskuläre Kontrolle)
• AWMF-Leitlinien und Evidenzlevel referenzieren wo relevant
• Indikationen UND Kontraindikationen nennen

TON: Fachlich-kollegial, auf Augenhöhe mit Therapeuten`;
  } else {
    audienceBlock = `
═══ ZIELGRUPPE: ENDKUNDEN / PATIENTEN (B2C) ═══

SPRACHE:
• Fachbegriffe IMMER erklären ("Propriozeption - das Körpergefühl")
• Alltagsszenarien und praktische Beispiele nutzen
• Keine Angstmacherei, aber ehrlich über Grenzen

TON: Freundlich, nahbar, vertrauensvoll`;
  }

  // ═══ TONALITÄT-INSTRUKTIONEN (KONKRET!) ═══
  const tonalityInstructionsMap: Record<string, string> = {
    'Expertenmix (70% Fachwissen, 20% Lösung, 10% Story)': `
SCHREIBSTIL - EXPERTENMIX:
• 70% Fachwissen: Tiefe technische Details, Studien, Evidenz
• 20% Lösung: Konkrete Anwendungsempfehlungen
• 10% Story: Kurze Praxisbeispiele als Auflockerung
• Ziel: Autorität und Kompetenz demonstrieren`,

    'Beratermix (40% Fachwissen, 40% Lösung, 20% Story)': `
SCHREIBSTIL - BERATERMIX (EMPFOHLEN):
• 40% Fachwissen: Fundierte Informationen, aber zugänglich erklärt
• 40% Lösung: "Das bedeutet für Sie...", konkrete Tipps und Empfehlungen
• 20% Story: Alltagsszenarien, "Kennen Sie das..."
• Ziel: Vertrauen aufbauen durch kompetente Beratung`,

    'Storytelling-Mix (30% Fachwissen, 30% Lösung, 40% Story)': `
SCHREIBSTIL - STORYTELLING-MIX:
• 30% Fachwissen: Nur das Wichtigste, leicht verständlich
• 30% Lösung: Praktische Tipps eingebettet in Geschichten
• 40% Story: Szenarien, Erfahrungsberichte, emotionale Anker
• Ziel: Emotional berühren und Identifikation schaffen`,

    'Conversion-Mix (20% Fachwissen, 60% Lösung, 20% Story)': `
SCHREIBSTIL - CONVERSION-MIX:
• 20% Fachwissen: Nur zur Untermauerung der Vorteile
• 60% Lösung: Benefits, Vorteile, "Was Sie davon haben"
• 20% Story: Social Proof, Erfolgsgeschichten
• Ziel: Zum Handeln motivieren, Kaufentscheidung fördern
• CTAs natürlich einbauen`,

    'Balanced-Mix (je 33%)': `
SCHREIBSTIL - BALANCED-MIX:
• 33% Fachwissen: Solide Informationsbasis
• 33% Lösung: Praktische Anwendung
• 33% Story: Emotionale Elemente
• Ziel: Ausgewogener Text für verschiedene Lesertypen`,

    'Sachlich & Informativ': `
SCHREIBSTIL - SACHLICH:
• Neutral, faktenbasiert, keine Verkaufsfloskeln
• Objektive Darstellung mit Quellen wo möglich
• Wissenschaftlicher, informativer Stil
• Keine emotionalen Appelle`,

    'Beratend & Nutzenorientiert': `
SCHREIBSTIL - BERATEND:
• Hilfreicher, lösungsorientierter Ton
• "Das bedeutet für Sie...", konkrete Empfehlungen
• Probleme ansprechen und Lösungen aufzeigen
• Vertrauensaufbau durch Kompetenz`,

    'Aktivierend & Überzeugend': `
SCHREIBSTIL - AKTIVIEREND:
• Emotionale Ansprache, Benefits betonen
• Vorteile klar herausstellen
• Call-to-Actions einbauen
• Dringlichkeit erzeugen wo passend`
  };

  const tonalityInstructions = tonalityInstructionsMap[tonality] || tonalityInstructionsMap['Beratermix (40% Fachwissen, 40% Lösung, 20% Story)'];

  // ═══ HEALTHCARE COMPLIANCE BLOCK (IMMER AKTIV!) ═══
  const healthcareComplianceBlock = `
╔═════════════════════════════════════════════════════════════════════════════╗
║  ABSOLUTE PFLICHT: HEALTHCARE COMPLIANCE (NICHT VERHANDELBAR!)              ║
╚═════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ MDR (Medical Device Regulation)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Medizinprodukte nur mit zugelassener Zweckbestimmung bewerben             │
│ • Keine Erweiterung der Indikationen über CE-Kennzeichnung hinaus           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ HWG (Heilmittelwerbegesetz)                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ VERBOTEN:                                                                    │
│ ❌ "heilt", "beseitigt", "garantiert Schmerzfreiheit"                       │
│ ❌ Absolut formulierte Wirkaussagen                                         │
│ ❌ "Klinisch getestet" ohne Quellenangabe                                   │
│                                                                              │
│ ERLAUBT:                                                                     │
│ ✓ "kann unterstützen bei...", "trägt bei zu..."                            │
│ ✓ "wurde entwickelt für...", "eignet sich für..."                          │
│ ✓ "Anwender berichten...", "In Studien zeigte sich..." (mit Quelle)        │
└─────────────────────────────────────────────────────────────────────────────┘

COMPLIANCE-SICHERE FORMULIERUNGEN:
• STATT "heilt Rückenschmerzen" → "kann bei Rückenbeschwerden unterstützend wirken"
• STATT "beseitigt Verspannungen" → "wurde entwickelt, um Verspannungen zu adressieren"
• STATT "garantierte Wirkung" → "viele Anwender berichten von positiven Erfahrungen"`;

  // ═══ ANTI-FLUFF BLACKLIST (ERWEITERT: 25 Einträge) ═══
  const antiFluffBlock = `
╔═════════════════════════════════════════════════════════════════════════════╗
║  ABSOLUTE VERBOTEN: KONKURRENZ-ERWÄHNUNG                                     ║
╚═════════════════════════════════════════════════════════════════════════════╝

NIEMALS erwähnen (auch nicht negativ oder vergleichend!):
❌ Amazon, eBay, Alibaba, AliExpress
❌ Fitshop, Decathlon, Sport-Tiedje, MediaMarkt, Saturn
❌ DocMorris, Shop Apotheke, Andere Online-Apotheken
❌ Andere Tape-Marken (Kintex, RockTape, Leukotape, PhysioTape)
❌ Andere TENS/EMS-Marken (Sanitas, Beurer, Prorelax)
❌ Generische Verweise auf "andere Anbieter", "im Vergleich zu Konkurrenz"

GRUND: Wir schenken Konkurrenten KEINE kostenlose Sichtbarkeit!
Schreibe NUR über K-Active/Bluetens-Produkte und deren Vorteile.

═══ LEITPLANKEN: STIL & WORTWAHL (Orientierung, kein Zwang) ═══

VERMEIDE NACH MÖGLICHKEIT diese KI-typischen Phrasen:
• "In der heutigen Zeit..." / "In der modernen Welt..."
• "Es ist wichtig zu beachten, dass..." / "Dabei ist es entscheidend..."
• "Zusammenfassend lässt sich sagen..." / "Abschließend kann man festhalten..."
• "In diesem Artikel erfahren Sie..." / "Herzlich willkommen..."
• "Nicht umsonst..." / "Zweifellos..." / "Grundsätzlich..."

STATTDESSEN BEVORZUGEN:
• Konkrete Zahlen und Fakten
• Direkte Aussagen
• Aktive Verben statt Passiv
• Kurze, prägnante Sätze

RHETORISCHE FRAGEN: Max 1x im Text - sie funktionieren nur einmal!

HINWEIS: Diese Liste dient als Orientierung. Wenn eine Phrase den
Lesefluss verbessert → nutze sie! Lebendiger Text > perfekte Regeltreue.

═══ FORMATIERUNG: FLIEẞTEXT BEVORZUGT ═══

BEVORZUGE im Haupttext:
• Zusammenhängende Absätze (Fließtext)
• Mehrere Punkte → In Sätze umformulieren

LISTEN ERLAUBT FÜR:
• "Vorteile auf einen Blick" am Ende (max 1x)
• FAQ-Bereich
• Schritt-für-Schritt Anleitungen (bei Ratgebern)

Beispiel: NICHT "Vorteile: - hautfreundlich - elastisch - wasserfest"
SONDERN: "Das Material überzeugt durch seine Hautfreundlichkeit, bleibt elastisch und ist zudem wasserfest."`;


  // ═══ STRUKTUR-TEMPLATE ═══
  let structureTemplate = '';
  if (pageType === 'product') {
    structureTemplate = `
═══ K-ACTIVE PRODUKTSEITEN-STIL (STORYTELLING) ═══

Der Text soll DIREKT verwendbar sein – wie vom Marketing-Chef geschrieben!
Textlänge: ca. 1000-1200 Wörter, aufgeteilt in 5-7 logische Sektionen.

═══ STIL-PRINZIPIEN (gelernt aus K-Active Beispielen): ═══

1. EMOTIONALE H2-ÜBERSCHRIFTEN
   ✗ NICHT: "Produkteigenschaften" oder "Über das Tape"
   ✓ STATTDESSEN: "Endlich ein Tape, das hält und trotzdem zart zu deiner Haut ist"
   ✓ STATTDESSEN: "Das Original, das eine medizinische Revolution ausgelöst hat"
   → Überschriften erzählen eine Geschichte, wecken Neugier, sprechen den Leser direkt an

2. STORYTELLING STATT FEATURE-LISTEN
   ✗ NICHT: "Das Tape hat folgende Eigenschaften: ..."
   ✓ STATTDESSEN: Erzähle WARUM das Produkt existiert, WER es nutzt, WELCHE Probleme es löst
   → Jede Sektion beantwortet eine Frage, die der Leser im Kopf hat

3. TRUST DURCH KONKRETHEIT
   → Erwähne echte Details: Japan-Ursprung, Materialien, Einsatz im Spitzensport
   → "Wissenschaftlich fundiert" mit konkreten Beispielen untermauern
   → Keine leeren Behauptungen

4. ZIELGRUPPEN-RELEVANZ
   → Nenne konkrete Anwendungssituationen: Sport, Alltag, Therapie, Beauty
   → "Wann ist dieses Produkt besonders sinnvoll?" beantworten

5. VORTEILE GEBÜNDELT
   → Am Ende eine klare "Deine Vorteile auf einen Blick" Liste mit 4-6 Punkten
   → Format: <strong>Vorteil:</strong> Erklärung

6. FAQ INTEGRIERT
   → Mind. 5 echte Kundenfragen beantworten
   → Direkte, hilfreiche Antworten (40-60 Wörter)

═══ BEISPIEL-STRUKTUR (FLEXIBEL ANPASSEN!): ═══

<h1>[Produkt] – [Emotionaler Benefit]</h1>
<p>Intro mit Hook und Fokus-Keyword</p>

<h2>[Emotionale Überschrift zu Haupt-USP]</h2>
<p>Was macht dieses Produkt besonders? Geschichte/Ursprung/Innovation</p>

<h2>[Überschrift zu Zielgruppe/Anwendung]</h2>
<p>Für wen? Wann? Welche Situationen?</p>

<h2>[Überschrift zu Trust/Wissenschaft]</h2>
<p>Warum vertrauen? Experten, Studien, Qualität</p>

<h2>[Überschrift zu spezifischem Anwendungsfall]</h2>
<p>Konkretes Szenario: Sport/Beauty/Therapie/Alltag</p>

<h2>Deine Vorteile auf einen Blick</h2>
<ul><li><strong>Vorteil:</strong> Erklärung</li>...</ul>

HINWEIS: Diese Struktur ist ein RAHMEN – passe sie kreativ an das konkrete Produkt an!`;
  } else if (pageType === 'category') {
    structureTemplate = `
═══ STRUKTUR: KATEGORIESEITE ═══

<h1>[Kategorie] – [Benefit/Überblick]</h1>
<p>Einleitung mit Fokus-Keyword. Was erwartet den Leser?</p>

<h2>Was sind [Kategorie]?</h2>
<p>Definition und Grundlagen. AEO-optimiert für Featured Snippets.</p>

<h2>Die verschiedenen [Kategorie]-Arten im Überblick</h2>
<h3>[Produkttyp 1]</h3>
<p>Beschreibung, Vorteile, Anwendungsgebiete</p>
<h3>[Produkttyp 2]</h3>
<p>Beschreibung, Vorteile, Anwendungsgebiete</p>

<h2>So findest du das richtige [Produkt] für dich</h2>
<p>Kaufberatung mit konkreten Empfehlungen basierend auf Anwendungsfall.</p>

<h2>Häufige Fragen zu [Kategorie]</h2>
(FAQ mit direkten Antworten)`;
  } else {
    // Guide / Ratgeber
    structureTemplate = `
═══ STRUKTUR: RATGEBER ═══

<h1>[Thema] – Der komplette Ratgeber</h1>
<p>Einleitung: Worum geht es? Was lernt der Leser?</p>

<h2>Was ist [Thema]?</h2>
<p>Definition und Grundlagen verständlich erklärt.</p>

<h2>Wie funktioniert [Thema]?</h2>
<p>Wirkmechanismus, Hintergründe, Zusammenhänge.</p>

<h2>[Thema] richtig anwenden – Schritt für Schritt</h2>
<ol>
<li><strong>Schritt 1:</strong> Vorbereitung</li>
<li><strong>Schritt 2:</strong> Durchführung</li>
<li><strong>Schritt 3:</strong> Nachbereitung</li>
</ol>

<h2>Die wichtigsten Vorteile</h2>
<ul>
<li><strong>Vorteil 1:</strong> Erklärung</li>
<li><strong>Vorteil 2:</strong> Erklärung</li>
</ul>

<h2>Häufige Fehler vermeiden</h2>
<p>Was sollte man NICHT tun? Tipps für Anfänger.</p>

<h2>Häufige Fragen</h2>
(FAQ mit direkten Antworten)`;
  }

  const pageTypeLabels: Record<string, string> = {
    'product': 'Produktseite (K-Active Style)',
    'category': 'Kategorieseite',
    'guide': 'Ratgeber'
  };

  return `Du bist ein Healthcare Content Engineer für ${brandName} (Medtech).
Du erstellst SEO-Content mit STRIKTER MDR/HWG Compliance.
Der Text soll DIREKT verwendbar sein – wie vom Marketing-Chef persönlich geschrieben!

═══ AKTUELLE AUFGABE ═══

MARKE: ${brandName}
SEITENTYP: ${pageTypeLabels[pageType] || 'Produktseite'}
ANREDE: ${addressStyle}
TEXTLÄNGE: ca. ${wordCount} Wörter
${tonalityInstructions}
${audienceBlock}
${healthcareComplianceBlock}
${antiFluffBlock}

═══ KEYWORD-STRATEGIE ═══

FOKUS-KEYWORD PLATZIERUNG (PFLICHT):
✓ In der H1-Überschrift
✓ In den ersten 100 Wörtern
✓ In mindestens einer H2
✓ Im Meta-Title UND Meta-Description

ZIEL-HÄUFIGKEIT: ${minKeywords}-${maxKeywords}x (bei ${wordCount} Wörtern)

AGGREGATIONS-REGEL: Long-Tail Keywords zählen als Variationen, nicht separat!

═══ SERP-TERMS INTEGRATION (SURFER SEO LEVEL!) ═══

WICHTIG: Die folgenden SERP-Terms stammen aus der Google Top-10 Analyse.
Sie sind der SCHLÜSSEL zu guten Rankings!

VOR DEM SCHREIBEN: Lies die SERP-Terms im Context-Block sorgfältig!
BEIM SCHREIBEN: Integriere JEDEN "mustHave"-Term mindestens 1x natürlich in den Text!
NACH DEM SCHREIBEN: Prüfe ob ALLE Pflicht-Terms enthalten sind!

${contextBlock}

═══ KONTRAINDIKATIONEN (BEI MEDIZINPRODUKTEN PFLICHT!) ═══

Wenn das Produkt ein Medizinprodukt ist (TENS, EMS, Tapes etc.):
- Erwähne IMMER wichtige Kontraindikationen im FAQ oder Text
- Typische Kontraindikationen: Herzschrittmacher, Schwangerschaft (Bauchbereich),
  offene Wunden, akute Entzündungen, Tumore, Epilepsie
- Formulierung: "Nicht geeignet bei..." oder "Bei folgenden Bedingungen
  sollte vor der Anwendung ein Arzt konsultiert werden:..."
${structureTemplate}

═══ HEADING-HIERARCHIE (ABSOLUT KRITISCH!) ═══

1. EXAKT EINE H1 (mit Fokus-Keyword, max. 70 Zeichen)
2. H2 für Hauptabschnitte (mind. 3-4 pro Text)
3. H3 NUR als Unterpunkt von H2
4. Nach JEDER Überschrift kommt Text
5. Keine Level überspringen (H1 → H3 ist VERBOTEN)

═══ LESBARKEIT ═══

• Satzlänge VARIIEREN: Kurz. Dann mittel. Dann länger.
• Max. 4 Sätze pro Absatz (${maxPara} Wörter)
• FLIEẞTEXT bevorzugen - Bullet-Liste NUR am Ende für "Vorteile auf einen Blick"
• <strong> für wichtige Keywords im Fließtext

═══ OUTPUT-FORMAT ═══

{
  "title": "Meta-Title, max 60 Zeichen, Fokus-Keyword vorne",
  "metaDescription": "Meta-Description, max 155 Zeichen, mit CTA",
  "seoText": "HTML mit <h1>, <h2>, <h3>, <p>, <ul>, <strong>",
  "faq": [{"question": "W-Frage?", "answer": "Direkte Antwort (40-60 Wörter)..."}]
}

═══ BEISPIEL-OUTPUTS (GOLD STANDARD) ═══

BEISPIEL META-TITLE (60 Zeichen max):
✓ "Kinesiologie Tape kaufen | K-Active® Original | Für Sport & Therapie"
✓ "TENS Gerät für zuhause | Bluetens® | Schmerztherapie ohne Medikamente"
✗ "Willkommen bei K-Active - Ihr Partner für hochwertige Kinesiologie Tapes" (zu lang, kein Keyword vorne)

BEISPIEL META-DESCRIPTION (155 Zeichen max):
✓ "K-Active Kinesiologie Tape: elastisch, hautverträglich, wasserfest. Entwickelt in Japan, bewährt im Spitzensport. Jetzt entdecken!"
✗ "In diesem Artikel erfahren Sie alles über unsere Produkte..." (Fluff!)

BEISPIEL FAQ (40-60 Wörter pro Antwort):
{
  "question": "Wie lange kann ich das Kinesiologie Tape tragen?",
  "answer": "Das K-Active Tape kann in der Regel 5-7 Tage getragen werden. Es ist wasserfest und hält auch beim Duschen oder Schwimmen. Für optimalen Halt sollte die Haut vor dem Anlegen sauber und trocken sein. Bei Hautreizungen das Tape sofort entfernen."
}

BEISPIEL H2-ÜBERSCHRIFT:
✓ "Endlich ein Tape, das hält und trotzdem zart zu deiner Haut ist"
✓ "Wissenschaftlich fundiert, vertraut von Experten weltweit"
✗ "Produkteigenschaften" (langweilig, kein Benefit)
✗ "Über unser Tape" (generisch, austauschbar)

╔═════════════════════════════════════════════════════════════════════════════╗
║  TEXTLÄNGE: ABSOLUTE PFLICHT - KEINE AUSNAHMEN!                             ║
╚═════════════════════════════════════════════════════════════════════════════╝

DER USER HAT ${wordCount} WÖRTER BESTELLT - LIEFERE SIE!

┌─────────────────────────────────────────────────────────────────────────────┐
│  MINDESTLÄNGE: ${Math.max(1000, wordCount - 200)} Wörter (ABSOLUTES MINIMUM)│
│  ZIELLÄNGE:    ${wordCount} Wörter (DAS SOLLST DU ERREICHEN!)              │
│  MAXIMALLÄNGE: ${wordCount + 300} Wörter (OK wenn nötig)                   │
└─────────────────────────────────────────────────────────────────────────────┘

⚠️ WARNUNG: Texte unter ${Math.max(1000, wordCount - 300)} Wörter werden ABGELEHNT!

WENN DU MERKST DASS DER TEXT ZU KURZ WIRD:
→ Füge MEHR Anwendungsszenarien hinzu (Sport, Alltag, Therapie, Beauty)
→ Erweitere Erklärungen mit PRAKTISCHEN BEISPIELEN
→ Baue ZUSÄTZLICHE H2-Abschnitte ein (Tipps, Vergleiche, Hintergründe, Studien)
→ Füge MEHR FAQ-Fragen hinzu (mindestens 5-6 Fragen!)
→ Erkläre Fachbegriffe AUSFÜHRLICHER
→ Beschreibe die ENTSTEHUNGSGESCHICHTE oder QUALITÄTSMERKMALE

MENTAL CHECK: Bei ${wordCount} Wörtern brauchst du ca. ${Math.round(wordCount / 120)}-${Math.round(wordCount / 100)} Absätze!
Ein Text mit nur 3-4 kurzen Abschnitten ist DEFINITIV zu kurz!

═══ QUALITÄTS-CHECK VOR OUTPUT ═══

□ Fokus-Keyword in H1? ✓
□ Keyword-Häufigkeit ${minKeywords}-${maxKeywords}x? ✓
□ KEINE Heilversprechen (HWG)? ✓
□ Keine absoluten Wirkaussagen (MDR)? ✓
□ Fließtext (Bullet-Liste nur am Ende)? ✓
□ FAQ mit direkten Antworten? ✓

═══════════════════════════════════════════════════════════════════════════════
                           KREATIVITÄTS-FREIRAUM
═══════════════════════════════════════════════════════════════════════════════

Du bist ein ERFAHRENER TEXTER, nicht nur eine Regel-Maschine!

Oben stehen viele Regeln - hier ist die wichtigste:

┌─────────────────────────────────────────────────────────────────────────────┐
│  SCHREIBE EINEN TEXT, DEN DU SELBST GERNE LESEN WÜRDEST!                    │
└─────────────────────────────────────────────────────────────────────────────┘

NUTZE DEINEN SPIELRAUM:

• Die Compliance-Regeln (HWG/MDR) sind NICHT verhandelbar → halte sie ein!
• ALLE anderen Regeln sind LEITPLANKEN, keine Zwangsjacke
• Wenn eine Stilregel den Lesefluss stört → Lesefluss gewinnt
• Variiere! Nicht jeder Absatz muss perfekt strukturiert sein
• Überrasche subtil - die besten Texte brechen sanft Erwartungen

GRUNDSATZ:
Lieber ein LEBENDIGER Text mit kleinen Stilabweichungen
als ein perfekt regelkonformer, aber LANGWEILIGER Text.

Die Regeln oben sind dein Werkzeugkasten, nicht dein Gefängnis.
Nutze sie KREATIV, um einen Text zu schreiben, der wirklich ÜBERZEUGT.`;
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
✓ Fließtext bevorzugt (Bullet-Liste nur am Ende für Vorteile)
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
