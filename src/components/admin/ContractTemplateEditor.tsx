import React, { useState, useEffect } from 'react';
import { Save, X, RefreshCw, AlertTriangle, CheckCircle, Eye, Code } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContractTemplateEditorProps {
  templateId?: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ContractTemplateEditor({ templateId, onClose, onSave }: ContractTemplateEditorProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    } else {
      // Set default template content for new templates
      setContent(`
CONTRATO DE PARCERIA COMERCIAL

Pelo presente instrumento particular, de um lado:

[NOME_COMPLETO], portador do CPF nº [CPF] e Passaporte nº [PASSAPORTE], residente e domiciliado no endereço cadastrado em nosso sistema, e-mail: [EMAIL], doravante denominado PARCEIRO;

E de outro lado:

O AGRO NÃO PARA TECNOLOGIA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº XX.XXX.XXX/0001-XX, com sede na Avenida Tocantins, 1000, Palmas/TO, doravante denominada EMPRESA;

Têm entre si justo e acordado o presente Contrato de Parceria Comercial, que se regerá pelas seguintes cláusulas e condições:

1. OBJETO
1.1. O presente contrato tem por objeto estabelecer as condições gerais para a parceria comercial entre as partes.
1.2. O PARCEIRO compromete-se a manter sigilo sobre todas as informações comerciais obtidas através da plataforma.

2. CONFIDENCIALIDADE
2.1. As partes se comprometem a manter em sigilo todas as informações confidenciais a que tiverem acesso.
2.2. São consideradas informações confidenciais todas aquelas obtidas através da plataforma, incluindo, mas não se limitando a: preços, volumes, condições comerciais, dados de contato e estratégias de negócio.

3. NÃO CIRCUNVENÇÃO
3.1. O PARCEIRO compromete-se a não circunvencionar a EMPRESA em nenhuma negociação iniciada através da plataforma.
3.2. Entende-se por circunvenção qualquer tentativa de contato direto com outros parceiros da plataforma sem a intermediação da EMPRESA.

4. VIGÊNCIA
4.1. O presente contrato tem vigência de 24 (vinte e quatro) meses a partir da data de sua assinatura.
4.2. Após este período, o contrato será renovado automaticamente por períodos iguais e sucessivos, salvo manifestação contrária de qualquer das partes.

5. PENALIDADES
5.1. O descumprimento de qualquer cláusula deste contrato implicará em multa equivalente a USD 50.000,00 (cinquenta mil dólares americanos), sem prejuízo de outras medidas legais cabíveis.

6. FORO
6.1. As partes elegem o foro da Comarca de Palmas/TO para dirimir quaisquer dúvidas oriundas do presente contrato.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.

Local e Data: [DATA_ATUAL]

_____________________________
[NOME_COMPLETO]
CPF: [CPF]
Passaporte: [PASSAPORTE]

_____________________________
O AGRO NÃO PARA TECNOLOGIA LTDA
CNPJ: XX.XXX.XXX/0001-XX

[ESPAÇO PARA IMAGEM DO PASSAPORTE_PARCEIRO]

[ESPAÇO PARA IMAGEM DO PASSAPORTE_AGRO]
      `);
      setName('Novo Modelo de Contrato');
    }
  }, [templateId]);

  async function fetchTemplate() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      
      if (data) {
        setName(data.name);
        setContent(data.content);
        setIsActive(data.is_active);
      }
    } catch (err) {
      console.error('Error fetching template:', err);
      setError('Erro ao carregar modelo de contrato');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('O nome do modelo é obrigatório');
      return;
    }

    if (!content.trim()) {
      setError('O conteúdo do modelo é obrigatório');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (templateId) {
        // Update existing template
        const { error } = await supabase
          .from('contract_templates')
          .update({
            name,
            content,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', templateId);

        if (error) throw error;
        
        setSuccessMessage('Modelo atualizado com sucesso!');
      } else {
        // Create new template
        const { error } = await supabase
          .from('contract_templates')
          .insert([{
            name,
            content,
            is_active: isActive,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
        
        setSuccessMessage('Novo modelo criado com sucesso!');
      }

      // Wait a moment to show success message before closing
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(`Erro ao salvar modelo: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  // Function to toggle preview mode
  const togglePreview = () => {
    setShowPreview(!showPreview);
    setShowHtmlEditor(false);
  };

  // Function to toggle HTML editor mode
  const toggleHtmlEditor = () => {
    setShowHtmlEditor(!showHtmlEditor);
    setShowPreview(false);
  };

  // Function to render the preview with sample data
  const renderPreview = () => {
    // Replace variables with sample data for preview
    let previewContent = content
      .replace(/\[NOME_COMPLETO\]/g, 'João da Silva')
      .replace(/\[CPF\]/g, '123.456.789-00')
      .replace(/\[PASSAPORTE\]/g, 'AB123456')
      .replace(/\[EMAIL\]/g, 'joao.silva@exemplo.com')
      .replace(/\[DATA_ATUAL\]/g, new Date().toLocaleDateString('pt-BR'));

    // Add watermark and styling
    return `
      <div style="position: relative; font-family: Arial, sans-serif; line-height: 1.5; color: #333; padding: 20px;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(34, 197, 94, 0.05); z-index: -1; pointer-events: none;">
          O AGRO NÃO PARA
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #22c55e, #3b82f6); width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);">
              <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
              <path d="M12 17V4"></path>
              <path d="M8 9l4-4 4 4"></path>
            </svg>
          </div>
          <h1 style="margin-top: 15px; color: #333; font-size: 24px;">O AGRO NÃO PARA</h1>
        </div>
        ${previewContent}
      </div>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-gray-900">
            {templateId ? 'Editar Modelo de Contrato' : 'Criar Novo Modelo de Contrato'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
          </div>
        ) : (
          <div className="flex-grow flex flex-col overflow-hidden">
            <div className="mb-4 flex justify-between items-center">
              <div className="w-1/2 pr-2">
                <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Modelo
                </label>
                <input
                  type="text"
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Nome do modelo de contrato"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label htmlFor="template-active" className="flex items-center">
                  <input
                    type="checkbox"
                    id="template-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Modelo ativo</span>
                </label>
                <button
                  onClick={toggleHtmlEditor}
                  className={`inline-flex items-center px-3 py-2 border ${showHtmlEditor ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'} shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                >
                  <Code className="h-4 w-4 mr-1" />
                  Editar HTML
                </button>
                <button
                  onClick={togglePreview}
                  className={`inline-flex items-center px-3 py-2 border ${showPreview ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'} shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Visualizar
                </button>
              </div>
            </div>

            <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
              {showPreview ? (
                <div className="flex-grow border border-gray-300 rounded-md overflow-auto p-4 bg-white">
                  <div 
                    dangerouslySetInnerHTML={{ __html: renderPreview() }} 
                    className="min-h-full"
                  />
                </div>
              ) : showHtmlEditor ? (
                <div className="flex-grow flex flex-col overflow-hidden">
                  <label htmlFor="template-html" className="block text-sm font-medium text-gray-700 mb-1">
                    Código HTML do Modelo
                  </label>
                  <div className="flex-grow relative border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                    <textarea
                      id="template-html"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="absolute inset-0 w-full h-full px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                      placeholder="Código HTML do modelo de contrato"
                      style={{ resize: 'none' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex flex-col overflow-hidden">
                  <label htmlFor="template-content" className="block text-sm font-medium text-gray-700 mb-1">
                    Conteúdo do Modelo
                  </label>
                  <div className="flex-grow relative border border-gray-300 rounded-md overflow-hidden">
                    <textarea
                      id="template-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="absolute inset-0 w-full h-full px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                      placeholder="Conteúdo do modelo de contrato"
                      style={{ resize: 'none' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Variáveis disponíveis:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                  <code>[NOME_COMPLETO]</code> - Nome do parceiro
                </div>
                <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                  <code>[CPF]</code> - CPF do parceiro
                </div>
                <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                  <code>[PASSAPORTE]</code> - Número do passaporte
                </div>
                <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                  <code>[EMAIL]</code> - Email do parceiro
                </div>
                <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                  <code>[DATA_ATUAL]</code> - Data atual formatada
                </div>
                <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                  <code>[ESPAÇO PARA IMAGEM DO PASSAPORTE_PARCEIRO]</code> - Imagem do passaporte do parceiro
                </div>
                <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                  <code>[ESPAÇO PARA IMAGEM DO PASSAPORTE_AGRO]</code> - Imagem do passaporte do administrador
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="-ml-1 mr-2 h-4 w-4" />
                Salvar Modelo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}