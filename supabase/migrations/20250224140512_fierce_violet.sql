/*
  # Create commodities and related tables

  1. New Tables
    - `commodities`
      - `id` (serial, primary key)
      - `codComm` (integer)
      - `Commoditie` (varchar)
      - `qtd` (integer)
      - `und` (varchar)
      - `dataOferta` (date)
      - `validadeOferta` (varchar)
      - `tipoOferta` (varchar)
      - `idResponsavel` (varchar)
      - `latitude` (varchar)
      - `longitude` (varchar)
      - `PrecoUSD` (numeric)
      - `FichaTecnica` (varchar)
      - `IncoTerms` (varchar)
      - `isGMO` (boolean)
      - `isConsumoHumano` (boolean)
      - `considerarOutrosLocais` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create commodities table
CREATE TABLE IF NOT EXISTS commodities (
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
ALTER TABLE commodities ENABLE ROW LEVEL SECURITY;

-- Create policies for commodities table
CREATE POLICY "Users can read all commodities"
  ON commodities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own commodities"
  ON commodities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = idResponsavel);

CREATE POLICY "Users can update their own commodities"
  ON commodities
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = idResponsavel);

CREATE POLICY "Users can delete their own commodities"
  ON commodities
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = idResponsavel);

-- Insert initial commodities data
INSERT INTO commodities (codComm, Commoditie) VALUES
  (1, 'Milho Amarelo GMO Consumo Humano'),
  (2, 'Milho Branco GMO Consumo Humano'),
  (3, 'Soja Padrão GMO Consumo Humano'),
  (4, 'Soja Avariada GMO Consumo Humano'),
  (5, 'Uréia'),
  (6, 'Açucar Icumza 45'),
  (7, 'Óleo de Soja Comestível')
ON CONFLICT (id) DO NOTHING;