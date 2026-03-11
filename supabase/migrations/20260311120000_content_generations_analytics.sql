-- Content Generations Analytics Table
-- Tracks every content generation for analysis and optimization

CREATE TABLE IF NOT EXISTS public.content_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User & Organization
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,

  -- Input Parameters
  focus_keyword TEXT NOT NULL,
  secondary_keywords TEXT[] DEFAULT '{}',
  page_type TEXT, -- 'product', 'category', 'guide'
  target_audience TEXT, -- 'b2b', 'b2c', 'mixed'
  word_count_target INTEGER,
  tonality TEXT,
  form_of_address TEXT, -- 'du', 'sie'

  -- AI Configuration
  ai_model TEXT NOT NULL, -- 'gemini-flash', 'gemini-pro', 'claude-sonnet'
  prompt_version TEXT NOT NULL, -- 'v9-master', 'v11-surfer-style', etc.

  -- SERP Context
  serp_used BOOLEAN DEFAULT FALSE,
  serp_terms_count INTEGER DEFAULT 0,

  -- Domain Knowledge
  domain_knowledge_used BOOLEAN DEFAULT FALSE,

  -- Compliance
  compliance_mdr BOOLEAN DEFAULT FALSE,
  compliance_hwg BOOLEAN DEFAULT FALSE,

  -- Output Metrics
  output_word_count INTEGER,
  output_has_faq BOOLEAN DEFAULT FALSE,
  output_faq_count INTEGER DEFAULT 0,

  -- Performance Metrics
  generation_time_ms INTEGER, -- How long did generation take
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,

  -- Quality Metrics (can be updated later)
  content_score INTEGER, -- 0-100 from ContentScorePanel
  user_rating INTEGER, -- 1-5 stars from user
  was_edited BOOLEAN DEFAULT FALSE,
  was_exported BOOLEAN DEFAULT FALSE,
  was_refined BOOLEAN DEFAULT FALSE,
  refinement_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_content_generations_user ON public.content_generations(user_id);
CREATE INDEX idx_content_generations_org ON public.content_generations(organization_id);
CREATE INDEX idx_content_generations_prompt ON public.content_generations(prompt_version);
CREATE INDEX idx_content_generations_model ON public.content_generations(ai_model);
CREATE INDEX idx_content_generations_created ON public.content_generations(created_at DESC);
CREATE INDEX idx_content_generations_success ON public.content_generations(success);

-- RLS Policies
ALTER TABLE public.content_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own generations
CREATE POLICY "Users can view their own generations"
ON public.content_generations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own generations
CREATE POLICY "Users can insert their own generations"
ON public.content_generations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own generations (for rating, editing flags)
CREATE POLICY "Users can update their own generations"
ON public.content_generations
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all generations in their organization
CREATE POLICY "Admins can view organization generations"
ON public.content_generations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = content_generations.organization_id
    AND (om.role = 'owner' OR om.role = 'admin')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_content_generations_updated_at
BEFORE UPDATE ON public.content_generations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Analytics View: Prompt Version Performance
CREATE OR REPLACE VIEW public.prompt_version_analytics AS
SELECT
  prompt_version,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE success = TRUE) as successful,
  COUNT(*) FILTER (WHERE success = FALSE) as failed,
  ROUND(AVG(content_score)::numeric, 1) as avg_content_score,
  ROUND(AVG(user_rating)::numeric, 2) as avg_user_rating,
  ROUND(AVG(generation_time_ms)::numeric, 0) as avg_generation_time_ms,
  ROUND(AVG(output_word_count)::numeric, 0) as avg_word_count,
  COUNT(*) FILTER (WHERE was_edited = TRUE) as edited_count,
  COUNT(*) FILTER (WHERE was_exported = TRUE) as exported_count
FROM public.content_generations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY prompt_version
ORDER BY total_generations DESC;

-- Analytics View: Daily Generation Stats
CREATE OR REPLACE VIEW public.daily_generation_stats AS
SELECT
  DATE(created_at) as generation_date,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE success = TRUE) as successful,
  ROUND(AVG(content_score)::numeric, 1) as avg_score,
  ROUND(AVG(generation_time_ms)::numeric, 0) as avg_time_ms
FROM public.content_generations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY generation_date DESC;

-- Grant access to views
GRANT SELECT ON public.prompt_version_analytics TO authenticated;
GRANT SELECT ON public.daily_generation_stats TO authenticated;
