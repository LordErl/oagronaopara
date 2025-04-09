import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, Leaf, FileText, Download, X, RefreshCw, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateContract, generatePdfContract, sendContractEmail } from '../lib/contractService';

export default function ContractReview() {
  const [loading, setLoading] = useState(true);
  const [contractContent, setContractContent] = useState('');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [processingContract, setProcessingContract] = useState(true);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [contractId, setContractId] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get('userId');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUserAndContract() {
      if (!userId) {
        setError('ID do usuário não fornecido');
        setLoading(false);
        setProcessingContract(false);
        return;
      }

      try {
        // Update progress immediately to show activity
        setProcessingProgress(10);

        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        if (!userData) throw new Error('Usuário não encontrado');

        setUser(userData);
        setProcessingProgress(30);

        // Check if a contract already exists
        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (contractError) {
          console.error("Error fetching contract:", contractError);
        } else if (contractData && contractData.length > 0) {
          setContractId(contractData[0].id);
        } else {
          // Create a new contract record if none exists
          const { data: newContract, error: createError } = await supabase
            .from('contracts')
            .insert([{
              user_id: userId,
              contract_url: '',
              partner_accepted: false,
              admin_validated: false
            }])
            .select()
            .single();

          if (createError) {
            console.error("Error creating contract:", createError);
          } else if (newContract) {
            setContractId(newContract.id);
          }
        }

        setProcessingProgress(50);

        // Generate contract content
        const contract = await generateContract(userData);
        setContractContent(contract);
        setProcessingProgress(70);

        // Pre-generate PDF in the background
        setGeneratingPdf(true);
        try {
          const pdf = await generatePdfContract(userData, contract);
          setPdfBlob(pdf);
          setProcessingProgress(100);
        } catch (pdfError) {
          console.error('Error pre-generating PDF:', pdfError);
          // Don't throw error here - we can generate PDF again when needed
        } finally {
          setGeneratingPdf(false);
        }

        // Hide progress after a short delay
        setTimeout(() => {
          setProcessingContract(false);
        }, 500);
      } catch (err: any) {
        console.error('Error fetching user or generating contract:', err);
        setError(err.message || 'Erro ao carregar contrato');
        setProcessingContract(false);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndContract();
  }, [userId]);

  const handleAcceptTerms = async () => {
    if (!user || !contractId) {
      setError('Dados necessários não disponíveis');
      return;
    }
    
    if (!accepted) {
      setError('Por favor, aceite os termos do contrato antes de continuar.');
      return;
    }

    setSendingEmail(true);
    setError('');
    
    try {
      // Generate PDF if not already generated
      let contractPdf = pdfBlob;
      if (!contractPdf) {
        try {
          contractPdf = await generatePdfContract(user, contractContent);
        } catch (pdfError) {
          throw new Error('Erro ao gerar PDF do contrato. Por favor, tente novamente.');
        }
      }

      // Update contract status in database
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ 
          partner_accepted: true,
          partner_accepted_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (updateError) throw updateError;
      
      // Send contract email
      await sendContractEmail(user, contractContent, 'compliance@oagronaopara.tec.br');
      
      // Update user's contract status
      await supabase
        .from('users')
        .update({ contract_signed: true })
        .eq('id', user.id);
      
      setEmailSent(true);
    } catch (err: any) {
      console.error('Error sending contract email:', err);
      setError(err.message || 'Erro ao enviar contrato por email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadContract = async () => {
    try {
      let contractPdf = pdfBlob;
      if (!contractPdf) {
        setGeneratingPdf(true);
        contractPdf = await generatePdfContract(user, contractContent);
        setPdfBlob(contractPdf);
        setGeneratingPdf(false);
      }

      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(contractPdf);
      link.download = `contrato_ncnda_${user?.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading contract:', error);
      setError('Erro ao baixar contrato. Por favor, tente novamente.');
    }
  };

  const handlePreviewContract = () => {
    // Create a new window with the contract content
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Contrato NCNDA - ${user?.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.5;
              color: #333;
              padding: 2cm;
              max-width: 800px;
              margin: 0 auto;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 100px;
              color: rgba(34, 197, 94, 0.05);
              z-index: -1;
              pointer-events: none;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="watermark">O AGRO NÃO PARA</div>
          ${contractContent}
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  if (loading && processingContract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-gradient-to-br from-green-100 to-blue-100 p-3">
              <FileText className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Preparando seu Contrato</h2>
          <p className="text-gray-600 text-center mb-6">
            Estamos digitalizando e personalizando seu contrato NCNDA com seus dados.
          </p>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            {processingProgress < 30 && "Verificando seus dados..."}
            {processingProgress >= 30 && processingProgress < 60 && "Gerando contrato personalizado..."}
            {processingProgress >= 60 && processingProgress < 90 && "Preparando documento PDF..."}
            {processingProgress >= 90 && "Finalizando..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <X className="h-12 w-12 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-md hover:from-green-700 hover:to-blue-700"
        >
          Voltar para a página inicial
        </button>
      </div>
    );
  }

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
        <div className="max-w-4xl w-full bg-white bg-opacity-95 rounded-lg shadow-xl overflow-hidden">
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
          
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-gradient-to-br from-green-100 to-blue-100 p-3">
                <FileText className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Revisão do Contrato NCNDA</h2>
            
            {emailSent ? (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <p className="text-xl font-medium text-gray-900">
                  Contrato enviado com sucesso!
                </p>
                <p className="text-gray-700">
                  Uma cópia do contrato NCNDA foi enviada para o email compliance@oagronaopara.tec.br.
                  Por favor, assine digitalmente o documento e envie-o de volta para nós.
                </p>
                <div className="pt-6">
                  <button
                    onClick={() => navigate('/confirm-email?email=' + encodeURIComponent(user?.email))}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Continuar para a Plataforma
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <FileText className="h-6 w-6 text-yellow-600 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Contrato NCNDA</h3>
                      <p className="mb-2">
                        Por favor, leia atentamente o contrato NCNDA (Non-Circumvention, Non-Disclosure Agreement) abaixo.
                        Este documento é essencial para garantir a confidencialidade e proteção das informações compartilhadas na plataforma.
                      </p>
                      <p>
                        <strong>Importante:</strong> Ao aceitar os termos, você receberá uma cópia deste contrato por email.
                        Você deverá assiná-lo digitalmente e enviá-lo de volta para o email compliance@oagronaopara.tec.br para completar seu cadastro.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                  <div 
                    ref={previewRef}
                    dangerouslySetInnerHTML={{ __html: contractContent }}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="accept-terms"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-900">
                    Li e aceito os termos do contrato NCNDA
                  </label>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handlePreviewContract}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar Contrato
                  </button>
                  
                  <button
                    onClick={handleDownloadContract}
                    disabled={generatingPdf}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {generatingPdf ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Contrato
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleAcceptTerms}
                    disabled={!accepted || sendingEmail}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingEmail ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aceitar e Receber por Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
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