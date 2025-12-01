-- ===========================================
-- FIX: Allow triggers to work properly and fix auth.users access
-- ===========================================

-- 1. Fix has_valid_invitation to use profiles table instead of auth.users
CREATE OR REPLACE FUNCTION public.has_valid_invitation(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_invitations oi
    INNER JOIN public.profiles p ON p.email = oi.email
    WHERE oi.organization_id = _org_id
      AND p.id = _user_id
      AND oi.accepted_at IS NULL
      AND oi.expires_at > now()
  )
$$;

-- 2. Update handle_new_organization to work with new RLS
-- The trigger is SECURITY DEFINER but still needs to bypass RLS
DROP FUNCTION IF EXISTS public.handle_new_organization() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert organization member (bypasses RLS as SECURITY DEFINER)
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'owner');
  
  -- Set as current organization for user
  UPDATE public.profiles 
  SET current_organization_id = NEW.id 
  WHERE id = auth.uid();
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_new_organization ON public.organizations;
CREATE TRIGGER on_new_organization
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- 3. Add policy to allow first organization member insertion during org creation
-- The trigger runs as SECURITY DEFINER so it bypasses RLS, but we need a fallback
DROP POLICY IF EXISTS "Users can join via invitation" ON public.organization_members;

-- Allow users to join via invitation OR when creating their own org (triggered)
CREATE POLICY "Users can join via invitation or own org"
ON public.organization_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Either via valid invitation
    has_valid_invitation(auth.uid(), organization_id)
    OR
    -- Or as owner of a new organization they just created
    (
      role = 'owner'
      AND NOT EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = organization_members.organization_id
      )
    )
  )
);

-- 4. Fix invited users can accept invitations policy
DROP POLICY IF EXISTS "Invited users can accept invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Invited users can view their own invitations" ON public.organization_invitations;

CREATE POLICY "Users can view and accept their invitations"
ON public.organization_invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Users can accept their invitations"
ON public.organization_invitations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
  AND expires_at > now()
  AND accepted_at IS NULL
);