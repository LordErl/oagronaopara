import React, { useState, useEffect } from 'react';
import { Save, Trash2, RefreshCw, Plus, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { deleteExpiredOffers } from '../../lib/api';

interface SettingItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
}

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description: string;
}

type SettingCategory = 'commodities' | 'incoterms' | 'currencies' | 'packaging' | 'units';

export default function SettingsManager() {
  const [activeTab, setActiveTab] = useState<SettingCategory>('commodities');
  const [items, setItems] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<Omit<SettingItem, 'id'>>({
    name: '',
    code: '',
    description: '',
    is_active: true
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // System settings
  const [autoDeleteExpired, setAutoDeleteExpired] = useState(false);
  const [autoDeleteDays, setAutoDeleteDays] = useState(7);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchItems(activeTab);
    fetchSystemSettings();
  }, [activeTab]);

  async function fetchItems(category: SettingCategory) {
    setLoading(true);
    try {
      let table = '';
      
      switch(category) {
        case 'commodities':
          table = 'system_commodities';
          break;
        case 'incoterms':
          table = 'system_incoterms';
          break;
        case 'currencies':
          table = 'system_currencies';
          break;
        case 'packaging':
          table = 'system_packaging';
          break;
        case 'units':
          table = 'system_units';
          break;
      }
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setErrorMessage(`Erro ao carregar ${getTabName(activeTab)}. Por favor, tente novamente.`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSystemSettings() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      
      if (data) {
        const autoDeleteSetting = data.find(s => s.key === 'auto_delete_expired');
        const autoDeleteDaysSetting = data.find(s => s.key === 'auto_delete_days');
        
        if (autoDeleteSetting) {
          setAutoDeleteExpired(autoDeleteSetting.value === 'true');
        }
        
        if (autoDeleteDaysSetting) {
          setAutoDeleteDays(parseInt(autoDeleteDaysSetting.value) || 7);
        }
      }
    } catch (err) {
      console.error('Error fetching system settings:', err);
    }
  }

  async function handleAddItem() {
    setActionLoading(0);
    try {
      let table = '';
      
      switch(activeTab) {
        case 'commodities':
          table = 'system_commodities';
          break;
        case 'incoterms':
          table = 'system_incoterms';
          break;
        case 'currencies':
          table = 'system_currencies';
          break;
        case 'packaging':
          table = 'system_packaging';
          break;
        case 'units':
          table = 'system_units';
          break;
      }
      
      const { data, error } = await supabase
        .from(table)
        .insert([newItem])
        .select();

      if (error) throw error;
      
      setItems([...items, data[0]]);
      setNewItem({
        name: '',
        code: '',
        description: '',
        is_active: true
      });
      setShowAddModal(false);
      setSuccessMessage(`${getTabName(activeTab, true)} adicionado com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error(`Error adding ${activeTab}:`, err);
      setErrorMessage(`Erro ao adicionar ${getTabName(activeTab, true)}: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleActive(item: SettingItem) {
    setActionLoading(item.id);
    try {
      let table = '';
      
      switch(activeTab) {
        case 'commodities':
          table = 'system_commodities';
          break;
        case 'incoterms':
          table = 'system_incoterms';
          break;
        case 'currencies':
          table = 'system_currencies';
          break;
        case 'packaging':
          table = 'system_packaging';
          break;
        case 'units':
          table = 'system_units';
          break;
      }
      
      const { error } = await supabase
        .from(table)
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      
      setItems(items.map(i => i.id === item.id ? { ...i, is_active: !item.is_active } : i));
      setSuccessMessage(`${getTabName(activeTab, true)} ${!item.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error(`Error toggling ${activeTab} status:`, err);
      setErrorMessage(`Erro ao alterar status: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteItem(item: SettingItem) {
    if (!confirm(`Tem certeza que deseja excluir "${item.name}"? Esta ação não pode ser desfeita.`)) return;
    
    setActionLoading(item.id);
    try {
      let table = '';
      
      switch(activeTab) {
        case 'commodities':
          table = 'system_commodities';
          break;
        case 'incoterms':
          table = 'system_incoterms';
          break;
        case 'currencies':
          table = 'system_currencies';
          break;
        case 'packaging':
          table = 'system_packaging';
          break;
        case 'units':
          table = 'system_units';
          break;
      }
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      
      setItems(items.filter(i => i.id !== item.id));
      setSuccessMessage(`${getTabName(activeTab, true)} excluído com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error(`Error deleting ${activeTab}:`, err);
      setErrorMessage(`Erro ao excluir: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveSystemSettings() {
    setSavingSettings(true);
    try {
      // Update auto delete expired setting
      const { error: error1 } = await supabase
        .from('system_settings')
        .upsert([
          {
            key: 'auto_delete_expired',
            value: autoDeleteExpired.toString(),
            description: 'Automatically delete expired offers'
          }
        ]);

      if (error1) throw error1;
      
      // Update auto delete days setting
      const { error: error2 } = await supabase
        .from('system_settings')
        .upsert([
          {
            key: 'auto_delete_days',
            value: autoDeleteDays.toString(),
            description: 'Number of days after expiration to delete offers'
          }
        ]);

      if (error2) throw error2;
      
      setSuccessMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving system settings:', err);
      setErrorMessage(`Erro ao salvar configurações: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleManualDeleteExpired() {
    if (!confirm('Tem certeza que deseja excluir todas as ofertas expiradas? Esta ação não pode ser desfeita.')) return;
    
    setSavingSettings(true);
    try {
      await deleteExpiredOffers();
      setSuccessMessage('Ofertas expiradas excluídas com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting expired offers:', err);
      setErrorMessage(`Erro ao excluir ofertas expiradas: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSavingSettings(false);
    }
  }

  function getTabName(tab: SettingCategory, singular: boolean = false): string {
    switch(tab) {
      case 'commodities':
        return singular ? 'Commodity' : 'Commodities';
      case 'incoterms':
        return singular ? 'Incoterm' : 'Incoterms';
      case 'currencies':
        return singular ? 'Moeda' : 'Moedas';
      case 'packaging':
        return singular ? 'Tipo de Embalagem' : 'Tipos de Embalagem';
      case 'units':
        return singular ? 'Unidade de Medida' : 'Unidades de Medida';
      default:
        return '';
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6 pt-4">
          <button
            onClick={() => setActiveTab('commodities')}
            className={`${
              activeTab === 'commodities'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Commodities
          </button>
          <button
            onClick={() => setActiveTab('incoterms')}
            className={`${
              activeTab === 'incoterms'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Incoterms
          </button>
          <button
            onClick={() => setActiveTab('currencies')}
            className={`${
              activeTab === 'currencies'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Moedas
          </button>
          <button
            onClick={() => setActiveTab('packaging')}
            className={`${
              activeTab === 'packaging'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Embalagens
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`${
              activeTab === 'units'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Unidades
          </button>
        </nav>
      </div>

      <div className="p-6">
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
          <h2 className="text-lg font-medium text-gray-900">Gerenciar {getTabName(activeTab)}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar {getTabName(activeTab, true)}
            </button>
            <button
              onClick={() => fetchItems(activeTab)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum item cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  {activeTab !== 'commodities' && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
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
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    {activeTab !== 'commodities' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.code}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`${
                            item.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                          title={item.is_active ? 'Desativar' : 'Ativar'}
                          disabled={actionLoading === item.id}
                        >
                          {actionLoading === item.id ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <span>{item.is_active ? 'Desativar' : 'Ativar'}</span>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                          disabled={actionLoading === item.id}
                        >
                          {actionLoading === item.id ? (
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

        {/* System Settings Section */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Configurações do Sistema</h2>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-md font-medium text-gray-900 mb-4">Gerenciamento de Ofertas Expiradas</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-delete"
                  checked={autoDeleteExpired}
                  onChange={(e) => setAutoDeleteExpired(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="auto-delete" className="ml-2 block text-sm text-gray-900">
                  Excluir automaticamente ofertas expiradas
                </label>
              </div>
              
              {autoDeleteExpired && (
                <div className="ml-6">
                  <label htmlFor="auto-delete-days" className="block text-sm font-medium text-gray-700">
                    Excluir ofertas após quantos dias de expiração:
                  </label>
                  <input
                    type="number"
                    id="auto-delete-days"
                    min="1"
                    max="90"
                    value={autoDeleteDays}
                    onChange={(e) => setAutoDeleteDays(parseInt(e.target.value))}
                    className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              )}
              
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleSaveSystemSettings}
                  disabled={savingSettings}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleManualDeleteExpired}
                  disabled={savingSettings}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Ofertas Expiradas Agora
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Adicionar {getTabName(activeTab, true)}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddItem(); }} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              {activeTab !== 'commodities' && (
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                    Código
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={newItem.code || ''}
                    onChange={(e) => setNewItem({...newItem, code: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newItem.is_active}
                  onChange={(e) => setNewItem({...newItem, is_active: e.target.checked})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Ativo
                </label>
              </div>

              <div className="pt-5">
                <button
                  type="submit"
                  disabled={actionLoading === 0}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {actionLoading === 0 ? (
                    <>
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      Adicionando...
                    </>
                  ) : (
                    'Adicionar'
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