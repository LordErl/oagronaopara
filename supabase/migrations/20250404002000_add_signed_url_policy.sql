-- Storage policy for creating signed URLs
CREATE POLICY "Allow authenticated users to create signed URLs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contracts');
