/*
  # Recreate Public Schema Tables

  1. Tables
    - users (user profiles)
    - contracts (user contracts)
    - offers (user offers)
    - commodities (available commodities)
    - contract_templates (contract templates)

  2. Security
    - Enable RLS on all tables
    - Set appropriate policies for each table
    - Configure storage policies

  3. Initial Data
    - Add initial commodities data
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS contract_templates CASCADE;
DROP TABLE IF EXISTS commodities CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  cep text NOT NULL,
  address text NOT NULL,
  passport_number text NOT NULL,
  passport_url text,
  contract_signed boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) NOT NULL,
  signed_at timestamptz,
  contract_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
  id SERIAL PRIMARY KEY,
  codComm integer,
  Commoditie varchar(50),
  qtd integer,
  und varchar(10),
  dataOferta date DEFAULT CURRENT_DATE,
  validadeOferta varchar(10),
  tipoOferta varchar(6),
  idResponsavel uuid REFERENCES public.users(id),
  latitude varchar(50),
  longitude varchar(50),
  PrecoUSD numeric(30,2),
  FichaTecnica varchar(500),
  IncoTerms varchar(150),
  isGMO boolean DEFAULT false,
  isConsumoHumano boolean DEFAULT false,
  considerarOutrosLocais boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create commodities table
CREATE TABLE public.commodities (
  id SERIAL PRIMARY KEY,
  codComm integer UNIQUE NOT NULL,
  Commoditie varchar(50) NOT NULL,
  qtd integer,
  und varchar(10),
  dataOferta date DEFAULT CURRENT_DATE,
  validadeOferta varchar(10),
  tipoOferta varchar(6),
  idResponsavel uuid REFERENCES public.users(id),
  latitude varchar(50),
  longitude varchar(50),
  PrecoUSD numeric(30,2),
  FichaTecnica varchar(500),
  IncoTerms varchar(150),
  isGMO boolean DEFAULT false,
  isConsumoHumano boolean DEFAULT false,
  considerarOutrosLocais boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create contract_templates table
CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Allow public signup"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for contracts table
CREATE POLICY "Users can read own contracts"
  ON public.contracts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own contracts"
  ON public.contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create policies for offers table
CREATE POLICY "Users can read all offers"
  ON public.offers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own offers"
  ON public.offers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = idResponsavel);

CREATE POLICY "Users can update own offers"
  ON public.offers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = idResponsavel);

CREATE POLICY "Users can delete own offers"
  ON public.offers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = idResponsavel);

-- Create policies for commodities table
CREATE POLICY "Users can read all commodities"
  ON public.commodities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own commodities"
  ON public.commodities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = idResponsavel);

CREATE POLICY "Users can update own commodities"
  ON public.commodities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = idResponsavel);

CREATE POLICY "Users can delete own commodities"
  ON public.commodities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = idResponsavel);

-- Create policies for contract_templates table
CREATE POLICY "Admins can manage contract templates"
  ON public.contract_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Users can read active templates"
  ON public.contract_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert initial commodities data
INSERT INTO public.commodities (codComm, Commoditie) VALUES
  (1, 'Milho Amarelo GMO Consumo Humano'),
  (2, 'Milho Branco GMO Consumo Humano'),
  (3, 'Soja Padrão GMO Consumo Humano'),
  (4, 'Soja Avariada GMO Consumo Humano'),
  (5, 'Uréia'),
  (6, 'Açucar Icumza 45'),
  (7, 'Óleo de Soja Comestível')
ON CONFLICT (codComm) DO NOTHING;

-- Ensure storage bucket exists and is configured correctly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'passport_documents'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('passport_documents', 'passport_documents', false);
    END IF;
END $$;

-- Reset and create storage policies
DROP POLICY IF EXISTS "Users can upload their own passport" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own passport" ON storage.objects;

CREATE POLICY "Users can upload their own passport"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'passport_documents'
);

CREATE POLICY "Users can read their own passport"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'passport_documents'
);

-- Enable RLS on storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;