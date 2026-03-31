-- SERP Keywords Table
-- Stores pre-analyzed SERP data per keyword for content optimization

CREATE TABLE IF NOT EXISTS public.serp_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  must_have_terms TEXT[] DEFAULT '{}',
  recommended_terms TEXT[] DEFAULT '{}',
  optional_terms TEXT[] DEFAULT '{}',
  competitor_titles TEXT[] DEFAULT '{}',
  common_questions TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast keyword lookup
CREATE INDEX idx_serp_keywords_keyword ON public.serp_keywords(keyword);

-- RLS
ALTER TABLE public.serp_keywords ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read serp_keywords"
ON public.serp_keywords FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Authenticated users can manage serp_keywords"
ON public.serp_keywords FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Example entry
INSERT INTO public.serp_keywords (keyword, must_have_terms, recommended_terms, optional_terms, competitor_titles) VALUES (
  'K-Active Tape Gentle',
  ARRAY['kaufen', 'haut'],
  ARRAY['guenstig', 'kinesiologie', 'kinesiologie tape', 'online', 'hautfreundliches', '5cmx5m', '50mmx5m'],
  ARRAY['patienten', 'zarte', 'baumwollgewebe', 'sensible', 'allergiker'],
  ARRAY['K-Active Gentle Hautfreundliches Kinesiologie Tape 5cmx5m', 'K-Active Tape Gentle', 'K-Active Tape Gentle online kaufen']
) ON CONFLICT (keyword) DO NOTHING;
