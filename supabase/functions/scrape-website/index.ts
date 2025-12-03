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

// NEW APPROACH: Extract content directly in browser with JavaScript
async function scrapeSinglePage(url: string, apiKey: string) {
  console.log('Starting single-page scrape for:', url);
  
  try {
    // Use Puppeteer with in-browser content extraction
    // This is more reliable than server-side regex parsing
    const result = await scrapeWithBrowserExtraction(url, apiKey);
    
    if (!result || !result.content || result.content.length < 50) {
      throw new Error('No content retrieved from page');
    }
    
    console.log(`Content extracted: ${result.content.length} chars`);
    
    const structuredData = {
      title: result.title || '',
      description: result.description || '',
      url,
      content: result.content,
      sections: result.headings?.map((h: any) => ({ heading: h.text, content: '' })) || [],
      metadata: {
        language: result.language || 'de',
        keywords: [],
      },
      detectedProducts: extractProducts(result.content, { title: result.title, headings: result.headings || [] }),
      summary: result.content.substring(0, 500) + '...',
    };
    
    // Add AI analysis for brand information
    let analysis = null;
    try {
      analysis = await analyzeBrandInfo(result.content);
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
  } catch (error) {
    console.error('Error in scrapeSinglePage:', error);
    throw error;
  }
}

// NEW: In-browser content extraction with Puppeteer
async function scrapeWithBrowserExtraction(url: string, apiKey: string): Promise<{
  content: string;
  title: string;
  description: string;
  language: string;
  headings: { level: number; text: string }[];
} | null> {
  try {
    console.log('Starting Puppeteer with in-browser extraction...');
    
    // The pageFunction runs IN THE BROWSER - no regex needed!
    const pageFunction = `
    async function pageFunction(context) {
      const { page, request, Apify } = context;
      
      // Wait for initial load
      await page.waitForTimeout(2000);
      
      // Scroll to trigger lazy-loading
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 400;
          const maxScrolls = 20;
          let scrollCount = 0;
          
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;
            scrollCount++;
            
            if (totalHeight >= document.body.scrollHeight || scrollCount >= maxScrolls) {
              clearInterval(timer);
              window.scrollTo(0, 0); // Scroll back to top
              resolve();
            }
          }, 150);
        });
      });
      
      // Wait for any lazy content to load
      await page.waitForTimeout(2000);
      
      // EXTRACT CONTENT DIRECTLY IN THE BROWSER
      const extractedData = await page.evaluate(() => {
        // Helper: Get text content without UI elements
        function getCleanText(element) {
          if (!element) return '';
          
          // Clone to avoid modifying the DOM
          const clone = element.cloneNode(true);
          
          // Remove unwanted elements
          const selectorsToRemove = [
            'script', 'style', 'noscript', 'svg', 'iframe',
            'nav', 'header', 'footer',
            'form', 'select', 'input', 'button', 'textarea',
            '[class*="nav"]', '[class*="menu"]', '[class*="sidebar"]',
            '[class*="cookie"]', '[class*="modal"]', '[class*="popup"]',
            '[class*="cart"]', '[class*="wishlist"]', '[class*="breadcrumb"]',
            '[class*="pagination"]', '[class*="social"]', '[class*="share"]',
            '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
            '[aria-hidden="true"]'
          ];
          
          selectorsToRemove.forEach(selector => {
            try {
              clone.querySelectorAll(selector).forEach(el => el.remove());
            } catch (e) {}
          });
          
          // Get innerText (browser handles all HTML-to-text conversion)
          return clone.innerText || clone.textContent || '';
        }
        
        // Try to find the main content area
        let mainContent = '';
        
        // Priority 1: main element
        const main = document.querySelector('main');
        if (main) {
          mainContent = getCleanText(main);
        }
        
        // Priority 2: article elements
        if (!mainContent || mainContent.length < 500) {
          const articles = document.querySelectorAll('article');
          if (articles.length > 0) {
            const articleText = Array.from(articles)
              .map(a => getCleanText(a))
              .join('\\n\\n');
            if (articleText.length > mainContent.length) {
              mainContent = articleText;
            }
          }
        }
        
        // Priority 3: content containers
        if (!mainContent || mainContent.length < 500) {
          const contentSelectors = [
            '[class*="content"]',
            '[class*="product"]',
            '[class*="description"]',
            '[id*="content"]',
            '.entry-content',
            '.post-content',
            '.page-content'
          ];
          
          for (const selector of contentSelectors) {
            try {
              const elements = document.querySelectorAll(selector);
              const combinedText = Array.from(elements)
                .map(el => getCleanText(el))
                .join('\\n\\n');
              if (combinedText.length > mainContent.length) {
                mainContent = combinedText;
              }
            } catch (e) {}
          }
        }
        
        // Priority 4: body fallback (but cleaned)
        if (!mainContent || mainContent.length < 300) {
          mainContent = getCleanText(document.body);
        }
        
        // Extract metadata
        const title = document.title || '';
        const descMeta = document.querySelector('meta[name="description"]');
        const description = descMeta ? descMeta.getAttribute('content') || '' : '';
        const lang = document.documentElement.lang || 'de';
        
        // Extract headings
        const headings = [];
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
          const text = h.innerText?.trim();
          if (text && text.length > 2 && text.length < 200) {
            headings.push({
              level: parseInt(h.tagName[1]),
              text: text
            });
          }
        });
        
        // Clean up the content
        let cleanContent = mainContent
          .replace(/\\t/g, ' ')
          .replace(/  +/g, ' ')
          .replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n')
          .trim();
        
        return {
          content: cleanContent,
          title,
          description,
          language: lang,
          headings
        };
      });
      
      console.log('Extracted content length:', extractedData.content?.length || 0);
      
      await Apify.pushData(extractedData);
    }
    `;

    const actorInput = {
      startUrls: [{ url }],
      pageFunction,
      proxyConfiguration: { useApifyProxy: true },
      maxRequestsPerCrawl: 1,
      maxConcurrency: 1,
    };

    const response = await fetch('https://api.apify.com/v2/acts/apify~puppeteer-scraper/runs?token=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorInput),
    });

    if (!response.ok) {
      console.error('Puppeteer start failed:', response.status);
      return null;
    }

    const runData = await response.json();
    const runId = runData.data?.id;
    const defaultDatasetId = runData.data?.defaultDatasetId;
    
    if (!runId) {
      console.error('No run ID returned');
      return null;
    }
    
    console.log('Apify puppeteer-scraper run started:', runId);

    // Poll for completion (max 2 minutes)
    let runStatus = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 60;

    while ((runStatus === 'RUNNING' || runStatus === 'READY') && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000));
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/apify~puppeteer-scraper/runs/${runId}?token=${apiKey}`);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.data?.status;
        console.log(`Puppeteer status: ${runStatus} (attempt ${attempts + 1}/${maxAttempts})`);
      }
      attempts++;
    }

    if (runStatus === 'SUCCEEDED') {
      const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${apiKey}`);
      
      if (resultsResponse.ok) {
        const results = await resultsResponse.json();
        if (results && results.length > 0) {
          const data = results[0];
          console.log(`Extraction successful: ${data.content?.length || 0} chars`);
          return {
            content: data.content || '',
            title: data.title || '',
            description: data.description || '',
            language: data.language || 'de',
            headings: data.headings || []
          };
        }
      }
    } else {
      console.error(`Apify run ended with status: ${runStatus}`);
    }
    
    return null;
  } catch (error) {
    console.error('Browser extraction error:', error);
    return null;
  }
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

    const response = await fetch('https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=' + apiKey, {
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
    });

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
    content: combinedContent.substring(0, 20000),
    pages: allPages.slice(0, 20),
    analysis,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper functions
function extractProducts(text: string, context: { title: string; headings: any[] }): string[] {
  const products: string[] = [];
  
  // Extract from headings
  context.headings?.forEach(h => {
    if (h.level <= 3 && h.text.length > 3 && h.text.length < 100) {
      products.push(h.text);
    }
  });
  
  return products.slice(0, 10);
}

async function analyzeBrandInfo(content: string) {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!OPENROUTER_API_KEY) {
    console.log('No OpenRouter API key, skipping AI analysis');
    return null;
  }

  console.log('Sending AI analysis request...');
  
  const truncatedContent = content.substring(0, 12000);
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `Analysiere Website-Inhalte und extrahiere strukturierte Informationen.
Antworte NUR mit validem JSON im folgenden Format:
{
  "companyName": "Firmenname",
  "industry": "Branche",
  "targetAudience": "Zielgruppe",
  "mainProducts": ["Produkt 1", "Produkt 2"],
  "usps": ["USP 1", "USP 2"],
  "brandVoice": "Beschreibung des Tonfalls",
  "claims": ["Slogan 1", "Claim 2"]
}`
        },
        {
          role: 'user',
          content: `Analysiere diese Website-Inhalte:\n\n${truncatedContent}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content;

  if (!aiResponse) {
    return null;
  }

  // Parse JSON response
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('JSON parse error:', e);
  }

  return null;
}
