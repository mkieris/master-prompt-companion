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

interface ReadabilityAnalysis {
  fleschScore: number;
  fleschLevel: string;
  fleschGrade: string;
  wstfScore: number;
  wstfLevel: string;
  lixScore: number;
  lixLevel: string;
  sentences: number;
  words: number;
  syllables: number;
  characters: number;
  paragraphs: number;
  avgSentenceLength: number;
  avgWordLength: number;
  avgSyllablesPerWord: number;
  longWordsCount: number;
  longWordsPercent: number;
  complexWordsCount: number;
  complexWordsPercent: number;
  shortSentences: number;
  mediumSentences: number;
  longSentences: number;
  veryLongSentences: number;
  passiveVoiceCount: number;
  fillWordsCount: number;
  issues: ReadabilityIssue[];
  overallRating: 'excellent' | 'good' | 'moderate' | 'difficult' | 'very-difficult';
}

interface ReadabilityIssue {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  recommendation: string;
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
    readability: ReadabilityAnalysis;
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
    
    let html = '';
    let markdown = '';
    let responseHeaders: Record<string, string> = {};
    
    // Use Firecrawl for content extraction
    if (FIRECRAWL_API_KEY) {
      console.log('Using Firecrawl for content extraction...');
      
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            formats: ['markdown', 'html'],
            onlyMainContent: false, // We need full HTML for SEO analysis
          }),
        });

        if (scrapeResponse.ok) {
          const result = await scrapeResponse.json();
          if (result.success) {
            html = result.data?.html || '';
            markdown = result.data?.markdown || '';
            console.log(`Firecrawl successful: HTML=${html.length}, Markdown=${markdown.length}`);
          }
        }
      } catch (firecrawlError) {
        console.error('Firecrawl failed:', firecrawlError);
      }
    }
    
    // Fallback to direct fetch if Firecrawl didn't work
    if (!html || html.length < 100) {
      console.log('Falling back to direct fetch...');
      try {
        const fetchResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
          },
          redirect: 'follow',
        });
        
        if (fetchResponse.ok) {
          html = await fetchResponse.text();
          fetchResponse.headers.forEach((value, key) => {
            responseHeaders[key.toLowerCase()] = value;
          });
          markdown = htmlToReadableText(html);
          console.log(`Direct fetch: HTML=${html.length}`);
        }
      } catch (fetchError) {
        console.error('Direct fetch failed:', fetchError);
      }
    }
    
    if (!html || html.length < 100) {
      return new Response(
        JSON.stringify({ error: 'No content retrieved from page' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If markdown is empty, generate it from HTML
    if (!markdown || markdown.length < 50) {
      markdown = htmlToReadableText(html);
    }
    
    // Extract metadata from HTML
    const metadata = extractMetadataFromHtml(html, url);
    
    console.log(`Content extracted: HTML=${html.length} chars, Text=${markdown.length} chars`);

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

// Helper function to convert HTML to readable text
function htmlToReadableText(html: string): string {
  let workingHtml = html;
  
  // Remove non-content elements
  workingHtml = workingHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  workingHtml = workingHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  workingHtml = workingHtml.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  workingHtml = workingHtml.replace(/<!--[\s\S]*?-->/g, '');
  workingHtml = workingHtml.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  
  // Try to extract main content
  let mainContent = '';
  
  const mainMatch = workingHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch && mainMatch[1].length > 500) {
    mainContent = mainMatch[1];
  }
  
  if (!mainContent) {
    const articleMatch = workingHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch && articleMatch[1].length > 500) {
      mainContent = articleMatch[1];
    }
  }
  
  if (!mainContent) {
    mainContent = workingHtml;
  }
  
  // Remove navigation elements
  mainContent = mainContent.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
  mainContent = mainContent.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
  mainContent = mainContent.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  mainContent = mainContent.replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '');
  
  let text = mainContent;
  
  // Convert headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n');
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n');
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n');
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n');
  text = text.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n\n##### $1\n\n');
  text = text.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n\n###### $1\n\n');
  
  // Convert paragraphs and breaks
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '');
  
  // Convert lists
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n');
  
  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Clean up entities
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&[a-z]+;/gi, ' ');
  
  // Clean whitespace
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.trim();
  
  return text;
}

// Extract metadata from HTML
function extractMetadataFromHtml(html: string, url: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1] : '';
  
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : '';
  
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  const robots = robotsMatch ? robotsMatch[1] : '';
  
  // Extract hreflang
  const hreflang: HreflangInfo[] = [];
  const hreflangMatches = html.matchAll(/<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["']/gi);
  for (const match of hreflangMatches) {
    hreflang.push({ lang: match[1], url: match[2], hasIssue: false });
  }
  
  // Extract headings
  const headings: HeadingInfo[] = [];
  for (let i = 1; i <= 6; i++) {
    const regex = new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text) {
        headings.push({ level: i, text, hasIssue: false });
      }
    }
  }
  
  // Extract links
  const internal: LinkInfo[] = [];
  const external: LinkInfo[] = [];
  const urlObj = new URL(url);
  
  const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  for (const match of linkMatches) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    const hasNofollow = /rel=["'][^"']*nofollow[^"']*["']/i.test(match[0]);
    
    if (href.startsWith('http')) {
      try {
        const linkUrl = new URL(href);
        if (linkUrl.hostname === urlObj.hostname) {
          internal.push({ url: href, text, hasNofollow });
        } else {
          external.push({ url: href, text, hasNofollow });
        }
      } catch {}
    } else if (href.startsWith('/') || href.startsWith('#')) {
      internal.push({ url: href, text, hasNofollow });
    }
  }
  
  // Extract images
  const images: ImageInfo[] = [];
  const imgMatches = html.matchAll(/<img[^>]*>/gi);
  for (const match of imgMatches) {
    const srcMatch = match[0].match(/src=["']([^"']+)["']/i);
    const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
    if (srcMatch) {
      images.push({
        src: srcMatch[1],
        alt: altMatch ? altMatch[1] : '',
        hasAlt: !!altMatch && altMatch[1].length > 0,
      });
    }
  }
  
  return {
    title,
    description,
    canonical,
    robots,
    hreflang,
    headings,
    internal,
    external,
    images,
  };
}

// Main SEO analysis function
function analyzeSEO(
  url: string,
  html: string,
  markdown: string,
  metadata: any,
  responseHeaders: Record<string, string>,
  keyword?: string
): SEOCheckResult {
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];
  
  // URL analysis
  const urlObj = new URL(url);
  const urlData = {
    hasUppercase: /[A-Z]/.test(urlObj.pathname),
    hasParameters: urlObj.search.length > 0,
    hasUnderscores: urlObj.pathname.includes('_'),
    length: url.length,
    depth: urlObj.pathname.split('/').filter(p => p).length,
  };
  
  // Word count
  const words = markdown.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Readability analysis
  const readability = analyzeReadability(markdown);
  
  // Keyword analysis
  let keywordData: KeywordAnalysis | null = null;
  if (keyword) {
    const keywordLower = keyword.toLowerCase();
    const textLower = markdown.toLowerCase();
    const occurrences = (textLower.match(new RegExp(keywordLower, 'g')) || []).length;
    const density = wordCount > 0 ? (occurrences / wordCount) * 100 : 0;
    
    keywordData = {
      keyword,
      density: Math.round(density * 100) / 100,
      inTitle: metadata.title.toLowerCase().includes(keywordLower),
      inH1: metadata.headings.some((h: HeadingInfo) => h.level === 1 && h.text.toLowerCase().includes(keywordLower)),
      inUrl: url.toLowerCase().includes(keywordLower),
      inDescription: metadata.description.toLowerCase().includes(keywordLower),
      occurrences,
    };
  }
  
  // Security analysis
  const isHttps = url.startsWith('https://');
  const securityHeaders: SecurityHeaderInfo[] = [
    { name: 'strict-transport-security', present: !!responseHeaders['strict-transport-security'], value: responseHeaders['strict-transport-security'] },
    { name: 'content-security-policy', present: !!responseHeaders['content-security-policy'], value: responseHeaders['content-security-policy'] },
    { name: 'x-content-type-options', present: !!responseHeaders['x-content-type-options'], value: responseHeaders['x-content-type-options'] },
    { name: 'x-frame-options', present: !!responseHeaders['x-frame-options'], value: responseHeaders['x-frame-options'] },
  ];
  
  // Category scores
  const metaChecks = analyzeMetaCategory(metadata, issues, recommendations);
  const contentChecks = analyzeContentCategory(markdown, metadata.headings, wordCount, readability, issues, recommendations);
  const technicalChecks = analyzeTechnicalCategory(url, urlData, metadata, isHttps, issues, recommendations);
  const linksChecks = analyzeLinksCategory(metadata.internal, metadata.external, issues, recommendations);
  const mediaChecks = analyzeMediaCategory(metadata.images, issues, recommendations);
  const securityChecks = analyzeSecurityCategory(isHttps, securityHeaders, issues, recommendations);
  
  // Calculate overall score
  const totalScore = metaChecks.score + contentChecks.score + technicalChecks.score + 
                     linksChecks.score + mediaChecks.score + securityChecks.score;
  const maxScore = metaChecks.maxScore + contentChecks.maxScore + technicalChecks.maxScore + 
                   linksChecks.maxScore + mediaChecks.maxScore + securityChecks.maxScore;
  const score = Math.round((totalScore / maxScore) * 100);
  
  return {
    url,
    timestamp: new Date().toISOString(),
    score,
    categories: {
      meta: metaChecks,
      content: contentChecks,
      technical: technicalChecks,
      links: linksChecks,
      media: mediaChecks,
      security: securityChecks,
    },
    issues,
    recommendations,
    contentData: {
      markdown,
      wordCount,
      headings: metadata.headings,
      readability,
    },
    linkData: {
      internal: metadata.internal,
      external: metadata.external,
    },
    mediaData: {
      images: metadata.images,
      imagesWithoutAlt: metadata.images.filter((img: ImageInfo) => !img.hasAlt),
    },
    metaData: {
      title: metadata.title,
      description: metadata.description,
      canonical: metadata.canonical,
      robots: metadata.robots,
      hreflang: metadata.hreflang,
    },
    keywordData,
    securityData: {
      isHttps,
      headers: securityHeaders,
    },
    urlData,
  };
}

// Readability analysis
function analyzeReadability(text: string): ReadabilityAnalysis {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const characters = text.replace(/\s/g, '').length;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
  
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgWordLength = words.length > 0 ? characters / words.length : 0;
  const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;
  
  const longWords = words.filter(w => w.length > 6);
  const complexWords = words.filter(w => countSyllables(w) >= 3);
  
  // Flesch Reading Ease (German adaptation)
  const fleschScore = Math.max(0, Math.min(100, 180 - avgSentenceLength - (58.5 * avgSyllablesPerWord)));
  
  // Wiener Sachtextformel
  const ms = (longWords.length / words.length) * 100;
  const sl = avgSentenceLength;
  const wstfScore = 0.1935 * ms + 0.1672 * sl - 0.1297 * ms - 0.0327 * sl - 0.875;
  
  // LIX Score
  const lixScore = avgSentenceLength + (longWords.length / words.length) * 100;
  
  const issues: ReadabilityIssue[] = [];
  
  if (avgSentenceLength > 20) {
    issues.push({
      type: 'sentence_length',
      severity: 'warning',
      message: `Durchschnittliche Satzlänge (${Math.round(avgSentenceLength)} Wörter) ist zu hoch`,
      recommendation: 'Kürze lange Sätze auf unter 20 Wörter',
    });
  }
  
  let overallRating: 'excellent' | 'good' | 'moderate' | 'difficult' | 'very-difficult';
  if (fleschScore >= 60) overallRating = 'excellent';
  else if (fleschScore >= 50) overallRating = 'good';
  else if (fleschScore >= 40) overallRating = 'moderate';
  else if (fleschScore >= 30) overallRating = 'difficult';
  else overallRating = 'very-difficult';
  
  return {
    fleschScore: Math.round(fleschScore),
    fleschLevel: getFleschLevel(fleschScore),
    fleschGrade: getFleschGrade(fleschScore),
    wstfScore: Math.round(wstfScore * 10) / 10,
    wstfLevel: getWstfLevel(wstfScore),
    lixScore: Math.round(lixScore),
    lixLevel: getLixLevel(lixScore),
    sentences: sentences.length,
    words: words.length,
    syllables,
    characters,
    paragraphs,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    longWordsCount: longWords.length,
    longWordsPercent: Math.round((longWords.length / Math.max(words.length, 1)) * 100),
    complexWordsCount: complexWords.length,
    complexWordsPercent: Math.round((complexWords.length / Math.max(words.length, 1)) * 100),
    shortSentences: sentences.filter(s => s.split(/\s+/).length < 10).length,
    mediumSentences: sentences.filter(s => { const l = s.split(/\s+/).length; return l >= 10 && l <= 20; }).length,
    longSentences: sentences.filter(s => { const l = s.split(/\s+/).length; return l > 20 && l <= 30; }).length,
    veryLongSentences: sentences.filter(s => s.split(/\s+/).length > 30).length,
    passiveVoiceCount: 0,
    fillWordsCount: 0,
    issues,
    overallRating,
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-zäöüß]/g, '');
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouyäöü';
  let count = 0;
  let prevWasVowel = false;
  
  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevWasVowel) count++;
    prevWasVowel = isVowel;
  }
  
  return Math.max(1, count);
}

function getFleschLevel(score: number): string {
  if (score >= 60) return 'Leicht verständlich';
  if (score >= 50) return 'Durchschnittlich';
  if (score >= 40) return 'Etwas schwierig';
  if (score >= 30) return 'Schwierig';
  return 'Sehr schwierig';
}

function getFleschGrade(score: number): string {
  if (score >= 60) return 'A';
  if (score >= 50) return 'B';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'E';
}

function getWstfLevel(score: number): string {
  if (score <= 4) return 'Grundschule';
  if (score <= 6) return 'Sekundarstufe I';
  if (score <= 8) return 'Sekundarstufe II';
  if (score <= 10) return 'Universität';
  return 'Akademisch';
}

function getLixLevel(score: number): string {
  if (score < 30) return 'Sehr leicht';
  if (score < 40) return 'Leicht';
  if (score < 50) return 'Durchschnittlich';
  if (score < 60) return 'Schwierig';
  return 'Sehr schwierig';
}

// Category analysis functions
function analyzeMetaCategory(metadata: any, issues: SEOIssue[], recommendations: string[]): CategoryResult {
  const checks: CheckResult[] = [];
  let score = 0;
  const maxScore = 25;
  
  // Title check
  const titleLength = metadata.title.length;
  if (titleLength >= 30 && titleLength <= 60) {
    checks.push({ name: 'Title Length', passed: true, severity: 'critical', message: `Optimal (${titleLength} Zeichen)`, value: titleLength });
    score += 5;
  } else if (titleLength > 0) {
    checks.push({ name: 'Title Length', passed: false, severity: 'critical', message: `Suboptimal (${titleLength} Zeichen)`, value: titleLength, recommendation: 'Title sollte 30-60 Zeichen haben' });
    score += 2;
    issues.push({ category: 'Meta', severity: 'critical', title: 'Title-Länge nicht optimal', description: `Der Title hat ${titleLength} Zeichen`, recommendation: 'Passe den Title auf 30-60 Zeichen an' });
  } else {
    checks.push({ name: 'Title Length', passed: false, severity: 'critical', message: 'Kein Title gefunden', recommendation: 'Füge einen Title-Tag hinzu' });
    issues.push({ category: 'Meta', severity: 'critical', title: 'Kein Title-Tag', description: 'Die Seite hat keinen Title-Tag', recommendation: 'Füge einen aussagekräftigen Title hinzu' });
  }
  
  // Description check
  const descLength = metadata.description.length;
  if (descLength >= 120 && descLength <= 160) {
    checks.push({ name: 'Meta Description', passed: true, severity: 'critical', message: `Optimal (${descLength} Zeichen)`, value: descLength });
    score += 5;
  } else if (descLength > 0) {
    checks.push({ name: 'Meta Description', passed: false, severity: 'warning', message: `Suboptimal (${descLength} Zeichen)`, value: descLength });
    score += 2;
    issues.push({ category: 'Meta', severity: 'warning', title: 'Meta Description nicht optimal', description: `Die Beschreibung hat ${descLength} Zeichen`, recommendation: 'Optimiere auf 120-160 Zeichen' });
  } else {
    checks.push({ name: 'Meta Description', passed: false, severity: 'critical', message: 'Keine Meta Description', recommendation: 'Füge eine Meta Description hinzu' });
    issues.push({ category: 'Meta', severity: 'critical', title: 'Keine Meta Description', description: 'Die Seite hat keine Meta Description', recommendation: 'Füge eine aussagekräftige Beschreibung hinzu' });
  }
  
  // Canonical check
  if (metadata.canonical) {
    checks.push({ name: 'Canonical URL', passed: true, severity: 'info', message: 'Vorhanden', value: metadata.canonical });
    score += 5;
  } else {
    checks.push({ name: 'Canonical URL', passed: false, severity: 'info', message: 'Nicht gesetzt' });
    score += 2;
  }
  
  // H1 check
  const h1Count = metadata.headings.filter((h: HeadingInfo) => h.level === 1).length;
  if (h1Count === 1) {
    checks.push({ name: 'H1 Tag', passed: true, severity: 'critical', message: 'Genau eine H1 vorhanden' });
    score += 5;
  } else if (h1Count > 1) {
    checks.push({ name: 'H1 Tag', passed: false, severity: 'warning', message: `${h1Count} H1-Tags gefunden`, recommendation: 'Nur eine H1 pro Seite verwenden' });
    score += 2;
    issues.push({ category: 'Meta', severity: 'warning', title: 'Mehrere H1-Tags', description: `${h1Count} H1-Tags gefunden`, recommendation: 'Reduziere auf eine einzige H1' });
  } else {
    checks.push({ name: 'H1 Tag', passed: false, severity: 'critical', message: 'Keine H1 gefunden', recommendation: 'Füge eine H1 hinzu' });
    issues.push({ category: 'Meta', severity: 'critical', title: 'Keine H1 vorhanden', description: 'Die Seite hat keine H1-Überschrift', recommendation: 'Füge eine aussagekräftige H1 hinzu' });
  }
  
  // Robots check
  if (metadata.robots && metadata.robots.includes('noindex')) {
    checks.push({ name: 'Robots Meta', passed: false, severity: 'critical', message: 'Seite ist auf noindex gesetzt!' });
    issues.push({ category: 'Meta', severity: 'critical', title: 'Seite nicht indexierbar', description: 'Der robots-Tag enthält noindex', recommendation: 'Entferne noindex wenn die Seite indexiert werden soll' });
  } else {
    checks.push({ name: 'Robots Meta', passed: true, severity: 'info', message: 'Indexierung erlaubt' });
    score += 5;
  }
  
  return { score, maxScore, checks };
}

function analyzeContentCategory(markdown: string, headings: HeadingInfo[], wordCount: number, readability: ReadabilityAnalysis, issues: SEOIssue[], recommendations: string[]): CategoryResult {
  const checks: CheckResult[] = [];
  let score = 0;
  const maxScore = 25;
  
  // Word count
  if (wordCount >= 300) {
    checks.push({ name: 'Wortanzahl', passed: true, severity: 'warning', message: `${wordCount} Wörter`, value: wordCount });
    score += 8;
  } else {
    checks.push({ name: 'Wortanzahl', passed: false, severity: 'warning', message: `Nur ${wordCount} Wörter`, recommendation: 'Mind. 300 Wörter empfohlen' });
    score += 3;
    issues.push({ category: 'Content', severity: 'warning', title: 'Wenig Content', description: `Nur ${wordCount} Wörter gefunden`, recommendation: 'Erweitere den Content auf mind. 300 Wörter' });
  }
  
  // Heading structure
  const h2Count = headings.filter(h => h.level === 2).length;
  if (h2Count >= 2) {
    checks.push({ name: 'H2-Struktur', passed: true, severity: 'info', message: `${h2Count} H2-Überschriften` });
    score += 5;
  } else {
    checks.push({ name: 'H2-Struktur', passed: false, severity: 'info', message: `Nur ${h2Count} H2-Überschriften`, recommendation: 'Mehr Zwischenüberschriften verwenden' });
    score += 2;
  }
  
  // Readability
  if (readability.fleschScore >= 50) {
    checks.push({ name: 'Lesbarkeit', passed: true, severity: 'info', message: readability.fleschLevel });
    score += 7;
  } else if (readability.fleschScore >= 30) {
    checks.push({ name: 'Lesbarkeit', passed: false, severity: 'warning', message: readability.fleschLevel, recommendation: 'Text vereinfachen' });
    score += 4;
  } else {
    checks.push({ name: 'Lesbarkeit', passed: false, severity: 'warning', message: readability.fleschLevel, recommendation: 'Text deutlich vereinfachen' });
    score += 2;
    issues.push({ category: 'Content', severity: 'warning', title: 'Schwere Lesbarkeit', description: `Flesch-Score: ${readability.fleschScore}`, recommendation: 'Verwende kürzere Sätze und einfachere Wörter' });
  }
  
  // Paragraphs
  if (readability.paragraphs >= 3) {
    checks.push({ name: 'Absätze', passed: true, severity: 'info', message: `${readability.paragraphs} Absätze` });
    score += 5;
  } else {
    checks.push({ name: 'Absätze', passed: false, severity: 'info', message: 'Wenige Absätze', recommendation: 'Text besser strukturieren' });
    score += 2;
  }
  
  return { score, maxScore, checks };
}

function analyzeTechnicalCategory(url: string, urlData: any, metadata: any, isHttps: boolean, issues: SEOIssue[], recommendations: string[]): CategoryResult {
  const checks: CheckResult[] = [];
  let score = 0;
  const maxScore = 20;
  
  // HTTPS
  if (isHttps) {
    checks.push({ name: 'HTTPS', passed: true, severity: 'critical', message: 'Seite nutzt HTTPS' });
    score += 5;
  } else {
    checks.push({ name: 'HTTPS', passed: false, severity: 'critical', message: 'Kein HTTPS!', recommendation: 'HTTPS aktivieren' });
    issues.push({ category: 'Technical', severity: 'critical', title: 'Kein HTTPS', description: 'Die Seite nutzt kein HTTPS', recommendation: 'SSL-Zertifikat installieren' });
  }
  
  // URL length
  if (urlData.length <= 75) {
    checks.push({ name: 'URL-Länge', passed: true, severity: 'info', message: `${urlData.length} Zeichen` });
    score += 4;
  } else {
    checks.push({ name: 'URL-Länge', passed: false, severity: 'info', message: `${urlData.length} Zeichen - zu lang` });
    score += 2;
  }
  
  // URL structure
  if (!urlData.hasUppercase && !urlData.hasUnderscores) {
    checks.push({ name: 'URL-Struktur', passed: true, severity: 'info', message: 'Sauber formatiert' });
    score += 4;
  } else {
    const urlIssues = [];
    if (urlData.hasUppercase) urlIssues.push('Großbuchstaben');
    if (urlData.hasUnderscores) urlIssues.push('Unterstriche');
    checks.push({ name: 'URL-Struktur', passed: false, severity: 'info', message: urlIssues.join(', ') });
    score += 2;
  }
  
  // URL depth
  if (urlData.depth <= 3) {
    checks.push({ name: 'URL-Tiefe', passed: true, severity: 'info', message: `Tiefe ${urlData.depth}` });
    score += 4;
  } else {
    checks.push({ name: 'URL-Tiefe', passed: false, severity: 'info', message: `Tiefe ${urlData.depth} - zu tief` });
    score += 2;
  }
  
  // Canonical
  if (metadata.canonical) {
    checks.push({ name: 'Canonical', passed: true, severity: 'warning', message: 'Gesetzt' });
    score += 3;
  } else {
    checks.push({ name: 'Canonical', passed: false, severity: 'warning', message: 'Nicht gesetzt' });
    score += 1;
  }
  
  return { score, maxScore, checks };
}

function analyzeLinksCategory(internal: LinkInfo[], external: LinkInfo[], issues: SEOIssue[], recommendations: string[]): CategoryResult {
  const checks: CheckResult[] = [];
  let score = 0;
  const maxScore = 15;
  
  // Internal links
  if (internal.length >= 3) {
    checks.push({ name: 'Interne Links', passed: true, severity: 'info', message: `${internal.length} interne Links` });
    score += 5;
  } else {
    checks.push({ name: 'Interne Links', passed: false, severity: 'warning', message: `Nur ${internal.length} interne Links` });
    score += 2;
    issues.push({ category: 'Links', severity: 'warning', title: 'Wenige interne Links', description: `Nur ${internal.length} interne Links`, recommendation: 'Mehr interne Verlinkungen hinzufügen' });
  }
  
  // External links
  if (external.length >= 1) {
    checks.push({ name: 'Externe Links', passed: true, severity: 'info', message: `${external.length} externe Links` });
    score += 5;
  } else {
    checks.push({ name: 'Externe Links', passed: false, severity: 'info', message: 'Keine externen Links' });
    score += 3;
  }
  
  // Nofollow ratio
  const nofollowCount = [...internal, ...external].filter(l => l.hasNofollow).length;
  const totalLinks = internal.length + external.length;
  if (totalLinks > 0) {
    const nofollowRatio = nofollowCount / totalLinks;
    if (nofollowRatio < 0.5) {
      checks.push({ name: 'Nofollow-Ratio', passed: true, severity: 'info', message: `${Math.round(nofollowRatio * 100)}% nofollow` });
      score += 5;
    } else {
      checks.push({ name: 'Nofollow-Ratio', passed: false, severity: 'info', message: `${Math.round(nofollowRatio * 100)}% nofollow - zu hoch` });
      score += 2;
    }
  }
  
  return { score, maxScore, checks };
}

function analyzeMediaCategory(images: ImageInfo[], issues: SEOIssue[], recommendations: string[]): CategoryResult {
  const checks: CheckResult[] = [];
  let score = 0;
  const maxScore = 10;
  
  const imagesWithAlt = images.filter(img => img.hasAlt);
  const imagesWithoutAlt = images.filter(img => !img.hasAlt);
  
  if (images.length === 0) {
    checks.push({ name: 'Bilder', passed: false, severity: 'info', message: 'Keine Bilder gefunden' });
    score += 3;
  } else {
    const altRatio = imagesWithAlt.length / images.length;
    if (altRatio >= 0.9) {
      checks.push({ name: 'Bilder mit Alt-Text', passed: true, severity: 'warning', message: `${imagesWithAlt.length}/${images.length} haben Alt-Text` });
      score += 10;
    } else if (altRatio >= 0.5) {
      checks.push({ name: 'Bilder mit Alt-Text', passed: false, severity: 'warning', message: `Nur ${imagesWithAlt.length}/${images.length} haben Alt-Text` });
      score += 5;
      issues.push({ category: 'Media', severity: 'warning', title: 'Fehlende Alt-Texte', description: `${imagesWithoutAlt.length} Bilder ohne Alt-Text`, recommendation: 'Alt-Texte für alle Bilder hinzufügen' });
    } else {
      checks.push({ name: 'Bilder mit Alt-Text', passed: false, severity: 'warning', message: `Nur ${imagesWithAlt.length}/${images.length} haben Alt-Text` });
      score += 2;
      issues.push({ category: 'Media', severity: 'warning', title: 'Viele fehlende Alt-Texte', description: `${imagesWithoutAlt.length} von ${images.length} Bildern ohne Alt-Text`, recommendation: 'Alt-Texte für alle Bilder hinzufügen' });
    }
  }
  
  return { score, maxScore, checks };
}

function analyzeSecurityCategory(isHttps: boolean, headers: SecurityHeaderInfo[], issues: SEOIssue[], recommendations: string[]): CategoryResult {
  const checks: CheckResult[] = [];
  let score = 0;
  const maxScore = 5;
  
  if (isHttps) {
    score += 2;
  }
  
  const hsts = headers.find(h => h.name === 'strict-transport-security');
  if (hsts?.present) {
    checks.push({ name: 'HSTS', passed: true, severity: 'info', message: 'Aktiviert' });
    score += 1;
  } else {
    checks.push({ name: 'HSTS', passed: false, severity: 'info', message: 'Nicht gesetzt' });
  }
  
  const csp = headers.find(h => h.name === 'content-security-policy');
  if (csp?.present) {
    checks.push({ name: 'CSP', passed: true, severity: 'info', message: 'Aktiviert' });
    score += 1;
  } else {
    checks.push({ name: 'CSP', passed: false, severity: 'info', message: 'Nicht gesetzt' });
  }
  
  const xfo = headers.find(h => h.name === 'x-frame-options');
  if (xfo?.present) {
    checks.push({ name: 'X-Frame-Options', passed: true, severity: 'info', message: 'Aktiviert' });
    score += 1;
  } else {
    checks.push({ name: 'X-Frame-Options', passed: false, severity: 'info', message: 'Nicht gesetzt' });
  }
  
  return { score, maxScore, checks };
}
