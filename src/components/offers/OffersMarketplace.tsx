import { useState, useEffect } from 'react';
import { Calendar, DollarSign, MapPin, AlertTriangle, MessageCircle, RefreshCw, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { fetchActiveOffers, expressInterestInOffer } from '../../lib/api';
import OffersMap from './OffersMap';
import { useLanguage } from '../../contexts/LanguageContext';

interface Offer {
  id: number;
  commoditie: string;
  quantity: number;
  unit: string;
  offer_date: string;
  valid_until: string;
  offer_type: string;
  user_id: string;
  latitude: string;
  longitude: string;
  price_usd: number;
  technical_specs: string;
  incoterms: string;
  is_gmo: boolean;
  is_human_consumption: boolean;
  user_name?: string;
  user_email?: string;
}

interface OffersMarketplaceProps {
  onClose: () => void;
}

export default function OffersMarketplace({ onClose }: OffersMarketplaceProps) {
  const { language } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [interestLoading, setInterestLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [commodityFilter, setCommodityFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [uniqueCommodities, setUniqueCommodities] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);

  useEffect(() => {
    fetchOffers();
  }, [filter, commodityFilter]);

  async function fetchOffers() {
    setLoading(true);
    try {
      const data = await fetchActiveOffers();
      
      // Process offers to add user information
      const processedOffers = data.map(offer => {
        return {
          ...offer,
          user_name: offer.users?.name || 'Parceiro verificado',
          user_email: offer.users?.email || ''
        };
      });

      // Sort offers by price * quantity (value) in descending order
      const sortedOffers = processedOffers.sort((a, b) => {
        const valueA = a.price_usd * a.quantity;
        const valueB = b.price_usd * b.quantity;
        return valueB - valueA;
      });

      // Extract unique commodities for filter
      const commodities = [...new Set(sortedOffers.map(offer => offer.commoditie))];
      setUniqueCommodities(commodities);

      // Apply filters
      let filteredOffers = sortedOffers;
      
      if (filter === 'buy') {
        filteredOffers = sortedOffers.filter(offer => offer.offer_type === 'COMPRA');
      } else if (filter === 'sell') {
        filteredOffers = sortedOffers.filter(offer => offer.offer_type === 'VENDA');
      }
      
      if (commodityFilter) {
        filteredOffers = filteredOffers.filter(offer => offer.commoditie === commodityFilter);
      }

      setOffers(filteredOffers);
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExpressInterest(offer: Offer) {
    setInterestLoading(offer.id);
    try {
      await expressInterestInOffer(offer);
      setSuccessMessage(`Interesse registrado com sucesso! Entraremos em contato em breve.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error expressing interest:', err);
      alert('Erro ao registrar interesse. Por favor, tente novamente.');
    } finally {
      setInterestLoading(null);
    }
  }

  const handleMarkerClick = (offerId: number) => {
    setSelectedOfferId(offerId);
    // Scroll to the offer card
    const offerElement = document.getElementById(`offer-${offerId}`);
    if (offerElement) {
      offerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the offer card
      offerElement.classList.add('ring-2', 'ring-green-500');
      setTimeout(() => {
        offerElement.classList.remove('ring-2', 'ring-green-500');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {language === 'pt' ? 'Ofertas Disponíveis' : 'Available Offers'}
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            {language === 'pt' ? 'Explore as ofertas ativas de nossos parceiros verificados' : 'Explore active offers from our verified partners'}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-48">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'buy' | 'sell')}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="all">{language === 'pt' ? 'Todas as ofertas' : 'All offers'}</option>
                <option value="buy">{language === 'pt' ? 'Ofertas de compra' : 'Buy offers'}</option>
                <option value="sell">{language === 'pt' ? 'Ofertas de venda' : 'Sell offers'}</option>
              </select>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Filter className="h-4 w-4 mr-1" />
              {language === 'pt' ? 'Filtros' : 'Filters'}
            </button>
          </div>
          <button
            onClick={fetchOffers}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {language === 'pt' ? 'Atualizar' : 'Refresh'}
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <X className="h-4 w-4 mr-1" />
            {language === 'pt' ? 'Fechar' : 'Close'}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{language === 'pt' ? 'Filtros avançados' : 'Advanced filters'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'pt' ? 'Commodity' : 'Commodity'}
                </label>
                <select
                  value={commodityFilter}
                  onChange={(e) => setCommodityFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                >
                  <option value="">{language === 'pt' ? 'Todas as commodities' : 'All commodities'}</option>
                  {uniqueCommodities.map(commodity => (
                    <option key={commodity} value={commodity}>{commodity}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setCommodityFilter('');
                  setFilter('all');
                  setShowFilters(false);
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {language === 'pt' ? 'Limpar filtros' : 'Clear filters'}
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Offers Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
          </div>
        ) : offers.length === 0 ? (
          <div className="mt-8 text-center py-12 bg-white rounded-lg shadow">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{language === 'pt' ? 'Nenhuma oferta encontrada' : 'No offers found'}</h3>
            <p className="mt-2 text-gray-500">
              {language === 'pt' ? 'Nenhuma oferta foi encontrada com os filtros atuais.' : 'No offers were found with the current filters.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {offers.slice(0, 9).map((offer) => (
                <div 
                  key={offer.id} 
                  id={`offer-${offer.id}`}
                  className="bg-white overflow-hidden shadow rounded-lg transition-all duration-300"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {offer.commoditie}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          offer.offer_type === 'VENDA' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {offer.offer_type === 'VENDA' ? (language === 'pt' ? 'Venda' : 'Sell') : (language === 'pt' ? 'Compra' : 'Buy')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        {offer.incoterms}
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="font-medium">{offer.quantity} {offer.unit}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-700">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        <span>USD {offer.price_usd.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span>{language === 'pt' ? 'Válido até' : 'Valid until'}: {format(new Date(offer.valid_until), 'dd/MM/yyyy')}</span>
                      </div>
                      
                      {offer.latitude && offer.longitude && (
                        <div className="flex items-center text-sm text-gray-700">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="truncate">
                            {language === 'pt' ? 'Localização' : 'Location'}: {parseFloat(offer.latitude).toFixed(2)}, {parseFloat(offer.longitude).toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {offer.technical_specs && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-700">{language === 'pt' ? 'Especificações técnicas' : 'Technical specifications'}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {offer.technical_specs.length > 100 
                              ? `${offer.technical_specs.substring(0, 100)}...` 
                              : offer.technical_specs}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-700 space-x-4">
                        {offer.is_gmo && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {language === 'pt' ? 'OGM' : 'GMO'}
                          </span>
                        )}
                        {offer.is_human_consumption && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {language === 'pt' ? 'Consumo humano' : 'Human consumption'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-5 border-t border-gray-200 pt-4">
                      <button
                        onClick={() => handleExpressInterest(offer)}
                        disabled={interestLoading === offer.id}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {interestLoading === offer.id ? (
                          <>
                            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                            {language === 'pt' ? 'Processando...' : 'Processing...'}
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {language === 'pt' ? 'Estou interessado' : 'I am interested'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{language === 'pt' ? 'Mapa de ofertas' : 'Offers map'}</h2>
              <OffersMap offers={offers} onMarkerClick={handleMarkerClick} />
            </div>

            {/* Show more offers if there are more than 9 */}
            {offers.length > 9 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{language === 'pt' ? 'Mais ofertas' : 'More offers'}</h2>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {offers.slice(9).map((offer) => (
                    <div 
                      key={offer.id} 
                      id={`offer-${offer.id}`}
                      className="bg-white overflow-hidden shadow rounded-lg transition-all duration-300"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {offer.commoditie}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              offer.offer_type === 'VENDA' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {offer.offer_type === 'VENDA' ? (language === 'pt' ? 'Venda' : 'Sell') : (language === 'pt' ? 'Compra' : 'Buy')}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-500">
                            {offer.incoterms}
                          </span>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center text-sm text-gray-700">
                            <span className="font-medium">{offer.quantity} {offer.unit}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-700">
                            <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                            <span>USD {offer.price_usd.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            <span>{language === 'pt' ? 'Válido até' : 'Valid until'}: {format(new Date(offer.valid_until), 'dd/MM/yyyy')}</span>
                          </div>
                          
                          {offer.latitude && offer.longitude && (
                            <div className="flex items-center text-sm text-gray-700">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="truncate">
                                {language === 'pt' ? 'Localização' : 'Location'}: {parseFloat(offer.latitude).toFixed(2)}, {parseFloat(offer.longitude).toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-sm text-gray-700 space-x-4">
                            {offer.is_gmo && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {language === 'pt' ? 'OGM' : 'GMO'}
                              </span>
                            )}
                            {offer.is_human_consumption && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {language === 'pt' ? 'Consumo humano' : 'Human consumption'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-5 border-t border-gray-200 pt-4">
                          <button
                            onClick={() => handleExpressInterest(offer)}
                            disabled={interestLoading === offer.id}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {interestLoading === offer.id ? (
                              <>
                                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                                {language === 'pt' ? 'Processando...' : 'Processing...'}
                              </>
                            ) : (
                              <>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {language === 'pt' ? 'Estou interessado' : 'I am interested'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}