-- Insert initial commodities
INSERT INTO system_commodities (name, description, is_active)
VALUES
  ('Milho Amarelo GMO Consumo Humano', 'Milho amarelo geneticamente modificado para consumo humano', true),
  ('Milho Branco GMO Consumo Humano', 'Milho branco geneticamente modificado para consumo humano', true),
  ('Soja Padrão GMO Consumo Humano', 'Soja padrão geneticamente modificada para consumo humano', true),
  ('Soja Avariada GMO Consumo Humano', 'Soja avariada geneticamente modificada para consumo humano', true),
  ('Uréia', 'Fertilizante nitrogenado', true),
  ('Açucar Icumza 45', 'Açúcar com índice de cor ICUMSA 45', true),
  ('Óleo de Soja Comestível', 'Óleo de soja refinado para consumo humano', true);

-- Insert initial incoterms
INSERT INTO system_incoterms (name, code, description, is_active)
VALUES
  ('Free On Board', 'FOB', 'Vendedor entrega a mercadoria a bordo do navio designado pelo comprador no porto de embarque', true),
  ('Cost, Insurance and Freight', 'CIF', 'Vendedor entrega a mercadoria a bordo do navio, paga o frete e seguro até o porto de destino', true),
  ('Cost and Freight', 'CFR', 'Vendedor entrega a mercadoria a bordo do navio e paga o frete até o porto de destino', true),
  ('Ex Works', 'EXW', 'Vendedor disponibiliza a mercadoria em suas instalações', true),
  ('Free Carrier', 'FCA', 'Vendedor entrega a mercadoria ao transportador designado pelo comprador', true),
  ('Carriage Paid To', 'CPT', 'Vendedor entrega a mercadoria ao transportador e paga o frete até o destino', true),
  ('Carriage and Insurance Paid To', 'CIP', 'Vendedor entrega a mercadoria ao transportador, paga o frete e seguro até o destino', true),
  ('Delivered at Place', 'DAP', 'Vendedor entrega a mercadoria no local de destino designado', true),
  ('Delivered at Place Unloaded', 'DPU', 'Vendedor entrega a mercadoria descarregada no local de destino designado', true),
  ('Delivered Duty Paid', 'DDP', 'Vendedor entrega a mercadoria no local de destino designado, com impostos pagos', true);

-- Insert initial currencies
INSERT INTO system_currencies (name, code, description, is_active)
VALUES
  ('Dólar Americano', 'USD', 'Moeda oficial dos Estados Unidos', true),
  ('Euro', 'EUR', 'Moeda oficial da União Europeia', true),
  ('Real Brasileiro', 'BRL', 'Moeda oficial do Brasil', true),
  ('Libra Esterlina', 'GBP', 'Moeda oficial do Reino Unido', true),
  ('Iene Japonês', 'JPY', 'Moeda oficial do Japão', true),
  ('Yuan Chinês', 'CNY', 'Moeda oficial da China', true);

-- Insert initial packaging types
INSERT INTO system_packaging (name, code, description, is_active)
VALUES
  ('Granel', 'BULK', 'Mercadoria transportada sem embalagem', true),
  ('Big Bag', 'BB', 'Sacas grandes de 500kg a 1500kg', true),
  ('Sacas', 'BAG', 'Sacas de 25kg a 60kg', true),
  ('Container', 'CTN', 'Container padrão de 20 ou 40 pés', true),
  ('Tambor', 'DRM', 'Tambores metálicos ou plásticos', true),
  ('IBC', 'IBC', 'Intermediate Bulk Container de 1000L', true);

-- Insert initial units
INSERT INTO system_units (name, code, description, is_active)
VALUES
  ('Tonelada', 'TON', 'Tonelada métrica (1000kg)', true),
  ('Quilograma', 'KG', 'Unidade básica de massa', true),
  ('Saca', 'SC', 'Saca de 60kg', true),
  ('Litro', 'L', 'Unidade de volume', true),
  ('Metro Cúbico', 'M3', 'Unidade de volume', true),
  ('Container 20 pés', 'C20', 'Container padrão de 20 pés', true),
  ('Container 40 pés', 'C40', 'Container padrão de 40 pés', true);

-- Create function to automatically delete expired offers
CREATE OR REPLACE FUNCTION auto_delete_expired_offers() RETURNS void AS $$
DECLARE
  auto_delete boolean;
  days_after integer;
  cutoff_date date;
BEGIN
  -- Get settings
  SELECT (value = 'true') INTO auto_delete FROM system_settings WHERE key = 'auto_delete_expired';
  SELECT COALESCE(value::integer, 7) INTO days_after FROM system_settings WHERE key = 'auto_delete_days';
  
  -- If auto delete is enabled
  IF auto_delete THEN
    -- Calculate cutoff date
    cutoff_date := CURRENT_DATE - days_after;
    
    -- Delete expired offers
    DELETE FROM offers WHERE valid_until < cutoff_date;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the function daily
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'delete-expired-offers',
      '0 0 * * *',  -- Run at midnight every day
      $$SELECT auto_delete_expired_offers()$$
    );
  END IF;
END $$;