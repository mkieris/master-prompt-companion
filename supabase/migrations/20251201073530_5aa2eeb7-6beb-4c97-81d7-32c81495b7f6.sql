-- ===========================================
-- SECURITY FIX PHASE 3: Block Anonymous Access
-- ===========================================

-- 1. profiles - deny anonymous access
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. organization_invitations - deny anonymous access
CREATE POLICY "Deny anonymous access to invitations"
ON public.organization_invitations
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. organizations - deny anonymous access  
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

CREATE POLICY "Authenticated users can view their organizations"
ON public.organizations
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND id IN (SELECT get_user_org_ids(auth.uid()))
);

-- 4. domain_knowledge - deny anonymous access
DROP POLICY IF EXISTS "Org members can view domain knowledge" ON public.domain_knowledge;

CREATE POLICY "Authenticated org members can view domain knowledge"
ON public.domain_knowledge
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
);

-- 5. competitor_analyses - deny anonymous access
DROP POLICY IF EXISTS "Users can view their organization's competitor analyses" ON public.competitor_analyses;

CREATE POLICY "Authenticated org members can view competitor analyses"
ON public.competitor_analyses
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_org_member(organization_id, auth.uid())
);

-- 6. content_projects - deny anonymous access
DROP POLICY IF EXISTS "Org members can view projects" ON public.content_projects;

CREATE POLICY "Authenticated org members can view projects"
ON public.content_projects
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
);

-- 7. content_plans - deny anonymous access  
DROP POLICY IF EXISTS "Org members can view content plans" ON public.content_plans;

CREATE POLICY "Authenticated org members can view content plans"
ON public.content_plans
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
);

-- 8. content_versions - deny anonymous access
DROP POLICY IF EXISTS "Org members can view versions" ON public.content_versions;

CREATE POLICY "Authenticated org members can view versions"
ON public.content_versions
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND project_id IN (
    SELECT id FROM content_projects
    WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))
  )
);

-- 9. organization_members - deny anonymous access
DROP POLICY IF EXISTS "Members can view their org members" ON public.organization_members;

CREATE POLICY "Authenticated members can view their org members"
ON public.organization_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
);

-- 10. seo_projects - deny anonymous access
DROP POLICY IF EXISTS "Users can view their own seo_projects" ON public.seo_projects;

CREATE POLICY "Authenticated users can view their own seo_projects"
ON public.seo_projects
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);