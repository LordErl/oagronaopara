/*
  # Add commodity quotes and news tables

  1. New Tables
    - `commodity_quotes`
      - Historical price data for commodities
      - Source tracking
      - Timestamp information
    - `agro_news`
      - Agricultural news articles
      - Source and translation tracking
      - Publication metadata

  2. Security
    - Enable RLS on new tables
    - Add admin policies for management
    - Allow authenticated users to read data
*/

-- Create commodity quotes table
CREATE TABLE IF NOT EXISTS commodity_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_name text NOT NULL,
  price_usd numeric(10,2) NOT NULL,
  change_percentage numeric(5,2),
  source_url text NOT NULL,
  source_name text NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create news table
CREATE TABLE IF NOT EXISTS agro_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  original_title text,
  original_content text,
  source_url text NOT NULL,
  source_name text NOT NULL,
  image_url text,
  published_at timestamptz NOT NULL,
  translated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE commodity_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_news ENABLE ROW LEVEL SECURITY;

-- Create policies for commodity quotes
CREATE POLICY "Users can read commodity quotes"
  ON commodity_quotes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage commodity quotes"
  ON commodity_quotes
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Create policies for news
CREATE POLICY "Users can read news"
  ON agro_news
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage news"
  ON agro_news
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Create indexes for better performance
CREATE INDEX commodity_quotes_commodity_name_idx ON commodity_quotes (commodity_name);
CREATE INDEX commodity_quotes_fetched_at_idx ON commodity_quotes (fetched_at DESC);
CREATE INDEX agro_news_published_at_idx ON agro_news (published_at DESC);

-- Add function to clean old data
CREATE OR REPLACE FUNCTION clean_old_data() RETURNS void AS $$
BEGIN
  -- Delete commodity quotes older than 1 month
  DELETE FROM commodity_quotes
  WHERE fetched_at < NOW() - INTERVAL '1 month';
  
  -- Delete news older than 1 month
  DELETE FROM agro_news
  WHERE published_at < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;