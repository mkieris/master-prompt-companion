-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

-- Create a new PERMISSIVE INSERT policy for organizations
CREATE POLICY "Users can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (true);