import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupClick: () => void;
}

export default function LoginModal({ isOpen, onClose, onSignupClick }: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginAttempts >= 3) {
      setError('Muitas tentativas de login. Por favor, aguarde alguns minutos e tente novamente.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Trim whitespace from email
      const email = formData.email.trim().toLowerCase();
      
      // Attempt to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (signInError) {
        console.error('SignIn Error:', signInError);
        
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.');
        } else if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha inválidos');
        } else if (signInError.message.includes('rate_limit')) {
          setLoginAttempts(prev => prev + 1);
          throw new Error('Por favor, aguarde alguns minutos antes de tentar novamente.');
        } else {
          throw signInError;
        }
      }

      if (!data.user) {
        throw new Error('Erro ao fazer login. Por favor, tente novamente.');
      }

      // Check if user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        console.error('User data error:', userError);
        throw new Error('Erro ao recuperar dados do usuário');
      }

      // Reset attempts on successful login
      setLoginAttempts(0);
      onClose();
    } catch (err: any) {
      console.error('Error during login:', err);
      setError(err.message || 'Erro ao fazer login');
      setLoginAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Entrar</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {loginAttempts >= 3 && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
            Muitas tentativas de login. Por favor, aguarde alguns minutos antes de tentar novamente.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="current-password"
            />
          </div>

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading || loginAttempts >= 3}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={onSignupClick}
              className="w-full flex justify-center py-2 px-4 border border-green-600 rounded-md shadow-sm text-sm font-medium text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cadastrar Novo Parceiro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}