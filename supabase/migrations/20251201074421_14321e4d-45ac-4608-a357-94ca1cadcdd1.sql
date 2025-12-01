-- ===========================================
-- SECURITY FIX PHASE 6: Final Hardening
-- ===========================================

-- 1. FIX: Prevent privilege escalation - admins cannot modify owner roles
CREATE OR REPLACE FUNCTION public.prevent_owner_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent changing someone to owner unless you are owner
  IF NEW.role = 'owner' AND OLD.role != 'owner' THEN
    IF NOT has_org_role(auth.uid(), NEW.organization_id, 'owner') THEN
      RAISE EXCEPTION 'Only owners can promote to owner role';
    END IF;
  END IF;
  
  -- Prevent demoting an owner unless you are owner
  IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
    IF NOT has_org_role(auth.uid(), NEW.organization_id, 'owner') THEN
      RAISE EXCEPTION 'Only owners can demote owners';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_owner_role_changes ON public.organization_members;
CREATE TRIGGER check_owner_role_changes
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_role_changes();

-- 2. FIX: Ensure at least one owner per organization
CREATE OR REPLACE FUNCTION public.ensure_org_has_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_count integer;
BEGIN
  -- Count remaining owners after this operation
  SELECT COUNT(*) INTO owner_count
  FROM public.organization_members
  WHERE organization_id = OLD.organization_id
    AND role = 'owner'
    AND id != OLD.id;
    
  IF owner_count = 0 THEN
    RAISE EXCEPTION 'Cannot remove the last owner of an organization';
  END IF;
  
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS check_last_owner ON public.organization_members;
CREATE TRIGGER check_last_owner
  BEFORE DELETE ON public.organization_members
  FOR EACH ROW
  WHEN (OLD.role = 'owner')
  EXECUTE FUNCTION public.ensure_org_has_owner();

-- Also prevent demoting last owner
CREATE OR REPLACE FUNCTION public.prevent_last_owner_demotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_count integer;
BEGIN
  IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
    SELECT COUNT(*) INTO owner_count
    FROM public.organization_members
    WHERE organization_id = OLD.organization_id
      AND role = 'owner'
      AND id != OLD.id;
      
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot demote the last owner of an organization';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_last_owner_demotion ON public.organization_members;
CREATE TRIGGER check_last_owner_demotion
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_owner_demotion();

-- 3. Fix organization_invitations to prevent cross-org access
DROP POLICY IF EXISTS "Deny anonymous access to invitations" ON public.organization_invitations;