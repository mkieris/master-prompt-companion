import { describe, it, expect } from 'vitest';
import {
  calculateContentScore,
  getScoreColor,
  getScoreLabel,
  type ContentScoreInput,
} from './content-score';

// Helper to create a default input
function makeInput(overrides: Partial<ContentScoreInput> = {}): ContentScoreInput {
  return {
    content: '',
    title: '',
    metaDescription: '',
    focusKeyword: '',
    targetWordCount: 1500,
    ...overrides,
  };
}

// Generate content with N words
function words(n: number): string {
  return Array.from({ length: n }, (_, i) => `word${i}`).join(' ');
}

describe('calculateContentScore', () => {
  describe('empty/missing content', () => {
    it('returns 0 for empty content', () => {
      const result = calculateContentScore(makeInput());
      expect(result.total).toBe(0);
      expect(result.wordCountScore).toBe(0);
      expect(result.keywordScore).toBe(0);
    });

    it('returns 0 for whitespace-only content', () => {
      const result = calculateContentScore(makeInput({ content: '   ' }));
      expect(result.total).toBe(0);
    });
  });

  describe('word count scoring (0-20)', () => {
    it('scores proportionally to target word count', () => {
      // 750 words / 1500 target = 0.5 ratio → 10 points
      const result = calculateContentScore(makeInput({
        content: words(750),
      }));
      expect(result.wordCountScore).toBe(10);
    });

    it('gives full 20 points at target word count', () => {
      const result = calculateContentScore(makeInput({
        content: words(1500),
      }));
      expect(result.wordCountScore).toBe(20);
    });

    it('caps at 1.2x target (24 points rounds to 24, capped)', () => {
      // 3000 words / 1500 target = 2.0, capped at 1.2 → 24 points
      const result = calculateContentScore(makeInput({
        content: words(3000),
      }));
      expect(result.wordCountScore).toBe(24);
    });

    it('uses custom target word count', () => {
      // 500 words / 500 target = 1.0 → 20 points
      const result = calculateContentScore(makeInput({
        content: words(500),
        targetWordCount: 500,
      }));
      expect(result.wordCountScore).toBe(20);
    });

    it('defaults to 1500 when targetWordCount is 0', () => {
      const result = calculateContentScore(makeInput({
        content: words(1500),
        targetWordCount: 0,
      }));
      expect(result.wordCountScore).toBe(20);
    });
  });

  describe('keyword scoring (0-25)', () => {
    it('gives 0 points when no focus keyword set', () => {
      const result = calculateContentScore(makeInput({
        content: words(100),
        focusKeyword: '',
      }));
      expect(result.keywordScore).toBe(0);
    });

    it('gives 25 points for optimal keyword density (0.5-2.5%)', () => {
      // 100 words, keyword appears 1 time → 1% density
      const contentWords = words(99);
      const result = calculateContentScore(makeInput({
        content: contentWords + ' kinesiotape',
        focusKeyword: 'kinesiotape',
      }));
      expect(result.keywordScore).toBe(25);
    });

    it('gives 15 points for keyword present but outside optimal range', () => {
      // 100 words, keyword appears 5 times → 5% density (too high)
      const base = words(95);
      const result = calculateContentScore(makeInput({
        content: base + ' kinesio kinesio kinesio kinesio kinesio',
        focusKeyword: 'kinesio',
      }));
      expect(result.keywordScore).toBe(15);
    });

    it('gives 0 points when keyword not found', () => {
      const result = calculateContentScore(makeInput({
        content: words(100),
        focusKeyword: 'kinesiotape',
      }));
      expect(result.keywordScore).toBe(0);
    });

    it('is case-insensitive', () => {
      const base = words(99);
      const result = calculateContentScore(makeInput({
        content: base + ' Kinesiotape',
        focusKeyword: 'kinesiotape',
      }));
      expect(result.keywordScore).toBe(25);
    });
  });

  describe('SERP terms scoring (0-30)', () => {
    it('gives 0 when no SERP terms provided', () => {
      const result = calculateContentScore(makeInput({
        content: words(100),
      }));
      expect(result.serpMustHaveScore).toBe(0);
      expect(result.serpShouldHaveScore).toBe(0);
    });

    it('scores must-have terms (0-20)', () => {
      // 2 of 4 must-have terms found → 50% → 10 points
      const result = calculateContentScore(makeInput({
        content: 'alpha beta ' + words(100),
        serpTerms: {
          mustHave: ['alpha', 'beta', 'gamma', 'delta'],
          shouldHave: [],
          niceToHave: [],
        },
      }));
      expect(result.serpMustHaveScore).toBe(10);
    });

    it('scores should-have terms (0-10)', () => {
      // 3 of 3 should-have terms found → 100% → 10 points
      const result = calculateContentScore(makeInput({
        content: 'foo bar baz ' + words(100),
        serpTerms: {
          mustHave: [],
          shouldHave: ['foo', 'bar', 'baz'],
          niceToHave: [],
        },
      }));
      expect(result.serpShouldHaveScore).toBe(10);
    });

    it('gives full 30 for all SERP terms found', () => {
      const result = calculateContentScore(makeInput({
        content: 'alpha beta gamma foo bar ' + words(100),
        serpTerms: {
          mustHave: ['alpha', 'beta', 'gamma'],
          shouldHave: ['foo', 'bar'],
          niceToHave: [],
        },
      }));
      expect(result.serpMustHaveScore).toBe(20);
      expect(result.serpShouldHaveScore).toBe(10);
    });

    it('is case-insensitive for SERP terms', () => {
      const result = calculateContentScore(makeInput({
        content: 'Alpha BETA ' + words(100),
        serpTerms: {
          mustHave: ['alpha', 'beta'],
          shouldHave: [],
          niceToHave: [],
        },
      }));
      expect(result.serpMustHaveScore).toBe(20);
    });
  });

  describe('structure scoring (0-15)', () => {
    it('gives 5 points for exactly one H1', () => {
      const result = calculateContentScore(makeInput({
        content: '<h1>Title</h1><p>' + words(100) + '</p>',
      }));
      expect(result.structureScore).toBe(5);
    });

    it('gives 0 for multiple H1s', () => {
      const result = calculateContentScore(makeInput({
        content: '<h1>Title</h1><h1>Another</h1><p>' + words(100) + '</p>',
      }));
      // Multiple H1s = no H1 points
      expect(result.structureScore).toBe(0);
    });

    it('gives 10 points for 3+ H2s', () => {
      const result = calculateContentScore(makeInput({
        content: '<h2>A</h2><h2>B</h2><h2>C</h2><p>' + words(100) + '</p>',
      }));
      expect(result.structureScore).toBe(10);
    });

    it('gives full 15 for 1 H1 + 3 H2s', () => {
      const result = calculateContentScore(makeInput({
        content: '<h1>Title</h1><h2>A</h2><h2>B</h2><h2>C</h2><p>' + words(100) + '</p>',
      }));
      expect(result.structureScore).toBe(15);
    });

    it('gives 0 for no headings', () => {
      const result = calculateContentScore(makeInput({
        content: '<p>' + words(100) + '</p>',
      }));
      expect(result.structureScore).toBe(0);
    });
  });

  describe('meta scoring (0-10)', () => {
    it('gives 5 for title in optimal range (30-60 chars)', () => {
      const result = calculateContentScore(makeInput({
        content: words(10),
        title: 'A'.repeat(45), // 45 chars - optimal
      }));
      expect(result.metaScore).toBe(5);
    });

    it('gives 0 for title too short', () => {
      const result = calculateContentScore(makeInput({
        content: words(10),
        title: 'Short',
      }));
      expect(result.metaScore).toBe(0);
    });

    it('gives 0 for title too long', () => {
      const result = calculateContentScore(makeInput({
        content: words(10),
        title: 'A'.repeat(61),
      }));
      expect(result.metaScore).toBe(0);
    });

    it('gives 5 for meta description in optimal range (120-155 chars)', () => {
      const result = calculateContentScore(makeInput({
        content: words(10),
        metaDescription: 'A'.repeat(140),
      }));
      expect(result.metaScore).toBe(5);
    });

    it('gives full 10 for both title and meta in range', () => {
      const result = calculateContentScore(makeInput({
        content: words(10),
        title: 'A'.repeat(50),
        metaDescription: 'A'.repeat(140),
      }));
      expect(result.metaScore).toBe(10);
    });
  });

  describe('total score', () => {
    it('is capped at 100', () => {
      // Create a scenario that could theoretically exceed 100
      const result = calculateContentScore(makeInput({
        content: '<h1>Title</h1><h2>A</h2><h2>B</h2><h2>C</h2><p>' + words(1800) + '</p>',
        title: 'A'.repeat(50),
        metaDescription: 'A'.repeat(140),
        focusKeyword: 'word0',
        targetWordCount: 1500,
        serpTerms: {
          mustHave: ['word1', 'word2', 'word3'],
          shouldHave: ['word4', 'word5'],
          niceToHave: [],
        },
      }));
      expect(result.total).toBeLessThanOrEqual(100);
    });

    it('sums all components correctly', () => {
      const result = calculateContentScore(makeInput({
        content: '<h1>Title</h1><h2>A</h2><h2>B</h2><h2>C</h2><p>' + words(100) + '</p>',
        title: 'A'.repeat(50),
        metaDescription: 'A'.repeat(140),
        targetWordCount: 100,
      }));
      const sum = result.wordCountScore + result.keywordScore + result.serpMustHaveScore +
        result.serpShouldHaveScore + result.structureScore + result.metaScore;
      expect(result.total).toBe(Math.min(sum, 100));
    });
  });
});

describe('getScoreColor', () => {
  it('returns green for score >= 80', () => {
    expect(getScoreColor(80)).toBe('text-green-500');
    expect(getScoreColor(100)).toBe('text-green-500');
  });

  it('returns yellow for score 60-79', () => {
    expect(getScoreColor(60)).toBe('text-yellow-500');
    expect(getScoreColor(79)).toBe('text-yellow-500');
  });

  it('returns orange for score 40-59', () => {
    expect(getScoreColor(40)).toBe('text-orange-500');
    expect(getScoreColor(59)).toBe('text-orange-500');
  });

  it('returns red for score < 40', () => {
    expect(getScoreColor(0)).toBe('text-red-500');
    expect(getScoreColor(39)).toBe('text-red-500');
  });
});

describe('getScoreLabel', () => {
  it('returns correct labels for score ranges', () => {
    expect(getScoreLabel(95)).toContain('Exzellent');
    expect(getScoreLabel(85)).toContain('Sehr gut');
    expect(getScoreLabel(75)).toContain('Gut');
    expect(getScoreLabel(65)).toContain('Akzeptabel');
    expect(getScoreLabel(50)).toContain('Verbesserungswürdig');
    expect(getScoreLabel(20)).toContain('Überarbeiten');
  });
});
