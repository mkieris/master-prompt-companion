import { z } from 'zod';

/**
 * Frontend validation schema for content generation config.
 * Mirrors server-side validation to catch issues early.
 */
export const contentConfigSchema = z.object({
  focusKeyword: z.string()
    .min(1, 'Keyword ist erforderlich')
    .max(200, 'Keyword darf maximal 200 Zeichen haben')
    .regex(/^[^<>{}]*$/, 'Ungültige Zeichen im Keyword'),
  brandName: z.string().max(100, 'Markenname zu lang').optional(),
  additionalInfo: z.string().max(50000, 'Zusatzinfo zu lang').optional(),
  secondaryKeywords: z.array(z.string().max(100)).max(20, 'Maximal 20 Sekundär-Keywords').optional(),
  mainTopic: z.string().max(200).optional(),
  manufacturerInfo: z.string().max(10000).optional(),
  internalLinks: z.string().max(5000).optional(),
  faqInputs: z.string().max(5000).optional(),
});

export type ContentConfigInput = z.infer<typeof contentConfigSchema>;

/**
 * Validates content config before API call.
 * Returns validation result with error messages.
 */
export function validateContentConfig(config: Record<string, unknown>) {
  return contentConfigSchema.safeParse(config);
}
