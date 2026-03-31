import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

import { getCorsHeaders } from '../_shared/cors.ts';

// ═══════════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════

const requestSchema = z.object({
  productName: z.string().min(1).max(500),
  focusKeyword: z.string().min(1).max(200),
  audience: z.enum(['b2c', 'b2b']),
  wordCount: z.number().int().min(500).max(3000),
  pageType: z.enum(['produktseite', 'kategorieseite', 'ratgeber']),
  additionalInfo: z.string().max(10000).optional().default(''),
  organizationId: z.string().uuid().optional(),
});

// ═══════════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════════

function buildAudienceToggle(audience: string): string {
  if (audience === 'b2b') {
    return `Zielgruppe: Therapeuten / Fachpersonal.
Schreibe wie ein Kollege zum Kollegen. Fachbegriffe nutzen, weil sie praeziser sind.
Impliziter Ton: "Du weisst was du tust. Hier ist ein Werkzeug fuer deine Arbeit."`;
  }
  return `Zielgruppe: Endkunden / Patienten (B2C).
Schreibe wie ein Therapeut zum Patienten. Fachbegriffe beilaeufig uebersetzen, nie vermeiden.
Impliziter Ton: "Das klingt komplizierter als es ist. Lass mich dir zeigen wie das funktioniert."`;
}

function calculateKeywordRange(wordCount: number): { min: number; max: number } {
  return {
    min: Math.round(wordCount * 0.006),
    max: Math.round(wordCount * 0.012),
  };
}

function buildDynamicStructure(wordCount: number, pageType: string): string {
  const structures: Record<string, any> = {
    produktseite: {
      intro: { label: "Einstieg (Hook + Fokus-Keyword)", share: 0.08 },
      sections: [
        { label: "Haupt-USP / Was macht es besonders?", share: 0.15 },
        { label: "Fuer wen? Anwendungsszenarien", share: 0.18 },
        { label: "Anwendung & Praxis", share: 0.15 },
        { label: "Qualitaet, Wissenschaft & Vertrauen", share: 0.12 },
        { label: "Vorteile auf einen Blick (Liste erlaubt)", share: 0.08 },
      ],
      faq: { wordsPerQuestion: 50, share: 0.18 },
      outro: { label: "Abschluss mit CTA", share: 0.06 },
    },
    kategorieseite: {
      intro: { label: "Einstieg (Hook + Fokus-Keyword)", share: 0.10 },
      sections: [
        { label: "Kategorie-Erklaerung", share: 0.18 },
        { label: "Typen / Varianten im Ueberblick", share: 0.20 },
        { label: "Auswahlhilfe / Worauf achten?", share: 0.18 },
        { label: "Qualitaet & Vertrauen", share: 0.10 },
      ],
      faq: { wordsPerQuestion: 50, share: 0.18 },
      outro: { label: "Abschluss mit CTA", share: 0.06 },
    },
    ratgeber: {
      intro: { label: "Einstieg (Hook + Fokus-Keyword)", share: 0.08 },
      sections: [
        { label: "Was ist [Thema]? Definition & Einordnung", share: 0.15 },
        { label: "Ursachen / Hintergruende", share: 0.15 },
        { label: "Behandlung / Loesung", share: 0.18 },
        { label: "Praktische Tipps fuer den Alltag", share: 0.15 },
        { label: "Wann zum Arzt / Therapeuten?", share: 0.07 },
      ],
      faq: { wordsPerQuestion: 50, share: 0.16 },
      outro: { label: "Abschluss", share: 0.06 },
    },
  };

  const structure = structures[pageType] || structures.produktseite;
  const introWords = Math.round(wordCount * structure.intro.share);
  const outroWords = Math.round(wordCount * structure.outro.share);
  const faqWords = Math.round(wordCount * structure.faq.share);
  const faqCount = Math.max(5, Math.round(faqWords / structure.faq.wordsPerQuestion));

  const sectionRows = structure.sections.map((s: any, i: number) => {
    const words = Math.round(wordCount * s.share);
    return `| H2 ${i + 1}: ${s.label} | ~${words} |`;
  });

  return `## TEXTAUFBAU

Halte dich exakt an diese Struktur. Jeder Block muss die angegebene Wortanzahl erreichen.

| Block | Woerter |
|---|---|
| Intro: ${structure.intro.label} | ~${introWords} |
${sectionRows.join('\n')}
| FAQ: ${faqCount} W-Fragen (je ~50 Woerter Antwort) | ~${faqWords} |
| ${structure.outro.label} | ~${outroWords} |
| **GESAMT** | **~${wordCount}** |`;
}

function buildContextBlock(serpData: any): string {
  if (!serpData) return '';

  let block = `## SERP-KONTEXT\n\n`;

  if (serpData.must_have_terms?.length) {
    block += `PFLICHT-BEGRIFFE (muessen im Text vorkommen):\n`;
    block += serpData.must_have_terms.map((t: string) => `- "${t}"`).join('\n') + '\n\n';
  }
  if (serpData.recommended_terms?.length) {
    block += `EMPFOHLENE BEGRIFFE (mind. 70% sollten vorkommen):\n`;
    block += serpData.recommended_terms.map((t: string) => `- "${t}"`).join('\n') + '\n\n';
  }
  if (serpData.optional_terms?.length) {
    block += `OPTIONALE BEGRIFFE (zur Differenzierung):\n`;
    block += serpData.optional_terms.map((t: string) => `- "${t}"`).join('\n') + '\n\n';
  }
  if (serpData.competitor_titles?.length) {
    block += `TOP-10 TITEL (Orientierung, NICHT kopieren):\n`;
    block += serpData.competitor_titles.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n') + '\n\n';
  }

  block += `REGEL: Jeden Pflicht-Begriff in sinnvollem Kontext einbauen.\n`;
  return block;
}

function buildSystemPrompt(vars: {
  audienceToggle: string;
  dynamicStructure: string;
  minKeywords: number;
  maxKeywords: number;
  contextBlock: string;
}): string {
  return `Du schreibst fuer K-Active, ein Medtech-Unternehmen fuer Kinesiologie-Tapes und Recovery-Produkte.
Der Tonfall ist wie ein erfahrener Therapeut, der sein Wissen teilt - aber du schreibst ALS UNTERNEHMEN, nicht als einzelne Person.
Nie "ich", nie "als Therapeut weiss ich". Stattdessen: "wir bei K-Active", "unsere Erfahrung zeigt", oder direkte Ansprache an den Leser.

Charakter: Erfahren, nicht belehrend. Ehrlich, nicht vorsichtig. Praktisch, nicht theoretisch. Sachlich-warm, nie kitschig.

Denke jede Produktaussage von der Anwendung her - nicht vom Datenblatt.
Nicht: "Das Tape ist elastisch." Sondern: "Die Elastizitaet geht mit deiner Bewegung mit."
Nicht: "Hochwertiger Acrylkleber." Sondern: "Der Kleber aktiviert sich durch deine Koerperwaerme."

${vars.audienceToggle}

Ansprache: Du-Form. Erste Person Plural fuer das Unternehmen ("Wir empfehlen").
Dein Text wird von einem Compliance-Team geprueft. Vermeide absolute Heilversprechen ("heilt", "garantiert"), formuliere stattdessen unterstuetzend ("kann unterstuetzen bei", "wurde entwickelt fuer"). Den Rest uebernimmt das Team.

${vars.dynamicStructure}

## KEYWORDS

Fokus-Keyword in: H1, erste 100 Woerter, mind. 1x H2, Meta-Title, Meta-Description.
Haeufigkeit: ${vars.minKeywords}-${vars.maxKeywords}x. Long-Tail-Variationen zaehlen mit.
Heading-Hierarchie: Exakt 1x H1. Danach H2 -> H3 (keine Ebene ueberspringen).

## STIL

Satzlaengen variieren: Kurz. Dann mittel. Dann ein laengerer Satz.
Aktiv statt Passiv. Konkret statt vage. Max. 4 Saetze pro Absatz.
Fliesstext bevorzugen. Bullet-Listen nur 1x fuer "Vorteile auf einen Blick".
Rhetorische Fragen: Max. 1x im gesamten Text.
<strong> fuer wichtige Keywords im Fliesstext.

Nie: "In der heutigen Zeit", "Es ist wichtig zu beachten", "Zusammenfassend laesst sich sagen", "In diesem Artikel erfahren Sie", "Nicht umsonst", "Zweifellos".

${vars.contextBlock}

## OUTPUT

Nur valides JSON:
{
  "title": "Max 60 Zeichen, Keyword vorne",
  "metaDescription": "Max 155 Zeichen, mit CTA",
  "seoText": "HTML mit <h1>, <h2>, <h3>, <p>, <ul>, <strong>",
  "faq": [{"question": "...", "answer": "..."}],
  "internalLinks": ["Vorschlaege fuer interne Verlinkung"],
  "qualityReport": {"wordCount": 0, "keywordCount": 0, "keywordDensity": "0%", "h2Count": 0}
}`;
}

function buildUserPrompt(vars: {
  productName: string;
  focusKeyword: string;
  additionalInfo: string;
  wordCount: number;
  minKeywords: number;
  maxKeywords: number;
}): string {
  return `## CONTENT-BRIEF

**Marke:** K-Active
**Produkt:** ${vars.productName}
**Fokus-Keyword:** ${vars.focusKeyword}
**Suchintention:** Know + Buy

${vars.additionalInfo ? `### ZUSATZINFOS / PRODUKTDETAILS\n${vars.additionalInfo}\n` : ''}
---

Schreibe den SEO-Text jetzt. Fuelle jeden Strukturblock vollstaendig aus.
Keyword-Dichte: ${vars.minKeywords}-${vars.maxKeywords}x.
Nur valides JSON.`;
}

function calculateMaxTokens(wordCount: number): number {
  const textTokens = Math.round(wordCount * 1.3);
  const overhead = 800;
  const buffer = Math.round((textTokens + overhead) * 0.2);
  return textTokens + overhead + buffer;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════

serve(async (req) => {
  const corsHeaders = getCorsHeaders();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ===== AUTH =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== VALIDATE INPUT =====
    const rawData = await req.json();
    const parseResult = requestSchema.safeParse(rawData);

    if (!parseResult.success) {
      return new Response(JSON.stringify({
        error: 'Invalid input',
        details: parseResult.error.format(),
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = parseResult.data;
    console.log('=== CONTENT V2 GENERATION ===');
    console.log('Product:', formData.productName);
    console.log('Keyword:', formData.focusKeyword);
    console.log('Audience:', formData.audience);
    console.log('Words:', formData.wordCount);
    console.log('Page type:', formData.pageType);

    // ===== SERP DATA LOOKUP =====
    let serpData = null;
    try {
      const { data } = await supabase
        .from('serp_keywords')
        .select('*')
        .eq('keyword', formData.focusKeyword)
        .maybeSingle();
      serpData = data;
      console.log('SERP data found:', !!serpData);
    } catch (e) {
      console.log('SERP lookup skipped (table may not exist):', e);
    }

    // ===== BUILD PROMPTS =====
    const audienceToggle = buildAudienceToggle(formData.audience);
    const dynamicStructure = buildDynamicStructure(formData.wordCount, formData.pageType);
    const contextBlock = buildContextBlock(serpData);
    const { min: minKeywords, max: maxKeywords } = calculateKeywordRange(formData.wordCount);

    const systemPrompt = buildSystemPrompt({
      audienceToggle,
      dynamicStructure,
      minKeywords,
      maxKeywords,
      contextBlock,
    });

    const userPrompt = buildUserPrompt({
      productName: formData.productName,
      focusKeyword: formData.focusKeyword,
      additionalInfo: formData.additionalInfo || '',
      wordCount: formData.wordCount,
      minKeywords,
      maxKeywords,
    });

    console.log('System prompt length:', systemPrompt.length);
    console.log('User prompt length:', userPrompt.length);

    // ===== CALL ANTHROPIC API =====
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY nicht konfiguriert' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const maxTokens = calculateMaxTokens(formData.wordCount);
    const TIMEOUT_MS = 90000;

    console.log('Calling Anthropic API... max_tokens:', maxTokens);
    const startTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let aiResponse;
    try {
      aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          temperature: 0.75,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        return new Response(JSON.stringify({
          error: 'Zeitueberschreitung bei AI-Generierung. Versuche es mit kuerzerer Textlaenge.',
        }), {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw err;
    }
    clearTimeout(timeout);

    const duration = Date.now() - startTime;
    console.log('Anthropic response:', aiResponse.status, 'in', duration, 'ms');

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Anthropic API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({
        error: 'AI-Fehler: ' + aiResponse.status,
        details: errorText.substring(0, 300),
      }), {
        status: aiResponse.status === 401 ? 401 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.content
      ?.filter((b: any) => b.type === 'text')
      ?.map((b: any) => b.text)
      ?.join('') || '';

    console.log('Raw content length:', rawContent.length);

    // ===== PARSE JSON RESPONSE =====
    let parsed;
    try {
      const cleaned = rawContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Try to find JSON object in response
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e2) {
          console.error('Failed to parse AI response as JSON');
          return new Response(JSON.stringify({
            error: 'AI-Antwort konnte nicht als JSON geparsed werden',
            rawContent: rawContent.substring(0, 500),
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        return new Response(JSON.stringify({
          error: 'Kein JSON in AI-Antwort gefunden',
          rawContent: rawContent.substring(0, 500),
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ===== RETURN RESPONSE =====
    const response = {
      title: parsed.title || '',
      metaDescription: parsed.metaDescription || '',
      seoText: parsed.seoText || '',
      faq: parsed.faq || [],
      internalLinks: parsed.internalLinks || [],
      qualityReport: parsed.qualityReport || {},
      serpDataUsed: !!serpData,
      generationTimeMs: duration,
      model: 'claude-sonnet-4',
      _prompts: {
        systemPrompt,
        userPrompt,
      },
    };

    console.log('=== GENERATION COMPLETE ===');
    console.log('Title:', response.title?.substring(0, 60));
    console.log('seoText length:', response.seoText?.length);
    console.log('FAQ count:', response.faq?.length);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
