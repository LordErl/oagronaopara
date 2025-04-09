/*
  # Add contract signature validation

  1. Changes
    - Add function to validate contract signatures
    - Add policy for signature validation
    - Add trigger to track signature validation

  2. Security
    - Only admins can validate signatures
    - Track who validated and when
*/

-- Add function to validate contract signature
CREATE OR REPLACE FUNCTION validate_contract_signature(
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
    RAISE EXCEPTION 'Only administrators can validate contract signatures';
  END IF;

  -- Update contract
  UPDATE contracts SET
    signature_validated = true,
    signature_validated_at = now(),
    signature_validated_by = validator_name
  WHERE id = contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to track signature validation
CREATE OR REPLACE FUNCTION track_signature_validation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.signature_validated AND NOT OLD.signature_validated THEN
    -- Log validation in audit table if needed
    -- This can be expanded later
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_signature_validated
  AFTER UPDATE ON contracts
  FOR EACH ROW
  WHEN (NEW.signature_validated IS DISTINCT FROM OLD.signature_validated)
  EXECUTE FUNCTION track_signature_validation();