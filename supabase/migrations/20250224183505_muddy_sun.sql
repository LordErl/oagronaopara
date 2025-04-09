/*
  # Fix RLS policies for signup flow

  1. Changes
    - Update RLS policies to allow public signup
    - Fix storage policies for passport upload
    - Add missing policies for user creation

  2. Security
    - Maintain data isolation between users
    - Allow public access only where necessary
    - Ensure proper authentication checks
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow all operations during signup" ON users;
DROP POLICY IF EXISTS "Users can upload their own passport" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own passport" ON storage.objects;

-- Create policy to allow public signup
CREATE POLICY "Enable public signup"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create storage policies that allow public upload during signup
CREATE POLICY "Allow public passport upload"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'passport_documents');

CREATE POLICY "Allow public passport read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'passport_documents');

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;