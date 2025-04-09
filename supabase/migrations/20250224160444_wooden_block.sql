/*
  # Fix RLS policies for user signup

  1. Changes
    - Drops and recreates policies to ensure proper signup flow
    - Allows public access for initial user creation
    - Maintains secure access for authenticated operations
    
  2. Security
    - Public access for INSERT only during signup
    - Authenticated access for all other operations
    - Ensures data integrity and security
*/

-- First, drop all existing policies on the users table
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable insert for signup" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create a new comprehensive set of policies

-- Allow public signup
CREATE POLICY "Allow public signup"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;