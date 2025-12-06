import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, mode = 'single' } = await req.json();
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    if (!url) {
      throw new Error('URL is required');
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    console.log('Scraping website with Firecrawl:', normalizedUrl, 'Mode:', mode);

    if (mode === 'multi') {
      return await crawlMultiplePages(normalizedUrl, FIRECRAWL_API_KEY);
    } else {
      return await scrapeSinglePage(normalizedUrl, FIRECRAWL_API_KEY);
    }
  } catch (error) {
    console.error('Error in scrape-website function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Single page scrape using Firecrawl
async function scrapeSinglePage(url: string, apiKey: string) {
  console.log('Starting Firecrawl single-page scrape for:', url);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl error:', response.status, errorText);
      throw new Error(`Firecrawl scrape failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Firecrawl scrape failed');
    }

    const content = result.data?.markdown || '';
    const html = result.data?.html || '';
    const metadata = result.data?.metadata || {};
    
    console.log(`Firecrawl scraped: ${content.length} chars markdown, Title: "${metadata.title}"`);

    if (content.length < 50) {
      throw new Error('Insufficient content extracted from page');
    }

    // Extract headings from markdown
    const headings = extractHeadingsFromMarkdown(content);

    const structuredData = {
      title: metadata.title || '',
      description: metadata.description || '',
      url,
      content,
      sections: headings.map(h => ({ heading: h.text, content: '' })),
      metadata: {
        language: metadata.language || 'de',
        keywords: metadata.keywords || [],
      },
      detectedProducts: extractProducts(content, { title: metadata.title || '', headings }),
      summary: content.substring(0, 500) + '...',
    };
    
    // Add AI analysis for brand information
    let analysis = null;
    try {
      analysis = await analyzeBrandInfo(content);
      console.log('AI analysis completed');
    } catch (analysisError) {
      console.error('AI analysis failed:', analysisError);
    }

    return new Response(JSON.stringify({
      ...structuredData,
      success: true,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrapeSinglePage:', error);
    throw error;
  }
}

// Extract headings from markdown content
function extractHeadingsFromMarkdown(markdown: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim()
      });
    }
  }
  
  return headings;
}

// Multi-page crawl using Firecrawl
async function crawlMultiplePages(url: string, apiKey: string) {
  console.log('Starting Firecrawl multi-page crawl for:', url);
  
  try {
    const urlObj = new URL(url);
    const basePath = urlObj.pathname.endsWith('/') 
      ? urlObj.pathname 
      : urlObj.pathname + '/';
    
    // Start crawl
    const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        limit: 50,
        maxDepth: 3,
        includePaths: basePath !== '/' ? [basePath + '*'] : undefined,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl crawl error:', response.status, errorText);
      throw new Error(`Failed to start crawl: ${response.status}`);
    }

    const crawlData = await response.json();
    
    if (!crawlData.success) {
      throw new Error(crawlData.error || 'Failed to start crawl');
    }

    const jobId = crawlData.id;
    console.log('Firecrawl crawl started. Job ID:', jobId);

    // Poll for completion (max 3 minutes)
    let crawlResult = null;
    let attempts = 0;
    const maxAttempts = 90;

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000));
      
      const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        console.error('Status check failed:', statusResponse.status);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`Crawl status: ${statusData.status}, Pages: ${statusData.completed || 0}/${statusData.total || '?'}`);

      if (statusData.status === 'completed') {
        crawlResult = statusData.data || [];
        break;
      }

      if (statusData.status === 'failed') {
        throw new Error('Crawl failed');
      }

      attempts++;
    }

    if (!crawlResult) {
      throw new Error('Crawl timed out');
    }

    console.log('Crawl completed with', crawlResult.length, 'pages');

    // Combine all content
    let combinedContent = '';
    const allPages: { url: string; title: string; content: string }[] = [];

    for (const page of crawlResult) {
      const pageContent = page.markdown || '';
      if (pageContent) {
        combinedContent += pageContent + '\n\n';
        allPages.push({
          url: page.metadata?.sourceURL || page.url || '',
          title: page.metadata?.title || '',
          content: pageContent.substring(0, 2000),
        });
      }
    }

    // Analyze combined content
    let analysis = null;
    try {
      analysis = await analyzeBrandInfo(combinedContent.substring(0, 15000));
    } catch (e) {
      console.error('Analysis failed:', e);
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'SUCCEEDED',
      pagesFound: crawlResult.length,
      pages: allPages,
      combinedContent: combinedContent.substring(0, 50000),
      analysis,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in crawlMultiplePages:', error);
    throw error;
  }
}

// Helper function to extract products from content
function extractProducts(content: string, metadata: { title: string; headings: { level: number; text: string }[] }) {
  const products: string[] = [];
  
  for (const h of metadata.headings) {
    if (h.level <= 3 && h.text.length > 3 && h.text.length < 100) {
      const lowerText = h.text.toLowerCase();
      if (!lowerText.includes('kontakt') && 
          !lowerText.includes('impressum') &&
          !lowerText.includes('über uns') &&
          !lowerText.includes('datenschutz') &&
          !lowerText.includes('warenkorb') &&
          !lowerText.includes('menü')) {
        products.push(h.text);
      }
    }
  }
  
  return products.slice(0, 10);
}

// AI Analysis for brand information
async function analyzeBrandInfo(content: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.log('No LOVABLE_API_KEY, skipping AI analysis');
    return null;
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `Du bist ein SEO-Experte. Analysiere den Website-Content und extrahiere strukturierte Informationen.
            
Antworte NUR mit einem validen JSON-Objekt (ohne Markdown-Formatierung):
{
  "companyName": "Name des Unternehmens",
  "industry": "Branche",
  "targetAudience": "Zielgruppe",
  "mainProducts": ["Produkt 1", "Produkt 2"],
  "usps": ["USP 1", "USP 2"],
  "brandVoice": "Beschreibung des Tons (z.B. professionell, freundlich)",
  "claims": ["Claim oder Slogan 1"],
  "summary": "Kurze Zusammenfassung des Unternehmens (2-3 Sätze)"
}`
          },
          {
            role: 'user',
            content: `Analysiere diesen Website-Content:\n\n${content.substring(0, 8000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('AI analysis request failed:', response.status);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      return null;
    }

    try {
      let jsonStr = aiResponse.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return { rawAnalysis: aiResponse };
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}
