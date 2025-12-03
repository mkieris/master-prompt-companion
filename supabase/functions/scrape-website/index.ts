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
    const { url, mode = 'single', action = 'scrape', runId } = await req.json();
    const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
    
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY is not configured');
    }

    // Handle different actions
    if (action === 'check-status' && runId) {
      console.log('Checking status for run:', runId);
      return await checkCrawlStatus(runId, APIFY_API_KEY);
    }

    if (action === 'use-partial' && runId) {
      console.log('Using partial results for run:', runId);
      return await usePartialResults(runId, APIFY_API_KEY);
    }

    if (!url) {
      throw new Error('URL is required');
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    console.log('Scraping website:', normalizedUrl, 'Mode:', mode);

    if (mode === 'multi') {
      return await startCrawl(normalizedUrl, APIFY_API_KEY);
    } else {
      return await scrapeSinglePage(normalizedUrl, APIFY_API_KEY);
    }
  } catch (error) {
    console.error('Error in scrape-website function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Single page scrape using Apify Web Scraper
async function scrapeSinglePage(url: string, apiKey: string) {
  console.log('Starting single-page scrape for:', url);
  
  try {
    // Use the website-content-crawler for single page - it's more reliable
    const actorInput = {
      startUrls: [{ url }],
      crawlerType: 'playwright:adaptive',
      maxCrawlPages: 1,
      maxCrawlDepth: 0,
      proxyConfiguration: { useApifyProxy: true },
      readableTextCharThreshold: 50,
    };

    console.log('Starting Apify website-content-crawler for single page...');
    
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actorInput),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apify start failed:', response.status, errorText);
      throw new Error(`Failed to start scraper: ${response.status}`);
    }

    const runData = await response.json();
    const runId = runData.data?.id;
    const datasetId = runData.data?.defaultDatasetId;
    
    if (!runId) {
      throw new Error('No run ID returned from Apify');
    }
    
    console.log('Apify run started:', runId, 'Dataset:', datasetId);

    // Poll for completion (max 90 seconds)
    let runStatus = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 45; // 45 * 2s = 90s

    while ((runStatus === 'RUNNING' || runStatus === 'READY') && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000));
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
      );
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.data?.status;
        console.log(`Status: ${runStatus} (attempt ${attempts + 1}/${maxAttempts})`);
      }
      attempts++;
    }

    if (runStatus !== 'SUCCEEDED') {
      console.error('Run did not succeed:', runStatus);
      throw new Error(`Scraping failed with status: ${runStatus}`);
    }

    // Get results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`
    );
    
    if (!resultsResponse.ok) {
      throw new Error('Failed to get results from dataset');
    }

    const results = await resultsResponse.json();
    console.log('Got results:', results.length, 'items');
    
    if (!results || results.length === 0) {
      throw new Error('No content retrieved from page');
    }

    const pageData = results[0];
    const content = pageData.text || pageData.markdown || '';
    const title = pageData.metadata?.title || pageData.title || '';
    const description = pageData.metadata?.description || '';
    
    console.log(`Content extracted: ${content.length} chars, Title: "${title}"`);

    if (content.length < 50) {
      throw new Error('Insufficient content extracted from page');
    }

    // Extract headings from content
    const headings = extractHeadingsFromMarkdown(pageData.markdown || content);

    const structuredData = {
      title,
      description,
      url,
      content,
      sections: headings.map(h => ({ heading: h.text, content: '' })),
      metadata: {
        language: pageData.metadata?.languageCode || 'de',
        keywords: [],
      },
      detectedProducts: extractProducts(content, { title, headings }),
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

// Multi-page crawl
async function startCrawl(url: string, apiKey: string) {
  console.log('Starting multi-page crawl for:', url);
  
  try {
    const urlObj = new URL(url);
    const basePath = urlObj.pathname.endsWith('/') 
      ? urlObj.pathname 
      : urlObj.pathname + '/';
    
    const includePattern = basePath === '/' ? '.*' : basePath + '.*';
    
    console.log('Crawl restricted to path:', includePattern);

    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url }],
          crawlerType: 'playwright:adaptive',
          maxCrawlDepth: 2,
          maxCrawlPages: 50,
          includePaths: [includePattern],
          excludePaths: [
            'impressum', 'datenschutz', 'agb', 'kontakt',
            'cart', 'checkout', 'privacy', 'imprint',
            'legal', 'terms', 'account', 'login',
          ],
          proxyConfiguration: { useApifyProxy: true },
          readableTextCharThreshold: 100,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Apify crawl error:', errorData);
      throw new Error(`Failed to start crawl: ${response.status}`);
    }

    const runData = await response.json();
    console.log('Crawl started. Run ID:', runData.data.id);
    
    return new Response(JSON.stringify({
      success: true,
      jobId: runData.data.id,
      runId: runData.data.id,
      datasetId: runData.data.defaultDatasetId,
      status: 'RUNNING',
      message: 'Crawl started successfully',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error starting crawl:', error);
    throw error;
  }
}

async function checkCrawlStatus(runId: string, apiKey: string) {
  try {
    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
    );

    if (!statusResponse.ok) {
      throw new Error(`Failed to get status: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    const runStatus = statusData.data.status;
    const datasetId = statusData.data.defaultDatasetId;

    console.log('Crawl status:', runStatus);

    if (runStatus === 'SUCCEEDED') {
      return await processCrawlResults(datasetId, apiKey);
    }

    return new Response(JSON.stringify({
      success: true,
      status: runStatus,
      runId,
      datasetId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking status:', error);
    throw error;
  }
}

async function usePartialResults(runId: string, apiKey: string) {
  try {
    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
    );
    
    if (!statusResponse.ok) {
      throw new Error('Failed to get run status');
    }
    
    const statusData = await statusResponse.json();
    const datasetId = statusData.data.defaultDatasetId;
    
    return await processCrawlResults(datasetId, apiKey);
  } catch (error) {
    console.error('Error getting partial results:', error);
    throw error;
  }
}

async function processCrawlResults(datasetId: string, apiKey: string) {
  const resultsResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`
  );

  if (!resultsResponse.ok) {
    throw new Error('Failed to get results');
  }

  const items = await resultsResponse.json();
  console.log('Got crawl results:', items.length, 'pages');

  // Combine all text content
  let combinedContent = '';
  const allPages: { url: string; title: string; content: string }[] = [];

  for (const item of items) {
    const pageContent = item.text || item.markdown || '';
    if (pageContent) {
      combinedContent += pageContent + '\n\n';
      allPages.push({
        url: item.url,
        title: item.metadata?.title || '',
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
    pagesFound: items.length,
    pages: allPages,
    combinedContent: combinedContent.substring(0, 50000),
    analysis,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper function to extract products from content
function extractProducts(content: string, metadata: { title: string; headings: { level: number; text: string }[] }) {
  const products: string[] = [];
  
  // Look for product-like headings
  for (const h of metadata.headings) {
    if (h.level <= 3 && h.text.length > 3 && h.text.length < 100) {
      // Exclude common non-product headings
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

    // Try to parse JSON from response
    try {
      // Remove markdown code blocks if present
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
