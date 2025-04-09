import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
// This is needed because Leaflet's default markers look for assets in a different location
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom marker icons for buy and sell offers
const sellIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const buyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
  incoterms: string;
  is_gmo: boolean;
  is_human_consumption: boolean;
  user_name?: string;
}

interface OffersMapProps {
  offers: Offer[];
  onMarkerClick?: (offerId: number) => void;
}

export default function OffersMap({ offers, onMarkerClick }: OffersMapProps) {
  const [validOffers, setValidOffers] = useState<Offer[]>([]);

  useEffect(() => {
    // Filter offers with valid coordinates
    const filtered = offers.filter(offer => {
      const lat = parseFloat(offer.latitude);
      const lng = parseFloat(offer.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });
    setValidOffers(filtered);
  }, [offers]);

  if (validOffers.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-500">Nenhuma oferta com localização disponível.</p>
      </div>
    );
  }

  // Calculate map center based on average of all coordinates
  const calculateCenter = () => {
    if (validOffers.length === 0) return [0, 0];
    
    const sum = validOffers.reduce(
      (acc, offer) => {
        const lat = parseFloat(offer.latitude);
        const lng = parseFloat(offer.longitude);
        return {
          lat: acc.lat + lat,
          lng: acc.lng + lng
        };
      },
      { lat: 0, lng: 0 }
    );
    
    return [
      sum.lat / validOffers.length,
      sum.lng / validOffers.length
    ];
  };

  const center: [number, number] = calculateCenter() as [number, number];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Mapa de Ofertas</h3>
      <div className="h-[500px] w-full rounded-lg overflow-hidden">
        <MapContainer 
          center={center} 
          zoom={3} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {validOffers.map(offer => {
            const lat = parseFloat(offer.latitude);
            const lng = parseFloat(offer.longitude);
            
            if (isNaN(lat) || isNaN(lng)) return null;
            
            return (
              <Marker 
                key={offer.id} 
                position={[lat, lng]}
                icon={offer.offer_type === 'VENDA' ? sellIcon : buyIcon}
                eventHandlers={{
                  click: () => {
                    if (onMarkerClick) onMarkerClick(offer.id);
                  }
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <h4 className="font-bold">{offer.commoditie}</h4>
                    <p className="text-gray-700">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        offer.offer_type === 'VENDA' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {offer.offer_type === 'VENDA' ? 'Venda' : 'Compra'}
                      </span>
                      <span className="ml-1">{offer.incoterms}</span>
                    </p>
                    <p className="flex items-center mt-1">
                      <span className="font-medium">{offer.quantity} {offer.unit}</span>
                    </p>
                    <p className="flex items-center mt-1">
                      <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                      <span>USD {offer.price_usd.toFixed(2)}</span>
                    </p>
                    <p className="flex items-center mt-1">
                      <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                      <span>Até: {format(new Date(offer.valid_until), 'dd/MM/yyyy')}</span>
                    </p>
                    {offer.user_name && (
                      <p className="mt-1 text-xs text-gray-500">
                        Parceiro: {offer.user_name}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      <div className="mt-3 flex justify-center space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-1"></div>
          <span>Ofertas de Venda</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-1"></div>
          <span>Ofertas de Compra</span>
        </div>
      </div>
    </div>
  );
}