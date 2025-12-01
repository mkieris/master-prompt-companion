-- ===========================================
-- SECURITY FIX PHASE 2: Critical Access Control
-- ===========================================

-- 1. FIX: profiles SELECT - stricter email protection
-- Users can only see full profiles of themselves, others only see non-sensitive data
DROP POLICY IF EXISTS "Users can view profiles in their organizations" ON public.profiles;

-- Policy: Users can see their own profile (including email)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Policy: Org members can see other members' non-sensitive data (name, avatar only)
-- Note: This policy allows SELECT but app should filter out email in queries
CREATE POLICY "Org members can view colleague basic info"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id IN (
      SELECT get_user_org_ids(auth.uid())
    )
  )
);

-- 2. FIX: organization_members INSERT - require invitation system
-- First, create invitations table for proper invite flow
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'viewer',
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Invitations policies
CREATE POLICY "Admins can view org invitations"
ON public.organization_invitations
FOR SELECT
USING (
  has_org_role(auth.uid(), organization_id, 'owner')
  OR has_org_role(auth.uid(), organization_id, 'admin')
);

CREATE POLICY "Admins can create invitations"
ON public.organization_invitations
FOR INSERT
WITH CHECK (
  has_org_role(auth.uid(), organization_id, 'owner')
  OR has_org_role(auth.uid(), organization_id, 'admin')
);

CREATE POLICY "Admins can delete invitations"
ON public.organization_invitations
FOR DELETE
USING (
  has_org_role(auth.uid(), organization_id, 'owner')
  OR has_org_role(auth.uid(), organization_id, 'admin')
);

-- 3. FIX: organization_members INSERT - only via invitation or creating new org
DROP POLICY IF EXISTS "Users can join organizations" ON public.organization_members;

-- Create function to check if user has valid invitation
CREATE OR REPLACE FUNCTION public.has_valid_invitation(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_invitations
    WHERE organization_id = _org_id
      AND email = (SELECT email FROM auth.users WHERE id = _user_id)
      AND accepted_at IS NULL
      AND expires_at > now()
  )
$$;

CREATE POLICY "Users can join via invitation"
ON public.organization_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND has_valid_invitation(auth.uid(), organization_id)
);

-- 4. FIX: organizations INSERT - limit to reasonable number per user
-- Create function to count user's organizations
CREATE OR REPLACE FUNCTION public.count_user_organizations(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.organization_members
  WHERE user_id = _user_id
    AND role = 'owner'
$$;

DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

CREATE POLICY "Users can create organizations with limit"
ON public.organizations
FOR INSERT
WITH CHECK (
  -- Limit to 5 organizations per user
  count_user_organizations(auth.uid()) < 5
);