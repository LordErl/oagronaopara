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
    // Escolher 3 fontes aleatórias (ou menos se a lista for menor)
    const shuffled = [...NEWS_SOURCES].sort(() => 0.5 - Math.random());
    const selectedSources = shuffled.slice(0, Math.min(3, NEWS_SOURCES.length));
    
    for (const source of selectedSources) {
      const processedNews = await processNews(source);
      
      // Verificar se a notícia já existe (pelo título ou URL)
      const { data: existingNews } = await supabase
        .from('news')
        .select('id')
        .or(`title.eq.${processedNews.title},source_url.eq.${processedNews.source_url}`)
        .limit(1);
      
      if (existingNews && existingNews.length > 0) {
        console.log('Notícia já existe, pulando:', processedNews.title);
        continue;
      }
      
      // Inserir nova notícia
      const { error } = await supabase
        .from('news')
        .insert([{
          title: processedNews.title,
          content: processedNews.content,
          original_title: processedNews.original_title,
          original_content: processedNews.original_content,
          source_url: processedNews.source_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      console.log('Notícia adicionada com sucesso:', processedNews.title);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao buscar notícias diárias:', error);
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
