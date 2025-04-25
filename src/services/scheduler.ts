import { supabase } from '../lib/supabase';
import { processNews, analyzeQuotes } from './openai';

// Lista de fontes de notícias
const NEWS_SOURCES = [
  'https://www.noticiasagricolas.com.br/noticias/agronegocio/',
  'https://www.canalrural.com.br/noticias/',
  'https://www.agrolink.com.br/noticias'
];

// Função para executar tarefas diárias
export async function runDailyTasks() {
  console.log('Iniciando tarefas diárias:', new Date().toISOString());
  
  try {
    // 1. Buscar notícias automaticamente
    await fetchDailyNews();
    
    // 2. Gerar análise de cotações
    await generateDailyQuoteAnalysis();
    
    console.log('Tarefas diárias concluídas com sucesso:', new Date().toISOString());
    return { success: true };
  } catch (error) {
    console.error('Erro ao executar tarefas diárias:', error);
    return { success: false, error };
  }
}

// Função para buscar notícias diárias
async function fetchDailyNews() {
  try {
    // Buscar notícias via OpenAI (igual ao endpoint fetch-news)
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    const prompt = `MARAVILHOSO DIA!!! Preciso que você atue como um minerador de notícias do setor agro mundial, focando em informações relevantes para exportadores e importadores de commodities no Brasil. Por favor, me retorne EXATAMENTE 5 notícias, cada uma no seguinte formato JSON:\n\n[\n  {\n    "titulo": "...",\n    "resumo": "...",\n    "url_fonte": "...",\n    "nome_fonte": "...",\n    "url_imagem": "..."\n  }\n]\n\nO resumo deve ser claro e objetivo (máx. 3 frases). As imagens devem ser públicas e de alta resolução, relacionadas ao tema da notícia. Apenas retorne o array JSON, sem comentários ou texto adicional.`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
      redirect: 'follow',
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      throw new Error('Erro ao consultar OpenAI: ' + err);
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    let noticias = [];
    try {
      noticias = JSON.parse(content);
    } catch {
      // fallback para tentar encontrar o JSON
      const match = content.match(/\[.*\]/s);
      if (match) noticias = JSON.parse(match[0]);
    }

    for (const noticia of noticias) {
      // Verifica se já existe notícia igual
      const { data: existingNews } = await supabase
        .from('agro_news')
        .select('id')
        .or(`title.eq.${noticia.titulo},source_url.eq.${noticia.url_fonte}`)
        .limit(1);
      if (existingNews && existingNews.length > 0) continue;
      await supabase.from('agro_news').insert([{
        title: noticia.titulo,
        content: noticia.resumo,
        source_url: noticia.url_fonte,
        source_name: noticia.nome_fonte,
        image_url: noticia.url_imagem,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        approved: false
      }]);
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao buscar notícias automaticamente via OpenAI:', error);
    throw error;
  }
}

// Função para gerar análise diária de cotações
async function generateDailyQuoteAnalysis() {
  try {
    // Buscar cotações recentes
    const { data: recentQuotes, error } = await supabase
      .from('quotes')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    if (!recentQuotes || recentQuotes.length === 0) {
      console.log('Nenhuma cotação encontrada para análise');
      return { success: false, reason: 'no_quotes' };
    }
    
    // Gerar análise
    const quoteAnalysis = await analyzeQuotes(recentQuotes);
    
    // Salvar análise
    const { error: insertError } = await supabase
      .from('quote_analyses')
      .insert([quoteAnalysis]);
    
    if (insertError) throw insertError;
    
    console.log('Análise de cotações gerada com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro ao gerar análise diária de cotações:', error);
    throw error;
  }
}
