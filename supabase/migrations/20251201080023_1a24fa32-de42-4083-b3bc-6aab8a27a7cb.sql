-- ===========================================
-- SECURITY FIX PHASE 9: Allow invited users to see their invitations
-- ===========================================

-- Allow users to view invitations addressed to their email
CREATE POLICY "Invited users can view their own invitations"
ON public.organization_invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
);