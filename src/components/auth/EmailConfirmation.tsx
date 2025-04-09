import React from 'react';
import { CheckCircle, Shield, Leaf, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmailConfirmationProps {
  email?: string;
}

export default function EmailConfirmation({ email }: EmailConfirmationProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)'
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-10 flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full bg-white bg-opacity-95 rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-white transform rotate-45" />
                </div>
                <h1 className="ml-2 text-2xl font-bold text-white">oagronaopara.tec.br</h1>
              </div>
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-gradient-to-br from-green-100 to-blue-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Confirmação de Email</h2>
            
            <div className="space-y-6 text-gray-700">
              <p className="text-xl">
                Obrigado por confirmar seu email{email ? ` (${email})` : ''}!
              </p>
              
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 text-left">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Próximos Passos</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 rounded-full bg-green-100 items-center justify-center">
                        <span className="text-green-800 font-semibold">1</span>
                      </div>
                    </div>
                    <p className="ml-4">Nossa equipe de compliance está analisando seus documentos.</p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 rounded-full bg-green-100 items-center justify-center">
                        <span className="text-green-800 font-semibold">2</span>
                      </div>
                    </div>
                    <p className="ml-4">Após a validação, você receberá o contrato NCNDA por email para assinatura digital.</p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 rounded-full bg-green-100 items-center justify-center">
                        <span className="text-green-800 font-semibold">3</span>
                      </div>
                    </div>
                    <p className="ml-4">Envie o contrato assinado de volta para nós através do email compliance@oagronaopara.tec.br</p>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 rounded-full bg-green-100 items-center justify-center">
                        <span className="text-green-800 font-semibold">4</span>
                      </div>
                    </div>
                    <p className="ml-4">Seu cadastro será ativado e você poderá acessar todas as funcionalidades da plataforma.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-6 text-left">
                <div className="flex items-start">
                  <FileText className="h-6 w-6 text-yellow-600 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Contrato NCNDA</h3>
                    <p>
                      O contrato NCNDA (Non-Circumvention, Non-Disclosure Agreement) é essencial para garantir a confidencialidade
                      e proteção das informações compartilhadas na plataforma. Você receberá o contrato por email após a validação
                      dos seus documentos.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Ir para a Plataforma
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-500">
            <p>© 2025 oagronaopara.tec.br - Todos os direitos reservados</p>
            <p>Conectando o agronegócio internacional com segurança e transparência</p>
          </div>
        </div>
      </div>
    </div>
  );
}