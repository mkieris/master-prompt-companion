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
  };
  issues: SEOIssue[];
  recommendations: string[];
  // New detailed data
  contentData: {
    markdown: string;
    wordCount: number;
    headings: HeadingInfo[];
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
    const { url, mode } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting SEO check for: ${url}, mode: ${mode}`);

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

    // Perform comprehensive SEO analysis
    const result = analyzeSEO(url, html, markdown, metadata);

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

function analyzeSEO(url: string, html: string, markdown: string, metadata: any): SEOCheckResult {
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];

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
                   descLength > 160 ? 'Meta Description ist zu lang, wird in den SERPs abgeschnitten' : undefined,
  });

  if (descLength === 0) {
    issues.push({
      category: 'Meta',
      severity: 'critical',
      title: 'Fehlende Meta Description',
      description: 'Die Seite hat keine Meta Description für die Suchergebnisse.',
      recommendation: 'Fügen Sie eine einzigartige Meta Description mit 150-160 Zeichen hinzu.',
    });
  }

  // Canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : '';
  
  metaChecks.push({
    name: 'Canonical URL',
    passed: canonical.length > 0,
    severity: 'warning',
    message: canonical ? `Canonical: ${canonical}` : 'Kein Canonical Tag gefunden',
    value: canonical,
    recommendation: !canonical ? 'Fügen Sie einen Canonical Tag hinzu um Duplicate Content zu vermeiden' : undefined,
  });

  // Viewport Meta
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*/i);
  metaChecks.push({
    name: 'Viewport Meta Tag',
    passed: !!viewportMatch,
    severity: 'critical',
    message: viewportMatch ? 'Viewport Tag vorhanden' : 'Kein Viewport Tag gefunden',
    recommendation: !viewportMatch ? 'Fügen Sie einen Viewport Meta Tag für Mobile-Optimierung hinzu' : undefined,
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
    recommendation: !(ogTitle && ogDesc && ogImage) ? 'Vervollständigen Sie die Open Graph Tags für besseres Social Sharing' : undefined,
  });

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
    
    // Check for hierarchy issues (e.g., H3 after H1 without H2)
    if (level > lastLevel + 1 && lastLevel !== 0) {
      hasIssue = true;
      issue = `Sprung von H${lastLevel} zu H${level} - H${lastLevel + 1} übersprungen`;
    }
    
    headingsList.push({ level, text, hasIssue, issue });
    lastLevel = level;
  }

  // H1 Tag
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Count = h1Matches.length;
  const h1Text = h1Matches[0]?.replace(/<[^>]*>/g, '').trim() || '';
  
  // Mark H1 issues
  if (h1Count === 0) {
    headingsList.unshift({ level: 1, text: '(Keine H1 vorhanden)', hasIssue: true, issue: 'H1 fehlt komplett' });
  } else if (h1Count > 1) {
    headingsList.forEach(h => {
      if (h.level === 1) {
        h.hasIssue = true;
        h.issue = 'Mehrere H1-Tags gefunden - sollte nur eine sein';
      }
    });
  }
  
  contentChecks.push({
    name: 'H1 Überschrift vorhanden',
    passed: h1Count === 1,
    severity: h1Count === 0 ? 'critical' : (h1Count > 1 ? 'warning' : 'info'),
    message: h1Count === 0 ? 'Keine H1 gefunden' : 
             h1Count === 1 ? `H1: "${h1Text.substring(0, 50)}${h1Text.length > 50 ? '...' : ''}"` : 
             `${h1Count} H1 Tags gefunden (sollte nur 1 sein)`,
    value: h1Count,
    recommendation: h1Count === 0 ? 'Fügen Sie genau eine H1 Überschrift hinzu' : 
                   h1Count > 1 ? 'Reduzieren Sie auf genau eine H1 Überschrift' : undefined,
  });

  if (h1Count === 0) {
    issues.push({
      category: 'Content',
      severity: 'critical',
      title: 'Fehlende H1 Überschrift',
      description: 'Die Seite hat keine H1 Überschrift.',
      recommendation: 'Fügen Sie eine aussagekräftige H1 Überschrift mit dem Haupt-Keyword hinzu.',
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

  if (wordCount < 300) {
    issues.push({
      category: 'Content',
      severity: 'warning',
      title: 'Zu wenig Textinhalt',
      description: `Die Seite hat nur ${wordCount} Wörter.`,
      recommendation: 'Erweitern Sie den Content auf mindestens 300 Wörter für bessere Rankings.',
    });
  }

  // Structured Data
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  
  contentChecks.push({
    name: 'Strukturierte Daten (Schema.org)',
    passed: jsonLdMatches.length > 0,
    severity: 'warning',
    message: jsonLdMatches.length > 0 ? `${jsonLdMatches.length} Schema(s) gefunden` : 'Keine strukturierten Daten gefunden',
    value: jsonLdMatches.length,
    recommendation: jsonLdMatches.length === 0 ? 'Fügen Sie Schema.org Markup hinzu (FAQ, Product, Article, etc.)' : undefined,
  });

  // === TECHNICAL ANALYSIS ===
  const technicalChecks: CheckResult[] = [];

  // URL Structure
  const urlObj = new URL(url);
  const urlPath = urlObj.pathname;
  const hasCleanUrl = !urlPath.includes('?') && !urlPath.includes('&') && urlPath.length < 100;
  
  technicalChecks.push({
    name: 'Saubere URL-Struktur',
    passed: hasCleanUrl,
    severity: hasCleanUrl ? 'info' : 'warning',
    message: `URL-Pfad: ${urlPath}`,
    value: urlPath,
    recommendation: !hasCleanUrl ? 'Verwenden Sie kurze, sprechende URLs ohne Parameter' : undefined,
  });

  // HTTPS
  const isHttps = urlObj.protocol === 'https:';
  technicalChecks.push({
    name: 'HTTPS',
    passed: isHttps,
    severity: isHttps ? 'info' : 'critical',
    message: isHttps ? 'Seite ist HTTPS-gesichert' : 'Seite verwendet kein HTTPS!',
    recommendation: !isHttps ? 'Migrieren Sie zu HTTPS für Sicherheit und Rankings' : undefined,
  });

  if (!isHttps) {
    issues.push({
      category: 'Technical',
      severity: 'critical',
      title: 'Keine HTTPS-Verschlüsselung',
      description: 'Die Seite ist nicht über HTTPS erreichbar.',
      recommendation: 'Aktivieren Sie HTTPS mit einem SSL-Zertifikat.',
    });
  }

  // Language Tag
  const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  const language = langMatch ? langMatch[1] : '';
  
  technicalChecks.push({
    name: 'Sprach-Attribut',
    passed: language.length > 0,
    severity: 'warning',
    message: language ? `Sprache: ${language}` : 'Kein lang-Attribut im HTML-Tag',
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
    message: charset ? `Charset: ${charset}` : 'Kein Charset definiert',
    value: charset,
    recommendation: charset !== 'UTF-8' ? 'Verwenden Sie UTF-8 als Zeichenkodierung' : undefined,
  });

  // === LINKS ANALYSIS ===
  const linkChecks: CheckResult[] = [];

  // Extract detailed link information
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
    
    // Skip anchors, javascript, mailto, tel
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
    message: `${internalLinksList.length} interne Links gefunden`,
    value: internalLinksList.length,
    recommendation: internalLinksList.length < 3 ? 'Fügen Sie mehr interne Links zu relevanten Seiten hinzu' : undefined,
  });

  linkChecks.push({
    name: 'Externe Links',
    passed: externalLinksList.length > 0,
    severity: 'info',
    message: `${externalLinksList.length} externe Links gefunden`,
    value: externalLinksList.length,
  });

  // Check for rel="nofollow" on external links
  const nofollowExternal = externalLinksList.filter(link => link.hasNofollow);
  linkChecks.push({
    name: 'Nofollow auf externen Links',
    passed: true,
    severity: 'info',
    message: `${nofollowExternal.length} von ${externalLinksList.length} externen Links mit nofollow`,
    value: nofollowExternal.length,
  });

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
    message: `${imagesList.length - imagesWithoutAltList.length} von ${imagesList.length} Bildern haben Alt-Text`,
    value: `${imagesList.length - imagesWithoutAltList.length}/${imagesList.length}`,
    recommendation: imagesWithoutAltList.length > 0 ? 'Fügen Sie beschreibende Alt-Texte zu allen Bildern hinzu' : undefined,
  });

  if (imagesWithoutAltList.length > 0) {
    issues.push({
      category: 'Media',
      severity: 'warning',
      title: 'Fehlende Alt-Texte',
      description: `${imagesWithoutAltList.length} Bilder haben keinen Alt-Text.`,
      recommendation: 'Fügen Sie beschreibende Alt-Texte zu allen Bildern hinzu.',
    });
  }

  // Check for lazy loading
  const lazyImages = imageMatches.filter(img => img.includes('loading="lazy"') || img.includes("loading='lazy'"));
  mediaChecks.push({
    name: 'Lazy Loading für Bilder',
    passed: imagesList.length === 0 || lazyImages.length > 0,
    severity: imagesList.length > 0 && lazyImages.length === 0 ? 'info' : 'info',
    message: `${lazyImages.length} von ${imagesList.length} Bildern mit Lazy Loading`,
    value: lazyImages.length,
    recommendation: imagesList.length > 3 && lazyImages.length === 0 ? 'Implementieren Sie Lazy Loading für bessere Performance' : undefined,
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

  const totalScore = metaScore.score + contentScore.score + technicalScore.score + linkScore.score + mediaScore.score;
  const totalMaxScore = metaScore.maxScore + contentScore.maxScore + technicalScore.maxScore + linkScore.maxScore + mediaScore.maxScore;
  const percentageScore = Math.round((totalScore / totalMaxScore) * 100);

  // Generate top recommendations
  const allChecks = [...metaChecks, ...contentChecks, ...technicalChecks, ...linkChecks, ...mediaChecks];
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
    },
    issues,
    recommendations,
    contentData: {
      markdown: markdown.substring(0, 10000), // Limit size
      wordCount,
      headings: headingsList,
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
    },
  };
}
