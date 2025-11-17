-- Create storage bucket for briefing documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'briefings',
  'briefings',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
);

-- RLS policies for briefings bucket
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