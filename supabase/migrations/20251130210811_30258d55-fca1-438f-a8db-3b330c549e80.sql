-- Create competitor analyses table
CREATE TABLE public.competitor_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  crawl_status TEXT NOT NULL DEFAULT 'pending',
  crawled_at TIMESTAMP WITH TIME ZONE,
  
  -- Extracted data
  page_title TEXT,
  meta_description TEXT,
  main_keywords TEXT[],
  secondary_keywords TEXT[],
  heading_structure JSONB,
  content_length INTEGER,
  word_count INTEGER,
  
  -- AI Analysis
  tonality_analysis TEXT,
  content_strategy TEXT,
  usp_patterns TEXT[],
  faq_patterns JSONB,
  call_to_actions TEXT[],
  strengths TEXT[],
  weaknesses TEXT[],
  best_practices JSONB,
  
  -- Raw data
  raw_content TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's competitor analyses"
  ON public.competitor_analyses
  FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Users can insert competitor analyses for their organization"
  ON public.competitor_analyses
  FOR INSERT
  WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Users can update their organization's competitor analyses"
  ON public.competitor_analyses
  FOR UPDATE
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Users can delete their organization's competitor analyses"
  ON public.competitor_analyses
  FOR DELETE
  USING (public.is_org_member(organization_id, auth.uid()));

-- Index for faster lookups
CREATE INDEX idx_competitor_analyses_org ON public.competitor_analyses(organization_id);
CREATE INDEX idx_competitor_analyses_domain ON public.competitor_analyses(domain);

-- Trigger for updated_at
CREATE TRIGGER update_competitor_analyses_updated_at
  BEFORE UPDATE ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();