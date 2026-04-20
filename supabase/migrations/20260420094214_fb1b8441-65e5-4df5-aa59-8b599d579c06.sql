-- Content V3 Projects
CREATE TABLE public.content_v3_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL,
  page_type text NOT NULL CHECK (page_type IN ('product','category','brand','topic_world','guide')),
  audience_channel text NOT NULL CHECK (audience_channel IN ('b2b_practice','b2c_active','b2c_patient')),
  product_type text CHECK (product_type IN ('own_brand','partner_brand','distribution','accessory')),
  brand_name text,
  object_name text NOT NULL,
  focus_keyword text NOT NULL,
  target_word_count integer NOT NULL DEFAULT 800,
  parallel_audience text CHECK (parallel_audience IN ('b2b_practice','b2c_active','b2c_patient')),
  final_content jsonb,
  parallel_content jsonb,
  compliance_status text DEFAULT 'pending' CHECK (compliance_status IN ('pending','passed','warnings','rejected')),
  content_score jsonb,
  total_tokens_used integer DEFAULT 0,
  total_cost_cents integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_v3_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view v3 projects" ON public.content_v3_projects
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_org_member(auth.uid(), organization_id));
CREATE POLICY "Editors can insert v3 projects" ON public.content_v3_projects
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND (
      has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR
      has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR
      has_org_role(auth.uid(), organization_id, 'editor'::app_role)
    )
  );
CREATE POLICY "Editors can update v3 projects" ON public.content_v3_projects
  FOR UPDATE USING (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR
    has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR
    has_org_role(auth.uid(), organization_id, 'editor'::app_role)
  );
CREATE POLICY "Editors can delete v3 projects" ON public.content_v3_projects
  FOR DELETE USING (
    has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR
    has_org_role(auth.uid(), organization_id, 'admin'::app_role)
  );

CREATE TRIGGER update_content_v3_projects_updated_at
  BEFORE UPDATE ON public.content_v3_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_v3_projects_org ON public.content_v3_projects(organization_id, created_at DESC);

-- Pipeline Runs (one row per stage)
CREATE TABLE public.content_v3_pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.content_v3_projects(id) ON DELETE RESTRICT,
  stage text NOT NULL CHECK (stage IN ('context','outline','writer','compliance','writer_parallel')),
  stage_order integer NOT NULL,
  model_used text,
  temperature numeric(3,2),
  input_payload jsonb,
  output_payload jsonb,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  duration_ms integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_v3_pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view v3 runs" ON public.content_v3_pipeline_runs
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND project_id IN (
      SELECT id FROM public.content_v3_projects
      WHERE is_org_member(auth.uid(), organization_id)
    )
  );
CREATE POLICY "Editors can insert v3 runs" ON public.content_v3_pipeline_runs
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.content_v3_projects
      WHERE has_org_role(auth.uid(), organization_id, 'owner'::app_role)
         OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
         OR has_org_role(auth.uid(), organization_id, 'editor'::app_role)
    )
  );

CREATE INDEX idx_v3_runs_project ON public.content_v3_pipeline_runs(project_id, stage_order);

-- Compliance Reports
CREATE TABLE public.content_v3_compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.content_v3_projects(id) ON DELETE RESTRICT,
  variant text NOT NULL DEFAULT 'primary' CHECK (variant IN ('primary','parallel')),
  hwg_violations jsonb DEFAULT '[]'::jsonb,
  evidence_matches jsonb DEFAULT '[]'::jsonb,
  missing_evidence jsonb DEFAULT '[]'::jsonb,
  competitor_warnings jsonb DEFAULT '[]'::jsonb,
  page_type_violations jsonb DEFAULT '[]'::jsonb,
  overall_status text NOT NULL CHECK (overall_status IN ('passed','warnings','rejected')),
  rewrite_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_v3_compliance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view v3 compliance" ON public.content_v3_compliance_reports
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND project_id IN (
      SELECT id FROM public.content_v3_projects
      WHERE is_org_member(auth.uid(), organization_id)
    )
  );
CREATE POLICY "Editors can insert v3 compliance" ON public.content_v3_compliance_reports
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.content_v3_projects
      WHERE has_org_role(auth.uid(), organization_id, 'owner'::app_role)
         OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)
         OR has_org_role(auth.uid(), organization_id, 'editor'::app_role)
    )
  );

CREATE INDEX idx_v3_compliance_project ON public.content_v3_compliance_reports(project_id);