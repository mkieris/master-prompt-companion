import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, domainId, organizationId } = await req.json();
    
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Starting domain crawl for:', url);

    // Parse the URL to get the base path for focused crawling
    const parsedUrl = new URL(url);
    const basePath = parsedUrl.pathname !== '/' ? parsedUrl.pathname : undefined;

    // Start the crawl with Firecrawl - like Screaming Frog, crawl all subpages
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        limit: 50, // Crawl up to 50 pages like Screaming Frog
        maxDepth: 5, // Allow deeper crawling for comprehensive coverage
        includePaths: basePath ? [`${basePath}*`] : undefined, // If subpage URL, only crawl that path and children
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true, // Focus on main content, ignore navigation/footer
        }
      }),
    });

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      console.error('Firecrawl error:', errorText);
      
      // Parse error for better messaging
      let errorMessage = 'Failed to start crawl';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.includes('Insufficient credits')) {
          errorMessage = 'Firecrawl credits exhausted. Please check your Firecrawl plan.';
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Keep default error message
      }
      
      await supabase
        .from('domain_knowledge')
        .update({ crawl_status: 'failed' })
        .eq('id', domainId);

      throw new Error(errorMessage);
    }

    const crawlData = await crawlResponse.json();
    console.log('Crawl started:', crawlData);

    // Wait for crawl to complete (poll status)
    let crawlResult = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlData.id}`, {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log('Crawl status:', statusData.status, 'Pages:', statusData.completed || 0);

      // Update progress in database
      await supabase
        .from('domain_knowledge')
        .update({ 
          pages_crawled: statusData.completed || 0,
          total_pages: statusData.total || 0 
        })
        .eq('id', domainId);

      if (statusData.status === 'completed') {
        crawlResult = statusData;
        break;
      }

      if (statusData.status === 'failed') {
        throw new Error('Crawl failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    if (!crawlResult) {
      throw new Error('Crawl timed out');
    }

    console.log('Crawl completed with', crawlResult.data?.length || 0, 'pages');

    // Combine all crawled content
    const allContent = crawlResult.data
      ?.map((page: any) => `### ${page.metadata?.title || 'Page'}\nURL: ${page.metadata?.sourceURL || ''}\n\n${page.markdown || ''}`)
      .join('\n\n---\n\n')
      .substring(0, 50000); // Limit content size

    // Analyze with AI
    console.log('Analyzing content with AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Business-Analyst. Analysiere die folgenden Webseiten-Inhalte und extrahiere strukturierte Informationen über das Unternehmen.

Gib deine Antwort als JSON zurück mit folgender Struktur:
{
  "company_name": "Name des Unternehmens",
  "company_description": "Kurze Beschreibung (2-3 Sätze)",
  "industry": "Branche/Industrie",
  "target_audience": "Detaillierte Beschreibung der Zielgruppe (B2B/B2C, Demografie, Bedürfnisse)",
  "main_products_services": ["Produkt/Service 1", "Produkt/Service 2", ...],
  "unique_selling_points": ["USP 1", "USP 2", ...],
  "brand_voice": "Beschreibung des Kommunikationsstils (formal/informell, technisch/emotional, etc.)",
  "keywords": ["keyword1", "keyword2", ...],
  "ai_summary": "Umfassende Zusammenfassung des Unternehmens für Content-Erstellung (300-500 Wörter)"
}

Wichtig: 
- Extrahiere KONKRETE Informationen aus dem Content
- Keywords sollten SEO-relevante Begriffe sein
- Die Zusammenfassung soll helfen, bessere SEO-Texte für das Unternehmen zu schreiben`
          },
          {
            role: 'user',
            content: `Analysiere folgende Webseiten-Inhalte:\n\n${allContent}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    let analysisResult;

    try {
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      analysisResult = {
        company_name: null,
        company_description: null,
        industry: null,
        target_audience: null,
        main_products_services: [],
        unique_selling_points: [],
        brand_voice: null,
        keywords: [],
        ai_summary: aiData.choices[0].message.content
      };
    }

    console.log('Analysis complete:', analysisResult.company_name);

    // Update database with results
    await supabase
      .from('domain_knowledge')
      .update({
        crawl_status: 'completed',
        pages_crawled: crawlResult.data?.length || 0,
        total_pages: crawlResult.data?.length || 0,
        company_name: analysisResult.company_name,
        company_description: analysisResult.company_description,
        industry: analysisResult.industry,
        target_audience: analysisResult.target_audience,
        main_products_services: analysisResult.main_products_services,
        unique_selling_points: analysisResult.unique_selling_points,
        brand_voice: analysisResult.brand_voice,
        keywords: analysisResult.keywords,
        ai_summary: analysisResult.ai_summary,
        crawl_data: crawlResult.data?.slice(0, 10) || [],
        crawled_at: new Date().toISOString(),
      })
      .eq('id', domainId);

    return new Response(
      JSON.stringify({ success: true, data: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in crawl-domain:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
