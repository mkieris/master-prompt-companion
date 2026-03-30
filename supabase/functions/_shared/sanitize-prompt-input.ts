/**
 * Sanitizes user input before interpolation into AI prompts.
 * Prevents prompt injection attacks by removing dangerous patterns.
 */

/**
 * Sanitizes a single string input for safe use in AI prompts.
 * - Removes prompt injection patterns (e.g., "ignore previous instructions")
 * - Removes role-switching attempts (system:/user:/assistant:)
 * - Escapes markdown code block delimiters
 * - Strips NULL bytes
 * - Enforces max length
 */
export function sanitizePromptInput(input: string, maxLength = 500): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input
    // Remove prompt injection patterns
    .replace(/ignore\s+(all\s+)?previous\s+(instructions|prompts|rules|directives)/gi, '')
    .replace(/disregard\s+(all\s+)?previous/gi, '')
    .replace(/forget\s+(all\s+)?previous/gi, '')
    .replace(/override\s+(all\s+)?previous/gi, '')
    .replace(/new\s+instructions?\s*:/gi, '')
    // Remove role-switching attempts
    .replace(/^system\s*:/gim, '')
    .replace(/^user\s*:/gim, '')
    .replace(/^assistant\s*:/gim, '')
    // Escape markdown code block delimiters (prevent prompt boundary escape)
    .replace(/```/g, '` ` `')
    // Remove NULL bytes
    .replace(/\0/g, '')
    // Remove excessive whitespace (prevent token stuffing)
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/ {10,}/g, '    ');

  return sanitized.slice(0, maxLength).trim();
}

/**
 * Sanitizes an array of strings for safe use in AI prompts.
 */
export function sanitizePromptArray(
  items: string[] | undefined | null,
  maxItems = 20,
  maxItemLength = 100
): string[] {
  if (!Array.isArray(items)) return [];

  return items
    .slice(0, maxItems)
    .map(item => sanitizePromptInput(item, maxItemLength))
    .filter(item => item.length > 0);
}
