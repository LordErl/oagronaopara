export interface Commodity {
  id: number;
  cod_comm: number;
  commoditie: string;
  quantity: number;
  unit: string;
  offer_date: string;
  valid_until: string;
  offer_type: string;
  user_id: string;
  latitude: string;
  longitude: string;
  price_usd: number;
  price_brl?: number;
  price_eur?: number;
  price_cny?: number;
  currency: string; // Moeda principal da oferta
  technical_specs: string;
  incoterms: string;
  is_gmo: boolean;
  is_human_consumption: boolean;
  consider_other_locations: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  cep: string;
  address: string;
  passport_number: string;
  contract_signed: boolean;
  created_at: string;
  updated_at: string;
  passport_url?: string;
}

export interface Contract {
  id: string;
  user_id: string;
  signed_at?: string;
  contract_url: string;
  created_at: string;
  partner_accepted: boolean;
  partner_accepted_at?: string;
  admin_validated: boolean;
  admin_validated_at?: string;
  email_sent: boolean;
  email_sent_at?: string;
}

export interface CommodityQuote {
  id: string;
  commodity_name: string;
  price_usd: number;
  change_percentage: number;
  source_url: string;
  source_name: string;
  fetched_at: string;
  created_at: string;
}

export interface AgroNews {
  id: string;
  title: string;
  content: string;
  original_title: string;
  original_content: string;
  source_url: string;
  source_name: string;
  image_url: string;
  published_at: string;
  translated_at: string;
  created_at: string;
}