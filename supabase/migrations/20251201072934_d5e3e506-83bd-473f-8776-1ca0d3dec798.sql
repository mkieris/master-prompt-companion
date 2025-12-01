-- ===========================================
-- SECURITY FIX: Comprehensive RLS Policy Update
-- ===========================================

-- 1. FIX: profiles SELECT policy - restrict to organization members only
DROP POLICY IF EXISTS "Users can view all profiles in their orgs" ON public.profiles;

CREATE POLICY "Users can view profiles in their organizations"
ON public.profiles
FOR SELECT
USING (
  -- Users can always see their own profile
  id = auth.uid()
  OR
  -- Users can see profiles of people in the same organization
  id IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id IN (
      SELECT get_user_org_ids(auth.uid())
    )
  )
);

-- 2. FIX: profiles DELETE policy - GDPR compliance
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (id = auth.uid());

-- 3. FIX: organizations DELETE policy - allow owners to delete
DROP POLICY IF EXISTS "Owners can delete organizations" ON public.organizations;

CREATE POLICY "Owners can delete organizations"
ON public.organizations
FOR DELETE
USING (has_org_role(auth.uid(), id, 'owner'));

-- 4. FIX: organization_members - allow users to leave organizations
DROP POLICY IF EXISTS "Users can leave organizations" ON public.organization_members;

CREATE POLICY "Users can leave organizations"
ON public.organization_members
FOR DELETE
USING (
  -- Users can remove themselves (leave organization)
  user_id = auth.uid()
  OR
  -- Admins/Owners can remove members (existing policy covers this via ALL)
  has_org_role(auth.uid(), organization_id, 'owner')
  OR
  has_org_role(auth.uid(), organization_id, 'admin')
);

-- 5. FIX: content_versions - add UPDATE and DELETE policies for editors
DROP POLICY IF EXISTS "Editors can update versions" ON public.content_versions;
DROP POLICY IF EXISTS "Editors can delete versions" ON public.content_versions;

CREATE POLICY "Editors can update versions"
ON public.content_versions
FOR UPDATE
USING (
  project_id IN (
    SELECT cp.id
    FROM content_projects cp
    WHERE has_org_role(auth.uid(), cp.organization_id, 'owner')
       OR has_org_role(auth.uid(), cp.organization_id, 'admin')
       OR has_org_role(auth.uid(), cp.organization_id, 'editor')
  )
);

CREATE POLICY "Editors can delete versions"
ON public.content_versions
FOR DELETE
USING (
  project_id IN (
    SELECT cp.id
    FROM content_projects cp
    WHERE has_org_role(auth.uid(), cp.organization_id, 'owner')
       OR has_org_role(auth.uid(), cp.organization_id, 'admin')
       OR has_org_role(auth.uid(), cp.organization_id, 'editor')
  )
);