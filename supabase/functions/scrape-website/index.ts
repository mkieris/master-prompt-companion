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

    // Normalize URL - add https:// if no protocol specified
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

async function scrapeSinglePage(url: string, apiKey: string) {
  console.log('Starting single-page scrape for:', url);
  
  try {
    // Step 1: Try fast direct fetch first
    console.log('Step 1: Trying fast direct fetch...');
    let html = '';
    let textContent = '';
    
    try {
      const directResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'de,en;q=0.9',
        },
      });
      
      if (directResponse.ok) {
        html = await directResponse.text();
        textContent = htmlToReadableText(html);
        console.log(`Direct fetch successful: HTML=${html.length}, Text=${textContent.length} chars`);
      }
    } catch (fetchError) {
      console.log('Direct fetch failed:', fetchError);
    }
    
    // Step 2: If content looks like SPA or is insufficient, use Puppeteer
    // Higher threshold to ensure we get complete content
    const needsJsRendering = html.length < 1000 || textContent.length < 500 || 
      (html.includes('__NEXT_DATA__') || html.includes('window.__INITIAL_STATE__') || 
       html.includes('id="root"') || html.includes('id="app"') ||
       // Check for lazy-loaded content indicators
       html.includes('data-lazy') || html.includes('loading="lazy"') ||
       // Check for tabs/accordions that might have hidden content
       html.includes('tab-content') || html.includes('accordion') ||
       html.includes('collapse'));
    
    if (needsJsRendering) {
      console.log('Step 2: Content appears to need JS rendering, using Puppeteer...');
      
      const puppeteerResult = await scrapeWithPuppeteer(url, apiKey);
      if (puppeteerResult) {
        html = puppeteerResult.html;
        textContent = htmlToReadableText(html);
        console.log(`Puppeteer scrape successful: HTML=${html.length}, Text=${textContent.length} chars`);
      }
    } else {
      console.log('Step 2: Skipping JS rendering - sufficient content found');
    }
    
    // Step 3: Final fallback with Googlebot UA if still no content
    if (textContent.length < 100) {
      console.log('Step 3: Still insufficient content, trying Googlebot fallback...');
      try {
        const googlebotResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        
        if (googlebotResponse.ok) {
          html = await googlebotResponse.text();
          textContent = htmlToReadableText(html);
          console.log(`Googlebot fallback: HTML=${html.length}, Text=${textContent.length} chars`);
        }
      } catch (e) {
        console.log('Googlebot fallback failed');
      }
    }
    
    if (!html || textContent.length < 50) {
      throw new Error('No content retrieved from page');
    }
    
    console.log(`Content extracted: HTML=${html.length} chars, Text=${textContent.length} chars`);
    
    // Extract metadata
    const title = extractMetaTag(html, 'title') || '';
    const description = extractMetaTag(html, 'description') || '';
    const headings = extractHeadings(html);
    
    const structuredData = {
      title,
      description,
      url,
      content: textContent,
      sections: headings.map(h => ({ heading: h.text, content: '' })),
      metadata: {
        language: extractLang(html) || 'de',
        keywords: [],
      },
      detectedProducts: extractProducts(textContent, { title, headings }),
      summary: textContent.substring(0, 500) + '...',
    };
    
    // Add AI analysis for brand information
    let analysis = null;
    try {
      analysis = await analyzeBrandInfo(textContent);
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

async function scrapeWithPuppeteer(url: string, apiKey: string): Promise<{ html: string } | null> {
  try {
    // Use puppeteer-scraper for proper JS rendering (same as SEO-Check)
    const actorInput = {
      startUrls: [{ url }],
      pageFunction: `async function pageFunction(context) {
        const { page, request, Apify } = context;
        
        // Wait for page to be fully loaded
        await page.waitForTimeout(3000);
        
        // Scroll to trigger lazy-loaded content
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
              window.scrollBy(0, distance);
              totalHeight += distance;
              if (totalHeight >= document.body.scrollHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 100);
            setTimeout(resolve, 5000);
          });
        });
        
        await page.waitForTimeout(2000);
        
        // Get the fully rendered HTML
        const html = await page.content();
        const title = await page.title();
        
        // Push to dataset
        await Apify.pushData({
          url: request.url,
          html: html,
          title: title,
        });
      }`,
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
    if (!runId) return null;
    
    console.log('Apify puppeteer-scraper run started:', runId);

    // Poll for completion (same as SEO-Check: 60 attempts, 2s interval = 2 min max)
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
        if (results && results.length > 0 && results[0].html) {
          console.log(`Apify Puppeteer successful: HTML length=${results[0].html.length}`);
          return { html: results[0].html };
        }
      }
    } else {
      console.error(`Apify run ended with status: ${runStatus}`);
    }
    
    return null;
  } catch (error) {
    console.error('Puppeteer scrape error:', error);
    return null;
  }
}

// Helper function to convert HTML to readable text - MAXIMALE Content-Extraktion
function htmlToReadableText(html: string): string {
  if (!html) return '';
  
  let workingHtml = html;
  
  // Step 1: Remove ONLY truly non-content elements (minimal removal)
  workingHtml = workingHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  workingHtml = workingHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  workingHtml = workingHtml.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  workingHtml = workingHtml.replace(/<!--[\s\S]*?-->/g, '');
  workingHtml = workingHtml.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  workingHtml = workingHtml.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove only input elements, NOT buttons (they might have text) or forms (they contain descriptions)
  workingHtml = workingHtml.replace(/<input[^>]*>/gi, '');
  workingHtml = workingHtml.replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '');
  
  // Step 2: Extract ALL content from main areas - use GREEDY matching for complete content
  let mainContent = '';
  
  // Priority 1: Look for <main> tag - use GREEDY match to get everything
  const mainMatch = workingHtml.match(/<main[^>]*>([\s\S]*)<\/main>/i);
  if (mainMatch && mainMatch[1].length > 500) {
    mainContent = mainMatch[1];
    console.log('Found <main> tag with FULL content:', mainContent.length, 'chars');
  }
  
  // Priority 2: Look for <article> tags - collect ALL of them
  if (!mainContent || mainContent.length < 1000) {
    const articleMatches = workingHtml.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi);
    let articles = '';
    for (const match of articleMatches) {
      articles += match[1] + '\n\n';
    }
    if (articles.length > (mainContent?.length || 0)) {
      mainContent = articles;
      console.log('Found <article> tags with content:', mainContent.length, 'chars');
    }
  }
  
  // Priority 3: Look for multiple content sections - COLLECT ALL, don't stop at first
  if (!mainContent || mainContent.length < 1000) {
    const contentSelectors = [
      // Product page specific selectors
      /class=["'][^"']*(?:product-description|cms-content|description-text|product-detail-description)[^"']*["']/gi,
      /class=["'][^"']*(?:product-info|product-content|product-text)[^"']*["']/gi,
      // Generic content selectors
      /class=["'][^"']*(?:content-section|text-content|main-content|page-content)[^"']*["']/gi,
    ];
    
    // Try to find all sections with these classes
    let combinedContent = mainContent || '';
    for (const selector of contentSelectors) {
      const sectionRegex = new RegExp(`<(?:div|section)[^>]*${selector.source}[^>]*>([\\s\\S]*?)<\\/(?:div|section)>`, 'gi');
      const matches = workingHtml.matchAll(sectionRegex);
      for (const match of matches) {
        if (match[1] && match[1].length > 100) {
          combinedContent += '\n\n' + match[1];
        }
      }
    }
    if (combinedContent.length > (mainContent?.length || 0)) {
      mainContent = combinedContent;
    }
  }
  
  // Priority 4: If still not enough, get BODY content
  if (!mainContent || mainContent.length < 500) {
    const bodyMatch = workingHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    mainContent = bodyMatch ? bodyMatch[1] : workingHtml;
    console.log('Fallback to full body content:', mainContent.length, 'chars');
  }
  
  // Step 3: Remove ONLY navigation, NOT headers/footers (they might have useful info)
  // Step 4: Convert remaining HTML to readable text
  let text = mainContent;
  
  // Step 5: Convert HTML to readable text with structure preservation
  
  // Convert headings to markdown-style (preserve structure)
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n');
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n');
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n');
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n');
  text = text.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n\n##### $1\n\n');
  text = text.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n\n###### $1\n\n');
  
  // Convert paragraphs and line breaks
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '');
  text = text.replace(/<\/section>/gi, '\n\n');
  text = text.replace(/<section[^>]*>/gi, '');
  text = text.replace(/<\/article>/gi, '\n\n');
  text = text.replace(/<article[^>]*>/gi, '');
  
  // Convert list items
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n');
  
  // Convert definition lists (often used for product specs)
  text = text.replace(/<dl[^>]*>/gi, '\n');
  text = text.replace(/<\/dl>/gi, '\n');
  text = text.replace(/<dt[^>]*>([\s\S]*?)<\/dt>/gi, '\n**$1**: ');
  text = text.replace(/<dd[^>]*>([\s\S]*?)<\/dd>/gi, '$1\n');
  
  // Convert tables to simple text
  text = text.replace(/<table[^>]*>/gi, '\n');
  text = text.replace(/<\/table>/gi, '\n');
  text = text.replace(/<thead[^>]*>/gi, '');
  text = text.replace(/<\/thead>/gi, '');
  text = text.replace(/<tbody[^>]*>/gi, '');
  text = text.replace(/<\/tbody>/gi, '');
  text = text.replace(/<tr[^>]*>/gi, '\n');
  text = text.replace(/<\/tr>/gi, '');
  text = text.replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, ' $1 |');
  text = text.replace(/<th[^>]*>([\s\S]*?)<\/th>/gi, ' **$1** |');
  
  // Extract link text
  text = text.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  
  // Convert strong/bold
  text = text.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
  
  // Convert emphasis/italic  
  text = text.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');
  
  // Convert blockquotes
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n');
  
  // Convert spans (just extract text)
  text = text.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  
  // Convert buttons (extract text, they often have important labels)
  text = text.replace(/<button[^>]*>([\s\S]*?)<\/button>/gi, ' $1 ');
  
  // Convert labels
  text = text.replace(/<label[^>]*>([\s\S]*?)<\/label>/gi, '$1');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&auml;/gi, 'ä')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&szlig;/gi, 'ß')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&[a-z]+;/gi, ' ');
  
  // Clean up whitespace while preserving paragraph breaks
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  text = text.trim();
  
  // Step 6: Light cleanup - remove only the most obvious UI garbage
  // But keep product descriptions, prices can be useful context, etc.
  text = text.replace(/In den Warenkorb/gi, '');
  text = text.replace(/Auf die Merkliste/gi, '');
  text = text.replace(/Zur Wunschliste hinzufügen/gi, '');
  text = text.replace(/Jetzt kaufen/gi, '');
  text = text.replace(/Weiterlesen/gi, '');
  text = text.replace(/Mehr erfahren/gi, '');
  text = text.replace(/Cookie.*?akzeptieren/gi, '');
  text = text.replace(/Alle Cookies akzeptieren/gi, '');
  
  return text;
}

function extractMetaTag(html: string, name: string): string {
  if (name === 'title') {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? match[1].trim() : '';
  }
  
  const metaMatch = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
                    html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'));
  return metaMatch ? metaMatch[1].trim() : '';
}

function extractLang(html: string): string {
  const match = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  return match ? match[1] : '';
}

function extractHeadings(html: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  const regex = /<h([1-6])[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/h[1-6]>/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (text) {
      headings.push({ level: parseInt(match[1]), text });
    }
  }
  
  return headings;
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
