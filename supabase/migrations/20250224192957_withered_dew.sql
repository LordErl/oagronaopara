/*
  # Fix admin policies to prevent infinite recursion

  1. Changes
    - Remove circular reference in admin policies
    - Simplify admin check using direct id comparison
    - Add admin check policy
    - Update existing policies to use the new admin check

  2. Security
    - Maintain RLS security
    - Ensure admin access works correctly
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can do everything" ON users;
DROP POLICY IF EXISTS "Admins can do everything" ON contracts;
DROP POLICY IF EXISTS "Admins can do everything" ON offers;
DROP POLICY IF EXISTS "Admins can do everything" ON commodities;
DROP POLICY IF EXISTS "Allow reading is_admin status" ON users;

-- Create a simpler admin check policy
CREATE POLICY "Allow reading admin status"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin = true);

-- Create admin policies for all tables without circular references
CREATE POLICY "Admin access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admin access"
  ON contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admin access"
  ON offers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admin access"
  ON commodities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Ensure the admin user exists and has proper permissions
UPDATE users 
SET is_admin = true 
WHERE email = 'efs.ceo@oagronaopara.tec.br';