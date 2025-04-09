/*
  # Add contract validation tracking

  1. Changes
    - Add validation tracking columns to contracts table
    - Add policies for validation actions
    - Add indexes for better performance

  2. Security
    - Only admins can validate contracts
    - Track who validated and when
*/

-- Add validation tracking columns
ALTER TABLE contracts 
  ADD COLUMN IF NOT EXISTS validated_by text,
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS signature_validated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS signature_validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS signature_validated_by text,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS contracts_validated_by_idx ON contracts(validated_by);
CREATE INDEX IF NOT EXISTS contracts_validated_at_idx ON contracts(validated_at);
CREATE INDEX IF NOT EXISTS contracts_signature_validated_idx ON contracts(signature_validated);
CREATE INDEX IF NOT EXISTS contracts_approved_by_idx ON contracts(approved_by);

-- Add validation policies
CREATE POLICY "Admins can validate contracts"
  ON contracts
  FOR UPDATE
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

-- Add function to validate contract
CREATE OR REPLACE FUNCTION validate_contract(
  contract_id uuid,
  validator_name text
) RETURNS void AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can validate contracts';
  END IF;

  -- Update contract
  UPDATE contracts SET
    admin_validated = true,
    admin_validated_at = now(),
    validated_by = validator_name,
    validated_at = now()
  WHERE id = contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;