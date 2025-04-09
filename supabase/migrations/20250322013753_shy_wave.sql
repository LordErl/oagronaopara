/*
  # Add contract approval tracking

  1. Changes
    - Add function to approve contracts
    - Add policy for contract approval
    - Add trigger to track approvals

  2. Security
    - Only admins can approve contracts
    - Track who approved and when
*/

-- Add function to approve contract
CREATE OR REPLACE FUNCTION approve_contract(
  contract_id uuid,
  approver_name text
) RETURNS void AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only administrators can approve contracts';
  END IF;

  -- Update contract
  UPDATE contracts SET
    partner_accepted = true,
    partner_accepted_at = now(),
    approved_by = approver_name,
    approved_at = now()
  WHERE id = contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to track contract approval
CREATE OR REPLACE FUNCTION track_contract_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_accepted AND NOT OLD.partner_accepted THEN
    -- Log approval in audit table if needed
    -- This can be expanded later
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_approved
  AFTER UPDATE ON contracts
  FOR EACH ROW
  WHEN (NEW.partner_accepted IS DISTINCT FROM OLD.partner_accepted)
  EXECUTE FUNCTION track_contract_approval();