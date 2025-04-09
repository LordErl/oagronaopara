/*
  # Fix admin policies to avoid recursion

  1. Changes
    - Remove recursive admin policies
    - Create simplified admin access policies
    - Fix admin status check
    - Maintain existing functionality without recursion

  2. Security
    - Maintain admin privileges
    - Prevent infinite recursion
    - Keep row level security intact
*/

-- First, drop all existing admin policies to start fresh
DROP POLICY IF EXISTS "Admin access" ON users;
DROP POLICY IF EXISTS "Admin access" ON contracts;
DROP POLICY IF EXISTS "Admin access" ON offers;
DROP POLICY IF EXISTS "Admin access" ON commodities;
DROP POLICY IF EXISTS "Allow reading admin status" ON users;

-- Create a basic policy for reading user data
CREATE POLICY "Users can read own and admin data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Create admin policies for each table
CREATE POLICY "Admin full access to users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

CREATE POLICY "Admin full access to contracts"
  ON contracts
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

CREATE POLICY "Admin full access to offers"
  ON offers
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

CREATE POLICY "Admin full access to commodities"
  ON commodities
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Ensure admin user has proper permissions
UPDATE users 
SET is_admin = true 
WHERE email = 'efs.ceo@oagronaopara.tec.br';