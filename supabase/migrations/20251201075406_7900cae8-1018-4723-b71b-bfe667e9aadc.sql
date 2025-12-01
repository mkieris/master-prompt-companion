-- ===========================================
-- SECURITY FIX PHASE 7: Clean up conflicting policies
-- ===========================================

-- Remove the overly permissive policy that allows all authenticated users to see all profiles
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;