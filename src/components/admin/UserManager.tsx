import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Edit, Key, CheckCircle, X, Search, UserPlus, Eye, EyeOff, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { resendConfirmationEmail } from '../../lib/contractService';

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  cep: string;
  address: string;
  passport_number: string;
  passport_url?: string;
  contract_signed: boolean;
  is_admin: boolean;
  created_at: string;
}

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    cep: '',
    address: '',
    passport_number: '',
    is_admin: false
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setErrorMessage('Erro ao carregar usuários. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.cpf.includes(searchTerm) ||
      user.phone.includes(searchTerm)
    );
  });

  async function handleDeleteUser(userId: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

    setActionLoading(userId);
    try {
      // Delete from our users table first
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) throw dbError;

      // Then try to delete from auth (this might fail if we don't have admin rights)
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (authError) {
        console.warn('Could not delete auth user (requires admin rights):', authError);
        // Continue anyway since we've deleted from our users table
      }

      // Remove from state
      setUsers(users.filter(user => user.id !== userId));
      setSuccessMessage('Usuário excluído com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setErrorMessage(`Erro ao excluir usuário: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleAdmin(user: User) {
    setActionLoading(user.id);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !user.is_admin })
        .eq('id', user.id);

      if (error) throw error;

      // Update state
      setUsers(users.map(u => u.id === user.id ? { ...u, is_admin: !user.is_admin } : u));
      setSuccessMessage(`Usuário ${!user.is_admin ? 'promovido a administrador' : 'removido de administrador'} com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error toggling admin status:', err);
      setErrorMessage(`Erro ao alterar status de administrador: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResendEmail(user: User) {
    setActionLoading(user.id);
    try {
      await resendConfirmationEmail(user.id);
      setSuccessMessage(`Email de confirmação com contrato NCNDA reenviado para ${user.email}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error resending email:', err);
      setErrorMessage(`Erro ao reenviar email: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading('new');
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserData.email,
        password: newUserData.password,
        email_confirm: true
      });

      if (authError) {
        // If we can't create via admin API (which requires admin rights),
        // try regular signup
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: newUserData.email,
          password: newUserData.password
        });
        
        if (signupError) throw signupError;
        if (!signupData.user) throw new Error('Erro ao criar usuário');
        
        authData.user = signupData.user;
      }

      if (!authData.user) throw new Error('Erro ao criar usuário');

      // Create user profile
      const userData = {
        id: authData.user.id,
        name: newUserData.name,
        email: newUserData.email,
        cpf: newUserData.cpf.replace(/\D/g, ''),
        phone: newUserData.phone,
        cep: newUserData.cep,
        address: newUserData.address,
        passport_number: newUserData.passport_number,
        is_admin: newUserData.is_admin
      };

      const { error: userError } = await supabase
        .from('users')
        .insert([userData]);

      if (userError) {
        // Try to rollback auth user
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (e) {
          console.warn("Couldn't delete auth user during rollback:", e);
        }
        throw userError;
      }

      // Reset form and close modal
      setNewUserData({
        name: '',
        email: '',
        password: '',
        cpf: '',
        phone: '',
        cep: '',
        address: '',
        passport_number: '',
        is_admin: false
      });
      setShowAddUserModal(false);
      
      // Refresh users list
      await fetchUsers();
      
      setSuccessMessage('Usuário adicionado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error adding user:', err);
      setErrorMessage(`Erro ao adicionar usuário: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    
    setActionLoading(selectedUser.id);
    try {
      const updates = {
        name: newUserData.name,
        email: newUserData.email,
        cpf: newUserData.cpf.replace(/\D/g, ''),
        phone: newUserData.phone,
        cep: newUserData.cep,
        address: newUserData.address,
        passport_number: newUserData.passport_number,
        is_admin: newUserData.is_admin
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Try to update email in auth if changed
      if (selectedUser.email !== newUserData.email) {
        try {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            selectedUser.id,
            { email: newUserData.email }
          );
          if (authError) {
            console.warn("Couldn't update auth email (requires admin rights):", authError);
            // Continue anyway since we've updated our users table
          }
        } catch (e) {
          console.warn("Error updating auth email:", e);
          // Continue anyway
        }
      }

      // Reset form and close modal
      setShowEditUserModal(false);
      
      // Refresh users list
      await fetchUsers();
      
      setSuccessMessage('Usuário atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setErrorMessage(`Erro ao atualizar usuário: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    
    setActionLoading(selectedUser.id);
    try {
      try {
        const { error } = await supabase.auth.admin.updateUserById(
          selectedUser.id,
          { password: newPassword }
        );

        if (error) {
          console.warn("Couldn't reset password via admin API:", error);
          // Try password reset email instead
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            selectedUser.email
          );
          
          if (resetError) throw resetError;
          
          setSuccessMessage('Email de redefinição de senha enviado com sucesso!');
        } else {
          setSuccessMessage('Senha redefinida com sucesso!');
        }
      } catch (e) {
        console.warn("Error resetting password:", e);
        throw new Error("Não foi possível redefinir a senha. Tente enviar um email de redefinição.");
      }

      // Reset form and close modal
      setNewPassword('');
      setShowResetPasswordModal(false);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setErrorMessage(`Erro ao redefinir senha: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  function openEditModal(user: User) {
    setSelectedUser(user);
    setNewUserData({
      name: user.name,
      email: user.email,
      password: '',
      cpf: user.cpf,
      phone: user.phone,
      cep: user.cep,
      address: user.address,
      passport_number: user.passport_number,
      is_admin: user.is_admin
    });
    setShowEditUserModal(true);
  }

  function openResetPasswordModal(user: User) {
    setSelectedUser(user);
    setNewPassword('');
    setShowResetPasswordModal(true);
  }

  function formatCPF(cpf: string) {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Gerenciar Usuários</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuários..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Usuário
          </button>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </button>
        </div>
      </div>

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
            <X className="h-5 w-5 mr-2" />
            {errorMessage}
          </div>
          <button onClick={() => setErrorMessage('')}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'Nenhum usuário encontrado para esta busca.' : 'Nenhum usuário cadastrado.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documentos
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
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 font-medium">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.phone}</div>
                    <div className="text-sm text-gray-500">{user.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">CPF: {formatCPF(user.cpf)}</div>
                    <div className="text-sm text-gray-500">Passaporte: {user.passport_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_admin ? 'Administrador' : 'Usuário'}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.contract_signed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.contract_signed ? 'Contrato Assinado' : 'Contrato Pendente'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Criado em: {format(new Date(user.created_at), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar usuário"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openResetPasswordModal(user)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Redefinir senha"
                      >
                        <Key className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleResendEmail(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Reenviar email de confirmação com contrato NCNDA"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <Mail className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className={`${
                          user.is_admin ? 'text-purple-600 hover:text-purple-900' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title={user.is_admin ? 'Remover administrador' : 'Tornar administrador'}
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir usuário"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Adicionar Novo Usuário</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    required
                    minLength={6}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                  CPF
                </label>
                <input
                  type="text"
                  id="cpf"
                  value={newUserData.cpf}
                  onChange={(e) => setNewUserData({...newUserData, cpf: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  type="text"
                  id="phone"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="cep" className="block text-sm font-medium text-gray-700">
                  CEP
                </label>
                <input
                  type="text"
                  id="cep"
                  value={newUserData.cep}
                  onChange={(e) => setNewUserData({...newUserData, cep: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Endereço
                </label>
                <input
                  type="text"
                  id="address"
                  value={newUserData.address}
                  onChange={(e) => setNewUserData({...newUserData, address: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="passport_number" className="block text-sm font-medium text-gray-700">
                  Número do Passaporte
                </label>
                <input
                  type="text"
                  id="passport_number"
                  value={newUserData.passport_number}
                  onChange={(e) => setNewUserData({...newUserData, passport_number: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={newUserData.is_admin}
                  onChange={(e) => setNewUserData({...newUserData, is_admin: e.target.checked})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">
                  Administrador
                </label>
              </div>

              <div className="pt-5">
                <button
                  type="submit"
                  disabled={actionLoading === 'new'}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {actionLoading === 'new' ? (
                    <>
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      Adicionando...
                    </>
                  ) : (
                    'Adicionar Usuário'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Editar Usuário</h3>
              <button onClick={() => setShowEditUserModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="edit-email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="edit-cpf" className="block text-sm font-medium text-gray-700">
                  CPF
                </label>
                <input
                  type="text"
                  id="edit-cpf"
                  value={newUserData.cpf}
                  onChange={(e) => setNewUserData({...newUserData, cpf: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  type="text"
                  id="edit-phone"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="edit-cep" className="block text-sm font-medium text-gray-700">
                  CEP
                </label>
                <input
                  type="text"
                  id="edit-cep"
                  value={newUserData.cep}
                  onChange={(e) => setNewUserData({...newUserData, cep: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700">
                  Endereço
                </label>
                <input
                  type="text"
                  id="edit-address"
                  value={newUserData.address}
                  onChange={(e) => setNewUserData({...newUserData, address: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="edit-passport_number" className="block text-sm font-medium text-gray-700">
                  Número do Passaporte
                </label>
                <input
                  type="text"
                  id="edit-passport_number"
                  value={newUserData.passport_number}
                  onChange={(e) => setNewUserData({...newUserData, passport_number: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-is_admin"
                  checked={newUserData.is_admin}
                  onChange={(e) => setNewUserData({...newUserData, is_admin: e.target.checked})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-is_admin" className="ml-2 block text-sm text-gray-900">
                  Administrador
                </label>
              </div>

              <div className="pt-5">
                <button
                  type="submit"
                  disabled={actionLoading === selectedUser.id}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {actionLoading === selectedUser.id ? (
                    <>
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Redefinir Senha</h3>
              <button onClick={() => setShowResetPasswordModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-500">
              Redefinindo senha para: <span className="font-medium text-gray-700">{selectedUser.name}</span>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  Nova Senha
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="pt-5">
                <button
                  type="submit"
                  disabled={actionLoading === selectedUser.id}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {actionLoading === selectedUser.id ? (
                    <>
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      Redefinindo...
                    </>
                  ) : (
                    'Redefinir Senha'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}