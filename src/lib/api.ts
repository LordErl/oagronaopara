import { supabase } from './supabase';
import type { Commodity, User, CommodityQuote } from './types';

export interface AgroNews {
  id: string;
  title: string;
  content: string;
  original_title?: string;
  original_content?: string;
  source_url: string;
  source_name: string;
  image_url: string;
  published_at: string;
  translated_at?: string;
  created_at: string;
  approved: boolean;
}

export interface NewsResponse {
  inserted: {
    noticia: {
      titulo: string;
      resumo: string;
      url_fonte: string;
      nome_fonte: string;
      url_imagem: string;
    };
    data?: AgroNews;
    error?: string;
    success: boolean;
  }[];
  summary: {
    total: number;
    success: number;
    error: number;
  };
}

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
  const { data, error } = await supabase
    .from('agro_news')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
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

export async function fetchNewsFromOpenAI(): Promise<NewsResponse> {
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
  
  const prompt = `MARAVILHOSO DIA!!! Preciso que você atue como um minerador de notícias do setor agro mundial, focando em informações relevantes para exportadores e importadores de commodities no Brasil. Por favor, me retorne EXATAMENTE 5 notícias, cada uma no seguinte formato JSON:\n\n[\n  {\n    "titulo": "...",\n    "resumo": "...",\n    "url_fonte": "...",\n    "nome_fonte": "...",\n    "url_imagem": "..."\n  }\n]\n\nO resumo deve ser claro e objetivo (máx. 3 frases). As imagens devem ser públicas e de alta resolução, relacionadas ao tema da notícia. Apenas retorne o array JSON, sem comentários ou texto adicional.`;

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.7,
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    throw new Error(`Erro ao consultar OpenAI: ${err}`);
  }

  const data = await openaiRes.json();
  console.log('OpenAI Response:', data);
  const content = data.choices?.[0]?.message?.content?.trim();
  console.log('Parsed content:', content);

  interface NewsItem {
    titulo: string;
    resumo: string;
    url_fonte: string;
    nome_fonte: string;
    url_imagem: string;
  }

  let noticias: NewsItem[] = [];
  try {
    noticias = JSON.parse(content);
    console.log('Parsed news:', noticias);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    const match = content.match(/\[.*\]/s);
    if (match) {
      noticias = JSON.parse(match[0]);
      console.log('Parsed news from regex:', noticias);
    } else {
      console.error('No JSON array found in content');
      throw new Error('Formato inesperado da resposta OpenAI');
    }
  }

  if (!Array.isArray(noticias) || noticias.length === 0) {
    console.error('Noticias não é um array válido:', noticias);
    throw new Error('Nenhuma notícia foi retornada pela OpenAI');
  }

  const results: NewsResponse['inserted'] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const noticia of noticias) {
    console.log('Tentando inserir notícia:', noticia);
    
    if (!noticia.titulo || !noticia.resumo) {
      console.error('Notícia com campos obrigatórios faltando:', noticia);
      errorCount++;
      results.push({ 
        noticia, 
        error: 'Campos obrigatórios faltando', 
        success: false 
      });
      continue;
    }

    try {
      const { data, error } = await supabase
        .from('agro_news')
        .insert([{
          title: noticia.titulo,
          content: noticia.resumo,
          source_url: noticia.url_fonte || '',
          source_name: noticia.nome_fonte || 'OpenAI',
          image_url: noticia.url_imagem || '',
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          approved: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro Supabase ao inserir notícia:', error);
        errorCount++;
        results.push({ noticia, error: error.message, success: false });
      } else {
        console.log('Notícia inserida com sucesso:', data);
        successCount++;
        results.push({ noticia, data, success: true });
      }
    } catch (error) {
      console.error('Erro ao inserir notícia:', error);
      errorCount++;
      results.push({ 
        noticia, 
        error: error instanceof Error ? error.message : 'Erro desconhecido', 
        success: false 
      });
    }
  }

  if (errorCount === noticias.length) {
    console.error('Todas as inserções falharam');
    throw new Error('Falha ao inserir todas as notícias');
  }

  const response: NewsResponse = { 
    inserted: results,
    summary: {
      total: noticias.length,
      success: successCount,
      error: errorCount
    }
  };
  console.log('Resposta final:', response);
  return response;
}