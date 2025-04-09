import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@4.12.4";

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// System prompt to guide ChatGPT responses
const SYSTEM_PROMPT = `Você é um assistente especializado em agronegócio e contratos NCNDA da empresa O Agro Não Para.
Algumas regras importantes:

1. Foque apenas em assuntos relacionados ao agronegócio e ao NCNDA da empresa
2. Para perguntas sobre o NCNDA, explique que:
   - É um contrato de confidencialidade e não circunvenção
   - Protege as informações compartilhadas na plataforma
   - É obrigatório para todos os parceiros
   - Tem validade de 24 meses
   - Prevê multa de USD 50.000 em caso de descumprimento
3. Para outras perguntas não relacionadas, educadamente direcione para o email compliance@oagronaopara.tec.br
4. Use linguagem profissional mas amigável
5. Mantenha as respostas concisas e diretas
6. Não forneça informações sensíveis ou confidenciais`;

// Handle incoming messages
async function handleMessage(message: any) {
  try {
    const userMessage = message.text.body;

    // Get ChatGPT response
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.data.choices[0].message?.content || 
      "Desculpe, não consegui processar sua mensagem. Por favor, entre em contato através do email compliance@oagronaopara.tec.br";

    // Send response via WhatsApp API
    await fetch(`https://graph.facebook.com/v17.0/${message.from}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.from,
        type: "text",
        text: { body: response }
      })
    });

    return true;
  } catch (error) {
    console.error("Error handling message:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle webhook verification
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Handle incoming messages
  if (req.method === "POST") {
    try {
      const body = await req.json();
      
      // Process each message in the webhook
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.value.messages) {
              for (const message of change.value.messages) {
                await handleMessage(message);
              }
            }
          }
        }
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});