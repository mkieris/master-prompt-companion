import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SSRF protection: Block private/internal URLs
function isBlockedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();

    const blockedPatterns = [
      /^localhost$/i,
      /^127\.\d+\.\d+\.\d+$/,
      /^10\.\d+\.\d+\.\d+$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
      /^192\.168\.\d+\.\d+$/,
      /^169\.254\.\d+\.\d+$/,
      /^0\.0\.0\.0$/,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return true;
      }
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

// Input validation schema
const requestSchema = z.object({
  url: z.string()
    .min(1, 'URL ist erforderlich')
    .max(2000, 'URL zu lang'),
  mode: z.enum(['topic', 'category', 'company']).default('topic'),
  depth: z.enum(['single', 'multi']).default('single'),
});

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

    console.log('Domain Analysis - Authenticated user:', user.id);
    // ===== END AUTHENTICATION =====

    // ===== INPUT VALIDATION =====
    const rawData = await req.json();
    const parseResult = requestSchema.safeParse(rawData);

    if (!parseResult.success) {
      console.log('Validation error:', parseResult.error.format());
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parseResult.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, mode, depth } = parseResult.data;
    // ===== END VALIDATION =====

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // ===== SSRF PROTECTION =====
    if (isBlockedUrl(normalizedUrl)) {
      console.log('Blocked SSRF attempt:', normalizedUrl);
      return new Response(
        JSON.stringify({ error: 'Private and internal URLs are not allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ===== END SSRF PROTECTION =====

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Domain-Analyse nicht konfiguriert',
          hint: 'FIRECRAWL_API_KEY fehlt'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing domain: ${normalizedUrl} (mode: ${mode}, depth: ${depth})`);

    // ===== SCRAPE CONTENT =====
    let content = '';
    let metadata: any = {};
    let pageCount = 1;

    if (depth === 'single') {
      // Single page scrape
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: normalizedUrl,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      if (!scrapeResponse.ok) {
        const errorText = await scrapeResponse.text();
        console.error('Firecrawl scrape error:', scrapeResponse.status, errorText);
        throw new Error('Website konnte nicht gescrapt werden');
      }

      const scrapeData = await scrapeResponse.json();
      if (!scrapeData.success) {
        throw new Error(scrapeData.error || 'Scraping fehlgeschlagen');
      }

      content = scrapeData.data?.markdown || '';
      metadata = scrapeData.data?.metadata || {};
      console.log(`Scraped single page: ${content.length} chars`);
    } else {
      // Multi-page crawl
      const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: normalizedUrl,
          limit: 20,
          maxDepth: 3,
          excludePaths: [
            '*impressum*', '*datenschutz*', '*agb*', '*kontakt*',
            '*cart*', '*checkout*', '*privacy*', '*imprint*',
            '*legal*', '*terms*', '*account*', '*login*',
          ],
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
      });

      if (!crawlResponse.ok) {
        throw new Error('Crawl konnte nicht gestartet werden');
      }

      const crawlData = await crawlResponse.json();
      if (!crawlData.success) {
        throw new Error(crawlData.error || 'Crawl fehlgeschlagen');
      }

      const jobId = crawlData.id;
      console.log('Crawl started, job ID:', jobId);

      // Poll for completion (max 2 minutes)
      let crawlResult = null;
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000));

        const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
          headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`Crawl status: ${statusData.status}, Pages: ${statusData.completed || 0}`);

          if (statusData.status === 'completed') {
            crawlResult = statusData.data || [];
            break;
          }
          if (statusData.status === 'failed') {
            throw new Error('Crawl fehlgeschlagen');
          }
        }
        attempts++;
      }

      if (!crawlResult) {
        throw new Error('Crawl Timeout');
      }

      // Combine content from all pages
      pageCount = crawlResult.length;
      content = crawlResult
        .map((page: any) => {
          const title = page.metadata?.title || 'Page';
          const pageContent = page.markdown || '';
          return `## ${title}\n\n${pageContent}`;
        })
        .join('\n\n---\n\n')
        .substring(0, 40000);

      console.log(`Crawled ${pageCount} pages, total: ${content.length} chars`);
    }
    // ===== END SCRAPE =====

    if (content.length < 100) {
      return new Response(
        JSON.stringify({ error: 'Nicht genug Content auf der Website gefunden' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== AI ANALYSIS =====
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'AI-Analyse nicht konfiguriert',
          hint: 'LOVABLE_API_KEY fehlt',
          rawContent: content.substring(0, 5000)
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode-specific analysis prompts
    const analysisPrompts: Record<string, string> = {
      topic: `Du bist ein Experte für Content-Strategie. Analysiere den Website-Content und extrahiere Wissen über das THEMA/DIE BRANCHE.

Ziel: Ein Texter soll nach dieser Analyse SEO-Texte über dieses Thema schreiben können, OHNE die Branche vorher zu kennen.

Antworte NUR mit validem JSON:
{
  "topicName": "Hauptthema der Website (z.B. 'Life Coaching für Frauen')",
  "industry": "Branche/Nische",
  "coreConceptsExplained": {
    "concept1": "Erklärung des Konzepts...",
    "concept2": "Erklärung des Konzepts..."
  },
  "targetAudience": {
    "demographics": "Wer sind die typischen Kunden?",
    "painPoints": ["Problem 1", "Problem 2"],
    "desires": ["Wunsch 1", "Wunsch 2"]
  },
  "terminology": {
    "term1": "Definition/Erklärung",
    "term2": "Definition/Erklärung"
  },
  "typicalServices": ["Service 1", "Service 2"],
  "marketingAngles": ["Verkaufsargument 1", "Verkaufsargument 2"],
  "toneRecommendation": "Empfohlener Schreibstil für diese Branche",
  "contentContext": "Ausführliche Zusammenfassung (300-500 Wörter) die als Kontext für Content-Erstellung genutzt werden kann. Enthält alle wichtigen Informationen über das Thema, typische Formulierungen, und worauf man achten sollte."
}`,

      category: `Du bist ein E-Commerce und SEO-Experte. Analysiere diese Kategorie-/Produktseite und extrahiere alle relevanten Informationen für SEO-Content.

Ziel: Basierend auf dieser Analyse soll ein perfekter Kategorietext geschrieben werden können.

Antworte NUR mit validem JSON:
{
  "categoryName": "Name der Kategorie",
  "parentCategory": "Übergeordnete Kategorie falls erkennbar",
  "products": [
    {
      "name": "Produktname",
      "keyFeatures": ["Feature 1", "Feature 2"],
      "priceRange": "Preisbereich falls vorhanden"
    }
  ],
  "categoryDescription": "Was wird in dieser Kategorie verkauft?",
  "targetCustomer": "Wer kauft diese Produkte?",
  "useCases": ["Anwendungsfall 1", "Anwendungsfall 2"],
  "buyingCriteria": ["Worauf sollte man achten?"],
  "relatedCategories": ["Verwandte Kategorie 1"],
  "seoKeywords": ["Keyword 1", "Keyword 2"],
  "contentContext": "Ausführliche Beschreibung (200-400 Wörter) die alle wichtigen Informationen für einen Kategorietext enthält. Beschreibt Produkte, Vorteile, Zielgruppe und Kaufkriterien."
}`,

      company: `Du bist ein Business-Analyst. Analysiere die Website und extrahiere alle Informationen über das UNTERNEHMEN.

Ziel: Ein Texter soll Texte für dieses Unternehmen schreiben können, die perfekt zur Marke passen.

Antworte NUR mit validem JSON:
{
  "companyName": "Name des Unternehmens",
  "industry": "Branche",
  "foundingStory": "Geschichte/Hintergrund falls vorhanden",
  "mission": "Mission/Vision",
  "values": ["Wert 1", "Wert 2"],
  "productsServices": ["Produkt/Service 1", "Produkt/Service 2"],
  "usps": ["USP 1", "USP 2"],
  "targetAudience": "Zielgruppe",
  "brandVoice": {
    "tone": "Tonalität (z.B. professionell, freundlich, innovativ)",
    "characteristics": ["Merkmal 1", "Merkmal 2"],
    "avoidWords": ["Wörter die nicht zur Marke passen"]
  },
  "claims": ["Slogan/Claim 1"],
  "contentContext": "Ausführliche Unternehmensbeschreibung (300-500 Wörter) die als Basis für alle Content-Erstellung dient. Enthält Positionierung, Werte, Tonalität und wichtige Botschaften."
}`
    };

    const systemPrompt = analysisPrompts[mode] || analysisPrompts.topic;

    console.log('Starting AI analysis...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analysiere folgenden Website-Content:\n\n${content.substring(0, 25000)}` }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI analysis failed:', aiResponse.status, errorText);
      throw new Error('AI-Analyse fehlgeschlagen');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON from AI response
    let analysis: any;
    try {
      let jsonStr = aiContent.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = { rawAnalysis: aiContent, parseError: true };
    }
    // ===== END AI ANALYSIS =====

    console.log('Domain analysis completed successfully');

    const response = {
      success: true,
      url: normalizedUrl,
      mode,
      pagesAnalyzed: pageCount,
      analysis,
      metadata: {
        title: metadata.title || null,
        description: metadata.description || null,
        analyzedAt: new Date().toISOString(),
      },
      // Ready-to-use context for content generation
      contentContext: analysis.contentContext || analysis.rawAnalysis || '',
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-domain:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
