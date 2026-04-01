-- Create storage bucket for exercise videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-videos',
  'exercise-videos',
  true,
  524288000,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload videos
CREATE POLICY "Admins can upload exercise videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-videos' AND is_admin(auth.uid())
);

-- Allow admins to update/delete exercise videos
CREATE POLICY "Admins can update exercise videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'exercise-videos' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete exercise videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'exercise-videos' AND is_admin(auth.uid()));

-- Allow everyone (authenticated) to view exercise videos
CREATE POLICY "Anyone can view exercise videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-videos');