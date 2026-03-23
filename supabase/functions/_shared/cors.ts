/**
 * Shared CORS configuration for all edge functions.
 * Restricts allowed origins instead of using wildcard '*'.
 */

const ALLOWED_ORIGINS: string[] = [
  // Production (update with actual production domain)
  'https://master-prompt-companion.lovable.app',
  // Local development
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

/**
 * Returns CORS headers with origin validation.
 * Falls back to first allowed origin if request origin is not whitelisted.
 */
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}
