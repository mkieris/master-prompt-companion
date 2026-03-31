CREATE TABLE public.serp_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  must_have_terms text[] DEFAULT '{}',
  recommended_terms text[] DEFAULT '{}',
  optional_terms text[] DEFAULT '{}',
  competitor_titles text[] DEFAULT '{}',
  search_volume integer,
  difficulty integer,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(keyword)
);

ALTER TABLE public.serp_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read serp_keywords"
  ON public.serp_keywords FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage serp_keywords"
  ON public.serp_keywords FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Authenticated users can insert serp_keywords"
  ON public.serp_keywords FOR INSERT
  TO authenticated
  WITH CHECK (true);