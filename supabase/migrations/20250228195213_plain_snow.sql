-- Add status fields to contracts table
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS partner_accepted boolean DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS partner_accepted_at timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS admin_validated boolean DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS admin_validated_at timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS contracts_user_id_idx ON contracts(user_id);
CREATE INDEX IF NOT EXISTS contracts_partner_accepted_idx ON contracts(partner_accepted);
CREATE INDEX IF NOT EXISTS contracts_admin_validated_idx ON contracts(admin_validated);

-- Add policies for contracts
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