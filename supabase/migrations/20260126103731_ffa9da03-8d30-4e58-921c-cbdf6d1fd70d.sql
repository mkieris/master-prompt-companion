-- Add UPDATE policy for content_ratings - users can update their own ratings
CREATE POLICY "Users can update their own ratings"
ON content_ratings
FOR UPDATE
USING (auth.uid() = rated_by)
WITH CHECK (auth.uid() = rated_by);

-- Add DELETE policy for content_ratings - users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
ON content_ratings
FOR DELETE
USING (auth.uid() = rated_by);