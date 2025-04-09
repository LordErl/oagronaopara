import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchLatestNews } from '../lib/api';
import type { AgroNews } from '../lib/types';

export default function News() {
  const [news, setNews] = useState<AgroNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await fetchLatestNews();
        setNews(data);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Erro ao carregar notícias');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    // Refresh news every 30 minutes
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="news" className="bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Notícias do Agronegócio
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Últimas notícias do setor agrícola internacional
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <div key={item.id} className="flex flex-col rounded-lg shadow-lg overflow-hidden">
              <div className="flex-shrink-0">
                <img 
                  className="h-48 w-full object-cover" 
                  src={item.image_url} 
                  alt={item.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600">
                    {new Date(item.published_at).toLocaleDateString()} • {item.source_name}
                  </p>
                  <a 
                    href={item.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block mt-2"
                  >
                    <p className="text-xl font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-3 text-base text-gray-500">
                      {item.content.length > 150 
                        ? `${item.content.substring(0, 150)}...` 
                        : item.content}
                    </p>
                  </a>
                </div>
                <div className="mt-6">
                  <a 
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-base font-semibold text-green-600 hover:text-green-500"
                  >
                    Ler mais →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}