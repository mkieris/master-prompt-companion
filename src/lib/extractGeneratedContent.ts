export interface ExtractedGeneratedContent {
  parsed: unknown;
  seoText: string;
  title: string;
  metaDescription: string;
  faq: Array<{ question: string; answer: string }>;
}

const EMPTY_RESULT: ExtractedGeneratedContent = {
  parsed: null,
  seoText: '',
  title: '',
  metaDescription: '',
  faq: [],
};

function stripCodeFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function tryParseJsonLoose(raw: string): unknown | null {
  const cleaned = stripCodeFence(raw);
  const candidates = [cleaned];

  const jsonStart = cleaned.search(/[\[{]/);
  if (jsonStart !== -1) {
    const opener = cleaned[jsonStart];
    const closer = opener === '[' ? ']' : '}';
    const jsonEnd = cleaned.lastIndexOf(closer);

    if (jsonEnd > jsonStart) {
      candidates.push(cleaned.slice(jsonStart, jsonEnd + 1));
    }
  }

  for (const candidate of candidates) {
    const normalizedCandidates = [
      candidate,
      candidate
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
    ];

    for (const normalized of normalizedCandidates) {
      try {
        return JSON.parse(normalized);
      } catch {
        // continue
      }
    }
  }

  return null;
}

function decodeJsonStringValue(value: string): string {
  const normalized = value.replace(/\r/g, '\\r').replace(/\n/g, '\\n');

  try {
    return JSON.parse(`"${normalized}"`);
  } catch {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

function extractJsonStringField(raw: string, field: string): string {
  const cleaned = stripCodeFence(raw);
  const fieldKey = `"${field}"`;
  const fieldIndex = cleaned.indexOf(fieldKey);

  if (fieldIndex === -1) return '';

  const colonIndex = cleaned.indexOf(':', fieldIndex + fieldKey.length);
  if (colonIndex === -1) return '';

  let valueStart = colonIndex + 1;
  while (valueStart < cleaned.length && /\s/.test(cleaned[valueStart])) {
    valueStart += 1;
  }

  if (cleaned[valueStart] !== '"') return '';

  let value = '';
  let escaped = false;

  for (let index = valueStart + 1; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (escaped) {
      value += `\\${char}`;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      return decodeJsonStringValue(value);
    }

    value += char;
  }

  return '';
}

function extractJsonArrayField<T = unknown>(raw: string, field: string): T[] {
  const fieldRegex = new RegExp(`"${field}"\\s*:\\s*\\[`, 's');
  const match = fieldRegex.exec(raw);
  if (!match) return [];

  const start = match.index + match[0].lastIndexOf('[');
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(raw.slice(start, index + 1)) as T[];
        } catch {
          return [];
        }
      }
    }
  }

  return [];
}

function extractFieldsFromBrokenJson(raw: string): Omit<ExtractedGeneratedContent, 'parsed'> | null {
  const cleaned = stripCodeFence(raw);
  const seoText = extractJsonStringField(cleaned, 'seoText');

  if (!seoText) return null;

  return {
    seoText,
    title: extractJsonStringField(cleaned, 'title'),
    metaDescription: extractJsonStringField(cleaned, 'metaDescription'),
    faq: extractJsonArrayField<{ question: string; answer: string }>(cleaned, 'faq').filter(
      (item) => !!item && typeof item.question === 'string' && typeof item.answer === 'string'
    ),
  };
}

export function extractGeneratedContentFields(input: unknown): ExtractedGeneratedContent {
  const extract = (value: unknown): ExtractedGeneratedContent => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const parsedString = tryParseJsonLoose(trimmed);
      if (parsedString) return extract(parsedString);

      const recovered = extractFieldsFromBrokenJson(trimmed);
      if (recovered?.seoText) {
        return {
          parsed: value,
          seoText: recovered.seoText,
          title: recovered.title,
          metaDescription: recovered.metaDescription,
          faq: recovered.faq,
        };
      }

      return {
        parsed: value,
        seoText: value,
        title: '',
        metaDescription: '',
        faq: [],
      };
    }

    if (!value || typeof value !== 'object') {
      return {
        ...EMPTY_RESULT,
        parsed: value,
        seoText: typeof value === 'string' ? value : String(value ?? ''),
      };
    }

    const parsed = value as any;
    const content = parsed?.variants?.[0] || parsed?.content || parsed;

    let seoText = content?.seoText || content?.content?.seoText || content?.text || '';
    let title = content?.title || content?.content?.title || '';
    let metaDescription = content?.metaDescription || content?.content?.metaDescription || '';
    let faq = content?.faq || content?.content?.faq || [];

    if (
      typeof seoText === 'string' &&
      (() => {
        const trimmedSeoText = seoText.trim();
        return (
          trimmedSeoText.startsWith('{') ||
          trimmedSeoText.startsWith('[') ||
          trimmedSeoText.startsWith('```') ||
          /"seoText"\s*:/.test(trimmedSeoText)
        );
      })()
    ) {
      const nested = extract(seoText);
      if (nested.seoText && nested.seoText !== seoText) {
        seoText = nested.seoText;
        title = nested.title || title;
        metaDescription = nested.metaDescription || metaDescription;
        faq = nested.faq.length ? nested.faq : faq;
      }
    }

    return {
      parsed,
      seoText: typeof seoText === 'string' ? seoText : String(seoText || ''),
      title: typeof title === 'string' ? title : String(title || ''),
      metaDescription: typeof metaDescription === 'string' ? metaDescription : String(metaDescription || ''),
      faq: Array.isArray(faq) ? faq.filter((item) => item?.question && item?.answer) : [],
    };
  };

  return extract(input);
}

function unescapeLiterals(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"');
}

export function getRenderableGeneratedContent(rawContent: string): string {
  const extracted = extractGeneratedContentFields(rawContent).seoText || rawContent;
  return unescapeLiterals(extracted);
}