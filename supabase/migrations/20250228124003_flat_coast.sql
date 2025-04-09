/*
  # Create email logs table

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key)
      - `recipient` (text)
      - `subject` (text)
      - `sent_at` (timestamp)
      - `success` (boolean)
  2. Security
    - Enable RLS on `email_logs` table
    - Add policy for admins to read logs
*/

-- Create email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  success boolean DEFAULT true,
  error_message text
);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to read logs
CREATE POLICY "Admins can read email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Create index for better performance
CREATE INDEX email_logs_sent_at_idx ON email_logs(sent_at DESC);