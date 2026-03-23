-- Rate Limiting Table
-- Tracks API usage per user per action for rate limiting

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,  -- 'generate_content', 'analyze_serp', 'scrape_website', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups: user + action + time window
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(user_id, action, created_at DESC);

-- Auto-cleanup: delete entries older than 24h (run via pg_cron or manual)
-- This keeps the table small and fast
CREATE INDEX idx_rate_limits_cleanup ON public.rate_limits(created_at);

-- RLS: Only service role should access this table (edge functions use service key)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (edge functions run with service key)
CREATE POLICY "Service role full access on rate_limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Cleanup function: remove entries older than 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;
