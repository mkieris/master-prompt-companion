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
    const { url } = await req.json();
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Scraping website:', url);

    // Call Firecrawl API to scrape the website
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl API error:', response.status, errorText);
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to scrape website');
    }

    console.log('Successfully scraped website');

    // Extract structured information from the scraped content
    const structuredData = extractStructuredInfo(data.data);

    return new Response(JSON.stringify(structuredData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrape-website function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
