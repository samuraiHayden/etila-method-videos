-- Create storage policies for progress-photos bucket
-- First, ensure the bucket exists and is configured correctly
UPDATE storage.buckets SET public = false WHERE id = 'progress-photos';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all photos" ON storage.objects;

-- Create policies for progress-photos bucket
-- Users can upload photos to their own folder
CREATE POLICY "Users can upload their own progress photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'progress-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own photos
CREATE POLICY "Users can view their own progress photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'progress-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own photos
CREATE POLICY "Users can update their own progress photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'progress-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own progress photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'progress-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all photos in the bucket
CREATE POLICY "Admins can view all progress photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'progress-photos' 
  AND public.is_admin(auth.uid())
);