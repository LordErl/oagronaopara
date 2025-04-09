import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Globe, X } from 'lucide-react';
import { createCommodity } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { Commodity } from '../../lib/types';

const commodities = [
  { cod_comm: 1, name: 'Milho Amarelo GMO Consumo Humano' },
  { cod_comm: 2, name: 'Milho Branco GMO Consumo Humano' },
  { cod_comm: 3, name: 'Soja Padrão GMO Consumo Humano' },
  { cod_comm: 4, name: 'Soja Avariada GMO Consumo Humano' },
  { cod_comm: 5, name: 'Uréia' },
  { cod_comm: 6, name: 'Açucar Icumza 45' },
  { cod_comm: 7, name: 'Óleo de Soja Comestível' }
];

const incoterms = [
  'FOB', 'CIF', 'CFR', 'EXW', 'FCA', 'CPT', 'CIP', 
  'DAP', 'DPU', 'DDP'
];

const currencies = [
  { code: 'USD', symbol: '$', name: 'Dólar Americano' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CNY', symbol: '¥', name: 'Yuan Chinês' }
];

interface CreateOfferProps {
  onClose: () => void;
}

export default function CreateOffer({ onClose }: CreateOfferProps) {
  const [location, setLocation] = useState({ latitude: '', longitude: '' });
  const [formData, setFormData] = useState<Omit<Commodity, 'id'>>({
    cod_comm: 0,
    commoditie: '',
    quantity: 0,
    unit: 'TON',
    offer_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    offer_type: 'VENDA',
    user_id: '',
    latitude: '',
    longitude: '',
    price_usd: 0,
    price_brl: 0,
    price_eur: 0,
    price_cny: 0,
    currency: 'USD', // Moeda padrão
    technical_specs: '',
    incoterms: 'FOB',
    is_gmo: false,
    is_human_consumption: false,
    consider_other_locations: false
  });

  // Estado para controlar a exibição das moedas adicionais
  const [showAdditionalCurrencies, setShowAdditionalCurrencies] = useState(false);

  // Taxas de conversão aproximadas (em produção, seria ideal usar uma API de taxas de câmbio em tempo real)
  const exchangeRates = {
    USD: { BRL: 5.5, EUR: 0.92, CNY: 7.25 },
    BRL: { USD: 0.18, EUR: 0.17, CNY: 1.32 },
    EUR: { USD: 1.09, BRL: 5.98, CNY: 7.88 },
    CNY: { USD: 0.14, BRL: 0.76, EUR: 0.13 }
  };

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFormData(prev => ({ ...prev, user_id: user.id }));
      }
    };

    getCurrentUser();

    // Get current location if browser supports geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          };
          setLocation(newLocation);
          setFormData(prev => ({
            ...prev,
            latitude: newLocation.latitude,
            longitude: newLocation.longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleCommodityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cod_comm = parseInt(e.target.value);
    const commodity = commodities.find(c => c.cod_comm === cod_comm);
    setFormData(prev => ({
      ...prev,
      cod_comm,
      commoditie: commodity?.name || ''
    }));
  };

  // Função para atualizar preços em todas as moedas quando o preço principal muda
  const updateAllPrices = (value: number, currency: string) => {
    if (currency === 'USD') {
      setFormData(prev => ({
        ...prev,
        price_usd: value,
        price_brl: parseFloat((value * exchangeRates.USD.BRL).toFixed(2)),
        price_eur: parseFloat((value * exchangeRates.USD.EUR).toFixed(2)),
        price_cny: parseFloat((value * exchangeRates.USD.CNY).toFixed(2))
      }));
    } else if (currency === 'BRL') {
      setFormData(prev => ({
        ...prev,
        price_brl: value,
        price_usd: parseFloat((value * exchangeRates.BRL.USD).toFixed(2)),
        price_eur: parseFloat((value * exchangeRates.BRL.EUR).toFixed(2)),
        price_cny: parseFloat((value * exchangeRates.BRL.CNY).toFixed(2))
      }));
    } else if (currency === 'EUR') {
      setFormData(prev => ({
        ...prev,
        price_eur: value,
        price_usd: parseFloat((value * exchangeRates.EUR.USD).toFixed(2)),
        price_brl: parseFloat((value * exchangeRates.EUR.BRL).toFixed(2)),
        price_cny: parseFloat((value * exchangeRates.EUR.CNY).toFixed(2))
      }));
    } else if (currency === 'CNY') {
      setFormData(prev => ({
        ...prev,
        price_cny: value,
        price_usd: parseFloat((value * exchangeRates.CNY.USD).toFixed(2)),
        price_brl: parseFloat((value * exchangeRates.CNY.BRL).toFixed(2)),
        price_eur: parseFloat((value * exchangeRates.CNY.EUR).toFixed(2))
      }));
    }
  };

  // Função para lidar com a mudança de moeda principal
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    setFormData(prev => ({
      ...prev,
      currency: newCurrency
    }));
    
    // Atualizar todos os preços com base no preço da moeda atual
    const currentPrice = formData[`price_${newCurrency.toLowerCase()}` as keyof typeof formData] as number;
    updateAllPrices(currentPrice, newCurrency);
  };

  // Função para lidar com a mudança de preço na moeda principal
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateAllPrices(value, formData.currency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create a new offer object without the cod_comm field to avoid unique constraint violation
      const offerData = {
        ...formData,
        // We'll use a different field name for the commodity code in the offers table
        // This avoids the unique constraint on cod_comm in the commodities table
        codComm: formData.cod_comm,
        // Remove the cod_comm field to avoid the unique constraint violation
        cod_comm: undefined
      };
      
      await createCommodity(offerData);
      onClose();
    } catch (error) {
      console.error('Error creating offer:', error);
      alert('Erro ao criar oferta. Por favor, tente novamente.');
    }
  };

  // Função para obter o símbolo da moeda atual
  const getCurrentCurrencySymbol = () => {
    const currency = currencies.find(c => c.code === formData.currency);
    return currency ? currency.symbol : '$';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nova Oferta</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Commodity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Commodity
              </label>
              <select
                value={formData.cod_comm}
                onChange={handleCommodityChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              >
                <option value="">Selecione uma commodity</option>
                {commodities.map(commodity => (
                  <option key={commodity.cod_comm} value={commodity.cod_comm}>
                    {commodity.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={e => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unidade
                </label>
                <select
                  value={formData.unit}
                  onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="TON">Toneladas</option>
                  <option value="KG">Quilogramas</option>
                  <option value="SC">Sacas</option>
                </select>
              </div>
            </div>

            {/* Offer Type and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Oferta
                </label>
                <select
                  value={formData.offer_type}
                  onChange={e => setFormData(prev => ({ ...prev, offer_type: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="VENDA">Venda</option>
                  <option value="COMPRA">Compra</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Moeda
                </label>
                <select
                  value={formData.currency}
                  onChange={handleCurrencyChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price in selected currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preço ({formData.currency})
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">{getCurrentCurrencySymbol()}</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData[`price_${formData.currency.toLowerCase()}` as keyof typeof formData] as number}
                  onChange={handlePriceChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            {/* Toggle para mostrar/esconder preços em outras moedas */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdditionalCurrencies(!showAdditionalCurrencies)}
                className="text-sm text-green-600 hover:text-green-800 flex items-center"
              >
                {showAdditionalCurrencies ? 'Esconder' : 'Mostrar'} preços em outras moedas
              </button>
            </div>

            {/* Preços em outras moedas (visível apenas quando o toggle está ativado) */}
            {showAdditionalCurrencies && (
              <div className="grid grid-cols-3 gap-4">
                {currencies
                  .filter(currency => currency.code !== formData.currency)
                  .map(currency => (
                    <div key={currency.code}>
                      <label className="block text-sm font-medium text-gray-700">
                        Preço em {currency.code}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">{currency.symbol}</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={formData[`price_${currency.code.toLowerCase()}` as keyof typeof formData] as number}
                          readOnly
                          className="pl-10 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Validity and Incoterms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Validade da Oferta
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={e => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Incoterms
                </label>
                <select
                  value={formData.incoterms}
                  onChange={e => setFormData(prev => ({ ...prev, incoterms: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                >
                  {incoterms.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Localização
              </label>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={location.latitude}
                    placeholder="Latitude"
                    readOnly
                    className="pl-10 block w-full rounded-md border-gray-300 bg-gray-50"
                  />
                </div>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={location.longitude}
                    placeholder="Longitude"
                    readOnly
                    className="pl-10 block w-full rounded-md border-gray-300 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ficha Técnica
              </label>
              <div className="mt-1">
                <textarea
                  value={formData.technical_specs}
                  onChange={e => setFormData(prev => ({ ...prev, technical_specs: e.target.value }))}
                  rows={3}
                  className="shadow-sm block w-full focus:ring-green-500 focus:border-green-500 sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Especificações técnicas do produto..."
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_gmo}
                  onChange={e => setFormData(prev => ({ ...prev, is_gmo: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  GMO
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_human_consumption}
                  onChange={e => setFormData(prev => ({ ...prev, is_human_consumption: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Consumo Humano
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.consider_other_locations}
                  onChange={e => setFormData(prev => ({ ...prev, consider_other_locations: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Considerar Outros Locais
                </label>
              </div>
            </div>

            <div className="pt-5">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Criar Oferta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}