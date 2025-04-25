import type { NextApiRequest, NextApiResponse } from 'next';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

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
    // Extrai apenas o conteúdo da resposta
    const content = data.choices?.[0]?.message?.content?.trim();

    // Tenta fazer parse do JSON retornado pelo modelo
    let noticias = [];
    try {
      noticias = JSON.parse(content);
    } catch (e) {
      // Tenta extrair JSON de resposta "suja"
      const match = content.match(/\[.*\]/s);
      if (match) {
        noticias = JSON.parse(match[0]);
      } else {
        return res.status(500).json({ error: 'Formato inesperado da resposta OpenAI', raw: content });
      }
    }

    return res.status(200).json({ noticias });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar notícias', details: error });
  }
}
