/*
  # Add passport documents storage

  1. Changes
    - Add `passport_url` column to users table
    - Add storage bucket for passport documents
    - Add policies for passport document access

  2. Security
    - Enable RLS for storage bucket
    - Add policy for users to upload their own passport
    - Add policy for users to read their own passport
*/

-- Add passport_url column to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'passport_url'
  ) THEN
    ALTER TABLE users ADD COLUMN passport_url text;
  END IF;
END $$;

-- Create storage bucket for passport documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('passport_documents', 'passport_documents', false);

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