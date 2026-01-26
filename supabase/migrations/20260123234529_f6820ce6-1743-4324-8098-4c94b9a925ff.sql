-- Drop existing policies on profiles table to recreate with stricter rules
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Recreate policies with explicit RESTRICTIVE enforcement
-- Users can ONLY view their own profile (strict isolation)
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can ONLY update their own profile
CREATE POLICY "Users can update own profile only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can ONLY insert their own profile
CREATE POLICY "Users can insert own profile only"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can ONLY delete their own profile
CREATE POLICY "Users can delete own profile only"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Add a comment to document the security intent
COMMENT ON TABLE public.profiles IS 'User profiles with strict RLS - each user can only access their own profile data';