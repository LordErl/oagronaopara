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
  cpf text NOT NULL,
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
  cod_comm integer,
  commoditie text,
  quantity integer,
  unit varchar(10),
  offer_date date DEFAULT CURRENT_DATE,
  valid_until date,
  offer_type varchar(6),
  user_id uuid REFERENCES public.users(id),
  latitude varchar(50),
  longitude varchar(50),
  price_usd numeric(30,2),
  technical_specs text,
  incoterms varchar(150),
  is_gmo boolean DEFAULT false,
  is_human_consumption boolean DEFAULT false,
  consider_other_locations boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create commodities table
CREATE TABLE public.commodities (
  id SERIAL PRIMARY KEY,
  cod_comm integer UNIQUE NOT NULL,
  commoditie text NOT NULL,
  quantity integer,
  unit varchar(10),
  offer_date date DEFAULT CURRENT_DATE,
  valid_until date,
  offer_type varchar(6),
  user_id uuid REFERENCES public.users(id),
  latitude varchar(50),
  longitude varchar(50),
  price_usd numeric(30,2),
  technical_specs text,
  incoterms varchar(150),
  is_gmo boolean DEFAULT false,
  is_human_consumption boolean DEFAULT false,
  consider_other_locations boolean DEFAULT false,
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
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offers"
  ON public.offers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own offers"
  ON public.offers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

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
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commodities"
  ON public.commodities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own commodities"
  ON public.commodities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

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
INSERT INTO public.commodities (cod_comm, commoditie) VALUES
  (1, 'Milho Amarelo GMO Consumo Humano'),
  (2, 'Milho Branco GMO Consumo Humano'),
  (3, 'Soja Padrão GMO Consumo Humano'),
  (4, 'Soja Avariada GMO Consumo Humano'),
  (5, 'Uréia'),
  (6, 'Açucar Icumza 45'),
  (7, 'Óleo de Soja Comestível')
ON CONFLICT (cod_comm) DO NOTHING;