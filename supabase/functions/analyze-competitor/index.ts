import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompetitorAnalysis {
  pageTitle: string;
  metaDescription: string;
  mainKeywords: string[];
  secondaryKeywords: string[];
  headingStructure: { h1: string[]; h2: string[]; h3: string[] };
  contentLength: number;
  wordCount: number;
  tonalityAnalysis: string;
  contentStrategy: string;
  uspPatterns: string[];
  faqPatterns: { question: string; answer: string }[];
  callToActions: string[];
  strengths: string[];
  weaknesses: string[];
  bestPractices: {
    keywordStrategy: string;
    contentStructure: string;
    argumentationPatterns: string;
    recommendations: string[];
  };
}

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
  url: z.string().min(1, 'URL is required').max(2000, 'URL too long'),
  organizationId: z.string().uuid('Invalid organization ID'),
  analysisId: z.string().uuid('Invalid analysis ID'),
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
    const rawData = await req.json();
    const parseResult = requestSchema.safeParse(rawData);
    
    if (!parseResult.success) {
      console.log('Validation error:', parseResult.error.format());
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parseResult.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, organizationId, analysisId } = parseResult.data;
    // ===== END VALIDATION =====

    // ===== ORGANIZATION MEMBERSHIP CHECK =====
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!membership) {
      console.log('User not authorized for organization:', organizationId);
      return new Response(
        JSON.stringify({ error: 'Not authorized for this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ===== END ORGANIZATION CHECK =====

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // ===== SSRF PROTECTION =====
    if (isBlockedUrl(url)) {
      console.log('Blocked SSRF attempt:', url);
      return new Response(
        JSON.stringify({ error: 'Private and internal URLs are not allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ===== END SSRF PROTECTION =====

    console.log('Starting competitor analysis for:', url, 'User:', user.id);

    // Update status to crawling
    await supabase
      .from('competitor_analyses')
      .update({ crawl_status: 'crawling' })
      .eq('id', analysisId);

    // Scrape the competitor URL using Firecrawl API directly
    console.log('Scraping URL with Firecrawl API...');
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl error:', scrapeResponse.status, errorText);
      throw new Error(`Failed to scrape URL: ${scrapeResponse.status}`);
    }

    const scrapeResult = await scrapeResponse.json();
    
    if (!scrapeResult.success) {
      throw new Error(`Failed to scrape URL: ${scrapeResult.error || 'Unknown error'}`);
    }

    const content = scrapeResult.data?.markdown || '';
    const html = scrapeResult.data?.html || '';
    const metadata = scrapeResult.data?.metadata || {};

    console.log('Scraped content length:', content.length);

    // Extract basic data from HTML/metadata
    const pageTitle = metadata.title || '';
    const metaDescription = metadata.description || '';
    
    // Extract headings from markdown
    const h1Matches = content.match(/^# (.+)$/gm) || [];
    const h2Matches = content.match(/^## (.+)$/gm) || [];
    const h3Matches = content.match(/^### (.+)$/gm) || [];
    
    const headingStructure = {
      h1: h1Matches.map((h: string) => h.replace(/^# /, '')),
      h2: h2Matches.map((h: string) => h.replace(/^## /, '')),
      h3: h3Matches.map((h: string) => h.replace(/^### /, '')),
    };

    const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;

    // Update status to analyzing
    await supabase
      .from('competitor_analyses')
      .update({ crawl_status: 'analyzing' })
      .eq('id', analysisId);

    // Analyze content with AI
    console.log('Analyzing content with AI...');
    const analysisPrompt = `Du bist ein SEO-Experte. Analysiere diese Wettbewerber-Webseite und extrahiere wertvolle Erkenntnisse für SEO-Content-Erstellung.

URL: ${url}
Titel: ${pageTitle}
Meta-Description: ${metaDescription}

CONTENT:
${content.substring(0, 15000)}

ANALYSE-AUFGABEN:
1. **Haupt-Keywords** (5-10): Die wichtigsten Keywords die auf dieser Seite targetiert werden
2. **Sekundäre Keywords** (5-15): Unterstützende Keywords und Long-Tail-Varianten
3. **Tonalitäts-Analyse**: Wie ist der Schreibstil? (B2B/B2C, formal/informal, Expertenlevel)
4. **Content-Strategie**: Welche Content-Strategie verfolgt diese Seite? (Informational, Transactional, etc.)
5. **USP-Muster**: Welche Alleinstellungsmerkmale werden hervorgehoben?
6. **FAQ-Muster**: Welche Fragen werden beantwortet? (Falls vorhanden)
7. **Call-to-Actions**: Welche CTAs werden verwendet?
8. **Stärken**: Was macht diese Seite gut?
9. **Schwächen**: Wo gibt es Verbesserungspotential?
10. **Best Practices**: Was können wir lernen und übernehmen?

Antworte NUR mit validem JSON in diesem Format:
{
  "mainKeywords": ["keyword1", "keyword2"],
  "secondaryKeywords": ["long tail 1", "long tail 2"],
  "tonalityAnalysis": "Beschreibung der Tonalität...",
  "contentStrategy": "Beschreibung der Strategie...",
  "uspPatterns": ["USP 1", "USP 2"],
  "faqPatterns": [{"question": "Frage?", "answer": "Antwort"}],
  "callToActions": ["CTA 1", "CTA 2"],
  "strengths": ["Stärke 1", "Stärke 2"],
  "weaknesses": ["Schwäche 1", "Schwäche 2"],
  "bestPractices": {
    "keywordStrategy": "Wie werden Keywords eingesetzt?",
    "contentStructure": "Wie ist der Content strukturiert?",
    "argumentationPatterns": "Welche Argumentationsmuster werden verwendet?",
    "recommendations": ["Empfehlung 1", "Empfehlung 2"]
  }
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du bist ein SEO-Analyse-Experte. Antworte nur mit validem JSON.' },
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
    let analysis: Partial<CompetitorAnalysis> = {};
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI analysis:', e);
    }

    // Update database with results
    const updateData = {
      crawl_status: 'completed',
      crawled_at: new Date().toISOString(),
      page_title: pageTitle,
      meta_description: metaDescription,
      main_keywords: analysis.mainKeywords || [],
      secondary_keywords: analysis.secondaryKeywords || [],
      heading_structure: headingStructure,
      content_length: content.length,
      word_count: wordCount,
      tonality_analysis: analysis.tonalityAnalysis || '',
      content_strategy: analysis.contentStrategy || '',
      usp_patterns: analysis.uspPatterns || [],
      faq_patterns: analysis.faqPatterns || [],
      call_to_actions: analysis.callToActions || [],
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      best_practices: analysis.bestPractices || {},
      raw_content: content.substring(0, 50000), // Limit storage
    };

    const { error: updateError } = await supabase
      .from('competitor_analyses')
      .update(updateData)
      .eq('id', analysisId);

    if (updateError) {
      console.error('Failed to update analysis:', updateError);
      throw new Error('Failed to save analysis results');
    }

    console.log('Competitor analysis completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      analysisId,
      summary: {
        pageTitle,
        wordCount,
        keywordsFound: (analysis.mainKeywords?.length || 0) + (analysis.secondaryKeywords?.length || 0),
        strengthsCount: analysis.strengths?.length || 0,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-competitor:', error);
    
    // Try to update status to failed
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // We can't re-read the body, so just log the error
      console.log('Unable to update analysis status to failed - body already consumed');
    } catch (e) {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
