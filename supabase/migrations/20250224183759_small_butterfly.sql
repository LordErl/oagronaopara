/*
  # Fix signup flow issues

  1. Changes
    - Drop and recreate users table with proper constraints
    - Update RLS policies to handle signup flow properly
    - Add proper indexes and constraints

  2. Security
    - Maintain data isolation
    - Allow public signup
    - Prevent duplicate entries
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Enable public signup" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow public passport upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public passport read" ON storage.objects;

-- Recreate users table with proper constraints
CREATE TABLE IF NOT EXISTS users_new (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  cpf text NOT NULL,
  phone text NOT NULL,
  cep text NOT NULL,
  address text NOT NULL,
  passport_number text NOT NULL,
  passport_url text,
  contract_signed boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_cpf_unique UNIQUE (cpf)
);

-- Copy data if old table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    INSERT INTO users_new 
    SELECT * FROM users;
  END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS users;
ALTER TABLE users_new RENAME TO users;

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_cpf_idx ON users (cpf);

-- Create policy to allow public signup
CREATE POLICY "Enable public signup"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM users 
      WHERE email = NEW.email 
      OR cpf = NEW.cpf
    )
  );

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