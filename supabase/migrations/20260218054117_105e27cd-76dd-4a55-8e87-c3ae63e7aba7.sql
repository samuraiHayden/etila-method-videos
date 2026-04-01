
-- Update exercise-videos bucket file size limit to 600MB (629145600 bytes)
UPDATE storage.buckets 
SET file_size_limit = 629145600
WHERE id = 'exercise-videos';
