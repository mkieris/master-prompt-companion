-- ===========================================
-- SECURITY FIX PHASE 8: Fix seo_projects orphan issue
-- ===========================================

-- Add policy for orphaned seo_projects (allow users to claim them)
-- Or alternatively, ensure user_id is NOT NULL for new records
-- Note: We can't change existing NULL values, but we ensure new ones require user_id

-- Add a policy to handle orphan cleanup by any authenticated user
CREATE POLICY "Authenticated users can delete orphaned seo_projects"
ON public.seo_projects
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NULL
);

-- Also add INSERT policy that requires user_id
DROP POLICY IF EXISTS "Users can create their own seo_projects" ON public.seo_projects;

CREATE POLICY "Authenticated users can create seo_projects"
ON public.seo_projects
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);