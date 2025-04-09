/*
  # Add WhatsApp interaction logging

  1. New Tables
    - `whatsapp_logs`
      - Track all WhatsApp interactions
      - Store message content and responses
      - Track success/failure

  2. Security
    - Enable RLS
    - Add admin access policies
*/

-- Create WhatsApp logs table
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to read logs
CREATE POLICY "Admins can read WhatsApp logs"
  ON whatsapp_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Create indexes for better performance
CREATE INDEX whatsapp_logs_created_at_idx ON whatsapp_logs(created_at DESC);
CREATE INDEX whatsapp_logs_phone_number_idx ON whatsapp_logs(phone_number);