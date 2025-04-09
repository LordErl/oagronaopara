import React, { useState, useEffect } from 'react';
import { Upload, RefreshCw, AlertTriangle, CheckCircle, X, Image } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminPassportUpload() {
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passportUrl, setPassportUrl] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'efs.ceo@oagronaopara.tec.br')
        .single();

      if (error) throw error;
      setAdminUser(data);
      setPassportUrl(data?.passport_url || null);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setErrorMessage('Erro ao carregar dados do administrador');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setErrorMessage('Por favor, selecione um arquivo');
      return;
    }

    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setErrorMessage('Por favor, selecione um arquivo JPG, PNG ou PDF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('O arquivo deve ter no máximo 5MB');
      return;
    }

    setUploadLoading(true);
    setErrorMessage('');

    try {
      if (!adminUser) {
        throw new Error('Dados do administrador não encontrados');
      }

      // Upload file to storage bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${adminUser.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('passport_documents')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('passport_documents')
        .getPublicUrl(fileName);

      // Update admin user with passport URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ passport_url: publicUrl })
        .eq('id', adminUser.id);

      if (updateError) throw updateError;

      setPassportUrl(publicUrl);
      setSuccessMessage('Passaporte do administrador atualizado com sucesso!');
      
      // Clear file input
      e.target.value = '';
    } catch (err: any) {
      console.error('Error uploading passport:', err);
      setErrorMessage(`Erro ao fazer upload do passaporte: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Passaporte do Administrador</h2>
      
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
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <p className="text-gray-700 mb-4">
          O passaporte do administrador é necessário para ser exibido nos contratos NCNDA junto com o passaporte do parceiro.
          Faça o upload do seu passaporte abaixo para que ele apareça em todos os contratos gerados.
        </p>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <RefreshCw className="h-6 w-6 text-green-500 animate-spin" />
          </div>
        ) : passportUrl ? (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">Passaporte Atual</h3>
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Image className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-gray-700 break-all">{passportUrl}</p>
                  <div className="mt-2 border border-gray-200 p-2 rounded">
                    <img 
                      src={passportUrl} 
                      alt="Passaporte do Administrador" 
                      className="max-w-full h-auto max-h-64"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'block';
                      }}
                    />
                    <div className="mt-2 p-4 bg-gray-100 rounded text-gray-500 text-sm hidden">
                      Não foi possível exibir a imagem do passaporte (pode ser um PDF ou outro formato não suportado para visualização).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <p className="text-yellow-700">
                Nenhum passaporte do administrador foi encontrado. Por favor, faça o upload abaixo.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {passportUrl ? 'Atualizar Passaporte' : 'Upload do Passaporte'}
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                <span>Upload de arquivo</span>
                <input
                  type="file"
                  className="sr-only"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                />
              </label>
              <p className="pl-1">ou arraste e solte</p>
            </div>
            <p className="text-xs text-gray-500">
              JPG, PNG ou PDF até 5MB
            </p>
            {uploadLoading && (
              <div className="flex justify-center mt-2">
                <RefreshCw className="h-5 w-5 text-green-500 animate-spin" />
                <span className="ml-2 text-sm text-green-500">Enviando...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Image className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Dicas para o upload do passaporte</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Use uma imagem clara e legível do seu passaporte</li>
                <li>Certifique-se de que todas as informações estão visíveis</li>
                <li>Prefira arquivos JPG ou PNG para melhor visualização no contrato</li>
                <li>Evite imagens muito grandes para não sobrecarregar o contrato</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}