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
  pageType: z.enum(['produktseite', 'kategorieseite', 'markenseite', 'ratgeber']),
  brandType: z.enum(['eigenmarke', 'handelsmarke']).default('eigenmarke'),
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
      intro: { label: "Einstieg: Was ist [Kategorie]? (Hook + Fokus-Keyword, Relevanz sofort klar machen)", share: 0.08 },
      sections: [
        { label: "Wie funktioniert [Kategorie]? Wirkprinzip verstaendlich erklaeren, therapeutischen Hintergrund einbauen", share: 0.16 },
        { label: "Anwendungsgebiete: Fuer welche Beschwerden/Ziele eignet sich [Kategorie]? Konkrete Szenarien aus Therapie und Alltag", share: 0.16 },
        { label: "Produkttypen im Ueberblick: Welche Varianten gibt es? Unterschiede, Einsatzzwecke, K-Active Sortiment einordnen", share: 0.18 },
        { label: "Auswahlhilfe: Worauf beim Kauf achten? Entscheidungskriterien, typische Fehler vermeiden", share: 0.14 },
        { label: "Qualitaet & Sicherheit: Zertifizierungen, MDR-Konformitaet, was K-Active anders macht", share: 0.08 },
      ],
      faq: { wordsPerQuestion: 50, share: 0.14 },
      outro: { label: "Abschluss: Zusammenfassung + CTA zum Sortiment", share: 0.06 },
    },
    markenseite: {
      intro: { label: "Einstieg: Die Marke in einem Satz positionieren (Hook + Fokus-Keyword, Kernversprechen)", share: 0.08 },
      sections: [
        { label: "Markengeschichte & Herkunft: Woher kommt die Marke? Gruendungsstory, therapeutischer Ursprung, Mission", share: 0.14 },
        { label: "Was macht die Marke besonders? Kernphilosophie, Differenzierung zum Wettbewerb, Werte", share: 0.14 },
        { label: "Produktwelt im Ueberblick: Welche Produktlinien/Kategorien bietet die Marke? Jeweils kurz mit Highlight-Produkt", share: 0.18 },
        { label: "Technologie & Innovation: Besondere Materialien, Verfahren, Patente, Forschung", share: 0.12 },
        { label: "Fuer wen? Zielgruppen und Einsatzbereiche: Profis, Sportler, Patienten — wer nutzt die Marke und warum", share: 0.12 },
        { label: "Vertrauen & Qualitaet: Zertifizierungen, klinische Studien, Partnerschaften, Therapeuten-Empfehlungen", share: 0.08 },
      ],
      faq: { wordsPerQuestion: 50, share: 0.08 },
      outro: { label: "Abschluss: Markenwert zusammenfassen + CTA", share: 0.06 },
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
  brandType: string;
}): string {
  const isEigenmarke = vars.brandType === 'eigenmarke';

  const brandVoice = isEigenmarke
    ? `## BRAND VOICE (EIGENMARKE)

Schreibe aus der Unternehmensperspektive ("wir bei K-Active", "unsere Produkte"), nie als Einzelperson ("ich", "als Therapeut weiss ich").
Das therapeutische Fachwissen fliesst ueber die INHALTE ein — durch praezise Anwendungsbeschreibungen, klinisch korrekte Erklaerungen und praxisnahe Szenarien. Nicht durch die Erzaehlperspektive.
K-Active ist Hersteller dieses Produkts. Formulierungen wie "von uns entwickelt", "unsere Technologie", "wir haben entwickelt" sind korrekt und erwuenscht.`
    : `## BRAND VOICE (HANDELSMARKE)

K-Active ist NICHT der Hersteller dieses Produkts, sondern vertreibt es als Handelspartner. Das muss sich im Text widerspiegeln:
- NIEMALS so schreiben als haette K-Active das Produkt entwickelt oder hergestellt.
- NICHT: "wir haben entwickelt", "unsere patentierte Technologie", "von uns hergestellt"
- STATTDESSEN: "wir fuehren im Sortiment", "in unserem Shop erhaeltlich", "wir empfehlen", "ueberzeugt uns durch", "deshalb haben wir es in unser Sortiment aufgenommen"
- Die Marke/den Hersteller als eigenstaendige Instanz behandeln: "Die Marke [X] setzt auf...", "[Hersteller] hat entwickelt..."
- K-Active positioniert sich als kompetenter Fachhaendler mit therapeutischem Know-how, der die besten Produkte kuratiert und seinen Kunden empfiehlt.
- Wir-Perspektive fuer K-Active als Haendler ist erlaubt: "Wir empfehlen", "In unserem Sortiment", "Unsere Experten haben getestet"`;

  return `Du bist ein erfahrener SEO-Content-Stratege mit Spezialisierung auf Healthcare und Medizinprodukte. Du erstellst suchmaschinenoptimierte Inhalte die gleichzeitig fachlich fundiert und verkaufsstark sind.

Du schreibst fuer K-Active, einen fuehrenden Anbieter von Kinesiologie-Tapes und Recovery-Produkten. K-Active kommt aus der professionellen Therapie — die Produkte wurden urspruenglich fuer Physiotherapeuten entwickelt und sind heute auch fuer Endkunden verfuegbar. Dieses therapeutische Know-how ist K-Actives groesster Differenziator und muss in jedem Text spuerbar sein.

${brandVoice}

Tonfall: Kompetent und nahbar. Wie ein Fachartikel, der auch Nicht-Mediziner verstehen.
- Erfahren, nicht belehrend
- Ehrlich, nicht vorsichtig
- Praktisch, nicht theoretisch
- Sachlich-warm, nie kitschig

Produktaussagen von der Anwendung her denken — nicht vom Datenblatt:
Nicht: "Das Tape ist elastisch." Sondern: "Die Elastizitaet geht mit deiner Bewegung mit."
Nicht: "Hochwertiger Acrylkleber." Sondern: "Der Kleber aktiviert sich durch deine Koerperwaerme."

${vars.audienceToggle}

Ansprache: Du-Form. Erste Person Plural fuer K-Active ("Wir empfehlen", "Unsere Erfahrung zeigt").

## COMPLIANCE

Der Text wird von einem Compliance-Team geprueft. Vermeide absolute Heilversprechen ("heilt", "garantiert", "beseitigt Schmerzen"). Formuliere stattdessen unterstuetzend ("kann unterstuetzen bei", "wurde entwickelt fuer", "Anwender berichten"). Kontraindikationen bei Medizinprodukten erwaehnen.

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
  brandType: string;
}): string {
  const brandLine = vars.brandType === 'eigenmarke'
    ? `**Marke:** K-Active (Eigenmarke / Hersteller)`
    : `**Vertrieb:** K-Active (Handelspartner / Distributor) — NICHT der Hersteller!`;

  return `## CONTENT-BRIEF

${brandLine}
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
  // German HTML + JSON wrapper needs ~2.5 tokens per word, plus overhead for FAQ/meta
  const textTokens = Math.round(wordCount * 2.5);
  const overhead = 2500; // JSON structure, FAQ, meta fields, qualityReport
  return Math.max(textTokens + overhead, 8000);
}

// ═══════════════════════════════════════════════════════════════════
// FALLBACK PARSER for truncated AI responses
// ═══════════════════════════════════════════════════════════════════

function extractJsonStringField(raw: string, fieldName: string): string {
  // Find "fieldName": "..." handling escaped quotes
  const pattern = new RegExp(`"${fieldName}"\\s*:\\s*"`);
  const match = pattern.exec(raw);
  if (!match) return '';

  const startIdx = match.index + match[0].length;
  let i = startIdx;
  let result = '';
  while (i < raw.length) {
    if (raw[i] === '\\' && i + 1 < raw.length) {
      result += raw[i] + raw[i + 1];
      i += 2;
    } else if (raw[i] === '"') {
      break;
    } else {
      result += raw[i];
      i++;
    }
  }
  // Unescape
  return result
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function extractFieldsManually(raw: string): Record<string, any> {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  const title = extractJsonStringField(cleaned, 'title');
  const metaDescription = extractJsonStringField(cleaned, 'metaDescription');
  const seoText = extractJsonStringField(cleaned, 'seoText');

  if (!seoText && !title) {
    throw new Error('Could not extract any fields');
  }

  // Try to extract FAQ array
  let faq: any[] = [];
  const faqMatch = cleaned.match(/"faq"\s*:\s*\[/);
  if (faqMatch) {
    const faqStart = faqMatch.index! + faqMatch[0].length - 1;
    // Find matching bracket, counting depth
    let depth = 0;
    let faqEnd = faqStart;
    for (let i = faqStart; i < cleaned.length; i++) {
      if (cleaned[i] === '[') depth++;
      else if (cleaned[i] === ']') {
        depth--;
        if (depth === 0) { faqEnd = i; break; }
      }
    }
    const faqStr = cleaned.substring(faqStart, faqEnd + 1);
    try {
      faq = JSON.parse(faqStr);
    } catch { /* ignore */ }
  }

  console.log('Manual extraction: title=' + title.length + ', seoText=' + seoText.length + ', faq=' + faq.length);

  return { title, metaDescription, seoText, faq };
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
      brandType: formData.brandType,
    });

    const userPrompt = buildUserPrompt({
      productName: formData.productName,
      focusKeyword: formData.focusKeyword,
      additionalInfo: formData.additionalInfo || '',
      wordCount: formData.wordCount,
      minKeywords,
      maxKeywords,
      brandType: formData.brandType,
    });

    console.log('System prompt length:', systemPrompt.length);
    console.log('User prompt length:', userPrompt.length);

    // ===== CALL AI via Anthropic API =====
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY nicht konfiguriert' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const maxTokens = calculateMaxTokens(formData.wordCount);
    const TIMEOUT_MS = 120000;

    console.log('Calling Anthropic API (Claude Sonnet)... max_tokens:', maxTokens);
    const startTime = Date.now();

    const MAX_RETRIES = 2;
    let aiResponse!: Response;
    let lastError = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = attempt * 5000; // 5s, 10s
        console.log(`Retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: maxTokens,
            temperature: 0.75,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        // Retry on 529 (overloaded) or 503
        if (aiResponse.status === 529 || aiResponse.status === 503) {
          lastError = `Status ${aiResponse.status}`;
          await aiResponse.text(); // consume body
          console.log(`Anthropic overloaded (${aiResponse.status}), will retry...`);
          if (attempt < MAX_RETRIES) continue;
        }
        break; // success or non-retryable error
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
    }

    const duration = Date.now() - startTime;
    console.log('Anthropic response:', aiResponse.status, 'in', duration, 'ms');

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Anthropic error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({
        error: 'AI-Fehler: ' + aiResponse.status,
        details: errorText.substring(0, 300),
      }), {
        status: aiResponse.status === 401 ? 401 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.content?.[0]?.text || '';

    console.log('Raw content length:', rawContent.length);

    // ===== PARSE JSON RESPONSE =====
    let parsed;
    try {
      // Strip markdown code blocks
      let cleaned = rawContent
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Find JSON boundaries
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }

      // Fix common issues
      cleaned = cleaned
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');

      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.log('Standard JSON parse failed, trying field extraction...');
      // Fallback: extract fields manually from truncated JSON
      try {
        parsed = extractFieldsManually(rawContent);
      } catch (e2) {
        console.error('All parsing attempts failed');
        return new Response(JSON.stringify({
          error: 'AI-Antwort konnte nicht als JSON geparsed werden',
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
      model: 'claude-sonnet-4-20250514',
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
