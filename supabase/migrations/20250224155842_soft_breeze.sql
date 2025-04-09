/*
  # Update RLS policies for user creation

  1. Changes
    - Adds policy to allow new user creation during signup
    - Ensures users can only create their own profile with matching auth.uid
    
  2. Security
    - Users can only create their own profile
    - Profile ID must match their auth.uid
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Create new insert policy
CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;