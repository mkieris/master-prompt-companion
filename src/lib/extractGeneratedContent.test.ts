import { describe, expect, it } from 'vitest';

import { extractGeneratedContentFields, getRenderableGeneratedContent } from './extractGeneratedContent';

describe('extractGeneratedContentFields', () => {
  it('extracts html fields from code-fenced JSON nested in seoText', () => {
    const response = {
      seoText: '```json\n{"title":"Testtitel","metaDescription":"Testmeta","seoText":"<h1>Headline</h1><p>Absatz</p>","faq":[{"question":"Frage","answer":"Antwort"}]}\n```',
    };

    const extracted = extractGeneratedContentFields(response);

    expect(extracted.title).toBe('Testtitel');
    expect(extracted.metaDescription).toBe('Testmeta');
    expect(extracted.seoText).toBe('<h1>Headline</h1><p>Absatz</p>');
    expect(extracted.faq).toEqual([{ question: 'Frage', answer: 'Antwort' }]);
  });

  it('returns renderable html instead of markdown json code blocks', () => {
    const raw = '```json\n{"title":"Titel","metaDescription":"Meta","seoText":"<h1>Hallo</h1><p>Welt</p>"}\n```';

    expect(getRenderableGeneratedContent(raw)).toBe('<h1>Hallo</h1><p>Welt</p>');
  });
});