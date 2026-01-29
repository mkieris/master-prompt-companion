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
  url: z.string().min(1, 'URL is required').max(2000, 'URL too long'),
  domainId: z.string().uuid('Invalid domain ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
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

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    const { url, domainId, organizationId } = parseResult.data;
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

    console.log('Starting domain crawl with Firecrawl for:', url, 'User:', user.id);

    const parsedUrl = new URL(url);
    const basePath = parsedUrl.pathname !== '/' ? parsedUrl.pathname : undefined;

    // Start Firecrawl crawl
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        limit: 10,  // Begrenzt auf 10 Seiten (3000 Credits Budget)
        maxDepth: 2, // Nur 2 Ebenen tief crawlen
        includePaths: basePath ? [basePath + '*'] : undefined,
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
      const errorData = await crawlResponse.json();
      console.error('Firecrawl error:', errorData);
      
      await supabase
        .from('domain_knowledge')
        .update({ crawl_status: 'failed' })
        .eq('id', domainId);

      throw new Error(errorData.error || 'Failed to start crawl');
    }

    const crawlData = await crawlResponse.json();
    
    if (!crawlData.success) {
      throw new Error(crawlData.error || 'Failed to start crawl');
    }

    const jobId = crawlData.id;
    console.log('Firecrawl crawl started with job ID:', jobId);

    // Poll for completion
    let crawlResult = null;
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes max

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        },
      });
      
      if (!statusResponse.ok) {
        console.error('Status check failed:', statusResponse.status);
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      const pagesCompleted = statusData.completed || 0;
      const totalPages = statusData.total || 0;
      
      console.log('Crawl status:', statusData.status, 'Pages:', pagesCompleted, '/', totalPages);

      // Update progress in database
      await supabase
        .from('domain_knowledge')
        .update({ 
          pages_crawled: pagesCompleted,
          total_pages: totalPages
        })
        .eq('id', domainId);

      if (statusData.status === 'completed') {
        crawlResult = statusData.data || [];
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

    console.log('Crawl completed with', crawlResult.length, 'pages');

    // Combine all crawled content
    const allContent = crawlResult
      .map((page: any) => {
        const title = page.metadata?.title || 'Page';
        const pageUrl = page.metadata?.sourceURL || page.url || '';
        const text = page.markdown || '';
        return `### ${title}\nURL: ${pageUrl}\n\n${text}`;
      })
      .join('\n\n---\n\n')
      .substring(0, 50000);

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

    // Update database
    await supabase
      .from('domain_knowledge')
      .update({
        crawl_status: 'completed',
        pages_crawled: crawlResult.length,
        total_pages: crawlResult.length,
        company_name: analysisResult.company_name,
        company_description: analysisResult.company_description,
        industry: analysisResult.industry,
        target_audience: analysisResult.target_audience,
        main_products_services: analysisResult.main_products_services,
        unique_selling_points: analysisResult.unique_selling_points,
        brand_voice: analysisResult.brand_voice,
        keywords: analysisResult.keywords,
        ai_summary: analysisResult.ai_summary,
        crawl_data: crawlResult.slice(0, 10),
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
