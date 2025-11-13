-- Add user_id column to seo_projects table
ALTER TABLE public.seo_projects 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing permissive RLS policies
DROP POLICY IF EXISTS "Allow public delete access to seo_projects" ON public.seo_projects;
DROP POLICY IF EXISTS "Allow public insert access to seo_projects" ON public.seo_projects;
DROP POLICY IF EXISTS "Allow public read access to seo_projects" ON public.seo_projects;
DROP POLICY IF EXISTS "Allow public update access to seo_projects" ON public.seo_projects;

-- Create user-specific RLS policies
CREATE POLICY "Users can view their own seo_projects" 
ON public.seo_projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own seo_projects" 
ON public.seo_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seo_projects" 
ON public.seo_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seo_projects" 
ON public.seo_projects 
FOR DELETE 
USING (auth.uid() = user_id);