-- ===========================================
-- SECURITY FIX PHASE 5: Remove SECURITY DEFINER view
-- ===========================================

-- Drop the problematic view
DROP VIEW IF EXISTS public.safe_profiles;

-- Instead, add a function to get safe colleague data
CREATE OR REPLACE FUNCTION public.get_colleague_profiles(_org_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  INNER JOIN public.organization_members om ON om.user_id = p.id
  WHERE om.organization_id = _org_id
    AND is_org_member(_org_id, auth.uid())
$$;