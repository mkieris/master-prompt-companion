import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, organizationId, analysisId } = await req.json();

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting competitor analysis for:', url);

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
      const { organizationId, analysisId } = await req.json().catch(() => ({}));
      if (analysisId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('competitor_analyses')
          .update({ crawl_status: 'failed' })
          .eq('id', analysisId);
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});