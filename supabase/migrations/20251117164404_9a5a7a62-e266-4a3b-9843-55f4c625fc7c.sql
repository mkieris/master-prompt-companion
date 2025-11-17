-- Set the briefings bucket to public temporarily to allow uploads
UPDATE storage.buckets 
SET public = true 
WHERE id = 'briefings';