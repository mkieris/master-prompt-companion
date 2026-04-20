// Content V3 — K-Active Content Studio Pipeline
// 4-Stage: Context → Outline → Writer → Compliance
// Strict Claude Sonnet via Anthropic Direct (no fallback per brief)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "claude-sonnet-4-5-20250929";

// ════════════════════════════════════════════════════════════════════════
// HARDCODED BRAND VOICE — K-Active (14 Slots)
// ════════════════════════════════════════════════════════════════════════
const BRAND_VOICE_KACTIVE = {
  brand_id: "kactive",
  identity_core:
    "K-Active Europe GmbH ist ein Multi-Brand-Distributor aus Hösbach für Physiotherapie-, Reha- und Recovery-Equipment. Geführt von Physiotherapeut Meik Vogler. Pionier des kinesiologischen Tapings in Europa seit 1996, exklusive Partnerschaft mit Nitto Denko (Erfinder Dr. Kenzo Kase, Japan).",
  mission:
    "Therapeuten und aktive Menschen mit fachlich fundierter, evidenzbasierter Ausrüstung versorgen.",
  values: [
    "Fachliche Tiefe vor Marketing-Glanz",
    "Therapeuten-Perspektive vor Produkt-Hype",
    "Belege vor Behauptungen",
    "Klarheit vor Verkaufsdruck",
  ],
  personality: [
    "fachlich-kompetent",
    "ruhig-souverän",
    "ehrlich",
    "lösungsorientiert",
    "ohne Hype",
  ],
  voice_attributes: {
    formality: "Sie-Form bei B2B, Du-Form bei B2C",
    expertise_level: "hoch — Fachterminologie zulässig, aber erklärt",
    emotion: "kontrolliert, sachlich-warm, niemals reißerisch",
    pace: "ruhig, gegliedert, keine Stakkato-CTAs",
  },
  do_use: [
    "Originaltape aus Japan",
    "klinisch erprobt",
    "von Therapeuten entwickelt",
    "evidenzbasiert",
    "Anwendungsbeobachtung zeigt",
    "in der Praxis bewährt",
    "Materialqualität nach Nitto-Denko-Spezifikation",
  ],
  dont_use: [
    "revolutionär",
    "Wundermittel",
    "garantiert",
    "100%",
    "der einzige",
    "erstklassig",
    "Premium-Erlebnis",
    "Lifestyle",
    "Game-Changer",
  ],
  tonality_examples: {
    good:
      "Das K-Active Tape Classic basiert auf der Originalformel, die Dr. Kenzo Kase 1979 in Japan entwickelt hat. Anwendungsbeobachtungen in Physiotherapiepraxen zeigen Unterstützung bei Bewegungseinschränkungen muskulärer Genese.",
    bad:
      "Unser revolutionäres Premium-Tape garantiert sofortige Schmerzlinderung und ist das beste Produkt am Markt!",
  },
  signature_phrases: [
    "Aus der Praxis für die Praxis",
    "Nitto Denko Originalqualität",
    "Pionier seit 1996",
  ],
  forbidden_topics: [
    "Heilversprechen",
    "Vergleichswerbung mit Markennennung",
    "Vorher/Nachher-Bilder",
  ],
  audience_register: {
    b2b_practice:
      "Sie-Form, Fachterminologie (Faszien, Propriozeption, Myofasziale Triggerpunkte), Studien-Referenzen, sachlich-kollegial",
    b2c_active:
      "Du-Form, Alltagssprache, Bezug zu Sport/Bewegung, motivierend ohne Druck",
    b2c_patient:
      "Du-Form, beruhigend, einfache Sprache, immer mit Hinweis 'bei anhaltenden Beschwerden ärztlich abklären'",
  },
  heritage_slots: {
    founded_year: 1996,
    founder_partner: "Nitto Denko Corporation, Japan",
    inventor_reference: "Dr. Kenzo Kase",
    pioneer_claim: "Pionier des kinesiologischen Tapings in Europa",
    location: "Hösbach bei Aschaffenburg",
    leadership: "Geschäftsführer Meik Vogler, Physiotherapeut",
  },
  version: 1,
};

// ════════════════════════════════════════════════════════════════════════
// HARDCODED EVIDENCE LIBRARY (Auszug, EV-001 ausgearbeitet)
// ════════════════════════════════════════════════════════════════════════
const EVIDENCE_LIBRARY = [
  {
    code: "EV-001",
    topic: "Kinesiologisches Taping bei Muskelverspannungen",
    claim_template:
      "Anwendungsbeobachtungen weisen auf eine Unterstützung bei muskulär bedingten Bewegungseinschränkungen hin",
    evidence_strength: "moderate",
    source_type: "Anwendungsbeobachtung",
    hwg_compliant: true,
    forbidden_phrasings: [
      "heilt Muskelverspannungen",
      "garantierte Schmerzlinderung",
      "wirkt sofort",
    ],
    permitted_phrasings: [
      "kann unterstützen",
      "wird in der Physiotherapie eingesetzt zur",
      "Anwendungsbeobachtung zeigt",
    ],
    applicable_products: ["k-active-tape-classic", "k-active-tape-gentle", "k-active-tape-elite"],
    audience_notes: {
      b2b_practice: "Studien-Hinweise OK, Fachterminologie",
      b2c_patient: "immer mit Hinweis auf ärztliche Abklärung",
    },
  },
  {
    code: "EV-002",
    topic: "Propriozeptive Stimulation durch Tape-Applikation",
    claim_template:
      "Die Tape-Applikation kann propriozeptive Reize an die Haut liefern",
    evidence_strength: "moderate",
    source_type: "Studie",
    hwg_compliant: true,
    forbidden_phrasings: ["aktiviert Nerven", "verbessert garantiert"],
    permitted_phrasings: ["liefert Reize", "kann unterstützen"],
    applicable_products: ["k-active-tape-classic", "k-active-tape-elite", "k-active-tape-sport"],
  },
  {
    code: "EV-003",
    topic: "Recovery durch Kompressionsmassage",
    claim_template:
      "Pneumatische Kompression wird in der Sportphysiotherapie zur Unterstützung der Regeneration eingesetzt",
    evidence_strength: "strong",
    source_type: "Klinische Studie",
    hwg_compliant: true,
    forbidden_phrasings: ["beschleunigt Regeneration garantiert"],
    permitted_phrasings: ["unterstützt die Regeneration", "wird eingesetzt zur"],
    applicable_products: ["recovery-boots-3-0", "normatec"],
  },
];

// ════════════════════════════════════════════════════════════════════════
// HWG / MDR DENYLIST (6 Kategorien)
// ════════════════════════════════════════════════════════════════════════
const HWG_DENYLIST = {
  verbs_paragraph_3: [
    "heilt", "heilen", "heilung", "heilend",
    "beseitigt", "beseitigung",
    "garantiert", "garantie",
    "wundermittel", "wunder",
    "100%ig", "100 prozent",
    "sofortwirkung", "sofort wirksam",
  ],
  fear_paragraph_11_7: [
    "ohne behandlung droht", "wenn sie nicht", "gefahr",
    "katastrophale folgen", "sonst riskieren sie",
  ],
  testimonials_11_2: [
    "empfohlen von prof.", "ärzte empfehlen", "alle ärzte",
    "studien beweisen", "wissenschaftlich bewiesen",
  ],
  guarantees: [
    "geld zurück garantie", "100% wirksam",
    "nebenwirkungsfrei", "ohne risiken",
  ],
  before_after_11_5: [
    "vorher/nachher", "vor und nach", "vergleichsbild",
  ],
  mdr_zweckbestimmung: [
    "ersetzt arzt", "ersetzt operation", "ersetzt medikament",
  ],
};

// ════════════════════════════════════════════════════════════════════════
// COMPETITOR POSITIONING
// ════════════════════════════════════════════════════════════════════════
const COMPETITOR_POSITIONING = [
  {
    competitor: "Nasara",
    avoid_phrasing: ["günstigste Lösung", "Discount-Tape"],
    differentiator: "Originalqualität von Nitto Denko, nicht No-Name-Klebstoff",
  },
  {
    competitor: "RockTape",
    avoid_phrasing: ["Performance-Tape", "Sport-Lifestyle"],
    differentiator: "Therapeuten-Perspektive vor Sport-Marketing",
  },
  {
    competitor: "KT Tape",
    avoid_phrasing: ["Marketing-Tape für Konsumenten"],
    differentiator: "Medizinischer Anspruch, Praxis-erprobt",
  },
  {
    competitor: "AcuTop",
    avoid_phrasing: [],
    differentiator: "Längere Marktpräsenz, exklusive Nitto-Denko-Partnerschaft",
  },
];

// ════════════════════════════════════════════════════════════════════════
// PAGE TYPE TEMPLATES (5 Seitentypen)
// ════════════════════════════════════════════════════════════════════════
const PAGE_TYPES: Record<string, any> = {
  product: {
    name: "Produktseite",
    default_structure: [
      { h2: "Im Überblick", words: 80, voice_mode: "factual" },
      { h2: "Anwendung & Eigenschaften", words: 200, voice_mode: "expert" },
      { h2: "Material & Qualität", words: 150, voice_mode: "factual" },
      { h2: "Für wen geeignet", words: 120, voice_mode: "advisory" },
      { h2: "Anwendungshinweise", words: 150, voice_mode: "expert" },
      { h2: "Häufige Fragen", words: 200, voice_mode: "advisory" },
    ],
    score_weights: { evidence: 0.25, voice: 0.2, structure: 0.15, seo: 0.15, compliance: 0.2, readability: 0.05 },
  },
  category: {
    name: "Kategorieseite",
    default_structure: [
      { h2: "Kategorie-Übersicht", words: 150, voice_mode: "factual" },
      { h2: "Anwendungsbereiche", words: 250, voice_mode: "expert" },
      { h2: "Auswahlkriterien", words: 200, voice_mode: "advisory" },
      { h2: "Häufige Fragen", words: 200, voice_mode: "advisory" },
    ],
    score_weights: { evidence: 0.15, voice: 0.2, structure: 0.2, seo: 0.25, compliance: 0.15, readability: 0.05 },
    constraints: ["KEINE marken-spezifischen Claims im Haupttext"],
  },
  brand: {
    name: "Markenseite",
    default_structure: [
      { h2: "Über die Marke", words: 200, voice_mode: "factual" },
      { h2: "Heritage & Hintergrund", words: 250, voice_mode: "narrative" },
      { h2: "Produktphilosophie", words: 200, voice_mode: "expert" },
      { h2: "Sortiment im Überblick", words: 150, voice_mode: "factual" },
    ],
    score_weights: { evidence: 0.15, voice: 0.3, structure: 0.15, seo: 0.15, compliance: 0.2, readability: 0.05 },
  },
  topic_world: {
    name: "Themenwelt",
    default_structure: [
      { h2: "Einleitung ins Thema", words: 200, voice_mode: "narrative" },
      { h2: "Hintergrund & Theorie", words: 300, voice_mode: "expert" },
      { h2: "Anwendung in der Praxis", words: 300, voice_mode: "expert" },
      { h2: "Produkt-Empfehlungen", words: 200, voice_mode: "advisory" },
      { h2: "Weiterführende Themen", words: 100, voice_mode: "factual" },
    ],
    score_weights: { evidence: 0.2, voice: 0.2, structure: 0.15, seo: 0.2, compliance: 0.15, readability: 0.1 },
  },
  guide: {
    name: "Ratgeber-Artikel",
    default_structure: [
      { h2: "Worum geht es", words: 150, voice_mode: "advisory" },
      { h2: "Hintergrundwissen", words: 300, voice_mode: "expert" },
      { h2: "Schritt für Schritt", words: 350, voice_mode: "advisory" },
      { h2: "Worauf achten", words: 200, voice_mode: "advisory" },
      { h2: "Wann zum Arzt", words: 100, voice_mode: "advisory" },
    ],
    score_weights: { evidence: 0.2, voice: 0.15, structure: 0.15, seo: 0.2, compliance: 0.2, readability: 0.1 },
    constraints: ["Bei b2c_patient PFLICHT-Hinweis 'ärztlich abklären'"],
  },
};

// ════════════════════════════════════════════════════════════════════════
// ANTHROPIC CLAUDE CALL
// ════════════════════════════════════════════════════════════════════════
async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens = 4096,
): Promise<{ text: string; tokens_in: number; tokens_out: number }> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Anthropic ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  return {
    text: data.content?.[0]?.text ?? "",
    tokens_in: data.usage?.input_tokens ?? 0,
    tokens_out: data.usage?.output_tokens ?? 0,
  };
}

function safeJsonParse(text: string): any {
  // Strip ```json fences
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extract first {...} block
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Could not parse JSON from model output");
  }
}

// ════════════════════════════════════════════════════════════════════════
// STAGE 0 — CONTEXT BUILDER (TS only, no LLM)
// ════════════════════════════════════════════════════════════════════════
interface ContextInput {
  page_type: string;
  audience_channel: string;
  product_type?: string | null;
  brand_name?: string | null;
  object_name: string;
  focus_keyword: string;
  target_word_count: number;
}

function buildContext(input: ContextInput) {
  const pageType = PAGE_TYPES[input.page_type];
  if (!pageType) throw new Error(`Unknown page_type: ${input.page_type}`);

  // Filter Evidence by relevance (simple keyword match)
  const kw = input.focus_keyword.toLowerCase();
  const relevantEvidence = EVIDENCE_LIBRARY.filter((e) =>
    e.topic.toLowerCase().includes(kw) ||
    e.claim_template.toLowerCase().includes(kw) ||
    kw.includes("tape") && e.code.startsWith("EV-00"),
  );

  // Heritage allowed?
  const heritage_allowed =
    input.product_type === "own_brand" ||
    (input.page_type === "brand" && (input.brand_name?.toLowerCase().includes("k-active") || input.brand_name?.toLowerCase().includes("kactive")));

  return {
    brand_voice: BRAND_VOICE_KACTIVE,
    page_type: pageType,
    page_type_key: input.page_type,
    audience: input.audience_channel,
    audience_register: BRAND_VOICE_KACTIVE.audience_register[input.audience_channel as keyof typeof BRAND_VOICE_KACTIVE.audience_register],
    product_type: input.product_type,
    brand_name: input.brand_name,
    object_name: input.object_name,
    focus_keyword: input.focus_keyword,
    target_word_count: input.target_word_count,
    relevant_evidence: relevantEvidence,
    competitor_positioning: COMPETITOR_POSITIONING,
    heritage_allowed,
    constraints: pageType.constraints ?? [],
  };
}

// ════════════════════════════════════════════════════════════════════════
// STAGE 1 — OUTLINE (Claude T=0.4)
// ════════════════════════════════════════════════════════════════════════
async function stageOutline(ctx: any) {
  const system = `Du bist ein Content-Strategist für K-Active Europe GmbH. Du erstellst Outlines für ${ctx.page_type.name} im Healthcare/Physiotherapie-Bereich. HWG- und MDR-konform.

Pflicht-Regeln:
- Nutze die default_structure als Ausgangspunkt, optimiere für Keyword "${ctx.focus_keyword}"
- Voice-Mode pro Sektion respektieren (factual/expert/advisory/narrative)
- Audience: ${ctx.audience} — Register: ${ctx.audience_register}
- Heritage-Claims (Nitto Denko, 1996, Kenzo Kase): ${ctx.heritage_allowed ? "ERLAUBT" : "VERBOTEN"}
- Constraints: ${JSON.stringify(ctx.constraints)}

Output: NUR JSON, keine Erklärung.`;

  const user = `Erstelle eine optimierte Outline für:
- Seitentyp: ${ctx.page_type.name}
- Objekt: ${ctx.object_name}
- Fokus-Keyword: ${ctx.focus_keyword}
- Ziel-Wortzahl: ${ctx.target_word_count}
- Ausgangs-Struktur: ${JSON.stringify(ctx.page_type.default_structure)}

Output-Format:
{
  "title": "SEO-Titel max 60 Zeichen",
  "meta_description": "max 160 Zeichen",
  "sections": [
    { "h2": "string", "h3s": ["optional"], "target_words": number, "voice_mode": "factual|expert|advisory|narrative", "key_points": ["3-5 Stichpunkte"], "evidence_refs": ["EV-XXX", ...] }
  ],
  "estimated_total_words": number
}`;

  const result = await callClaude(system, user, 0.4, 2048);
  const outline = safeJsonParse(result.text);
  return { outline, tokens_in: result.tokens_in, tokens_out: result.tokens_out };
}

// ════════════════════════════════════════════════════════════════════════
// STAGE 2 — WRITER (Claude T=0.7)
// ════════════════════════════════════════════════════════════════════════
async function stageWriter(ctx: any, outline: any) {
  const system = `Du bist Senior Medical Content Writer für K-Active Europe GmbH.

BRAND VOICE (verbindlich):
${JSON.stringify(BRAND_VOICE_KACTIVE, null, 2)}

EVIDENCE LIBRARY (verbindlich, jede Wirkungsaussage MUSS evidence_ref enthalten):
${JSON.stringify(ctx.relevant_evidence, null, 2)}

COMPETITOR POSITIONING (Abgrenzung):
${JSON.stringify(COMPETITOR_POSITIONING, null, 2)}

PFLICHT-REGELN:
1. Audience-Register: ${ctx.audience} — ${ctx.audience_register}
2. Heritage (Nitto Denko, 1996, Kenzo Kase): ${ctx.heritage_allowed ? "ERLAUBT, nutze heritage_slots wenn passend" : "STRIKT VERBOTEN"}
3. Jede Wirkungsaussage in JSON-Output mit "evidence_ref": "EV-XXX" markieren
4. Verwende permitted_phrasings, vermeide forbidden_phrasings
5. dont_use Wörter aus Brand Voice NIEMALS verwenden
6. Constraints: ${JSON.stringify(ctx.constraints)}
7. ${ctx.audience_channel === "b2c_patient" && ctx.page_type_key === "guide" ? "PFLICHT-Hinweis 'bei anhaltenden Beschwerden ärztlich abklären' integrieren" : ""}

Output: NUR JSON.`;

  const user = `Schreibe den vollständigen Text gemäß Outline:
${JSON.stringify(outline, null, 2)}

Format:
{
  "title": "string",
  "meta_description": "string",
  "sections": [
    {
      "h2": "string",
      "content_html": "<p>...</p><h3>...</h3><p>...</p>",
      "evidence_refs_used": ["EV-XXX"],
      "word_count": number
    }
  ],
  "total_word_count": number
}`;

  const result = await callClaude(system, user, 0.7, 8192);
  const content = safeJsonParse(result.text);
  return { content, tokens_in: result.tokens_in, tokens_out: result.tokens_out };
}

// ════════════════════════════════════════════════════════════════════════
// STAGE 3 — COMPLIANCE (Hybrid: Code-Checks + Claude Audit T=0.2)
// ════════════════════════════════════════════════════════════════════════
function flattenContent(content: any): string {
  return content.sections
    ?.map((s: any) => `${s.h2}\n${s.content_html}`)
    .join("\n\n") ?? "";
}

function checkDenylist(text: string) {
  const lower = text.toLowerCase();
  const violations: { category: string; phrase: string }[] = [];
  for (const [category, phrases] of Object.entries(HWG_DENYLIST)) {
    for (const phrase of phrases) {
      if (lower.includes(phrase.toLowerCase())) {
        violations.push({ category, phrase });
      }
    }
  }
  return violations;
}

function checkBrandVoiceDontUse(text: string) {
  const lower = text.toLowerCase();
  return BRAND_VOICE_KACTIVE.dont_use.filter((w) => lower.includes(w.toLowerCase()));
}

function checkHeritageViolation(text: string, ctx: any) {
  if (ctx.heritage_allowed) return [];
  const heritageMarkers = ["nitto denko", "kenzo kase", "seit 1996", "pionier des kinesiologischen"];
  const lower = text.toLowerCase();
  return heritageMarkers.filter((m) => lower.includes(m));
}

function checkEvidenceMatching(content: any, evidenceLib: any[]) {
  const allRefs: string[] = [];
  content.sections?.forEach((s: any) => {
    (s.evidence_refs_used ?? []).forEach((r: string) => allRefs.push(r));
  });
  const validCodes = evidenceLib.map((e) => e.code);
  const matched = allRefs.filter((r) => validCodes.includes(r));
  const invalid = allRefs.filter((r) => !validCodes.includes(r));
  return { matched, invalid, total_refs: allRefs.length };
}

function checkCompetitorWarnings(text: string) {
  const lower = text.toLowerCase();
  const warnings: { competitor: string; phrase: string }[] = [];
  for (const c of COMPETITOR_POSITIONING) {
    for (const p of c.avoid_phrasing) {
      if (lower.includes(p.toLowerCase())) {
        warnings.push({ competitor: c.competitor, phrase: p });
      }
    }
  }
  return warnings;
}

function checkPageTypeConstraints(text: string, ctx: any) {
  const violations: string[] = [];
  if (ctx.page_type_key === "category") {
    // No brand-specific claims in category main text
    const brandMentions = ["k-active tape classic", "recovery boots 3.0", "hyperice normatec"];
    const lower = text.toLowerCase();
    if (brandMentions.some((b) => lower.includes(b))) {
      violations.push("Marken-spezifischer Claim auf Kategorieseite gefunden");
    }
  }
  if (ctx.page_type_key === "guide" && ctx.audience === "b2c_patient") {
    const lower = text.toLowerCase();
    if (!lower.includes("ärztlich") && !lower.includes("arzt")) {
      violations.push("Pflicht-Hinweis 'ärztlich abklären' fehlt bei guide+b2c_patient");
    }
  }
  return violations;
}

async function stageCompliance(ctx: any, content: any) {
  const fullText = flattenContent(content);

  const hwg_violations = checkDenylist(fullText);
  const dont_use_violations = checkBrandVoiceDontUse(fullText);
  const heritage_violations = checkHeritageViolation(fullText, ctx);
  const evidence_matching = checkEvidenceMatching(content, ctx.relevant_evidence);
  const competitor_warnings = checkCompetitorWarnings(fullText);
  const page_type_violations = checkPageTypeConstraints(fullText, ctx);

  const hard_blocks =
    hwg_violations.length + heritage_violations.length + page_type_violations.length;

  let overall_status: "passed" | "warnings" | "rejected" = "passed";
  if (hard_blocks > 0) overall_status = "rejected";
  else if (
    dont_use_violations.length > 0 ||
    competitor_warnings.length > 0 ||
    evidence_matching.invalid.length > 0
  )
    overall_status = "warnings";

  return {
    report: {
      hwg_violations,
      dont_use_violations,
      heritage_violations,
      evidence_matching,
      competitor_warnings,
      page_type_violations,
      overall_status,
    },
    needs_rewrite: overall_status === "rejected",
  };
}

// ════════════════════════════════════════════════════════════════════════
// STAGE 3b — REWRITE (if rejected, Claude T=0.5)
// ════════════════════════════════════════════════════════════════════════
async function stageRewrite(ctx: any, content: any, report: any) {
  const system = `Du bist Compliance-Editor für K-Active. Schreibe den Text um, sodass ALLE Verstöße behoben sind. Kein Abmildern, sondern komplette Reformulierung der betroffenen Passagen. Brand Voice und Audience-Register beibehalten. Output: NUR JSON gleicher Struktur.`;

  const user = `Original-Content:
${JSON.stringify(content, null, 2)}

Compliance-Verstöße zu beheben:
${JSON.stringify(report, null, 2)}

Heritage-Claims erlaubt: ${ctx.heritage_allowed ? "JA" : "NEIN"}
Audience: ${ctx.audience}
Page Type: ${ctx.page_type_key}

Gib den korrigierten Content im gleichen JSON-Format zurück.`;

  const result = await callClaude(system, user, 0.5, 8192);
  const rewritten = safeJsonParse(result.text);
  return { content: rewritten, tokens_in: result.tokens_in, tokens_out: result.tokens_out };
}

// ════════════════════════════════════════════════════════════════════════
// CONTENT SCORE (6 dimensions, page-type weighted)
// ════════════════════════════════════════════════════════════════════════
function calculateContentScore(ctx: any, content: any, report: any) {
  const fullText = flattenContent(content);
  const wc = content.total_word_count ?? fullText.split(/\s+/).length;

  // Evidence: % wirklich genutzt vs verfügbar
  const evidenceScore = ctx.relevant_evidence.length > 0
    ? Math.min(100, (report.evidence_matching.matched.length / ctx.relevant_evidence.length) * 100)
    : 70;

  // Voice: dont_use Verstöße
  const voiceScore = Math.max(0, 100 - report.dont_use_violations.length * 25);

  // Structure: section count match
  const expectedSections = ctx.page_type.default_structure.length;
  const actualSections = content.sections?.length ?? 0;
  const structureScore = Math.max(0, 100 - Math.abs(expectedSections - actualSections) * 15);

  // SEO: keyword presence
  const kwCount = (fullText.toLowerCase().match(new RegExp(ctx.focus_keyword.toLowerCase(), "g")) || []).length;
  const kwDensity = (kwCount / wc) * 100;
  const seoScore = kwDensity >= 0.5 && kwDensity <= 2.5 ? 100 : kwDensity > 0 ? 70 : 30;

  // Compliance
  const complianceScore = report.overall_status === "passed" ? 100 : report.overall_status === "warnings" ? 70 : 30;

  // Readability (avg sentence length proxy)
  const sentences = fullText.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
  const avgSentLen = wc / Math.max(1, sentences.length);
  const readabilityScore = avgSentLen < 25 ? 100 : avgSentLen < 35 ? 75 : 50;

  const w = ctx.page_type.score_weights;
  const total =
    evidenceScore * w.evidence +
    voiceScore * w.voice +
    structureScore * w.structure +
    seoScore * w.seo +
    complianceScore * w.compliance +
    readabilityScore * w.readability;

  return {
    total: Math.round(total),
    breakdown: {
      evidence: Math.round(evidenceScore),
      voice: Math.round(voiceScore),
      structure: Math.round(structureScore),
      seo: Math.round(seoScore),
      compliance: Math.round(complianceScore),
      readability: Math.round(readabilityScore),
    },
    weights: w,
    word_count: wc,
    keyword_density_percent: Number(kwDensity.toFixed(2)),
  };
}

// ════════════════════════════════════════════════════════════════════════
// PIPELINE ORCHESTRATOR
// ════════════════════════════════════════════════════════════════════════
async function recordStage(
  supabase: any,
  projectId: string,
  stage: string,
  order: number,
  payload: any,
) {
  try {
    await supabase.from("content_v3_pipeline_runs").insert({
      project_id: projectId,
      stage,
      stage_order: order,
      ...payload,
    });
  } catch (e) {
    console.error("recordStage failed", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      project_id,
      page_type,
      audience_channel,
      product_type,
      brand_name,
      object_name,
      focus_keyword,
      target_word_count = 800,
      parallel_audience,
    } = body;

    if (!project_id || !page_type || !audience_channel || !object_name || !focus_keyword) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!PAGE_TYPES[page_type]) {
      return new Response(
        JSON.stringify({ error: `Invalid page_type: ${page_type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Mark project running
    await supabase
      .from("content_v3_projects")
      .update({ status: "running" })
      .eq("id", project_id);

    let totalTokensIn = 0;
    let totalTokensOut = 0;

    // STAGE 0 — Context
    const t0 = Date.now();
    const ctx = buildContext({
      page_type,
      audience_channel,
      product_type,
      brand_name,
      object_name,
      focus_keyword,
      target_word_count,
    });
    await recordStage(supabase, project_id, "context", 0, {
      model_used: "ts-builder",
      input_payload: { page_type, audience_channel, focus_keyword },
      output_payload: { evidence_count: ctx.relevant_evidence.length, heritage_allowed: ctx.heritage_allowed },
      duration_ms: Date.now() - t0,
      status: "completed",
    });

    // STAGE 1 — Outline
    const t1 = Date.now();
    const { outline, tokens_in: oti, tokens_out: oto } = await stageOutline(ctx);
    totalTokensIn += oti;
    totalTokensOut += oto;
    await recordStage(supabase, project_id, "outline", 1, {
      model_used: MODEL,
      temperature: 0.4,
      output_payload: outline,
      tokens_input: oti,
      tokens_output: oto,
      duration_ms: Date.now() - t1,
      status: "completed",
    });

    // STAGE 2 — Writer
    const t2 = Date.now();
    const { content, tokens_in: wti, tokens_out: wto } = await stageWriter(ctx, outline);
    totalTokensIn += wti;
    totalTokensOut += wto;
    await recordStage(supabase, project_id, "writer", 2, {
      model_used: MODEL,
      temperature: 0.7,
      output_payload: content,
      tokens_input: wti,
      tokens_output: wto,
      duration_ms: Date.now() - t2,
      status: "completed",
    });

    // STAGE 3 — Compliance
    const t3 = Date.now();
    let { report, needs_rewrite } = await stageCompliance(ctx, content);
    let finalContent = content;
    let rewriteCount = 0;

    if (needs_rewrite) {
      const rewrite = await stageRewrite(ctx, content, report);
      finalContent = rewrite.content;
      totalTokensIn += rewrite.tokens_in;
      totalTokensOut += rewrite.tokens_out;
      rewriteCount = 1;
      // re-check
      const recheck = await stageCompliance(ctx, finalContent);
      report = recheck.report;
    }

    await recordStage(supabase, project_id, "compliance", 3, {
      model_used: rewriteCount > 0 ? MODEL : "code-only",
      temperature: rewriteCount > 0 ? 0.5 : 0,
      output_payload: report,
      duration_ms: Date.now() - t3,
      status: "completed",
    });

    // STAGE 2b — Optional Parallel Audience Writer
    let parallelContent: any = null;
    if (parallel_audience && parallel_audience !== audience_channel) {
      const parallelCtx = { ...ctx, audience: parallel_audience, audience_register: BRAND_VOICE_KACTIVE.audience_register[parallel_audience as keyof typeof BRAND_VOICE_KACTIVE.audience_register] };
      const tp = Date.now();
      const { content: pcontent, tokens_in: pti, tokens_out: pto } = await stageWriter(parallelCtx, outline);
      totalTokensIn += pti;
      totalTokensOut += pto;
      parallelContent = pcontent;
      await recordStage(supabase, project_id, "writer_parallel", 4, {
        model_used: MODEL,
        temperature: 0.7,
        output_payload: pcontent,
        tokens_input: pti,
        tokens_output: pto,
        duration_ms: Date.now() - tp,
        status: "completed",
      });
    }

    // Score
    const score = calculateContentScore(ctx, finalContent, report);

    // Cost (Claude Sonnet 4.5: $3/Mtok in, $15/Mtok out → cents)
    const costCents = Math.round(((totalTokensIn / 1_000_000) * 300) + ((totalTokensOut / 1_000_000) * 1500));

    // Persist project final
    await supabase
      .from("content_v3_projects")
      .update({
        status: "completed",
        final_content: finalContent,
        parallel_content: parallelContent,
        compliance_status: report.overall_status,
        content_score: score,
        total_tokens_used: totalTokensIn + totalTokensOut,
        total_cost_cents: costCents,
      })
      .eq("id", project_id);

    // Persist compliance report
    await supabase.from("content_v3_compliance_reports").insert({
      project_id,
      variant: "primary",
      hwg_violations: report.hwg_violations,
      evidence_matches: report.evidence_matching.matched,
      missing_evidence: report.evidence_matching.invalid,
      competitor_warnings: report.competitor_warnings,
      page_type_violations: report.page_type_violations,
      overall_status: report.overall_status,
      rewrite_count: rewriteCount,
    });

    return new Response(
      JSON.stringify({
        project_id,
        outline,
        final_content: finalContent,
        parallel_content: parallelContent,
        compliance_report: report,
        content_score: score,
        tokens_used: totalTokensIn + totalTokensOut,
        cost_cents: costCents,
        rewrite_count: rewriteCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("V3 pipeline error", err);
    const message = err instanceof Error ? err.message : String(err);
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const body = await req.clone().json().catch(() => ({}));
      if (body.project_id) {
        await supabase
          .from("content_v3_projects")
          .update({ status: "failed", error_message: message })
          .eq("id", body.project_id);
      }
    } catch {}
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
