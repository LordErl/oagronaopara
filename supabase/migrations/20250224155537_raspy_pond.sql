/*
  # Create storage bucket for passport documents

  1. Changes
    - Creates a new storage bucket for passport documents
    - Sets up RLS policies for the bucket
    
  2. Security
    - Bucket is private (not public)
    - Users can only access their own documents
    - Upload path is restricted to user's folder
*/

-- Create storage bucket for passport documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'passport_documents', 'passport_documents', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'passport_documents'
);

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to upload their own passport
CREATE POLICY "Users can upload their own passport"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'passport_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow users to read their own passport
CREATE POLICY "Users can read their own passport"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'passport_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);