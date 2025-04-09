/*
  # Create users and contracts tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `cep` (text)
      - `address` (text)
      - `passport_number` (text)
      - `contract_signed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `contracts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `signed_at` (timestamp)
      - `contract_url` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read their own data
    - Add policies for users to update their own contract status
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  cep text NOT NULL,
  address text NOT NULL,
  passport_number text NOT NULL,
  contract_signed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  signed_at timestamptz,
  contract_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for contracts table
CREATE POLICY "Users can read own contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own contracts"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());