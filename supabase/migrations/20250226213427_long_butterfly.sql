/*
  # System settings tables

  1. New Tables
    - `system_settings` - Stores key-value pairs for system configuration
    - `system_commodities` - Stores available commodity types
    - `system_incoterms` - Stores available incoterms
    - `system_currencies` - Stores available currencies
    - `system_packaging` - Stores available packaging types
    - `system_units` - Stores available units of measurement
  
  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
*/

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create system commodities table
CREATE TABLE IF NOT EXISTS system_commodities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create system incoterms table
CREATE TABLE IF NOT EXISTS system_incoterms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create system currencies table
CREATE TABLE IF NOT EXISTS system_currencies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create system packaging table
CREATE TABLE IF NOT EXISTS system_packaging (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create system units table
CREATE TABLE IF NOT EXISTS system_units (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_incoterms ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_packaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_units ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin access to system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admin access to system commodities"
  ON system_commodities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admin access to system incoterms"
  ON system_incoterms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admin access to system currencies"
  ON system_currencies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admin access to system packaging"
  ON system_packaging
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admin access to system units"
  ON system_units
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Create read policies for authenticated users
CREATE POLICY "Authenticated users can read active system commodities"
  ON system_commodities
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can read active system incoterms"
  ON system_incoterms
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can read active system currencies"
  ON system_currencies
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can read active system packaging"
  ON system_packaging
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can read active system units"
  ON system_units
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert initial data
INSERT INTO system_settings (key, value, description)
VALUES 
  ('auto_delete_expired', 'false', 'Automatically delete expired offers'),
  ('auto_delete_days', '7', 'Number of days after expiration to delete offers');

-- Insert initial commodities
INSERT INTO system_commodities (name, description, is_active)
VALUES
  ('Milho Amarelo GMO Consumo Humano', 'Milho amarelo geneticamente modificado para consumo humano', true),
  ('Milho Branco GMO Consumo Humano', 'Milho branco geneticamente modificado para consumo humano', true),
  ('Soja Padrão GMO Consumo Humano', 'Soja padrão geneticamente modificada