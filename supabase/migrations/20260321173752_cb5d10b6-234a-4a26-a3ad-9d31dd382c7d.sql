-- Make exercise-videos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'exercise-videos';

-- Drop all existing exercise-videos storage policies
DROP POLICY IF EXISTS "Authenticated users can view exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete exercise videos" ON storage.objects;

-- Recreate policies
CREATE POLICY "Authenticated users can view exercise videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exercise-videos');

CREATE POLICY "Admins can upload exercise videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exercise-videos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update exercise videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'exercise-videos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete exercise videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'exercise-videos' AND public.is_admin(auth.uid()));