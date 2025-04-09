import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Offer {
  id: number;
  commoditie: string;
  quantity: number;
  unit: string;
  offer_date: string;
  valid_until: string;
  offer_type: string;
  user_id: string;
  price_usd: number;
  incoterms: string;
  is_gmo: boolean;
  is_human_consumption: boolean;
  user_name?: string;
  user_email?: string;
  is_expired?: boolean;
}

export default function OffersManager() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    fetchOffers();
  }, [filter]);

  async function fetchOffers() {
    setLoading(true);
    try {
      // Fetch offers with user information
      const { data, error } = await supabase
        .from('offers')
        .select(`
          id, 
          commoditie, 
          quantity, 
          unit, 
          offer_date, 
          valid_until, 
          offer_type, 
          user_id, 
          price_usd, 
          incoterms, 
          is_gmo, 
          is_human_consumption,
          users:user_id (
            name,
            email
          )
        `)
        .order('offer_date', { ascending: false });

      if (error) throw error;

      // Process offers to add user information and check expiration
      const processedOffers = data.map(offer => {
        const today = new Date();
        const validUntil = new Date(offer.valid_until);
        const isExpired = !isAfter(validUntil, today);
        
        return {
          ...offer,
          user_name: offer.users?.name || 'Usuário não encontrado',
          user_email: offer.users?.email || 'Email não disponível',
          is_expired: isExpired
        };
      });

      // Apply filter
      let filteredOffers = processedOffers;
      if (filter === 'active') {
        filteredOffers = processedOffers.filter(offer => !offer.is_expired);
      } else if (filter === 'expired') {
        filteredOffers = processedOffers.filter(offer => offer.is_expired);
      }

      setOffers(filteredOffers);
    } catch (err) {
      console.error('Error fetching offers:', err);
      alert('Erro ao carregar ofertas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteOffer(id: number) {
    if (!confirm('Tem certeza que deseja excluir esta oferta?')) return;

    setDeleteLoading(id);
    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Remove the deleted offer from the state
      setOffers(offers.filter(offer => offer.id !== id));
    } catch (err) {
      console.error('Error deleting offer:', err);
      alert('Erro ao excluir oferta. Por favor, tente novamente.');
    } finally {
      setDeleteLoading(null);
    }
  }

  async function deleteExpiredOffers() {
    if (!confirm('Tem certeza que deseja excluir todas as ofertas expiradas?')) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('offers')
        .delete()
        .lt('valid_until', today);

      if (error) throw error;
      
      // Refresh offers list
      await fetchOffers();
    } catch (err) {
      console.error('Error deleting expired offers:', err);
      alert('Erro ao excluir ofertas expiradas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Gerenciar Ofertas</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'expired')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            >
              <option value="all">Todas as ofertas</option>
              <option value="active">Ofertas ativas</option>
              <option value="expired">Ofertas expiradas</option>
            </select>
          </div>
          <button
            onClick={fetchOffers}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </button>
          <button
            onClick={deleteExpiredOffers}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir Expiradas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhuma oferta encontrada.
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
                  Detalhes
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parceiro
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offers.map((offer) => (
                <tr key={offer.id} className={offer.is_expired ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{offer.commoditie}</div>
                    <div className="text-sm text-gray-500">
                      {offer.offer_type === 'VENDA' ? 'Venda' : 'Compra'} • {offer.incoterms}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <span className="font-medium">{offer.quantity} {offer.unit}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>USD {offer.price_usd.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Válido até: {format(new Date(offer.valid_until), 'dd/MM/yyyy')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{offer.user_name}</div>
                    <div className="text-sm text-gray-500">{offer.user_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {offer.is_expired ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Expirada
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Ativa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={deleteLoading === offer.id}
                    >
                      {deleteLoading === offer.id ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}