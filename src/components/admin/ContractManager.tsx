import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, X, Eye, Download, FileText, Check, Mail, Edit2, ThumbsUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateContract, generatePdfContract, sendContractEmail } from '../../lib/contractService';
import Select from 'react-select';

interface Contract {
  id: string;
  user_id: string;
  contract_url: string;
  partner_accepted: boolean;
  partner_accepted_at: string | null;
  admin_validated: boolean;
  admin_validated_at: string | null;
  approved_by?: string;
  approved_at?: string;
  signature_validated: boolean;
  signature_validated_at: string | null;
  signature_validated_by?: string;
  validated_by?: string;
  validated_at?: string;
  created_at: string;
  email_sent: boolean;
  email_sent_at: string | null;
  user: {
    name: string;
    email: string;
    cpf: string;
    passport_number: string;
    passport_url: string | null;
    phone: string;
    cep: string;
    address: string;
  } | null;
}

export default function ContractManager() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [contractContent, setContractContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendingBulkEmails, setSendingBulkEmails] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchContracts();
    fetchCurrentUser();
  }, []);

  async function fetchCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setCurrentUser(userData);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  }

  async function fetchContracts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          user:user_id (
            name,
            email,
            cpf,
            passport_number,
            passport_url,
            phone,
            cep,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setErrorMessage('Erro ao carregar contratos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptContract(contract: Contract) {
    if (!currentUser) {
      setErrorMessage('Usuário não autenticado');
      return;
    }

    setActionLoading(contract.id);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          partner_accepted: true,
          partner_accepted_at: new Date().toISOString(),
          approved_by: currentUser.name,
          approved_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (error) throw error;
      
      setContracts(contracts.map(c => 
        c.id === contract.id 
          ? { 
              ...c, 
              partner_accepted: true, 
              partner_accepted_at: new Date().toISOString(),
              approved_by: currentUser.name,
              approved_at: new Date().toISOString()
            } 
          : c
      ));
      
      setSuccessMessage(`Aceitação do contrato de ${contract.user?.name} registrada com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error accepting contract:', err);
      setErrorMessage(`Erro ao registrar aceitação: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleValidateSignature(contract: Contract) {
    if (!currentUser) {
      setErrorMessage('Usuário não autenticado');
      return;
    }

    setActionLoading(contract.id);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          signature_validated: true,
          signature_validated_at: new Date().toISOString(),
          signature_validated_by: currentUser.name
        })
        .eq('id', contract.id);

      if (error) throw error;
      
      setContracts(contracts.map(c => 
        c.id === contract.id 
          ? { 
              ...c, 
              signature_validated: true, 
              signature_validated_at: new Date().toISOString(),
              signature_validated_by: currentUser.name
            } 
          : c
      ));
      
      setSuccessMessage(`Assinatura do contrato de ${contract.user?.name} validada com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error validating signature:', err);
      setErrorMessage(`Erro ao validar assinatura: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleValidateContract(contract: Contract) {
    if (!currentUser) {
      setErrorMessage('Usuário não autenticado');
      return;
    }

    setActionLoading(contract.id);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          admin_validated: true,
          admin_validated_at: new Date().toISOString(),
          validated_by: currentUser.name,
          validated_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (error) throw error;
      
      setContracts(contracts.map(c => 
        c.id === contract.id 
          ? { 
              ...c, 
              admin_validated: true, 
              admin_validated_at: new Date().toISOString(),
              validated_by: currentUser.name,
              validated_at: new Date().toISOString()
            } 
          : c
      ));
      
      setSuccessMessage(`Contrato de ${contract.user?.name} validado com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error validating contract:', err);
      setErrorMessage(`Erro ao validar contrato: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDownloadContract(contract: Contract) {
    if (!contract.user) {
      setErrorMessage('Dados do usuário não encontrados');
      return;
    }

    setGeneratingPdf(true);
    try {
      const content = await generateContract({
        id: contract.user_id,
        name: contract.user.name,
        email: contract.user.email,
        cpf: contract.user.cpf,
        passport_number: contract.user.passport_number,
        passport_url: contract.user.passport_url || undefined,
        contract_signed: contract.partner_accepted,
        created_at: contract.created_at,
        updated_at: contract.created_at,
        phone: contract.user.phone,
        cep: contract.user.cep,
        address: contract.user.address
      });

      const pdfBlob = await generatePdfContract({
        id: contract.user_id,
        name: contract.user.name,
        email: contract.user.email,
        cpf: contract.user.cpf,
        passport_number: contract.user.passport_number,
        passport_url: contract.user.passport_url || undefined,
        contract_signed: contract.partner_accepted,
        created_at: contract.created_at,
        updated_at: contract.created_at,
        phone: contract.user.phone,
        cep: contract.user.cep,
        address: contract.user.address
      }, content);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato_${contract.user.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage('Contrato baixado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error downloading contract:', err);
      setErrorMessage(`Erro ao baixar contrato: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setGeneratingPdf(false);
    }
  }

  async function handlePreviewContract(contract: Contract) {
    setSelectedContract(contract);
    setPreviewLoading(true);
    
    try {
      if (!contract.user) {
        throw new Error('Dados do usuário não encontrados');
      }
      
      // Generate contract content
      const content = await generateContract({
        id: contract.user_id,
        name: contract.user.name,
        email: contract.user.email,
        cpf: contract.user.cpf,
        passport_number: contract.user.passport_number,
        passport_url: contract.user.passport_url || undefined,
        contract_signed: contract.partner_accepted,
        created_at: contract.created_at,
        updated_at: contract.created_at,
        phone: contract.user.phone,
        cep: contract.user.cep,
        address: contract.user.address
      });
      
      setContractContent(content);
      setEditableContent(content);
      setShowPreview(true);
    } catch (err: any) {
      console.error('Error generating contract preview:', err);
      setErrorMessage(`Erro ao gerar visualização do contrato: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleEditContract(contract: Contract) {
    setSelectedContract(contract);
    setPreviewLoading(true);
    
    try {
      if (!contract.user) {
        throw new Error('Dados do usuário não encontrados');
      }
      
      // Generate initial contract content
      const content = await generateContract({
        id: contract.user_id,
        name: contract.user.name,
        email: contract.user.email,
        cpf: contract.user.cpf,
        passport_number: contract.user.passport_number,
        passport_url: contract.user.passport_url || undefined,
        contract_signed: contract.partner_accepted,
        created_at: contract.created_at,
        updated_at: contract.created_at,
        phone: contract.user.phone,
        cep: contract.user.cep,
        address: contract.user.address
      });
      
      setEditableContent(content);
      setShowEditModal(true);
    } catch (err: any) {
      console.error('Error preparing contract for edit:', err);
      setErrorMessage(`Erro ao preparar contrato para edição: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSendContract(contract: Contract) {
    setActionLoading(contract.id);
    try {
      if (!contract.user) {
        throw new Error('Dados do usuário não encontrados');
      }

      // Use edited content if available, otherwise generate new
      const content = showEditModal ? editableContent : await generateContract({
        id: contract.user_id,
        name: contract.user.name,
        email: contract.user.email,
        cpf: contract.user.cpf,
        passport_number: contract.user.passport_number,
        passport_url: contract.user.passport_url || undefined,
        contract_signed: contract.partner_accepted,
        created_at: contract.created_at,
        updated_at: contract.created_at,
        phone: contract.user.phone,
        cep: contract.user.cep,
        address: contract.user.address
      });

      // Send email with contract
      await sendContractEmail(
        {
          id: contract.user_id,
          name: contract.user.name,
          email: contract.user.email,
          cpf: contract.user.cpf,
          passport_number: contract.user.passport_number,
          passport_url: contract.user.passport_url || undefined,
          contract_signed: contract.partner_accepted,
          created_at: contract.created_at,
          updated_at: contract.created_at,
          phone: contract.user.phone,
          cep: contract.user.cep,
          address: contract.user.address
        },
        content,
        'compliance@oagronaopara.tec.br' // Adiciona o email de compliance como cópia
      );

      // Update contract status
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (updateError) throw updateError;

      // Update local state
      setContracts(contracts.map(c => 
        c.id === contract.id 
          ? { ...c, email_sent: true, email_sent_at: new Date().toISOString() } 
          : c
      ));

      setSuccessMessage(`Contrato enviado com sucesso para ${contract.user.email}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Close modals
      setShowEditModal(false);
      setShowPreview(false);
    } catch (err: any) {
      console.error('Error sending contract:', err);
      setErrorMessage(`Erro ao enviar contrato: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkSendContracts() {
    setSendingBulkEmails(true);
    try {
      const selectedContracts = contracts.filter(c => selectedUsers.includes(c.id));
      
      for (const contract of selectedContracts) {
        await handleSendContract(contract);
      }
      
      setSuccessMessage(`Contratos enviados com sucesso para ${selectedContracts.length} usuários`);
      setSelectedUsers([]);
    } catch (err: any) {
      console.error('Error sending bulk contracts:', err);
      setErrorMessage(`Erro ao enviar contratos em lote: ${err.message}`);
    } finally {
      setSendingBulkEmails(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Gerenciar Contratos</h2>
      
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
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 mr-4">
          <Select
            isMulti
            value={selectedUsers.map(id => ({
              value: id,
              label: contracts.find(c => c.id === id)?.user?.name || id
            }))}
            onChange={(selected) => setSelectedUsers(selected ? selected.map(s => s.value) : [])}
            options={contracts.map(contract => ({
              value: contract.id,
              label: contract.user?.name || contract.id
            }))}
            placeholder="Selecione usuários para envio em lote..."
            className="min-w-[300px]"
          />
        </div>
        
        <div className="flex space-x-2">
          {selectedUsers.length > 0 && (
            <button
              onClick={handleBulkSendContracts}
              disabled={sendingBulkEmails}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {sendingBulkEmails ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Contratos ({selectedUsers.length})
                </>
              )}
            </button>
          )}
          
          <button
            onClick={fetchContracts}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p>Nenhum contrato encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parceiro
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contract.user ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{contract.user.name}</div>
                        <div className="text-sm text-gray-500">{contract.user.email}</div>
                        <div className="text-sm text-gray-500">CPF: {contract.user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Usuário não encontrado</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contract.partner_accepted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {contract.partner_accepted ? 'Aceito pelo Parceiro' : 'Pendente Aceitação'}
                      </span>
                      
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contract.admin_validated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {contract.admin_validated ? 'Validado pelo Admin' : 'Pendente Validação'}
                      </span>

                      {contract.admin_validated && contract.validated_by && (
                        <span className="text-xs text-gray-500">
                          Validado por: {contract.validated_by}
                          <br />
                          Em: {format(new Date(contract.validated_at!), 'dd/MM/yyyy HH:mm')}
                        </span>
                      )}

                      {contract.signature_validated && contract.signature_validated_by && (
                        <span className="text-xs text-gray-500">
                          Assinatura validada por: {contract.signature_validated_by}
                          <br />
                          Em: {format(new Date(contract.signature_validated_at!), 'dd/MM/yyyy HH:mm')}
                        </span>
                      )}

                      {contract.email_sent && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Email Enviado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(contract.created_at), 'dd/MM/yyyy HH:mm')}
                    
                    {contract.partner_accepted_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Aceito em: {format(new Date(contract.partner_accepted_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}
                    
                    {contract.admin_validated_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Validado em: {format(new Date(contract.admin_validated_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}

                    {contract.email_sent_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Email enviado em: {format(new Date(contract.email_sent_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePreviewContract(contract)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Visualizar Contrato"
                      >
                        <Eye className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => handleDownloadContract(contract)}
                        disabled={generatingPdf}
                        className="text-blue-600 hover:text-blue-900"
                        title="Baixar Contrato"
                      >
                        {generatingPdf ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <Download className="h-5 w-5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleEditContract(contract)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar Contrato"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleSendContract(contract)}
                        disabled={actionLoading === contract.id}
                        className="text-green-600 hover:text-green-900"
                        title="Enviar Contrato por Email"
                      >
                        {actionLoading === contract.id ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <Mail className="h-5 w-5" />
                        )}
                      </button>

                      {!contract.partner_accepted && (
                        <button
                          onClick={() => handleAcceptContract(contract)}
                          disabled={actionLoading === contract.id}
                          className="text-green-600 hover:text-green-900"
                          title="Informar Aceitação"
                        >
                          {actionLoading === contract.id ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <ThumbsUp className="h-5 w-5" />
                          )}
                        </button>
                      )}
                      
                      {contract.partner_accepted && !contract.signature_validated && (
                        <button
                          onClick={() => handleValidateSignature(contract)}
                          disabled={actionLoading === contract.id}
                          className="text-green-600 hover:text-green-900"
                          title="Validar Assinatura"
                        >
                          {actionLoading === contract.id ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <Check className="h-5 w-5" />
                          )}
                        </button>
                      )}
                      
                      {contract.partner_accepted && !contract.admin_validated && (
                        <button
                          onClick={() => handleValidateContract(contract)}
                          disabled={actionLoading === contract.id}
                          className="text-green-600 hover:text-green-900"
                          title="Validar Contrato"
                        >
                          {actionLoading === contract.id ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <Check className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contract Preview Modal */}
      {showPreview && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-gray-900">
                Contrato de {selectedContract.user?.name}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {previewLoading ? (
              <div className="flex-grow flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex-grow overflow-auto bg-gray-50 p-6 rounded-md">
                  <div 
                    className="bg-white p-8 rounded shadow-sm"
                    dangerouslySetInnerHTML={{ __html: contractContent }} 
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => handleDownloadContract(selectedContract)}
                    disabled={generatingPdf}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {generatingPdf ? (
                      <>
                        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSendContract(selectedContract)}
                    disabled={actionLoading === selectedContract.id}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {actionLoading === selectedContract.id ? (
                      <>
                        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar por Email
                      </>
                    )}
                  </button>
                  
                  {selectedContract.partner_accepted && !selectedContract.admin_validated && (
                    <button
                      onClick={() => {
                        handleValidateContract(selectedContract);
                        setShowPreview(false);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Validar Contrato
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contract Edit Modal */}
      {showEditModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-gray-900">
                Editar Contrato de {selectedContract.user?.name}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {previewLoading ? (
              <div className="flex-grow flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex-grow flex flex-col">
                  <textarea
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="flex-grow p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Variáveis disponíveis:</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>[NOME_COMPLETO] - Nome do parceiro</div>
                      <div>[CPF] - CPF formatado</div>
                      <div>[PASSAPORTE] - Número do passaporte</div>
                      <div>[EMAIL] - Email do parceiro</div>
                      <div>[DATA_ATUAL] - Data atual formatada</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={() => handleSendContract(selectedContract)}
                    disabled={actionLoading === selectedContract.id}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {actionLoading === selectedContract.id ? (
                      <>
                        <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Salvar e Enviar
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}