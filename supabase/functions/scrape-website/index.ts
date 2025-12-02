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

    console.log('Scraping website:', url, 'Mode:', mode);

    if (mode === 'multi') {
      return await startCrawl(url, APIFY_API_KEY);
    } else {
      return await scrapeSinglePage(url, APIFY_API_KEY);
    }
  } catch (error) {
    console.error('Error in scrape-website function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function scrapeSinglePage(url: string, apiKey: string) {
  console.log('Starting single-page scrape for:', url);
  
  try {
    const urlObj = new URL(url);
    const basePath = urlObj.pathname.endsWith('/') 
      ? urlObj.pathname 
      : urlObj.pathname + '/';
    const includePattern = basePath + '*';

    // Start Apify Website Content Crawler for single page
    const response = await fetch('https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [{ url }],
        crawlerType: 'cheerio',
        maxCrawlDepth: 0,
        maxCrawlPages: 1,
        initialCookies: [],
        proxyConfiguration: { useApifyProxy: true },
        readableTextCharThreshold: 100,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Apify API error:', errorData);
      throw new Error(`Apify API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const runData = await response.json();
    console.log('Apify run started:', runData.data.id);

    // Wait for completion (single page should be fast)
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runData.data.id}?token=${apiKey}`
      );
      const statusData = await statusResponse.json();

      console.log('Run status:', statusData.data.status);

      if (statusData.data.status === 'SUCCEEDED') {
        // Get results
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/actor-runs/${runData.data.id}/dataset/items?token=${apiKey}`
        );
        const results = await resultsResponse.json();

        if (!results || results.length === 0) {
          throw new Error('No data returned from crawl');
        }

        const pageData = results[0];
        console.log('Successfully scraped single page');

        const structuredData = extractStructuredInfo(pageData);
        
        // Add AI analysis for brand information
        let analysis = null;
        try {
          analysis = await analyzeBrandInfo(structuredData.content);
          console.log('AI analysis completed:', analysis ? 'Success' : 'No analysis returned');
        } catch (analysisError) {
          console.error('AI analysis failed, continuing without it:', analysisError);
        }

        return new Response(JSON.stringify({
          ...structuredData,
          success: true,
          analysis
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (statusData.data.status === 'FAILED' || statusData.data.status === 'ABORTED') {
        throw new Error(`Scrape ${statusData.data.status.toLowerCase()}`);
      }

      attempts++;
    }

    throw new Error('Scrape timed out');
  } catch (error) {
    console.error('Error in scrapeSinglePage:', error);
    throw error;
  }
}

async function startCrawl(url: string, apiKey: string) {
  console.log('Starting multi-page crawl for:', url);
  
  try {
    const urlObj = new URL(url);
    const basePath = urlObj.pathname.endsWith('/') 
      ? urlObj.pathname 
      : urlObj.pathname + '/';
    
    const includePattern = basePath === '/' ? '.*' : basePath + '.*';
    
    console.log('Crawl restricted to path:', includePattern);

    // Start Apify Website Content Crawler
    const response = await fetch('https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: [{ url }],
        crawlerType: 'cheerio',
        maxCrawlDepth: 2,
        maxCrawlPages: 50,
        includePaths: [includePattern],
        excludePaths: [
          'impressum',
          'datenschutz',
          'agb',
          'kontakt',
          'cart',
          'checkout',
          'privacy',
          'imprint',
          'legal',
          'terms',
          'account',
          'login',
        ],
        initialCookies: [],
        proxyConfiguration: { useApifyProxy: true },
        readableTextCharThreshold: 100,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Apify crawl error:', errorData);
      throw new Error(`Failed to start crawl: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const runData = await response.json();
    console.log('✅ Crawl started successfully. Run ID:', runData.data.id);
    
    return new Response(JSON.stringify({
      success: true,
      jobId: runData.data.id,
      runId: runData.data.id,
      status: 'started',
      message: 'Crawl job started successfully. Use runId to check status.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in startCrawl:', error);
    throw error;
  }
}

async function checkCrawlStatus(runId: string, apiKey: string) {
  try {
    console.log('Checking crawl status for run:', runId);
    
    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
    );

    if (!statusResponse.ok) {
      throw new Error(`Failed to check crawl status: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    const status = statusData.data.status;
    
    console.log('Crawl status:', status);

    // Get partial results even if not completed
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}`
    );
    const results = await resultsResponse.json();
    
    const crawledUrls = results.map((item: any) => item.url).filter(Boolean);
    const completed = results.length;

    console.log('Partial data available:', completed, 'pages');

    // If completed, process and return the data
    if (status === 'SUCCEEDED') {
      console.log('Crawl completed, processing data...');
      
      if (results.length === 0) {
        throw new Error('No pages were successfully crawled');
      }
      
      const allContent = combineMultiplePages(results);
      console.log('Combined content from', results.length, 'pages');
      
      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        data: allContent
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (status === 'FAILED' || status === 'ABORTED') {
      throw new Error(`Crawl ${status.toLowerCase()}`);
    }

    // Return current status with partial data
    return new Response(JSON.stringify({
      success: true,
      status: 'running',
      completed: completed,
      total: 50, // maxCrawlPages
      crawledUrls: crawledUrls,
      data: results || [],
      hasPartialData: results.length > 0,
      partialDataCount: results.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in checkCrawlStatus:', error);
    throw error;
  }
}

async function usePartialResults(runId: string, apiKey: string) {
  try {
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}`
    );

    if (!resultsResponse.ok) {
      throw new Error(`Failed to get crawl data: ${resultsResponse.status}`);
    }

    const results = await resultsResponse.json();
    console.log('Using partial results:', results.length, 'pages');

    if (results.length === 0) {
      throw new Error('No data available for partial results');
    }

    const combinedData = combineMultiplePages(results);

    return new Response(JSON.stringify({
      success: true,
      status: 'partial',
      data: combinedData,
      pageCount: results.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in usePartialResults:', error);
    throw error;
  }
}

function combineMultiplePages(pagesData: any[]): any {
  if (!pagesData || pagesData.length === 0) {
    throw new Error('No pages found in crawl result');
  }

  console.log(`Combining ${pagesData.length} pages`);

  let combinedMarkdown = '';
  const allSections: any[] = [];
  const allUrls: string[] = [];
  const allKeywords: string[] = [];

  pagesData.forEach((page, index) => {
    const text = page.text || '';
    const url = page.url || '';
    const title = page.metadata?.title || url;
    
    if (text) {
      combinedMarkdown += `\n\n--- Seite ${index + 1}: ${title} ---\n\n`;
      combinedMarkdown += text;
      
      // Extract sections from headings
      const headings = page.metadata?.headings || [];
      headings.forEach((heading: any) => {
        allSections.push({
          heading: heading.text,
          content: '',
          source: url,
        });
      });
    }

    if (url) allUrls.push(url);
    if (page.metadata?.keywords) allKeywords.push(...page.metadata.keywords);
  });

  const uniqueKeywords = [...new Set(allKeywords)];

  return {
    title: `Crawl-Ergebnis: ${pagesData.length} Seiten`,
    description: `Kombinierte Inhalte von ${pagesData.length} Unterseiten`,
    url: allUrls[0] || '',
    crawledUrls: allUrls,
    pageCount: pagesData.length,
    content: combinedMarkdown,
    sections: allSections,
    metadata: {
      language: 'de',
      keywords: uniqueKeywords,
    },
    summary: combinedMarkdown.substring(0, 800) + `... (${pagesData.length} Seiten analysiert)`,
  };
}

function extractStructuredInfo(scrapedData: any): any {
  const text = scrapedData.text || '';
  const metadata = scrapedData.metadata || {};
  
  // Extract sections from headings
  const headings = metadata.headings || [];
  const sections = headings.map((heading: any) => ({
    heading: heading.text,
    content: ''
  }));
  
  const detectedProducts = extractProducts(text, metadata);
  
  return {
    title: metadata.title || '',
    description: metadata.description || '',
    url: scrapedData.url || '',
    content: text,
    sections: sections,
    metadata: {
      language: metadata.languageCode || 'de',
      keywords: metadata.keywords || [],
    },
    detectedProducts,
    summary: text.substring(0, 500) + '...',
  };
}

function extractProducts(text: string, metadata: any): any {
  const lowerText = text.toLowerCase();
  
  const isCategoryPage = lowerText.includes('kategorie') || 
                         lowerText.includes('category') || 
                         lowerText.includes('produkte') ||
                         lowerText.includes('products') ||
                         lowerText.includes('sortiment') ||
                         lowerText.includes('shop');
  
  const headings = metadata.headings || [];
  const products: any[] = [];
  
  let category = '';
  if (isCategoryPage) {
    category = metadata.title || headings[0]?.text || 'Shop-Kategorie';
  }
  
  const productKeywords = ['produkt', 'product', 'artikel', 'item', 'modell', 'model', 'serie', 'series'];
  headings.forEach((heading: any) => {
    const lowerHeading = heading.text.toLowerCase();
    const hasProductKeyword = productKeywords.some(kw => lowerHeading.includes(kw));
    
    if (hasProductKeyword || (!isCategoryPage && heading.text.length < 100)) {
      products.push({
        name: heading.text.trim(),
        confidence: hasProductKeyword ? 'high' : 'medium',
      });
    }
  });
  
  return {
    isCategoryPage,
    category,
    detectedProducts: products.slice(0, 5),
    pageType: isCategoryPage ? 'category' : (products.length > 0 ? 'product' : 'general'),
  };
}

async function analyzeBrandInfo(content: string): Promise<any> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.log('LOVABLE_API_KEY not found, skipping AI analysis');
      return null;
    }

    const contentPreview = content.substring(0, 6000);
    
    const prompt = `Analysiere den folgenden Website-Content und extrahiere strukturierte Markeninformationen:

${contentPreview}

Gib ein JSON-Objekt zurück mit folgenden Feldern:
- companyName: Der Firmenname (string)
- industry: Die Branche (string)
- targetAudience: Die Zielgruppe (string, kurz beschrieben)
- uniqueSellingPoints: Array von 2-4 USPs (string[])
- mainProducts: Array von 2-4 Hauptprodukten/Services (string[])
- brandVoice: Beschreibung der Markenstimme (string, z.B. "professionell, innovativ, kundenorientiert")
- existingClaims: Falls vorhanden, bestehende Claims/Slogans (string[])

Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text.`;

    console.log('Sending AI analysis request...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du bist ein Marketing-Analyst. Analysiere Website-Content und extrahiere Markeninformationen.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return null;
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content || '';
    
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }
    
    return null;
  } catch (error) {
    console.error('Error in analyzeBrandInfo:', error);
    return null;
  }
}
