/**
 * Shared CORS configuration for all edge functions.
 * Allows all origins to prevent CORS issues with Lovable previews.
 */

export function getCorsHeaders(_requestOrigin?: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}
