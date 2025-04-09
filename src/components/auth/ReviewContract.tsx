import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../../lib/supabase';

export default function ReviewContract() {
  const location = useLocation();
  const navigate = useNavigate();
  const [personalizedContract, setPersonalizedContract] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const previewRef = useRef<HTMLDivElement>(null); // Referência para o preview

  useEffect(() => {
    const loadUserData = async () => {
      const urlParams = new URLSearchParams(location.search);
      const userId = urlParams.get('userId');

      if (!userId) {
        setError('ID do usuário não fornecido. Por favor, refaça o cadastro.');
        navigate('/signup');
        return;
      }

      const { data: users, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);

      if (queryError) {
        setError('Erro ao buscar usuário: ' + queryError.message);
        navigate('/signup');
        return;
      }

      if (!users || users.length === 0) {
        setError('Nenhum usuário encontrado com este ID. Por favor, refaça o cadastro.');
        navigate('/signup');
        return;
      }

      const userFromDb = users[0];
      setUserData(userFromDb);

      const { data: templates, error: templateError } = await supabase
        .from('contract_templates')
        .select('content')
        .eq('is_active', true);

      if (templateError || !templates || templates.length === 0) {
        setError('Erro ao buscar modelo de contrato ou nenhum modelo ativo encontrado.');
        navigate('/signup');
        return;
      }

      const contract = personalizeContract(templates[0].content, userFromDb);
      setPersonalizedContract(contract);

      // Pré-carregar imagens no preview
      await preloadImages(userFromDb.passport_url, "https://ppuhqfxgyovbiyfpkyfm.supabase.co/storage/v1/object/public/passport_documents/8da3e93d-c8a2-4116-af7d-9a8256803a84/1740768581528.jpg");
    };

    loadUserData();
  }, [location.search, navigate]);

  const preloadImages = async (partnerUrl: string, adminUrl: string) => {
    const loadImage = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Erro ao carregar imagem: ${url}`));
        img.src = url;
      });
    };

    try {
      await Promise.all([loadImage(partnerUrl), loadImage(adminUrl)]);
      console.log("Imagens pré-carregadas com sucesso");
    } catch (err) {
      console.error("Erro ao pré-carregar imagens:", err);
      setError("Erro ao carregar imagens do contrato. Tente novamente.");
    }
  };

  const personalizeContract = (template: string, userData: any) => {
    const adminPassportUrl = "https://ppuhqfxgyovbiyfpkyfm.supabase.co/storage/v1/object/public/passport_documents/8da3e93d-c8a2-4116-af7d-9a8256803a84/1740768581528.jpg";
    return template
      .replaceAll('[NOME_COMPLETO]', userData.name || 'N/A')
      .replaceAll('[CPF]', userData.cpf || 'N/A')
      .replaceAll('[PASSAPORTE]', userData.passport_number || 'N/A')
      .replaceAll('[EMAIL]', userData.email || 'N/A')
      .replaceAll('[DATA_ATUAL]', new Date().toLocaleDateString('pt-BR'))
      .replaceAll('[ESPAÇO PARA IMAGEM_DO_PASSAPORTE_PARCEIRO]', `<img src="${userData.passport_url || ''}" alt="Passaporte do Parceiro" style="max-width: 100%; height: auto; max-height: 300px; border: 1px solid #ccc; padding: 5px;" />`)
      .replaceAll('[ESPAÇO PARA IMAGEM_DO_PASSAPORTE_ADMIN]', `<img src="${adminPassportUrl}" alt="Passaporte do Administrador" style="max-width: 100%; height: auto; max-height: 300px; border: 1px solid #ccc; padding: 5px;" />`);
  };

  const handleAccept = async () => {
    if (!accepted) {
      setError('Por favor, aceite os termos do contrato antes de continuar.');
      return;
    }

    if (!userData) {
      setError('Dados do usuário não carregados.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Usar o elemento do preview diretamente
      const element = previewRef.current;
      if (!element) {
        throw new Error("Elemento de preview não encontrado.");
      }

      // Configurações do html2canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        windowWidth: 794, // Largura A4 em pixels (210mm a 96dpi)
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // Criar PDF com jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // Largura A4 em mm
      const pageHeight = 297; // Altura A4 em mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Salvar o PDF como Blob
      const pdfBlob = pdf.output('blob');

      // Testar o PDF localmente
      const pdfUrl = URL.createObjectURL(pdfBlob);
      console.log('URL do PDF gerado para teste:', pdfUrl);

      // Upload para o Supabase
      const filename = `Contrato_${userData.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(`${userData.id}/${filename}`, pdfBlob, { contentType: 'application/pdf' });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(`${userData.id}/${filename}`);

      // Converter para base64 para o email
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(pdfBlob);
      });
      const base64Data = await base64Promise;
      const base64Content = base64Data.split(',')[1];

      // Enviar email via Supabase/Resend
      const { data, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: `${userData.email}, compliance@oagronaopara.tec.br`,
          subject: `Novo Contrato NCNDA para Validação - ${userData.name}`,
          html: `Seu contrato foi gerado e está anexado neste email.`,
          attachments: [{
            filename: filename,
            content: base64Content,
            contentType: 'application/pdf',
          }],
        },
      });
      if (emailError) throw emailError;

      // Atualizar o banco de dados
      const { error: contractInsertError } = await supabase.from('contracts').insert([{
        user_id: userData.id,
        contract_url: publicUrl,
        partner_accepted: true,
        admin_validated: false,
        created_at: new Date().toISOString(),
      }]);
      if (contractInsertError) throw contractInsertError;

      const { error: updateError } = await supabase.from('users').update({ contract_signed: true }).eq('id', userData.id);
      if (updateError) throw updateError;

      navigate('/signup-success', { state: { message: 'Contrato aceito e enviado com sucesso! Verifique seu email.' } });
    } catch (err: any) {
      console.error('Erro ao processar o contrato:', err);
      setError('Erro ao processar o contrato: ' + (err.message || 'Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Revisão e Aceitação do Contrato</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
            <button onClick={() => navigate('/')} className="ml-2 text-blue-600 hover:underline">
              Voltar para a página inicial
            </button>
          </div>
        )}
        {loading ? (
          <p className="text-gray-500">Preparando seu contrato...</p>
        ) : personalizedContract ? (
          <>
            <div
              ref={previewRef}
              className="border rounded-md p-4 max-h-[60vh] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: personalizedContract }}
              style={{ width: '210mm', margin: '0 auto' }} // Simula A4 no preview
            />
            <div className="mt-6 flex items-center">
              <input
                type="checkbox"
                id="accept"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="accept" className="ml-2 block text-sm text-gray-900">
                Eu aceito os termos e condições deste contrato e me comprometo a assiná-lo digitalmente.
              </label>
            </div>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Aceitar e Enviar Contrato'}
            </button>
          </>
        ) : (
          <p className="text-gray-500">Carregando contrato...</p>
        )}
      </div>
    </div>
  );
}