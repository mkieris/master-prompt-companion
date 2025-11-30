import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinkInfo {
  url: string;
  text: string;
  hasNofollow: boolean;
}

interface HeadingInfo {
  level: number;
  text: string;
  hasIssue: boolean;
  issue?: string;
}

interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
}

interface HreflangInfo {
  lang: string;
  url: string;
  hasIssue: boolean;
  issue?: string;
}

interface SecurityHeaderInfo {
  name: string;
  present: boolean;
  value?: string;
  recommendation?: string;
}

interface KeywordAnalysis {
  keyword: string;
  density: number;
  inTitle: boolean;
  inH1: boolean;
  inUrl: boolean;
  inDescription: boolean;
  occurrences: number;
}

interface SEOCheckResult {
  url: string;
  timestamp: string;
  score: number;
  categories: {
    meta: CategoryResult;
    content: CategoryResult;
    technical: CategoryResult;
    links: CategoryResult;
    media: CategoryResult;
    security: CategoryResult;
  };
  issues: SEOIssue[];
  recommendations: string[];
  contentData: {
    markdown: string;
    wordCount: number;
    headings: HeadingInfo[];
    readabilityScore: number;
    readabilityLevel: string;
    avgSentenceLength: number;
    avgWordLength: number;
  };
  linkData: {
    internal: LinkInfo[];
    external: LinkInfo[];
  };
  mediaData: {
    images: ImageInfo[];
    imagesWithoutAlt: ImageInfo[];
  };
  metaData: {
    title: string;
    description: string;
    canonical: string;
    robots: string;
    hreflang: HreflangInfo[];
  };
  keywordData: KeywordAnalysis | null;
  securityData: {
    isHttps: boolean;
    headers: SecurityHeaderInfo[];
  };
  urlData: {
    hasUppercase: boolean;
    hasParameters: boolean;
    hasUnderscores: boolean;
    length: number;
    depth: number;
  };
}

interface CategoryResult {
  score: number;
  maxScore: number;
  checks: CheckResult[];
}

interface CheckResult {
  name: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  value?: string | number;
  recommendation?: string;
}

interface SEOIssue {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, mode, keyword } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting SEO check for: ${url}, mode: ${mode}, keyword: ${keyword || 'none'}`);

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape the page with Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'link', 'script'],
        waitFor: 3000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to scrape website', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    console.log('Scrape successful, analyzing...');

    if (!scrapeData.success || !scrapeData.data) {
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve page data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pageData = scrapeData.data;
    const html = pageData.html || '';
    const markdown = pageData.markdown || '';
    const metadata = pageData.metadata || {};
    const responseHeaders = scrapeData.data.headers || {};

    // Perform comprehensive SEO analysis
    const result = analyzeSEO(url, html, markdown, metadata, responseHeaders, keyword);

    console.log(`SEO check completed. Score: ${result.score}/100`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SEO check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Calculate Flesch Reading Ease for German text
function calculateFleschDE(text: string): { score: number; level: string; avgSentenceLength: number; avgWordLength: number } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length === 0 || sentences.length === 0) {
    return { score: 0, level: 'Nicht berechenbar', avgSentenceLength: 0, avgWordLength: 0 };
  }
  
  // Count syllables (simplified German approximation)
  const countSyllables = (word: string): number => {
    const vowels = word.toLowerCase().match(/[aeiouäöü]/gi);
    return vowels ? vowels.length : 1;
  };
  
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  
  // German Flesch formula: 180 - ASL - (58.5 * ASW)
  const score = Math.round(180 - avgSentenceLength - (58.5 * avgSyllablesPerWord));
  
  let level: string;
  if (score >= 80) level = 'Sehr leicht';
  else if (score >= 60) level = 'Leicht';
  else if (score >= 40) level = 'Mittelschwer';
  else if (score >= 20) level = 'Schwer';
  else level = 'Sehr schwer';
  
  return { 
    score: Math.max(0, Math.min(100, score)), 
    level, 
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10
  };
}

// Analyze keyword usage
function analyzeKeyword(keyword: string, text: string, title: string, h1: string, url: string, description: string): KeywordAnalysis {
  const lowerKeyword = keyword.toLowerCase();
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/).filter(w => w.length > 0);
  
  // Count exact and partial matches
  const keywordWords = lowerKeyword.split(/\s+/);
  let occurrences = 0;
  
  if (keywordWords.length === 1) {
    occurrences = words.filter(w => w.includes(lowerKeyword)).length;
  } else {
    // Multi-word keyword - count phrase occurrences
    const regex = new RegExp(lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lowerText.match(regex);
    occurrences = matches ? matches.length : 0;
  }
  
  const density = words.length > 0 ? (occurrences / words.length) * 100 : 0;
  
  return {
    keyword,
    density: Math.round(density * 100) / 100,
    inTitle: title.toLowerCase().includes(lowerKeyword),
    inH1: h1.toLowerCase().includes(lowerKeyword),
    inUrl: url.toLowerCase().includes(lowerKeyword.replace(/\s+/g, '-')),
    inDescription: description.toLowerCase().includes(lowerKeyword),
    occurrences,
  };
}

function analyzeSEO(url: string, html: string, markdown: string, metadata: any, responseHeaders: any, keyword?: string): SEOCheckResult {
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];
  const urlObj = new URL(url);

  // === URL ANALYSIS ===
  const urlPath = urlObj.pathname;
  const urlData = {
    hasUppercase: /[A-Z]/.test(urlPath),
    hasParameters: urlObj.search.length > 0,
    hasUnderscores: urlPath.includes('_'),
    length: urlPath.length,
    depth: urlPath.split('/').filter(p => p.length > 0).length,
  };

  // === META ANALYSIS ===
  const metaChecks: CheckResult[] = [];

  // Title Tag
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : metadata.title || '';
  const titleLength = title.length;
  
  metaChecks.push({
    name: 'Title Tag vorhanden',
    passed: titleLength > 0,
    severity: 'critical',
    message: titleLength > 0 ? `Title gefunden: "${title.substring(0, 60)}${title.length > 60 ? '...' : ''}"` : 'Kein Title Tag gefunden',
    value: title,
    recommendation: titleLength === 0 ? 'Fügen Sie einen aussagekräftigen Title Tag hinzu' : undefined,
  });

  metaChecks.push({
    name: 'Title Länge (50-60 Zeichen)',
    passed: titleLength >= 50 && titleLength <= 60,
    severity: titleLength === 0 ? 'critical' : (titleLength < 30 || titleLength > 70 ? 'warning' : 'info'),
    message: `Title hat ${titleLength} Zeichen`,
    value: titleLength,
    recommendation: titleLength < 50 ? 'Title ist zu kurz, erweitern Sie ihn auf 50-60 Zeichen' : 
                   titleLength > 60 ? 'Title ist zu lang, kürzen Sie ihn auf 50-60 Zeichen' : undefined,
  });

  if (titleLength === 0) {
    issues.push({
      category: 'Meta',
      severity: 'critical',
      title: 'Fehlender Title Tag',
      description: 'Die Seite hat keinen Title Tag, der für SEO essentiell ist.',
      recommendation: 'Fügen Sie einen einzigartigen, beschreibenden Title Tag mit 50-60 Zeichen hinzu.',
    });
  }

  // Meta Description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : metadata.description || '';
  const descLength = description.length;

  metaChecks.push({
    name: 'Meta Description vorhanden',
    passed: descLength > 0,
    severity: 'critical',
    message: descLength > 0 ? `Description gefunden (${descLength} Zeichen)` : 'Keine Meta Description gefunden',
    value: description,
    recommendation: descLength === 0 ? 'Fügen Sie eine Meta Description hinzu' : undefined,
  });

  metaChecks.push({
    name: 'Meta Description Länge (150-160 Zeichen)',
    passed: descLength >= 150 && descLength <= 160,
    severity: descLength === 0 ? 'critical' : (descLength < 120 || descLength > 170 ? 'warning' : 'info'),
    message: `Description hat ${descLength} Zeichen`,
    value: descLength,
    recommendation: descLength < 150 ? 'Meta Description ist zu kurz' : 
                   descLength > 160 ? 'Meta Description ist zu lang' : undefined,
  });

  // Canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : '';
  
  // Check for canonical issues
  const canonicalIsRelative = canonical.startsWith('/');
  const canonicalMatchesUrl = canonical === url || canonical === url.replace(/\/$/, '') || canonical === url + '/';
  
  metaChecks.push({
    name: 'Canonical URL vorhanden',
    passed: canonical.length > 0,
    severity: 'warning',
    message: canonical ? `Canonical: ${canonical}` : 'Kein Canonical Tag gefunden',
    value: canonical,
    recommendation: !canonical ? 'Fügen Sie einen Canonical Tag hinzu' : undefined,
  });

  if (canonical && canonicalIsRelative) {
    metaChecks.push({
      name: 'Canonical ist absolut',
      passed: false,
      severity: 'warning',
      message: 'Canonical URL ist relativ statt absolut',
      recommendation: 'Verwenden Sie absolute URLs für Canonical Tags',
    });
  }

  // Viewport Meta
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*/i);
  metaChecks.push({
    name: 'Viewport Meta Tag',
    passed: !!viewportMatch,
    severity: 'critical',
    message: viewportMatch ? 'Viewport Tag vorhanden' : 'Kein Viewport Tag gefunden',
    recommendation: !viewportMatch ? 'Fügen Sie einen Viewport Meta Tag hinzu' : undefined,
  });

  // Robots Meta
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const robots = robotsMatch ? robotsMatch[1] : '';
  const isIndexable = !robots.toLowerCase().includes('noindex');
  
  metaChecks.push({
    name: 'Indexierbar (kein noindex)',
    passed: isIndexable,
    severity: 'info',
    message: robots ? `Robots: ${robots}` : 'Kein Robots Tag (standardmäßig indexierbar)',
    value: robots || 'index, follow',
  });

  // Open Graph
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*/i);
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*/i);
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*/i);
  
  metaChecks.push({
    name: 'Open Graph Tags',
    passed: !!(ogTitle && ogDesc && ogImage),
    severity: 'warning',
    message: `OG Tags: Title ${ogTitle ? '✓' : '✗'}, Description ${ogDesc ? '✓' : '✗'}, Image ${ogImage ? '✓' : '✗'}`,
    recommendation: !(ogTitle && ogDesc && ogImage) ? 'Vervollständigen Sie die Open Graph Tags' : undefined,
  });

  // === HREFLANG ANALYSIS ===
  const hreflangMatches = html.matchAll(/<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']*)["'][^>]*href=["']([^"']*)["']/gi);
  const hreflangList: HreflangInfo[] = [];
  
  for (const match of hreflangMatches) {
    const lang = match[1];
    const hrefUrl = match[2];
    let hasIssue = false;
    let issue: string | undefined;
    
    if (!hrefUrl.startsWith('http')) {
      hasIssue = true;
      issue = 'Hreflang URL sollte absolut sein';
    }
    
    hreflangList.push({ lang, url: hrefUrl, hasIssue, issue });
  }

  // Check for x-default
  const hasXDefault = hreflangList.some(h => h.lang === 'x-default');
  if (hreflangList.length > 0 && !hasXDefault) {
    metaChecks.push({
      name: 'Hreflang x-default vorhanden',
      passed: false,
      severity: 'warning',
      message: 'Kein x-default hreflang Tag gefunden',
      recommendation: 'Fügen Sie einen x-default hreflang Tag für die Standardsprache hinzu',
    });
  }

  if (hreflangList.length > 0) {
    metaChecks.push({
      name: 'Hreflang Tags vorhanden',
      passed: true,
      severity: 'info',
      message: `${hreflangList.length} Hreflang Tags gefunden`,
      value: hreflangList.length,
    });
  }

  // === CONTENT ANALYSIS ===
  const contentChecks: CheckResult[] = [];

  // Extract all headings for detailed view
  const headingsList: HeadingInfo[] = [];
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let headingMatch;
  let lastLevel = 0;
  
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    const level = parseInt(headingMatch[1]);
    const text = headingMatch[2].replace(/<[^>]*>/g, '').trim();
    
    let hasIssue = false;
    let issue: string | undefined;
    
    if (level > lastLevel + 1 && lastLevel !== 0) {
      hasIssue = true;
      issue = `Sprung von H${lastLevel} zu H${level}`;
    }
    
    headingsList.push({ level, text, hasIssue, issue });
    lastLevel = level;
  }

  // H1 Tag
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Count = h1Matches.length;
  const h1Text = h1Matches[0]?.replace(/<[^>]*>/g, '').trim() || '';
  
  if (h1Count === 0) {
    headingsList.unshift({ level: 1, text: '(Keine H1 vorhanden)', hasIssue: true, issue: 'H1 fehlt komplett' });
  } else if (h1Count > 1) {
    headingsList.forEach(h => {
      if (h.level === 1) {
        h.hasIssue = true;
        h.issue = 'Mehrere H1-Tags gefunden';
      }
    });
  }
  
  contentChecks.push({
    name: 'H1 Überschrift vorhanden',
    passed: h1Count === 1,
    severity: h1Count === 0 ? 'critical' : (h1Count > 1 ? 'warning' : 'info'),
    message: h1Count === 0 ? 'Keine H1 gefunden' : 
             h1Count === 1 ? `H1: "${h1Text.substring(0, 50)}${h1Text.length > 50 ? '...' : ''}"` : 
             `${h1Count} H1 Tags gefunden`,
    value: h1Count,
    recommendation: h1Count === 0 ? 'Fügen Sie genau eine H1 hinzu' : 
                   h1Count > 1 ? 'Reduzieren Sie auf eine H1' : undefined,
  });

  // Title vs H1 check
  if (title && h1Text && title.toLowerCase() === h1Text.toLowerCase()) {
    contentChecks.push({
      name: 'Title unterscheidet sich von H1',
      passed: false,
      severity: 'info',
      message: 'Title und H1 sind identisch',
      recommendation: 'Variieren Sie Title und H1 leicht für mehr Keyword-Vielfalt',
    });
  }

  // Heading Structure
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
  const h4Count = (html.match(/<h4[^>]*>/gi) || []).length;
  
  contentChecks.push({
    name: 'Überschriften-Struktur',
    passed: h2Count > 0,
    severity: h2Count === 0 ? 'warning' : 'info',
    message: `H1: ${h1Count}, H2: ${h2Count}, H3: ${h3Count}, H4: ${h4Count}`,
    value: `${h1Count}-${h2Count}-${h3Count}-${h4Count}`,
    recommendation: h2Count === 0 ? 'Strukturieren Sie den Content mit H2 Unterüberschriften' : undefined,
  });

  // Word Count
  const textContent = markdown.replace(/[#*\[\]()_`]/g, '').trim();
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
  
  contentChecks.push({
    name: 'Textlänge (min. 300 Wörter)',
    passed: wordCount >= 300,
    severity: wordCount < 300 ? 'warning' : 'info',
    message: `${wordCount} Wörter`,
    value: wordCount,
    recommendation: wordCount < 300 ? 'Erweitern Sie den Content auf mindestens 300 Wörter' : undefined,
  });

  // Readability Score
  const readability = calculateFleschDE(textContent);
  
  contentChecks.push({
    name: 'Lesbarkeit (Flesch DE)',
    passed: readability.score >= 40,
    severity: readability.score < 30 ? 'warning' : 'info',
    message: `Score: ${readability.score} - ${readability.level}`,
    value: readability.score,
    recommendation: readability.score < 40 ? 'Vereinfachen Sie Satzstruktur und Wortwahl' : undefined,
  });

  contentChecks.push({
    name: 'Durchschnittliche Satzlänge',
    passed: readability.avgSentenceLength <= 20,
    severity: readability.avgSentenceLength > 25 ? 'warning' : 'info',
    message: `${readability.avgSentenceLength} Wörter pro Satz`,
    value: readability.avgSentenceLength,
    recommendation: readability.avgSentenceLength > 20 ? 'Kürzen Sie lange Sätze für bessere Lesbarkeit' : undefined,
  });

  // Structured Data
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  
  contentChecks.push({
    name: 'Strukturierte Daten (Schema.org)',
    passed: jsonLdMatches.length > 0,
    severity: 'warning',
    message: jsonLdMatches.length > 0 ? `${jsonLdMatches.length} Schema(s) gefunden` : 'Keine strukturierten Daten',
    value: jsonLdMatches.length,
    recommendation: jsonLdMatches.length === 0 ? 'Fügen Sie Schema.org Markup hinzu' : undefined,
  });

  // === KEYWORD ANALYSIS ===
  let keywordData: KeywordAnalysis | null = null;
  
  if (keyword && keyword.trim().length > 0) {
    keywordData = analyzeKeyword(keyword.trim(), textContent, title, h1Text, url, description);
    
    contentChecks.push({
      name: 'Keyword in Title',
      passed: keywordData.inTitle,
      severity: keywordData.inTitle ? 'info' : 'warning',
      message: keywordData.inTitle ? 'Keyword im Title enthalten' : 'Keyword fehlt im Title',
      recommendation: !keywordData.inTitle ? 'Fügen Sie das Keyword zum Title hinzu' : undefined,
    });

    contentChecks.push({
      name: 'Keyword in H1',
      passed: keywordData.inH1,
      severity: keywordData.inH1 ? 'info' : 'warning',
      message: keywordData.inH1 ? 'Keyword in H1 enthalten' : 'Keyword fehlt in H1',
      recommendation: !keywordData.inH1 ? 'Fügen Sie das Keyword zur H1 hinzu' : undefined,
    });

    contentChecks.push({
      name: 'Keyword-Dichte (1-3%)',
      passed: keywordData.density >= 1 && keywordData.density <= 3,
      severity: keywordData.density < 0.5 || keywordData.density > 4 ? 'warning' : 'info',
      message: `${keywordData.density}% (${keywordData.occurrences}x)`,
      value: keywordData.density,
      recommendation: keywordData.density < 1 ? 'Erhöhen Sie die Keyword-Dichte' : 
                     keywordData.density > 3 ? 'Reduzieren Sie die Keyword-Dichte' : undefined,
    });
  }

  // === TECHNICAL ANALYSIS ===
  const technicalChecks: CheckResult[] = [];

  // URL Structure
  technicalChecks.push({
    name: 'Saubere URL-Struktur',
    passed: !urlData.hasUppercase && !urlData.hasParameters && !urlData.hasUnderscores,
    severity: urlData.hasUppercase || urlData.hasParameters ? 'warning' : 'info',
    message: `Länge: ${urlData.length}, Tiefe: ${urlData.depth}`,
    value: urlPath,
  });

  if (urlData.hasUppercase) {
    technicalChecks.push({
      name: 'URL kleingeschrieben',
      passed: false,
      severity: 'warning',
      message: 'URL enthält Großbuchstaben',
      recommendation: 'Verwenden Sie ausschließlich Kleinbuchstaben in URLs',
    });
  }

  if (urlData.hasUnderscores) {
    technicalChecks.push({
      name: 'URL ohne Unterstriche',
      passed: false,
      severity: 'info',
      message: 'URL enthält Unterstriche',
      recommendation: 'Verwenden Sie Bindestriche statt Unterstriche',
    });
  }

  if (urlData.length > 115) {
    technicalChecks.push({
      name: 'URL-Länge optimal',
      passed: false,
      severity: 'warning',
      message: `URL hat ${urlData.length} Zeichen (max. 115 empfohlen)`,
      recommendation: 'Kürzen Sie die URL auf unter 115 Zeichen',
    });
  }

  // HTTPS
  const isHttps = urlObj.protocol === 'https:';
  technicalChecks.push({
    name: 'HTTPS',
    passed: isHttps,
    severity: isHttps ? 'info' : 'critical',
    message: isHttps ? 'HTTPS aktiv' : 'Kein HTTPS!',
    recommendation: !isHttps ? 'Migrieren Sie zu HTTPS' : undefined,
  });

  // Language Tag
  const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  const language = langMatch ? langMatch[1] : '';
  
  technicalChecks.push({
    name: 'Sprach-Attribut',
    passed: language.length > 0,
    severity: 'warning',
    message: language ? `Sprache: ${language}` : 'Kein lang-Attribut',
    value: language,
    recommendation: !language ? 'Fügen Sie lang="de" zum HTML-Tag hinzu' : undefined,
  });

  // Character Encoding
  const charsetMatch = html.match(/<meta[^>]*charset=["']?([^"'\s>]*)["']?/i);
  const charset = charsetMatch ? charsetMatch[1].toUpperCase() : '';
  
  technicalChecks.push({
    name: 'UTF-8 Encoding',
    passed: charset === 'UTF-8',
    severity: charset === 'UTF-8' ? 'info' : 'warning',
    message: charset ? `Charset: ${charset}` : 'Kein Charset',
    value: charset,
    recommendation: charset !== 'UTF-8' ? 'Verwenden Sie UTF-8' : undefined,
  });

  // === SECURITY ANALYSIS ===
  const securityChecks: CheckResult[] = [];
  const securityHeaders: SecurityHeaderInfo[] = [];

  // HSTS Header
  const hstsPresent = responseHeaders['strict-transport-security'] !== undefined;
  securityHeaders.push({
    name: 'Strict-Transport-Security (HSTS)',
    present: hstsPresent,
    value: responseHeaders['strict-transport-security'],
    recommendation: !hstsPresent ? 'Aktivieren Sie HSTS für sichere Verbindungen' : undefined,
  });

  // CSP Header
  const cspPresent = responseHeaders['content-security-policy'] !== undefined;
  securityHeaders.push({
    name: 'Content-Security-Policy',
    present: cspPresent,
    value: responseHeaders['content-security-policy']?.substring(0, 100),
    recommendation: !cspPresent ? 'Implementieren Sie eine Content Security Policy' : undefined,
  });

  // X-Frame-Options
  const xfoPresent = responseHeaders['x-frame-options'] !== undefined;
  securityHeaders.push({
    name: 'X-Frame-Options',
    present: xfoPresent,
    value: responseHeaders['x-frame-options'],
    recommendation: !xfoPresent ? 'Setzen Sie X-Frame-Options gegen Clickjacking' : undefined,
  });

  // X-Content-Type-Options
  const xctoPresent = responseHeaders['x-content-type-options'] !== undefined;
  securityHeaders.push({
    name: 'X-Content-Type-Options',
    present: xctoPresent,
    value: responseHeaders['x-content-type-options'],
    recommendation: !xctoPresent ? 'Setzen Sie X-Content-Type-Options: nosniff' : undefined,
  });

  const presentHeaders = securityHeaders.filter(h => h.present).length;
  
  securityChecks.push({
    name: 'HTTPS aktiv',
    passed: isHttps,
    severity: isHttps ? 'info' : 'critical',
    message: isHttps ? 'Verbindung ist verschlüsselt' : 'Keine Verschlüsselung',
  });

  securityChecks.push({
    name: 'Security Headers',
    passed: presentHeaders >= 2,
    severity: presentHeaders < 2 ? 'warning' : 'info',
    message: `${presentHeaders} von ${securityHeaders.length} Headers vorhanden`,
    value: presentHeaders,
    recommendation: presentHeaders < 2 ? 'Implementieren Sie wichtige Security Headers' : undefined,
  });

  // Mixed Content Check
  const mixedContent = html.match(/src=["']http:\/\//gi) || [];
  if (isHttps && mixedContent.length > 0) {
    securityChecks.push({
      name: 'Kein Mixed Content',
      passed: false,
      severity: 'warning',
      message: `${mixedContent.length} HTTP-Ressourcen auf HTTPS-Seite`,
      recommendation: 'Ändern Sie alle HTTP-URLs zu HTTPS',
    });
  }

  // === LINKS ANALYSIS ===
  const linkChecks: CheckResult[] = [];
  const allLinks = html.match(/<a[^>]*href=["'][^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || [];
  
  const internalLinksList: LinkInfo[] = [];
  const externalLinksList: LinkInfo[] = [];
  
  allLinks.forEach(link => {
    const hrefMatch = link.match(/href=["']([^"']*)["']/i);
    if (!hrefMatch) return;
    
    const href = hrefMatch[1];
    const textMatch = link.match(/>([^<]*)</);
    const text = textMatch ? textMatch[1].trim() : '';
    const hasNofollow = link.toLowerCase().includes('nofollow');
    
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    
    const isInternal = href.startsWith('/') || href.includes(urlObj.hostname);
    const isExternal = href.startsWith('http') && !href.includes(urlObj.hostname);
    
    if (isInternal) {
      internalLinksList.push({ url: href, text: text || href, hasNofollow });
    } else if (isExternal) {
      externalLinksList.push({ url: href, text: text || href, hasNofollow });
    }
  });

  linkChecks.push({
    name: 'Interne Links',
    passed: internalLinksList.length >= 3,
    severity: internalLinksList.length < 3 ? 'warning' : 'info',
    message: `${internalLinksList.length} interne Links`,
    value: internalLinksList.length,
    recommendation: internalLinksList.length < 3 ? 'Fügen Sie mehr interne Links hinzu' : undefined,
  });

  linkChecks.push({
    name: 'Externe Links',
    passed: externalLinksList.length > 0,
    severity: 'info',
    message: `${externalLinksList.length} externe Links`,
    value: externalLinksList.length,
  });

  // Empty anchor texts
  const emptyAnchors = [...internalLinksList, ...externalLinksList].filter(l => l.text.length === 0);
  if (emptyAnchors.length > 0) {
    linkChecks.push({
      name: 'Links mit Ankertext',
      passed: false,
      severity: 'warning',
      message: `${emptyAnchors.length} Links ohne Ankertext`,
      recommendation: 'Fügen Sie beschreibende Ankertexte zu allen Links hinzu',
    });
  }

  // === MEDIA ANALYSIS ===
  const mediaChecks: CheckResult[] = [];
  const imageMatches = html.match(/<img[^>]*>/gi) || [];
  const imagesList: ImageInfo[] = [];
  const imagesWithoutAltList: ImageInfo[] = [];
  
  imageMatches.forEach(img => {
    const srcMatch = img.match(/src=["']([^"']*)["']/i);
    const altMatch = img.match(/alt=["']([^"']*)["']/i);
    
    const src = srcMatch ? srcMatch[1] : '';
    const alt = altMatch ? altMatch[1].trim() : '';
    const hasAlt = alt.length > 0;
    
    const imageInfo: ImageInfo = { src, alt, hasAlt };
    imagesList.push(imageInfo);
    
    if (!hasAlt) {
      imagesWithoutAltList.push(imageInfo);
    }
  });

  mediaChecks.push({
    name: 'Bilder mit Alt-Text',
    passed: imagesList.length === 0 || imagesWithoutAltList.length === 0,
    severity: imagesWithoutAltList.length > 0 ? 'warning' : 'info',
    message: `${imagesList.length - imagesWithoutAltList.length} von ${imagesList.length} mit Alt-Text`,
    value: `${imagesList.length - imagesWithoutAltList.length}/${imagesList.length}`,
    recommendation: imagesWithoutAltList.length > 0 ? 'Fügen Sie Alt-Texte zu allen Bildern hinzu' : undefined,
  });

  // Lazy loading
  const lazyImages = imageMatches.filter(img => img.includes('loading="lazy"') || img.includes("loading='lazy'"));
  mediaChecks.push({
    name: 'Lazy Loading',
    passed: imagesList.length === 0 || lazyImages.length > 0,
    severity: imagesList.length > 3 && lazyImages.length === 0 ? 'info' : 'info',
    message: `${lazyImages.length} von ${imagesList.length} mit Lazy Loading`,
    value: lazyImages.length,
    recommendation: imagesList.length > 3 && lazyImages.length === 0 ? 'Implementieren Sie Lazy Loading' : undefined,
  });

  // Calculate scores
  const calculateCategoryScore = (checks: CheckResult[]): { score: number; maxScore: number } => {
    let score = 0;
    let maxScore = 0;
    
    checks.forEach(check => {
      const points = check.severity === 'critical' ? 15 : check.severity === 'warning' ? 10 : 5;
      maxScore += points;
      if (check.passed) score += points;
    });
    
    return { score, maxScore };
  };

  const metaScore = calculateCategoryScore(metaChecks);
  const contentScore = calculateCategoryScore(contentChecks);
  const technicalScore = calculateCategoryScore(technicalChecks);
  const linkScore = calculateCategoryScore(linkChecks);
  const mediaScore = calculateCategoryScore(mediaChecks);
  const securityScore = calculateCategoryScore(securityChecks);

  const totalScore = metaScore.score + contentScore.score + technicalScore.score + linkScore.score + mediaScore.score + securityScore.score;
  const totalMaxScore = metaScore.maxScore + contentScore.maxScore + technicalScore.maxScore + linkScore.maxScore + mediaScore.maxScore + securityScore.maxScore;
  const percentageScore = Math.round((totalScore / totalMaxScore) * 100);

  // Generate recommendations
  const allChecks = [...metaChecks, ...contentChecks, ...technicalChecks, ...linkChecks, ...mediaChecks, ...securityChecks];
  const failedChecks = allChecks.filter(c => !c.passed && c.recommendation);
  const sortedFailed = failedChecks.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  sortedFailed.slice(0, 5).forEach(check => {
    if (check.recommendation) {
      recommendations.push(check.recommendation);
    }
  });

  return {
    url,
    timestamp: new Date().toISOString(),
    score: percentageScore,
    categories: {
      meta: { ...metaScore, checks: metaChecks },
      content: { ...contentScore, checks: contentChecks },
      technical: { ...technicalScore, checks: technicalChecks },
      links: { ...linkScore, checks: linkChecks },
      media: { ...mediaScore, checks: mediaChecks },
      security: { ...securityScore, checks: securityChecks },
    },
    issues,
    recommendations,
    contentData: {
      markdown: markdown.substring(0, 10000),
      wordCount,
      headings: headingsList,
      readabilityScore: readability.score,
      readabilityLevel: readability.level,
      avgSentenceLength: readability.avgSentenceLength,
      avgWordLength: readability.avgWordLength,
    },
    linkData: {
      internal: internalLinksList,
      external: externalLinksList,
    },
    mediaData: {
      images: imagesList,
      imagesWithoutAlt: imagesWithoutAltList,
    },
    metaData: {
      title,
      description,
      canonical,
      robots,
      hreflang: hreflangList,
    },
    keywordData,
    securityData: {
      isHttps,
      headers: securityHeaders,
    },
    urlData,
  };
}
