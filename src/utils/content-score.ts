/**
 * Content Score Calculation Utility
 * Calculates an SEO content score from 0-100 based on multiple factors.
 */

export interface SerpTerms {
  mustHave: string[];
  shouldHave: string[];
  niceToHave: string[];
}

export interface ContentScoreInput {
  content: string;
  title: string;
  metaDescription: string;
  focusKeyword: string;
  targetWordCount: number;
  serpTerms?: SerpTerms;
}

export interface ContentScoreBreakdown {
  total: number;
  wordCountScore: number;
  keywordScore: number;
  serpMustHaveScore: number;
  serpShouldHaveScore: number;
  structureScore: number;
  metaScore: number;
}

/**
 * Calculates the content score with a detailed breakdown.
 * Score components:
 * - Word count: 0-20 points (ratio to target, capped at 1.2x)
 * - Keyword presence: 0-25 points (density 0.5-2.5% = 25, any > 0 = 15)
 * - SERP must-have terms: 0-20 points
 * - SERP should-have terms: 0-10 points
 * - Structure (headings): 0-15 points (1x H1 = 5, ≥3x H2 = 10)
 * - Meta tags: 0-10 points (title 30-60 chars = 5, meta 120-155 chars = 5)
 */
export function calculateContentScore(input: ContentScoreInput): ContentScoreBreakdown {
  const { content, title, metaDescription, focusKeyword, targetWordCount, serpTerms } = input;

  if (!content) {
    return { total: 0, wordCountScore: 0, keywordScore: 0, serpMustHaveScore: 0, serpShouldHaveScore: 0, structureScore: 0, metaScore: 0 };
  }

  const text = content.toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Word count score (0-20)
  const target = targetWordCount || 1500;
  const wordRatio = Math.min(wordCount / target, 1.2);
  const wordCountScore = Math.round(wordRatio * 20);

  // Keyword presence (0-25) - uses word boundaries to avoid substring false positives
  let keywordScore = 0;
  if (focusKeyword) {
    const keywordLower = focusKeyword.toLowerCase();
    const escapedKeyword = keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use Unicode word boundaries to match full words (including German umlauts)
    const keywordRegex = new RegExp('(?:^|[^a-zA-Z0-9äöüÄÖÜß])' + escapedKeyword + '(?:[^a-zA-Z0-9äöüÄÖÜß]|$)', 'g');
    const keywordCount = (text.match(keywordRegex) || []).length;
    const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
    if (keywordDensity >= 0.5 && keywordDensity <= 2.5) {
      keywordScore = 25;
    } else if (keywordDensity > 0) {
      keywordScore = 15;
    }
  }

  // SERP terms (0-30)
  let serpMustHaveScore = 0;
  let serpShouldHaveScore = 0;
  if (serpTerms) {
    const mustHaveFound = serpTerms.mustHave.filter(t => text.includes(t.toLowerCase())).length;
    const shouldHaveFound = serpTerms.shouldHave.filter(t => text.includes(t.toLowerCase())).length;
    serpMustHaveScore = Math.round((mustHaveFound / Math.max(serpTerms.mustHave.length, 1)) * 20);
    serpShouldHaveScore = Math.round((shouldHaveFound / Math.max(serpTerms.shouldHave.length, 1)) * 10);
  }

  // Structure score (0-15)
  let structureScore = 0;
  const h1Count = (content.match(/<h1/g) || []).length;
  const h2Count = (content.match(/<h2/g) || []).length;
  if (h1Count === 1) structureScore += 5;
  if (h2Count >= 3) structureScore += 10;

  // Meta presence (0-10)
  let metaScore = 0;
  if (title && title.length >= 30 && title.length <= 60) metaScore += 5;
  if (metaDescription && metaDescription.length >= 120 && metaDescription.length <= 155) metaScore += 5;

  const total = Math.min(wordCountScore + keywordScore + serpMustHaveScore + serpShouldHaveScore + structureScore + metaScore, 100);

  return { total, wordCountScore, keywordScore, serpMustHaveScore, serpShouldHaveScore, structureScore, metaScore };
}

/**
 * Score color based on value.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Score label with emoji.
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Exzellent 🏆';
  if (score >= 80) return 'Sehr gut 🌟';
  if (score >= 70) return 'Gut 👍';
  if (score >= 60) return 'Akzeptabel 📈';
  if (score >= 40) return 'Verbesserungswürdig ⚠️';
  return 'Überarbeiten 🔧';
}
