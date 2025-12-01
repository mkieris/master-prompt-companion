-- Create content_ratings table for learning system
CREATE TABLE public.content_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES content_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rated_by UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  feedback_categories JSONB DEFAULT '[]'::jsonb,
  prompt_version TEXT,
  form_data JSONB,
  generated_content JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for content_ratings
CREATE POLICY "Authenticated org members can view ratings"
  ON public.content_ratings
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    organization_id IN (SELECT get_user_org_ids(auth.uid()))
  );

CREATE POLICY "Users can create ratings for their org projects"
  ON public.content_ratings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    rated_by = auth.uid() AND
    organization_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Create indexes for performance
CREATE INDEX idx_content_ratings_project_id ON public.content_ratings(project_id);
CREATE INDEX idx_content_ratings_organization_id ON public.content_ratings(organization_id);
CREATE INDEX idx_content_ratings_rating ON public.content_ratings(rating);
CREATE INDEX idx_content_ratings_prompt_version ON public.content_ratings(prompt_version);

-- Create prompt_insights table for AI-generated improvement suggestions
CREATE TABLE public.prompt_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prompt_version TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  insight_summary TEXT NOT NULL,
  detailed_analysis JSONB NOT NULL,
  based_on_ratings_count INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2),
  suggestion_priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_insights ENABLE ROW LEVEL SECURITY;

-- Policies for prompt_insights
CREATE POLICY "Admins can view insights"
  ON public.prompt_insights
  FOR SELECT
  USING (
    has_org_role(auth.uid(), organization_id, 'owner') OR
    has_org_role(auth.uid(), organization_id, 'admin')
  );

CREATE POLICY "Admins can manage insights"
  ON public.prompt_insights
  FOR ALL
  USING (
    has_org_role(auth.uid(), organization_id, 'owner') OR
    has_org_role(auth.uid(), organization_id, 'admin')
  );

-- Create indexes
CREATE INDEX idx_prompt_insights_organization_id ON public.prompt_insights(organization_id);
CREATE INDEX idx_prompt_insights_prompt_version ON public.prompt_insights(prompt_version);
CREATE INDEX idx_prompt_insights_status ON public.prompt_insights(status);

-- Create trigger for updating updated_at
CREATE TRIGGER update_prompt_insights_updated_at
  BEFORE UPDATE ON public.prompt_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();