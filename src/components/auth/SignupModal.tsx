import React, { useState, useRef } from 'react';
import { X, Upload, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { generateContract } from '../../lib/contractService';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

export default function SignupModal({ isOpen, onClose, onLoginClick }: SignupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    cep: '',
    address: '',
    passportNumber: '',
  });
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupAttempts, setSignupAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const cpfInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cpf') {
      const numbers = value.replace(/\D/g, '');
      let formattedCpf = numbers;
      if (numbers.length > 3) formattedCpf = numbers.replace(/(\d{3})/, '$1.');
      if (numbers.length > 6) formattedCpf = formattedCpf.replace(/(\d{3}\.)(\d{3})/, '$1$2.');
      if (numbers.length > 9) formattedCpf = formattedCpf.replace(/(\d{3}\.\d{3}\.)(\d{3})/, '$1$2-');
      setFormData((prev) => ({ ...prev, cpf: formattedCpf }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileError('Por favor, selecione um arquivo');
      return;
    }
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setFileError('Por favor, envie um arquivo JPG, PNG ou PDF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('O arquivo deve ter no máximo 5MB');
      return;
    }
    setFileError('');
    setPassportFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupAttempts >= 3) {
      setError('Muitas tentativas de cadastro. Por favor, aguarde alguns minutos e tente novamente.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!passportFile) throw new Error('Por favor, faça o upload do seu passaporte');

      // Check for existing users
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email, cpf')
        .or(`email.eq.${formData.email},cpf.eq.${formData.cpf.replace(/\D/g, '')}`);

      if (checkError) throw checkError;
      if (existingUsers?.length > 0) throw new Error('Email ou CPF já cadastrado');

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name } },
      });

      if (authError || !authData.user) throw new Error('Erro ao criar usuário');

      // Upload passport
      const fileName = `${authData.user.id}/${Date.now()}.${passportFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('passport_documents')
        .upload(fileName, passportFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl: passportUrl } } = supabase.storage
        .from('passport_documents')
        .getPublicUrl(fileName);

      // Create user profile
      const userData = {
        id: authData.user.id,
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone,
        cep: formData.cep,
        address: formData.address,
        passport_number: formData.passportNumber,
        passport_url: passportUrl,
        is_admin: false,
        contract_signed: false,
      };

      const { error: userError } = await supabase.from('users').insert([userData]);
      if (userError) throw userError;

      // Generate initial contract content
      const contractContent = await generateContract(userData);

      // Create contract record
      const { error: contractError } = await supabase
        .from('contracts')
        .insert([{
          user_id: authData.user.id,
          contract_url: '',
          partner_accepted: false,
          admin_validated: false,
          email_sent: false,
          created_at: new Date().toISOString()
        }]);

      if (contractError) throw contractError;

      // Send welcome email
      const emailData = {
        to: userData.email,
        subject: 'Bem-vindo ao O Agro Não Para - Confirme seu Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #166534;">Bem-vindo ao O Agro Não Para!</h1>
            
            <p>Olá ${userData.name},</p>
            
            <p>Obrigado por se cadastrar em nossa plataforma. Seu cadastro está em análise pela nossa equipe de compliance.</p>
            
            <p><strong>Próximos passos:</strong></p>
            <ol>
              <li>Confirme seu email clicando no link abaixo</li>
              <li>Aguarde a análise dos seus documentos pela nossa equipe</li>
              <li>Você receberá o contrato NCNDA por email para assinatura digital</li>
              <li>Após enviar o contrato assinado, seu cadastro será ativado</li>
            </ol>
            
            <p>
              <a href="${window.location.origin}/confirm-email?email=${encodeURIComponent(userData.email)}"
                 style="background-color: #166534; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Confirmar Email
              </a>
            </p>
            
            <p style="margin-top: 20px; color: #666;">
              Atenciosamente,<br>
              Equipe O Agro Não Para
            </p>
          </div>
        `
      };

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Continue even if email fails
      }

      // Log the email
      await supabase.from('email_logs').insert([{
        recipient: userData.email,
        subject: emailData.subject,
        success: true,
        sent_at: new Date().toISOString()
      }]);

      onClose();
      navigate('/confirm-email?email=' + encodeURIComponent(userData.email));
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setError(err.message || 'Erro ao realizar cadastro.');
      setSignupAttempts((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cadastro de Novo Parceiro</h2>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        {signupAttempts >= 3 && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
            Muitas tentativas de cadastro. Por favor, aguarde alguns minutos antes de tentar novamente.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input type="text" id="name" name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" value={formData.name} onChange={handleInputChange} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" name="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" value={formData.email} onChange={handleInputChange} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <div className="mt-1 relative">
              <input type={showPassword ? 'text' : 'password'} id="password" name="password" required minLength={6} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 pr-10" value={formData.password} onChange={handleInputChange} />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
            <input ref={cpfInputRef} type="text" id="cpf" name="cpf" required maxLength={14} placeholder="000.000.000-00" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" value={formData.cpf} onChange={handleInputChange} />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
            <input type="tel" id="phone" name="phone" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" value={formData.phone} onChange={handleInputChange} />
          </div>
          <div>
            <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
            <input type="text" id="cep" name="cep" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" value={formData.cep} onChange={handleInputChange} />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço Completo</label>
            <input type="text" id="address" name="address" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" value={formData.address} onChange={handleInputChange} />
          </div>
          <div>
            <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700">Número do Passaporte</label>
            <input type="text" id="passportNumber" name="passportNumber" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" value={formData.passportNumber} onChange={handleInputChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload do Passaporte</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="passport-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                    <span>Fazer upload do arquivo</span>
                    <input id="passport-upload" name="passport-upload" type="file" className="sr-only" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} required />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG ou PDF até 5MB</p>
                {passportFile && <p className="text-sm text-green-600">Arquivo selecionado: {passportFile.name}</p>}
                {fileError && <p className="text-sm text-red-600">{fileError}</p>}
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <button type="submit" disabled={loading || signupAttempts >= 3} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
            <button type="button" onClick={onLoginClick} className="w-full flex justify-center py-2 px-4 border border-green-600 rounded-md shadow-sm text-sm font-medium text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Já tem uma conta? Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}