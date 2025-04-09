import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, X, Edit, Plus, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ContractTemplateEditor from './ContractTemplateEditor';

interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  is_active: boolean;
}

export default function ContractTemplateManager() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setErrorMessage('Erro ao carregar modelos de contrato. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleTemplateStatus(template: ContractTemplate) {
    try {
      const { error } = await supabase
        .from('contract_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      await fetchTemplates();
      setSuccessMessage(`Status do modelo "${template.name}" alterado com sucesso!`);
    } catch (error) {
      console.error('Error updating template:', error);
      setErrorMessage('Erro ao atualizar o status do modelo.');
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return;

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      await fetchTemplates();
      setSuccessMessage('Modelo excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting template:', error);
      setErrorMessage('Erro ao excluir o modelo.');
    }
  }

  function handleEditTemplate(id: string) {
    setEditingTemplateId(id);
    setShowEditor(true);
  }

  function handleCreateNewTemplate() {
    setEditingTemplateId(undefined);
    setShowEditor(true);
  }

  function handleEditorClose() {
    setShowEditor(false);
    setEditingTemplateId(undefined);
  }

  function handleEditorSave() {
    fetchTemplates();
    setShowEditor(false);
    setEditingTemplateId(undefined);
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Gerenciar Modelos de Contrato</h2>
      
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
      
      <div className="flex justify-between mb-6">
        <h3 className="text-md font-medium text-gray-900">Modelos de Contrato HTML</h3>
        <button
          onClick={handleCreateNewTemplate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Novo Modelo
        </button>
      </div>
      
      {/* HTML Templates Section */}
      <div className="mb-8">
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <RefreshCw className="h-6 w-6 text-green-500 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhum modelo HTML cadastrado.</p>
              <button
                onClick={handleCreateNewTemplate}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Modelo
              </button>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-500">
                    Status: {template.is_active ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditTemplate(template.id)}
                    className="px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleTemplateStatus(template)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      template.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {template.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contract Template Editor Modal */}
      {showEditor && (
        <ContractTemplateEditor
          onClose={handleEditorClose}
          onSave={handleEditorSave}
          templateId={editingTemplateId}
        />
      )}
    </div>
  );
}