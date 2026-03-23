-- Compliance Checks Audit Trail
-- Tracks every compliance check linked to content generations for MDR/HWG traceability

CREATE TABLE IF NOT EXISTS public.compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to content generation (nullable for standalone checks)
  generation_id UUID REFERENCES public.content_generations(id) ON DELETE CASCADE,

  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,

  -- Check configuration
  ai_model TEXT NOT NULL DEFAULT 'gemini-flash',
  prompt_version TEXT,
  check_trigger TEXT NOT NULL DEFAULT 'auto',  -- 'auto' (after generation), 'manual' (user-triggered)

  -- Overall result
  overall_status TEXT NOT NULL CHECK (overall_status IN ('passed', 'warning', 'failed')),
  hwg_status TEXT NOT NULL DEFAULT 'passed' CHECK (hwg_status IN ('passed', 'warning', 'failed', 'not_checked')),
  mdr_status TEXT NOT NULL DEFAULT 'passed' CHECK (mdr_status IN ('passed', 'warning', 'failed', 'not_checked')),

  -- Compliance score (0-100, 100 = fully compliant)
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),

  -- Detailed findings
  violations JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ "text": "...", "severity": "critical"|"warning"|"info", "category": "HWG"|"MDR"|"Studien"|"Heilaussagen", "explanation": "...", "suggestion": "..." }]

  medical_claims JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ "claim_text": "...", "claim_type": "efficacy"|"safety"|"indication"|"mechanism", "evidence_required": true, "evidence_provided": false, "hwg_relevant": true, "mdr_relevant": false, "severity": "warning", "suggestion": "..." }]

  -- Counts for quick filtering
  critical_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  info_count INTEGER NOT NULL DEFAULT 0,

  -- Performance
  check_duration_ms INTEGER,

  -- Raw AI response (for debugging/auditing)
  raw_ai_response JSONB,

  -- Timestamps
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_compliance_checks_generation ON public.compliance_checks(generation_id);
CREATE INDEX idx_compliance_checks_user ON public.compliance_checks(user_id);
CREATE INDEX idx_compliance_checks_org ON public.compliance_checks(organization_id);
CREATE INDEX idx_compliance_checks_status ON public.compliance_checks(overall_status);
CREATE INDEX idx_compliance_checks_checked_at ON public.compliance_checks(checked_at DESC);

-- RLS Policies
ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;

-- Users can view their own compliance checks
CREATE POLICY "Users can view own compliance checks"
ON public.compliance_checks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert compliance checks for their own generations
CREATE POLICY "Users can insert own compliance checks"
ON public.compliance_checks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can insert (for auto-checks from edge functions)
CREATE POLICY "Service role can insert compliance checks"
ON public.compliance_checks
FOR INSERT
WITH CHECK (true);

-- Admins can view organization compliance checks
CREATE POLICY "Admins can view organization compliance checks"
ON public.compliance_checks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = compliance_checks.organization_id
    AND (om.role = 'owner' OR om.role = 'admin')
  )
);

-- Analytics View: Compliance Overview
CREATE OR REPLACE VIEW public.compliance_overview AS
SELECT
  DATE(checked_at) as check_date,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE overall_status = 'passed') as passed,
  COUNT(*) FILTER (WHERE overall_status = 'warning') as warnings,
  COUNT(*) FILTER (WHERE overall_status = 'failed') as failed,
  ROUND(AVG(compliance_score)::numeric, 1) as avg_compliance_score,
  SUM(critical_count) as total_critical_violations,
  SUM(warning_count) as total_warning_violations
FROM public.compliance_checks
WHERE checked_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(checked_at)
ORDER BY check_date DESC;

-- Grant access to views
GRANT SELECT ON public.compliance_overview TO authenticated;

-- Add compliance_check_id to content_generations for quick reference
ALTER TABLE public.content_generations
ADD COLUMN IF NOT EXISTS latest_compliance_check_id UUID REFERENCES public.compliance_checks(id) ON DELETE SET NULL;

ALTER TABLE public.content_generations
ADD COLUMN IF NOT EXISTS compliance_status TEXT DEFAULT NULL CHECK (compliance_status IN ('passed', 'warning', 'failed', NULL));
