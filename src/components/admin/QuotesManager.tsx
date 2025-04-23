import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, X, Plus, TrendingUp, TrendingDown, Bot, BarChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { analyzeQuotes } from '../../services/openai';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuoteSuggestion {
  commodity_name: string;
  price_usd: number;
  change_percentage: number;
  source_url: string;
  source_name: string;
}

interface CommodityQuote {
  id: string;
  commodity_name: string;
  price_usd: number;
  change_percentage: number;
  source_url: string;
  source_name: string;
  fetched_at: string;
  created_at: string;
}

// Simulated quotes data
const simulatedQuotes: QuoteSuggestion[] = [
  {
    commodity_name: 'Soja',
    price_usd: 525.75,
    change_percentage: 1.25,
    source_url: 'https://www.noticiasagricolas.com.br/cotacoes/soja',
    source_name: 'Notícias Agrícolas'
  },
  {
    commodity_name: 'Soja',
    price_usd: 524.50,
    change_percentage: 1.15,
    source_url: 'https://news.agrofy.com.br/cotacoes/graos/soja',
    source_name: 'Agrofy News'
  },
  {
    commodity_name: 'Soja',
    price_usd: 526.00,
    change_percentage: 1.30,
    source_url: 'https://www.agrolink.com.br/cotacoes/graos/soja',
    source_name: 'Agrolink'
  },
  {
    commodity_name: 'Milho',
    price_usd: 185.25,
    change_percentage: -0.75,
    source_url: 'https://www.noticiasagricolas.com.br/cotacoes/milho',
    source_name: 'Notícias Agrícolas'
  },
  {
    commodity_name: 'Milho',
    price_usd: 184.90,
    change_percentage: -0.80,
    source_url: 'https://news.agrofy.com.br/cotacoes/graos/milho',
    source_name: 'Agrofy News'
  },
  {
    commodity_name: 'Milho',
    price_usd: 185.50,
    change_percentage: -0.70,
    source_url: 'https://www.agrolink.com.br/cotacoes/graos/milho',
    source_name: 'Agrolink'
  },
  {
    commodity_name: 'Açúcar',
    price_usd: 23.45,
    change_percentage: 2.15,
    source_url: 'https://www.noticiasagricolas.com.br/cotacoes/acucar',
    source_name: 'Notícias Agrícolas'
  },
  {
    commodity_name: 'Açúcar',
    price_usd: 23.35,
    change_percentage: 2.10,
    source_url: 'https://news.agrofy.com.br/cotacoes/acucar',
    source_name: 'Agrofy News'
  },
  {
    commodity_name: 'Açúcar',
    price_usd: 23.50,
    change_percentage: 2.20,
    source_url: 'https://www.agrolink.com.br/cotacoes/acucar',
    source_name: 'Agrolink'
  }
];

function QuotesManager() {
  const [quotes, setQuotes] = useState<CommodityQuote[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, QuoteSuggestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info' | null, text: string}>({type: null, text: ''});
  const [analysis, setAnalysis] = useState<{analysis: string, generated_at: string} | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  async function fetchQuotes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commodity_quotes')
        .select('*')
        .order('fetched_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setErrorMessage('Erro ao carregar cotações');
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuoteSuggestions() {
    setFetchingSuggestions(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Group suggestions by commodity
      const groupedSuggestions: Record<string, QuoteSuggestion[]> = {};
      simulatedQuotes.forEach(quote => {
        if (!groupedSuggestions[quote.commodity_name]) {
          groupedSuggestions[quote.commodity_name] = [];
        }
        // Add small random variation to simulate real-time data
        const variation = (Math.random() * 2 - 1) * 0.5; // Random variation between -0.5% and +0.5%
        groupedSuggestions[quote.commodity_name].push({
          ...quote,
          price_usd: quote.price_usd * (1 + variation / 100),
          change_percentage: quote.change_percentage + variation
        });
      });

      setSuggestions(groupedSuggestions);
      setSuccessMessage('Sugestões de cotações atualizadas com sucesso!');
    } catch (err) {
      console.error('Error fetching quote suggestions:', err);
      setErrorMessage('Erro ao buscar sugestões de cotações');
    } finally {
      setFetchingSuggestions(false);
    }
  }

  async function handleApproveSuggestion(suggestion: QuoteSuggestion) {
    try {
      const { error } = await supabase
        .from('commodity_quotes')
        .insert([{
          ...suggestion,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await fetchQuotes();
      setSuccessMessage('Cotação aprovada e salva com sucesso!');
    } catch (err) {
      console.error('Error approving quote:', err);
      setErrorMessage('Erro ao aprovar cotação');
    }
  }

  async function handleGenerateAnalysis() {
    setGeneratingAnalysis(true);
    setMessage({ type: 'info', text: 'Gerando análise de cotações...' });
    
    try {
      // Obter as cotações mais recentes
      const recentQuotes = quotes.slice(0, 10); // Últimas 10 cotações
      
      if (recentQuotes.length === 0) {
        setMessage({ type: 'error', text: 'Não há cotações disponíveis para análise.' });
        setGeneratingAnalysis(false);
        return;
      }
      
      // Gerar análise
      const quoteAnalysis = await analyzeQuotes(recentQuotes);
      
      // Salvar análise no banco de dados
      const { error } = await supabase
        .from('quote_analyses')
        .insert([quoteAnalysis])
        .select();
      
      if (error) throw error;
      
      setAnalysis(quoteAnalysis);
      setShowAnalysis(true);
      setMessage({ type: 'success', text: 'Análise gerada com sucesso!' });
    } catch (error) {
      console.error('Erro ao gerar análise:', error);
      setMessage({ type: 'error', text: 'Erro ao gerar análise de cotações.' });
    } finally {
      setGeneratingAnalysis(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Gerenciar Cotações</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchQuoteSuggestions}
            disabled={fetchingSuggestions}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {fetchingSuggestions ? (
              <>
                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                Buscando Sugestões...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Buscar Novas Cotações
              </>
            )}
          </button>
          <button
            onClick={handleGenerateAnalysis}
            disabled={generatingAnalysis || quotes.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {generatingAnalysis ? (
              <>
                <Bot className="animate-spin h-4 w-4 mr-2" />
                Gerando Análise...
              </>
            ) : (
              <>
                <BarChart className="h-4 w-4 mr-2" />
                Gerar Análise de Mercado
              </>
            )}
          </button>
          <button
            onClick={fetchQuotes}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage('')}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {errorMessage}
          </div>
          <button onClick={() => setErrorMessage('')}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {message.type && (
        <div className={`mb-4 p-4 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 
          message.type === 'error' ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'
        } rounded-md flex items-center justify-between`}>
          <div className="flex items-center">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : 
             message.type === 'error' ? <AlertTriangle className="h-5 w-5 mr-2" /> : 
             <RefreshCw className="h-5 w-5 mr-2" />}
            {message.text}
          </div>
          <button onClick={() => setMessage({type: null, text: ''})}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Market Analysis */}
      {showAnalysis && analysis && (
        <div className="mt-6 mb-8 p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Análise de Mercado</h3>
            <button 
              onClick={() => setShowAnalysis(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            Gerada em: {format(new Date(analysis.generated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
          <div className="prose prose-sm max-w-none">
            {analysis.analysis.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Quote Suggestions */}
      {Object.keys(suggestions).length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sugestões de Cotações</h3>
          {Object.entries(suggestions).map(([commodity, commoditySuggestions]) => (
            <div key={commodity} className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-2">{commodity}</h4>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {commoditySuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          USD {suggestion.price_usd.toFixed(2)}
                        </p>
                        <div className={`flex items-center text-sm ${
                          suggestion.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {suggestion.change_percentage >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {suggestion.change_percentage.toFixed(2)}%
                        </div>
                      </div>
                      <a
                        href={suggestion.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {suggestion.source_name}
                      </a>
                    </div>
                    <button
                      onClick={() => handleApproveSuggestion(suggestion)}
                      className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Aprovar Cotação
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Quotes */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cotações Atuais</h3>
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhuma cotação encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commodity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço (USD)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variação
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fonte
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atualizado em
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <tr key={quote.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{quote.commodity_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">USD {quote.price_usd.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center text-sm ${
                        quote.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {quote.change_percentage >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {quote.change_percentage.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={quote.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        {quote.source_name}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quote.fetched_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuotesManager;