-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Policy for email_logs: allow insert for authenticated users
CREATE POLICY "Allow authenticated users to insert email logs"
ON email_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for contracts: allow update for authenticated users
CREATE POLICY "Allow authenticated users to update contracts"
ON contracts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Storage policy for contracts bucket
CREATE POLICY "Allow authenticated users to upload contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts' AND
  (storage.foldername(name))[1] = 'contracts'
);

-- Storage policy for reading contracts
CREATE POLICY "Allow authenticated users to read contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts' AND
  (storage.foldername(name))[1] = 'contracts'
);
