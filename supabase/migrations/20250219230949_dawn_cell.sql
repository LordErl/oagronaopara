/*
  # Create offers table

  1. New Tables
    - `offers`
      - All fields matching the existing SQL Server table structure
      - Adapted for PostgreSQL compatibility
      - Added proper constraints and defaults
  
  2. Security
    - Enable RLS on `offers` table
    - Add policies for authenticated users to manage their offers
*/

CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  codComm integer,
  Commoditie varchar(50),
  qtd integer,
  und varchar(10),
  dataOferta date DEFAULT CURRENT_DATE,
  validadeOferta varchar(10),
  tipoOferta varchar(6),
  idResponsavel varchar(50),
  latitude varchar(50),
  longitude varchar(50),
  PrecoUSD numeric(30,2),
  FichaTecnica varchar(500),
  IncoTerms varchar(150),
  isGMO boolean DEFAULT false,
  isConsumoHumano boolean DEFAULT false,
  considerarOutrosLocais boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting offers (only authenticated users)
CREATE POLICY "Users can insert their own offers"
  ON offers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = idResponsavel);

-- Create policy for reading offers
CREATE POLICY "Users can read all offers"
  ON offers
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for updating offers
CREATE POLICY "Users can update their own offers"
  ON offers
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = idResponsavel);

-- Create policy for deleting offers
CREATE POLICY "Users can delete their own offers"
  ON offers
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = idResponsavel);