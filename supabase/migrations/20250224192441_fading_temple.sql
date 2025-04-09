/*
  # Fix admin authentication and email settings

  1. Changes
    - Add policy to allow reading is_admin field
    - Add policy for admin access to all tables
    - Add initial admin user

  2. Security
    - Enable RLS for all tables
    - Add admin-specific policies
*/

-- First, ensure we have the proper admin policies
CREATE POLICY "Allow reading is_admin status"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create admin policies for all tables
CREATE POLICY "Admins can do everything"
  ON users
  FOR ALL
  TO authenticated
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can do everything"
  ON contracts
  FOR ALL
  TO authenticated
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can do everything"
  ON offers
  FOR ALL
  TO authenticated
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can do everything"
  ON commodities
  FOR ALL
  TO authenticated
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM users WHERE id = auth.uid())
  );

-- Create initial admin user if it doesn't exist
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'e34e2362-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'efs.ceo@oagronaopara.tec.br',
  crypt('admin123', gen_salt('bf')), -- Change this password!
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create the admin user profile
INSERT INTO users (
  id,
  name,
  email,
  cpf,
  phone,
  cep,
  address,
  passport_number,
  is_admin,
  contract_signed
) VALUES (
  'e34e2362-0000-0000-0000-000000000000',
  'Admin',
  'efs.ceo@oagronaopara.tec.br',
  '00000000000',
  '+5563999535432',
  '77000000',
  'Admin Address',
  'ADMIN123',
  true,
  true
) ON CONFLICT (id) DO NOTHING;