-- =========================================
-- Content Studio V3 Stammdaten-Tabellen
-- =========================================

-- 1. BRAND VOICES (14 Slots pro Marke)
CREATE TABLE public.brand_voices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  -- 14 Slots
  mission text,
  vision text,
  core_values jsonb DEFAULT '[]'::jsonb,
  tonality text,
  voice_attributes jsonb DEFAULT '[]'::jsonb,
  target_audiences jsonb DEFAULT '[]'::jsonb,
  unique_selling_points jsonb DEFAULT '[]'::jsonb,
  mandatory_terms jsonb DEFAULT '[]'::jsonb,
  forbidden_terms jsonb DEFAULT '[]'::jsonb,
  preferred_phrases jsonb DEFAULT '[]'::jsonb,
  brand_story text,
  product_categories jsonb DEFAULT '[]'::jsonb,
  compliance_notes text,
  example_snippets jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, brand_name)
);

ALTER TABLE public.brand_voices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view brand voices"
ON public.brand_voices FOR SELECT
USING (auth.uid() IS NOT NULL AND is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage brand voices"
ON public.brand_voices FOR ALL
USING (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role))
WITH CHECK (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE TRIGGER update_brand_voices_updated_at
BEFORE UPDATE ON public.brand_voices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. PAGE TYPES (Strukturen je Seitentyp)
CREATE TABLE public.page_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  type_key text NOT NULL,
  display_name text NOT NULL,
  description text,
  default_structure jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_sections jsonb DEFAULT '[]'::jsonb,
  forbidden_sections jsonb DEFAULT '[]'::jsonb,
  default_word_count integer DEFAULT 800,
  voice_mode_defaults jsonb DEFAULT '{}'::jsonb,
  cta_strategy text,
  meta_template jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, type_key)
);

ALTER TABLE public.page_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view page types"
ON public.page_types FOR SELECT
USING (auth.uid() IS NOT NULL AND (organization_id IS NULL OR is_org_member(auth.uid(), organization_id)));

CREATE POLICY "Admins can manage page types"
ON public.page_types FOR ALL
USING (organization_id IS NOT NULL AND (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)))
WITH CHECK (organization_id IS NOT NULL AND (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role)));

CREATE TRIGGER update_page_types_updated_at
BEFORE UPDATE ON public.page_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. EVIDENCE LIBRARY
CREATE TABLE public.evidence_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  evidence_key text NOT NULL,
  brand_name text,
  claim text NOT NULL,
  category text,
  hwg_compatible_phrasings jsonb DEFAULT '[]'::jsonb,
  caveats jsonb DEFAULT '[]'::jsonb,
  sources jsonb DEFAULT '[]'::jsonb,
  evidence_type text DEFAULT 'study',
  strength text DEFAULT 'medium',
  valid_until date,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, evidence_key)
);

ALTER TABLE public.evidence_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view evidence"
ON public.evidence_library FOR SELECT
USING (auth.uid() IS NOT NULL AND is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage evidence"
ON public.evidence_library FOR ALL
USING (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role))
WITH CHECK (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE TRIGGER update_evidence_library_updated_at
BEFORE UPDATE ON public.evidence_library
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. BRANDS REGISTRY
CREATE TABLE public.brands_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  brand_type text NOT NULL DEFAULT 'competitor',
  domain text,
  aliases jsonb DEFAULT '[]'::jsonb,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, brand_name)
);

ALTER TABLE public.brands_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view brands registry"
ON public.brands_registry FOR SELECT
USING (auth.uid() IS NOT NULL AND is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage brands registry"
ON public.brands_registry FOR ALL
USING (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role))
WITH CHECK (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE TRIGGER update_brands_registry_updated_at
BEFORE UPDATE ON public.brands_registry
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. DENYLISTS
CREATE TABLE public.denylists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category text NOT NULL,
  phrase text NOT NULL,
  severity text DEFAULT 'warning',
  reason text,
  replacement_suggestion text,
  applies_to_page_types jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_denylists_org_category ON public.denylists(organization_id, category) WHERE is_active = true;

ALTER TABLE public.denylists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view denylists"
ON public.denylists FOR SELECT
USING (auth.uid() IS NOT NULL AND is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage denylists"
ON public.denylists FOR ALL
USING (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role))
WITH CHECK (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE TRIGGER update_denylists_updated_at
BEFORE UPDATE ON public.denylists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. COMPETITOR POSITIONING
CREATE TABLE public.competitor_positioning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  competitor_name text NOT NULL,
  positioning_summary text,
  unique_angles jsonb DEFAULT '[]'::jsonb,
  avoid_overlap_themes jsonb DEFAULT '[]'::jsonb,
  differentiation_strategy text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, competitor_name)
);

ALTER TABLE public.competitor_positioning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view competitor positioning"
ON public.competitor_positioning FOR SELECT
USING (auth.uid() IS NOT NULL AND is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage competitor positioning"
ON public.competitor_positioning FOR ALL
USING (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role))
WITH CHECK (has_org_role(auth.uid(), organization_id, 'owner'::app_role) OR has_org_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE TRIGGER update_competitor_positioning_updated_at
BEFORE UPDATE ON public.competitor_positioning
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();