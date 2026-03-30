/**
 * Database-backed rate limiting for edge functions.
 * Uses the rate_limits table to track requests per user per action.
 */

interface RateLimitConfig {
  /** Action identifier, e.g. 'generate_content' */
  action: string;
  /** Maximum requests allowed in the time window */
  maxRequests: number;
  /** Time window in minutes */
  windowMinutes: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds?: number;
}

/** Default rate limits per action */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  generate_content: { action: 'generate_content', maxRequests: 20, windowMinutes: 60 },
  analyze_serp: { action: 'analyze_serp', maxRequests: 50, windowMinutes: 60 },
  analyze_keyword: { action: 'analyze_keyword', maxRequests: 50, windowMinutes: 60 },
  analyze_competitor: { action: 'analyze_competitor', maxRequests: 20, windowMinutes: 60 },
  analyze_domain: { action: 'analyze_domain', maxRequests: 10, windowMinutes: 60 },
  scrape_website: { action: 'scrape_website', maxRequests: 10, windowMinutes: 60 },
  crawl_domain: { action: 'crawl_domain', maxRequests: 5, windowMinutes: 60 },
  check_compliance: { action: 'check_compliance', maxRequests: 30, windowMinutes: 60 },
  generate_ai_content: { action: 'generate_ai_content', maxRequests: 30, windowMinutes: 60 },
  generate_insights: { action: 'generate_insights', maxRequests: 10, windowMinutes: 60 },
  ai_content_chat: { action: 'ai_content_chat', maxRequests: 100, windowMinutes: 60 },
};

/**
 * Checks and enforces rate limits for a user action.
 * Returns whether the request is allowed and remaining quota.
 */
export async function checkRateLimit(
  supabase: any,
  userId: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

  // Count requests in current window
  const { count, error: countError } = await supabase
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', config.action)
    .gte('created_at', windowStart.toISOString());

  if (countError) {
    console.error('[RateLimit] Count error:', countError);
    // On error, allow the request (fail open) but log it
    return { allowed: true, remaining: config.maxRequests, limit: config.maxRequests };
  }

  const current = count || 0;

  if (current >= config.maxRequests) {
    console.warn(`[RateLimit] User ${userId} exceeded limit for ${config.action}: ${current}/${config.maxRequests}`);
    return {
      allowed: false,
      remaining: 0,
      limit: config.maxRequests,
      retryAfterSeconds: config.windowMinutes * 60,
    };
  }

  // Record this request
  const { error: insertError } = await supabase
    .from('rate_limits')
    .insert({
      user_id: userId,
      action: config.action,
    });

  if (insertError) {
    console.error('[RateLimit] Insert error:', insertError);
    // Still allow the request if we can't record it
  }

  return {
    allowed: true,
    remaining: config.maxRequests - current - 1,
    limit: config.maxRequests,
  };
}

/**
 * Creates a 429 Too Many Requests response with appropriate headers.
 */
export function rateLimitResponse(
  corsHeaders: Record<string, string>,
  result: RateLimitResult,
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit erreicht. Bitte später erneut versuchen.',
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds || 3600),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
      },
    },
  );
}
