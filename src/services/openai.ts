import { Configuration, OpenAIApi } from 'openai';

// Configuração da API OpenAI
const configuration = new Configuration({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Função para processar notícias
export async function processNews(newsUrl: string) {
  try {
    // Buscar o conteúdo da notícia
    const newsContent = await fetchNewsContent(newsUrl);
    
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em notícias agrícolas. Extraia as informações mais relevantes e crie um resumo conciso."
        },
        {
          role: "user",
          content: `Analise esta notícia e forneça: 1) Um título conciso, 2) Um resumo de até 3 parágrafos, 3) Palavras-chave relevantes separadas por vírgula. Notícia: ${newsContent}`
        }
      ],
    });

    const result = response.data.choices[0].message?.content;
    if (!result) throw new Error("Falha ao processar a notícia");

    // Parsear o resultado
    const lines = result.split('\n').filter(line => line.trim());
    const title = lines[0].replace(/^(título|title):\s*/i, '');
    
    // Extrair o resumo (pode estar em múltiplas linhas)
    let contentStartIndex = 1;
    while (contentStartIndex < lines.length && 
           !lines[contentStartIndex].toLowerCase().includes('resumo') && 
           !lines[contentStartIndex].toLowerCase().includes('content')) {
      contentStartIndex++;
    }
    contentStartIndex++;
    
    let keywordsIndex = contentStartIndex;
    while (keywordsIndex < lines.length && 
           !lines[keywordsIndex].toLowerCase().includes('palavras-chave') && 
           !lines[keywordsIndex].toLowerCase().includes('keywords')) {
      keywordsIndex++;
    }
    
    const content = lines.slice(contentStartIndex, keywordsIndex).join('\n');
    const keywords = keywordsIndex < lines.length - 1 ? 
      lines[keywordsIndex + 1].split(',').map(k => k.trim()) : 
      [];

    return {
      title,
      content,
      original_title: newsContent.substring(0, 100), // Primeiros 100 caracteres como título original
      original_content: newsContent,
      source_url: newsUrl,
      keywords
    };
  } catch (error) {
    console.error("Erro ao processar notícia:", error);
    throw error;
  }
}

// Função para analisar cotações
export async function analyzeQuotes(commodityData: any[]) {
  try {
    // Formatar os dados para enviar ao ChatGPT
    const formattedData = commodityData.map(item => 
      `${item.commodity}: ${item.price} (${item.date})`
    ).join('\n');
    
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um analista de mercado agrícola especializado em análise de cotações."
        },
        {
          role: "user",
          content: `Analise estas cotações e forneça: 1) Um resumo das tendências, 2) Previsões de curto prazo, 3) Recomendações para produtores. Dados: ${formattedData}`
        }
      ],
    });

    const result = response.data.choices[0].message?.content;
    if (!result) throw new Error("Falha ao analisar cotações");

    return {
      analysis: result,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Erro ao analisar cotações:", error);
    throw error;
  }
}

// Função auxiliar para buscar conteúdo de notícias
async function fetchNewsContent(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Extrair o conteúdo principal (isso é simplificado, você pode precisar de uma biblioteca como cheerio)
    // Para uma implementação completa, considere usar uma API como Mercury Parser ou similar
    const textContent = html.replace(/<[^>]*>/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim();
    
    return textContent;
  } catch (error) {
    console.error("Erro ao buscar conteúdo da notícia:", error);
    throw error;
  }
}
