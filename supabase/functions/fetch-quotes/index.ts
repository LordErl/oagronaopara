import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const sources = [
      {
        name: "Notícias Agrícolas",
        baseUrl: "https://www.noticiasagricolas.com.br/cotacoes",
        commodities: {
          "Soja": "/soja",
          "Milho": "/milho",
          "Trigo": "/trigo",
          "Café": "/cafe",
          "Açúcar": "/acucar"
        }
      },
      {
        name: "Agrofy News",
        baseUrl: "https://news.agrofy.com.br/cotacoes",
        commodities: {
          "Soja": "/graos/soja",
          "Milho": "/graos/milho",
          "Trigo": "/graos/trigo",
          "Café": "/cafe",
          "Açúcar": "/acucar"
        }
      },
      {
        name: "Agrolink",
        baseUrl: "https://www.agrolink.com.br/cotacoes",
        commodities: {
          "Soja": "/graos/soja",
          "Milho": "/graos/milho",
          "Trigo": "/graos/trigo",
          "Café": "/cafe",
          "Açúcar": "/acucar"
        }
      }
    ];

    const quotes: any[] = [];

    for (const source of sources) {
      for (const [commodity, path] of Object.entries(source.commodities)) {
        try {
          const url = `${source.baseUrl}${path}`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          if (!response.ok) continue;

          const html = await response.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          
          if (!doc) continue;

          // Extract price and change based on source-specific selectors
          let price = 0;
          let change = 0;

          if (source.name === "Notícias Agrícolas") {
            const priceElement = doc.querySelector('.quotation-value');
            const changeElement = doc.querySelector('.quotation-change');
            
            if (priceElement && changeElement) {
              price = parseFloat(priceElement.textContent.replace(/[^\d.-]/g, ''));
              change = parseFloat(changeElement.textContent.replace(/[^\d.-]/g, ''));
            }
          } else if (source.name === "Agrofy News") {
            const priceElement = doc.querySelector('.price-value');
            const changeElement = doc.querySelector('.price-change');
            
            if (priceElement && changeElement) {
              price = parseFloat(priceElement.textContent.replace(/[^\d.-]/g, ''));
              change = parseFloat(changeElement.textContent.replace(/[^\d.-]/g, ''));
            }
          } else if (source.name === "Agrolink") {
            const priceElement = doc.querySelector('.quotation-price');
            const changeElement = doc.querySelector('.quotation-variation');
            
            if (priceElement && changeElement) {
              price = parseFloat(priceElement.textContent.replace(/[^\d.-]/g, ''));
              change = parseFloat(changeElement.textContent.replace(/[^\d.-]/g, ''));
            }
          }

          if (price > 0) {
            quotes.push({
              commodity_name: commodity,
              price_usd: price,
              change_percentage: change,
              source_url: url,
              source_name: source.name
            });
          }
        } catch (err) {
          console.error(`Error fetching ${commodity} from ${source.name}:`, err);
          continue;
        }
      }
    }

    return new Response(
      JSON.stringify(quotes),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Error in fetch-quotes function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});