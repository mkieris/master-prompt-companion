/**
 * TypeScript Interfaces for Content Creator
 * Eliminates `any` types and improves type safety
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SERP ANALYSIS TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SerpTerms {
  mustHave: string[];
  shouldHave: string[];
  niceToHave: string[];
  all: string[];
}

export interface SerpQuestions {
  peopleAlsoAsk: string[];
  relatedSearches: string[];
}

export interface SerpCompetitor {
  position: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface SerpStats {
  totalResultsAnalyzed: number;
  averageSnippetLength: number;
  termDetails: {
    term: string;
    score: number;
    inTitles: number;
    inSnippets: number;
    frequency: number;
  }[];
}

export interface SerpResult {
  keyword: string;
  searchedAt: string;
  serpTerms: SerpTerms;
  questions: SerpQuestions;
  competitors: SerpCompetitor[];
  competitorHeadings: string[];
  stats: SerpStats;
  promptContext: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN KNOWLEDGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DomainKnowledge {
  companyName?: string;
  brandVoice?: string;
  uniqueSellingPoints?: string[];
  targetAudiences?: string[];
  productCategories?: string[];
  complianceNotes?: string;
  managementInfo?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH URL TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ResearchUrl {
  url: string;
  status: 'pending' | 'crawling' | 'completed' | 'error';
  content?: string;
  title?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTLINE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface OutlineSection {
  h2: string;
  h3s?: string[];
  keyPoints?: string[];
}

export interface Outline {
  title: string;
  metaDescription: string;
  sections: OutlineSection[];
  faqs: string[];
  estimatedWordCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATED CONTENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface GeneratedFaq {
  question: string;
  answer: string;
}

export interface GeneratedContent {
  title: string;
  metaDescription: string;
  seoText: string;
  faq: GeneratedFaq[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT CONFIG TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type PageType = 'product' | 'category' | 'guide';
export type TargetAudience = 'consumers' | 'b2b' | 'physiotherapists' | 'both';
export type FormOfAddress = 'du' | 'sie' | 'neutral';
export type Tone = 'sachlich' | 'beratend' | 'aktivierend';
export type ContentLength = 'short' | 'medium' | 'long';
export type KeywordDensity = 'minimal' | 'low' | 'normal' | 'medium' | 'high';
export type AIModel = 'gemini-flash' | 'gemini-pro' | 'claude-sonnet';
export type PromptVersion =
  | 'v12-healthcare-master'
  | 'v11-surfer-style'
  | 'v10-geo-optimized'
  | 'v9-master'
  | 'v8-natural-seo';

export interface ComplianceChecks {
  mdr: boolean;
  hwg: boolean;
  studies: boolean;
}

export interface ContentConfig {
  focusKeyword: string;
  secondaryKeywords: string[];
  pageType: PageType;
  targetAudience: TargetAudience;
  formOfAddress: FormOfAddress;
  tone: Tone;
  contentLength: ContentLength;
  keywordDensity: KeywordDensity;
  complianceChecks: ComplianceChecks;
  aiModel: AIModel;
  promptVersion: PromptVersion;
  manufacturerInfo: string;
  additionalInfo: string;
  internalLinks: string;
  faqInputs: string;
  outlineFirst: boolean;
  contentMix: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT SCORE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ContentMetrics {
  wordCount: number;
  keywordCount: number;
  keywordDensity: number;
  headingCount: number;
  listCount: number;
  paragraphCount: number;
  serpTermsFound: { term: string; count: number; type: 'must' | 'should' | 'nice' }[];
  serpMustHaveTotal: number;
  serpShouldHaveTotal: number;
}

export interface ScoreCheck {
  label: string;
  status: 'success' | 'warning' | 'error';
  detail: string;
}
