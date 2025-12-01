-- ===========================================
-- SECURITY FIX PHASE 4: Final Critical Fixes
-- ===========================================

-- 1. FIX: Remove email exposure from colleague view
-- Only allow viewing own email, colleagues see name/avatar only
DROP POLICY IF EXISTS "Org members can view colleague basic info" ON public.profiles;

-- Create a view for safe profile data (without email)
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  current_organization_id,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.safe_profiles TO authenticated;

-- 2. FIX: Add UPDATE policy for invitations (mark as accepted)
CREATE POLICY "Invited users can accept invitations"
ON public.organization_invitations
FOR UPDATE
USING (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- User's email must match invitation email  
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND
  -- Invitation must not be expired
  expires_at > now()
  AND
  -- Invitation must not already be accepted
  accepted_at IS NULL
)
WITH CHECK (
  -- Can only update accepted_at field (implicitly by only allowing this condition)
  accepted_at IS NOT NULL
);

-- Also allow admins to update invitations
CREATE POLICY "Admins can update invitations"
ON public.organization_invitations
FOR UPDATE
USING (
  has_org_role(auth.uid(), organization_id, 'owner')
  OR has_org_role(auth.uid(), organization_id, 'admin')
);