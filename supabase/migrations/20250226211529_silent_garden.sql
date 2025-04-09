/*
  # Create offer interests table

  1. New Tables
    - `offer_interests`
      - `id` (uuid, primary key)
      - `offer_id` (integer, references offers.id)
      - `user_id` (uuid, references users.id)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `offer_interests` table
    - Add policies for authenticated users to create and read their own interests
*/

-- Create offer_interests table
CREATE TABLE IF NOT EXISTS offer_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id integer REFERENCES offers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE offer_interests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own interests"
  ON offer_interests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own interests"
  ON offer_interests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all interests"
  ON offer_interests
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
CREATE INDEX offer_interests_offer_id_idx ON offer_interests(offer_id);
CREATE INDEX offer_interests_user_id_idx ON offer_interests(user_id);