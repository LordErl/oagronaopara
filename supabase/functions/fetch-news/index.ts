import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sources = [
  {
    name: "The Economist",
    url: "https://www.economist.com/agriculture",
    selector: "article",
    titleSelector: "h3",
    contentSelector: "p",
    imageSelector: "img",
    linkSelector: "a",
  },
  {
    name: "EURACTIV",
    url: "https://www.euractiv.com/section/agriculture-food/",
    selector: "article",
    titleSelector: "h2",
    contentSelector: ".excerpt",
    imageSelector: "img",
    linkSelector: "a",
  },
  {
    name: "AgroPages",
    url: "http://news.agropages.com/",
    selector: ".newslist",
    titleSelector: "h3",
    contentSelector: "p",
    imageSelector: "img",
    linkSelector: "a",
  },
  {
    name: "AgriCensus",
    url: "https://www.agricensus.com/news",
    selector: "article",
    titleSelector: "h2",
    contentSelector: ".summary",
    imageSelector: "img",
    linkSelector: "a",
  },
  {
    name: "Agri-Pulse",
    url: "https://www.agri-pulse.com/articles",
    selector: ".article",
    titleSelector: "h2",
    contentSelector: ".summary",
    imageSelector: "img",
    linkSelector: "a",
  },
  {
    name: "Successful Farming",
    url: "https://www.agriculture.com/news",
    selector: "article",
    titleSelector: "h2",
    contentSelector: ".field-summary",
    imageSelector: "img",
    linkSelector: "a",
  },
  {
    name: "World-Grain",
    url: "https://www.world-grain.com/articles",
    selector: ".article",
    titleSelector: "h2",
    contentSelector: ".summary",
    imageSelector: "img",
    linkSelector: "a",
  },
  {
    name: "Farmers Weekly",
    url: "https://www.fwi.co.uk/news",
    selector: "article",
    titleSelector: "h2",
    contentSelector: ".excerpt",
    imageSelector: "img",
    linkSelector: "a",
  },
  {
    name: "Agrolink",
    url: "https://www.agrolink.com.br/noticias",
    selector: ".article",
    titleSelector: "h2",
    contentSelector: ".summary",
    imageSelector: "img",
    linkSelector: "a",
  },
  {
    name: "Notícias Agrícolas",
    url: "https://www.noticiasagricolas.com.br/noticias",
    selector: ".article",
    titleSelector: "h2",
    contentSelector: ".summary",
    imageSelector: "img",
    linkSelector: "a",
  }
];

async function scrapeNews(source: any) {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) return [];

    const articles = doc.querySelectorAll(source.selector);
    const news = [];

    for (const article of articles) {
      try {
        const titleElement = article.querySelector(source.titleSelector);
        const contentElement = article.querySelector(source.contentSelector);
        const imageElement = article.querySelector(source.imageSelector);
        const linkElement = article.querySelector(source.linkSelector);

        if (!titleElement || !contentElement) continue;

        const title = titleElement.textContent.trim();
        const content = contentElement.textContent.trim();
        const imageUrl = imageElement?.getAttribute('src') || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2';
        const sourceUrl = linkElement?.getAttribute('href') || source.url;

        news.push({
          title,
          content,
          source_url: sourceUrl.startsWith('http') ? sourceUrl : `${new URL(source.url).origin}${sourceUrl}`,
          source_name: source.name,
          image_url: imageUrl.startsWith('http') ? imageUrl : `${new URL(source.url).origin}${imageUrl}`,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error(`Error processing article from ${source.name}:`, err);
      }
    }

    return news;
  } catch (err) {
    console.error(`Error scraping ${source.name}:`, err);
    return [];
  }
}

async function scrapeConab() {
  try {
    const response = await fetch('https://www.conab.gov.br/ultimas-noticias');
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) return [];

    const articles = doc.querySelectorAll('.item-page');
    const news = [];

    for (const article of articles) {
      try {
        const titleElement = article.querySelector('h2');
        const contentElement = article.querySelector('.article-content');
        const imageElement = article.querySelector('img');

        if (!titleElement || !contentElement) continue;

        news.push({
          title: titleElement.textContent.trim(),
          content: contentElement.textContent.trim(),
          source_url: 'https://www.conab.gov.br/ultimas-noticias',
          source_name: 'CONAB',
          image_url: imageElement?.getAttribute('src') || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2',
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error processing CONAB article:', err);
      }
    }

    return news;
  } catch (err) {
    console.error('Error scraping CONAB:', err);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Scrape news from all sources
    const allNews = [];
    
    // First try CONAB
    const conabNews = await scrapeConab();
    allNews.push(...conabNews);

    // If CONAB fails or returns no news, try other sources
    if (conabNews.length === 0) {
      for (const source of sources) {
        const news = await scrapeNews(source);
        allNews.push(...news);
      }
    }

    // Insert news into database
    for (const item of allNews) {
      const { error } = await supabase.from('agro_news').insert([item]);
      if (error) console.error('Error inserting news:', error);
    }

    // Delete old news (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await supabase
      .from('agro_news')
      .delete()
      .lt('published_at', sevenDaysAgo.toISOString());

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "News updated successfully",
        count: allNews.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Error in fetch-news function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});