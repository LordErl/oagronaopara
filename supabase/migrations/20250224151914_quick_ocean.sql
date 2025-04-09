/*
  # Add contract template management

  1. New Tables
    - `contract_templates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid)
      - `is_active` (boolean)

  2. Security
    - Enable RLS
    - Only admins can manage templates
    - All authenticated users can read active templates
*/

CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage templates
CREATE POLICY "Admins can manage contract templates"
  ON contract_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Policy for reading active templates
CREATE POLICY "Users can read active templates"
  ON contract_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);