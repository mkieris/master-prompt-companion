-- Fix storage exposure: Set briefings bucket back to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'briefings';

-- Ensure RLS policies exist for the briefings bucket (recreate if needed)
DROP POLICY IF EXISTS "Users can upload their own briefings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own briefings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own briefings" ON storage.objects;

CREATE POLICY "Users can upload their own briefings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'briefings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own briefings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'briefings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own briefings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'briefings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);