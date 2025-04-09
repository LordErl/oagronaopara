import React from 'react';
import { Shield, MapPin, FileCheck, Lock, Globe2, BarChart as ChartBar } from 'lucide-react';

const features = [
  {
    name: 'Cadastro Verificado',
    description: 'Sistema robusto com verificação documental e autenticação multifatorial.',
    icon: Shield,
  },
  {
    name: 'Geolocalização Avançada',
    description: 'Otimização de rotas de transporte com dados em tempo real.',
    icon: MapPin,
  },
  {
    name: 'Contrato de Confidencialidade',
    description: 'Proteção garantida das informações compartilhadas na plataforma.',
    icon: FileCheck,
  },
  {
    name: 'Segurança Robusta',
    description: 'Criptografia avançada e proteção contínua dos dados.',
    icon: Lock,
  },
  {
    name: 'Integração API',
    description: 'Conexão direta com APIs locais para sincronização em tempo real.',
    icon: Globe2,
  },
  {
    name: 'Cotações em Tempo Real',
    description: 'Acompanhamento das cotações diárias de grãos e commodities.',
    icon: ChartBar,
  },
];

export default function Features() {
  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Funcionalidades</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Tudo que você precisa em um só lugar
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Nossa plataforma oferece recursos avançados para impulsionar seus negócios no mercado internacional.
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                    <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}