import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const prompt = `MARAVILHOSO DIA!!! Preciso que você atue como um minerador de notícias do setor agro mundial, focando em informações relevantes para exportadores e importadores de commodities no Brasil. Por favor, me retorne EXATAMENTE 5 notícias, cada uma no seguinte formato JSON:\n\n[\n  {\n    "titulo": "...",\n    "resumo": "...",\n    "url_fonte": "...",\n    "nome_fonte": "...",\n    "url_imagem": "..."\n  }\n]\n\nO resumo deve ser claro e objetivo (máx. 3 frases). As imagens devem ser públicas e de alta resolução, relacionadas ao tema da notícia. Apenas retorne o array JSON, sem comentários ou texto adicional.`;

  try {
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
      return res.status(500).json({ error: 'Erro ao consultar OpenAI', details: err });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    let noticias = [];
    try {
      noticias = JSON.parse(content);
    } catch (e) {
      const match = content.match(/\[.*\]/s);
      if (match) {
        noticias = JSON.parse(match[0]);
      } else {
        return res.status(500).json({ error: 'Formato inesperado da resposta OpenAI', raw: content });
      }
    }

    // Inserir notícias no Supabase
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const noticia of noticias) {
      const { data, error } = await supabase
        .from('agro_news')
        .insert([{
          title: noticia.titulo,
          content: noticia.resumo,
          source_url: noticia.url_fonte,
          source_name: noticia.nome_fonte,
          image_url: noticia.url_imagem,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          approved: false
        }])
        .select()
        .single();

      if (error) {
        errorCount++;
        console.error('Erro ao inserir notícia:', error);
        results.push({ noticia, error: error.message, success: false });
      } else {
        successCount++;
        results.push({ noticia, data, success: true });
      }
    }

    if (errorCount === noticias.length) {
      return res.status(500).json({ 
        error: 'Falha ao inserir todas as notícias', 
        details: results 
      });
    }

    return res.status(200).json({ 
      inserted: results,
      summary: {
        total: noticias.length,
        success: successCount,
        error: errorCount
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar notícias', details: error });
  }
}
