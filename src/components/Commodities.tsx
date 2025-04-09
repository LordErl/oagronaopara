import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { fetchLatestQuotes } from '../lib/api';
import type { CommodityQuote } from '../lib/types';

export default function Commodities() {
  const [quotes, setQuotes] = useState<CommodityQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const data = await fetchLatestQuotes();
        setQuotes(data);
      } catch (err) {
        console.error('Error fetching quotes:', err);
        setError('Erro ao carregar cotações');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
    // Refresh quotes every 5 minutes
    const interval = setInterval(fetchQuotes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white py-24">
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
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="commodities" className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Cotações em Tempo Real
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Acompanhe as principais commodities do mercado internacional
          </p>
        </div>

        <div className="mt-12 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="relative rounded-lg border border-gray-200 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
            >
              <div className="flex-1 min-w-0">
                <div className="focus:outline-none">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">
                    {quote.commodity_name}
                    <span className="text-xs text-gray-500 ml-2">
                      via {quote.source_name}
                    </span>
                  </p>
                  <p className="text-lg font-bold text-gray-700">
                    US$ {quote.price_usd.toFixed(2)}
                  </p>
                  <p className={`text-sm ${
                    quote.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {quote.change_percentage >= 0 ? '+' : ''}{quote.change_percentage.toFixed(2)}%
                  </p>
                </div>
              </div>
              {quote.change_percentage >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Última atualização: {new Date(quotes[0]?.fetched_at || Date.now()).toLocaleString()}
        </div>
      </div>
    </div>
  );
}