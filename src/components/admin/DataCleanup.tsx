import React, { useState } from 'react';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DataCleanup() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');

  async function handleDeleteAllUsers() {
    if (confirmDelete !== 'CONFIRMAR') {
      setErrorMessage('Por favor, digite "CONFIRMAR" para prosseguir com a exclusão.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. First delete all offer interests
      const { error: interestsError } = await supabase
        .from('offer_interests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (interestsError) {
        console.error('Error deleting offer interests:', interestsError);
      }

      // 2. Delete all offers
      const { error: offersError } = await supabase
        .from('offers')
        .delete()
        .neq('id', 0);

      if (offersError) {
        console.error('Error deleting offers:', offersError);
      }

      // 3. Delete all contracts
      const { error: contractsError } = await supabase
        .from('contracts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (contractsError) {
        console.error('Error deleting contracts:', contractsError);
      }

      // 4. Get all users except admin
      const { data: users, error: usersQueryError } = await supabase
        .from('users')
        .select('id, email')
        .neq('email', 'efs.ceo@oagronaopara.tec.br');

      if (usersQueryError) {
        throw usersQueryError;
      }

      // 5. Delete all users except admin from users table
      const { error: usersDeleteError } = await supabase
        .from('users')
        .delete()
        .neq('email', 'efs.ceo@oagronaopara.tec.br');

      if (usersDeleteError) {
        throw usersDeleteError;
      }

      // 6. Try to delete auth users (this might fail without admin rights)
      if (users && users.length > 0) {
        for (const user of users) {
          try {
            await supabase.auth.admin.deleteUser(user.id);
          } catch (error) {
            console.warn(`Could not delete auth user ${user.email}:`, error);
            // Continue with next user
          }
        }
      }

      setSuccessMessage(`Limpeza concluída com sucesso! ${users?.length || 0} usuários foram removidos.`);
      setConfirmDelete('');
    } catch (error: any) {
      console.error('Error during cleanup:', error);
      setErrorMessage(`Erro durante a limpeza: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Limpeza de Dados para Testes</h2>

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

      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-2 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Atenção: Operação Irreversível</h3>
            <p className="mb-2">
              Esta operação irá excluir <strong>TODOS</strong> os usuários (exceto o administrador), ofertas, contratos e interesses em ofertas do sistema.
            </p>
            <p className="mb-2">
              Use esta função apenas em ambientes de teste ou desenvolvimento.
            </p>
            <p>
              <strong>Esta ação não pode ser desfeita!</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700 mb-2">
            Digite "CONFIRMAR" para prosseguir com a exclusão:
          </label>
          <input
            type="text"
            id="confirm-delete"
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            placeholder="CONFIRMAR"
          />
        </div>

        <button
          onClick={handleDeleteAllUsers}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
              Excluindo dados...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Todos os Dados de Teste
            </>
          )}
        </button>
      </div>
    </div>
  );
}