import { supabase } from './supabase';
import type { Commodity, User, CommodityQuote, AgroNews } from './types';

export async function fetchLatestQuotes(): Promise<CommodityQuote[]> {
  try {
    const { data, error } = await supabase
      .from('commodity_quotes')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching quotes:', err);
    return []; // Return empty array instead of throwing
  }
}

export async function fetchLatestNews(): Promise<AgroNews[]> {
  try {
    const { data, error } = await supabase
      .from('agro_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(6);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching news:', err);
    return []; // Return empty array instead of throwing
  }
}

export async function fetchCommodities() {
  const { data, error } = await supabase
    .from('commodities')
    .select('*')
    .order('cod_comm', { ascending: true });

  if (error) throw error;
  return data as Commodity[];
}

export async function createCommodity(commodity: Omit<Commodity, 'id'> | any) {
  // Use the offers table instead of commodities to avoid unique constraint violation
  const { data, error } = await supabase
    .from('offers')
    .insert([{
      cod_comm: commodity.codComm || commodity.cod_comm,
      commoditie: commodity.commoditie,
      quantity: commodity.quantity,
      unit: commodity.unit,
      offer_date: commodity.offer_date,
      valid_until: commodity.valid_until,
      offer_type: commodity.offer_type,
      user_id: commodity.user_id,
      latitude: commodity.latitude,
      longitude: commodity.longitude,
      price_usd: commodity.price_usd,
      technical_specs: commodity.technical_specs,
      incoterms: commodity.incoterms,
      is_gmo: commodity.is_gmo,
      is_human_consumption: commodity.is_human_consumption,
      consider_other_locations: commodity.consider_other_locations
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCommodity(id: number, updates: Partial<Commodity>) {
  const { data, error } = await supabase
    .from('commodities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Commodity;
}

export async function deleteCommodity(id: number) {
  const { error } = await supabase
    .from('commodities')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchOffers() {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .order('offer_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchActiveOffers() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      users:user_id (
        name,
        email
      )
    `)
    .gte('valid_until', today)
    .order('offer_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function expressInterestInOffer(offer: any) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  // Get user details
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('name, email, phone')
    .eq('id', user.id)
    .single();
  
  if (userError) throw userError;
  
  // Send email notification
  const emailData = {
    to: 'efs.ceo@oagronaopara.tec.br',
    subject: `Interesse em Oferta: ${offer.commoditie}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #166534;">Novo Interesse em Oferta</h1>
        
        <p>Um usuário demonstrou interesse na seguinte oferta:</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h2 style="margin-top: 0; color: #374151;">${offer.commoditie}</h2>
          <p><strong>Tipo:</strong> ${offer.offer_type === 'VENDA' ? 'Venda' : 'Compra'}</p>
          <p><strong>Quantidade:</strong> ${offer.quantity} ${offer.unit}</p>
          <p><strong>Preço:</strong> USD ${offer.price_usd.toFixed(2)}</p>
          <p><strong>Incoterms:</strong> ${offer.incoterms}</p>
          <p><strong>Válido até:</strong> ${new Date(offer.valid_until).toLocaleDateString()}</p>
        </div>
        
        <h3 style="color: #374151;">Dados do Interessado:</h3>
        <p><strong>Nome:</strong> ${userData.name}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>Telefone:</strong> ${userData.phone}</p>
        
        <p style="margin-top: 20px; color: #666;">
          Este email foi enviado automaticamente pelo sistema oagronaopara.tec.br
        </p>
      </div>
    `
  };

  // Use Supabase's email service or a custom function
  const { error } = await supabase.functions.invoke('send-email', {
    body: emailData
  });

  if (error) throw error;
  
  // Log the interest in the database for tracking
  const { error: logError } = await supabase
    .from('offer_interests')
    .insert([{
      offer_id: offer.id,
      user_id: user.id,
      created_at: new Date().toISOString()
    }]);

  if (logError) {
    console.error('Error logging interest:', logError);
    // Continue even if logging fails, as the email was sent
  }

  return true;
}

export async function deleteOffer(id: number) {
  const { error } = await supabase
    .from('offers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as User[];
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data as User;
}

export async function deleteExpiredOffers() {
  try {
    const { data, error } = await supabase
      .from('offers')
      .delete()
      .lt('expiration_date', new Date().toISOString());

    if (error) throw error;
    return { success: true, deletedCount: data?.length || 0 };
  } catch (err) {
    console.error('Error deleting expired offers:', err);
    return { success: false, error: err };
  }
}