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

    console.log('Scraping website:', url, 'Mode:', mode);

    if (mode === 'multi') {
      // Multi-page crawling: Start crawl job and wait for completion
      return await crawlMultiplePages(url, FIRECRAWL_API_KEY);
    } else {
      // Single-page scraping
      return await scrapeSinglePage(url, FIRECRAWL_API_KEY);
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
        waitFor: 5000,
        timeout: 60000,
      }),
    });

    const data = await response.json();
    console.log('Firecrawl response status:', response.status, 'success:', data.success);
    
    if (!response.ok) {
      console.error('Firecrawl API error details:', data);
      
      // Handle timeout specifically
      if (response.status === 408 || data.code === 'SCRAPE_TIMEOUT') {
        return new Response(JSON.stringify({ 
          error: 'Website scraping timed out. Try a simpler page or use multi-page mode.',
          code: 'TIMEOUT',
          url: url
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Firecrawl API error: ${response.status} - ${data.error || 'Unknown error'}`);
    }
    
    if (!data.success) {
      throw new Error('Failed to scrape website: ' + (data.error || 'Unknown error'));
    }

    console.log('Successfully scraped single page');
    const structuredData = extractStructuredInfo(data.data);

    return new Response(JSON.stringify(structuredData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrapeSinglePage:', error);
    throw error;
  }
}

async function crawlMultiplePages(url: string, apiKey: string) {
  console.log('Starting multi-page crawl');
  
  // Start crawl job
  const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      limit: 50, // Maximum 50 pages
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
      },
      excludePaths: [
        '**/impressum*',
        '**/datenschutz*',
        '**/agb*',
        '**/kontakt*',
        '**/cart*',
        '**/checkout*',
      ],
    }),
  });

  if (!crawlResponse.ok) {
    const errorText = await crawlResponse.text();
    console.error('Firecrawl crawl start error:', crawlResponse.status, errorText);
    throw new Error(`Failed to start crawl: ${crawlResponse.status}`);
  }

  const crawlData = await crawlResponse.json();
  
  if (!crawlData.success || !crawlData.id) {
    throw new Error('Failed to start crawl job');
  }

  const jobId = crawlData.id;
  console.log('Crawl job started:', jobId);

  // Poll for completion (max 3 minutes)
  const maxAttempts = 36; // 36 * 5s = 3 minutes
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;

    const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      console.error('Failed to check crawl status');
      continue;
    }

    const statusData = await statusResponse.json();
    console.log('Crawl status:', statusData.status, `(${statusData.completed}/${statusData.total})`);

    if (statusData.status === 'completed') {
      console.log('Crawl completed successfully');
      
      // Combine all scraped pages
      const allContent = combineMultiplePages(statusData.data);
      
      return new Response(JSON.stringify(allContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (statusData.status === 'failed') {
      throw new Error('Crawl job failed');
    }
  }

  throw new Error('Crawl timeout after 3 minutes');
}

function extractStructuredInfo(scrapedData: any): any {
  const markdown = scrapedData.markdown || '';
  const metadata = scrapedData.metadata || {};
  
  // Extract key information from the markdown content
  const sections = markdown.split('\n## ');
  
  return {
    title: metadata.title || '',
    description: metadata.description || '',
    url: metadata.url || '',
    content: markdown,
    sections: sections.map((section: string) => {
      const lines = section.split('\n');
      return {
        heading: lines[0]?.replace(/^#+ /, ''),
        content: lines.slice(1).join('\n').trim()
      };
    }).filter((s: any) => s.heading),
    metadata: {
      language: metadata.language || 'de',
      keywords: metadata.keywords || [],
    },
    summary: markdown.substring(0, 500) + '...',
  };
}

function combineMultiplePages(pagesData: any[]): any {
  if (!pagesData || pagesData.length === 0) {
    throw new Error('No pages found in crawl result');
  }

  console.log(`Combining ${pagesData.length} pages`);

  // Combine all markdown content from all pages
  let combinedMarkdown = '';
  const allSections: any[] = [];
  const allUrls: string[] = [];
  const allKeywords: string[] = [];

  pagesData.forEach((page, index) => {
    const markdown = page.markdown || '';
    const metadata = page.metadata || {};
    
    if (markdown) {
      combinedMarkdown += `\n\n--- Seite ${index + 1}: ${metadata.title || metadata.url || 'Unbekannt'} ---\n\n`;
      combinedMarkdown += markdown;
      
      const pageSections = markdown.split('\n## ');
      pageSections.forEach((section: string) => {
        const lines = section.split('\n');
        const heading = lines[0]?.replace(/^#+ /, '');
        if (heading) {
          allSections.push({
            heading,
            content: lines.slice(1).join('\n').trim(),
            source: metadata.url || '',
          });
        }
      });
    }

    if (metadata.url) allUrls.push(metadata.url);
    if (metadata.keywords) allKeywords.push(...metadata.keywords);
  });

  // Remove duplicate keywords
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
