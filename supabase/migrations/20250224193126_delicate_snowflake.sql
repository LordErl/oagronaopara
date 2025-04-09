/*
  # Fix signup policy to avoid using NEW

  1. Changes
    - Remove policy that uses NEW keyword
    - Create new policy that uses proper RLS syntax
    - Maintain unique constraints through database constraints instead of policy

  2. Security
    - Maintain data integrity
    - Prevent duplicate emails and CPFs
    - Allow public signup while maintaining security
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Enable public signup" ON users;

-- Create new signup policy without using NEW
CREATE POLICY "Enable public signup"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure we have proper unique constraints
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_email_unique,
  DROP CONSTRAINT IF EXISTS users_cpf_unique,
  ADD CONSTRAINT users_email_unique UNIQUE (email),
  ADD CONSTRAINT users_cpf_unique UNIQUE (cpf);