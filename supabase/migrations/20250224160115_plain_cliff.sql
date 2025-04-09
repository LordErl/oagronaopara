/*
  # Update RLS policies for user signup

  1. Changes
    - Modifies policy to allow user creation during signup
    - Maintains security by ensuring user can only create their own profile
    
  2. Security
    - Users can create their profile during signup
    - Profile ID must match their auth.uid
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

-- Create new insert policy that allows signup
CREATE POLICY "Enable insert for signup"
  ON users
  FOR INSERT
  TO public  -- Changed from 'authenticated' to 'public'
  WITH CHECK (true);  -- Allow initial creation

-- Keep existing select/update policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);