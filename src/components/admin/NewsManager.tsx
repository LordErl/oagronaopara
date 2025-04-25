import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, X, Plus, Edit2, Globe, Calendar, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  original_title: string;
  original_content: string;
  source_url: string;
  source_name: string;
  image_url: string;
  published_at: string;
  translated_at: string;
  created_at: string;
  approved: boolean;
}

export default function NewsManager() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info' | null, text: string}>({type: null, text: ''});
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source_url: '',
    source_name: '',
    image_url: '',
  });
  const [newsFilter, setNewsFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const filteredNews = newsFilter === 'all'
    ? news
    : newsFilter === 'pending'
      ? news.filter(n => !n.approved)
      : news.filter(n => n.approved);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agro_news')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setErrorMessage('Erro ao carregar notícias');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNews(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('agro_news')
        .insert([{ ...formData, published_at: new Date().toISOString(), created_at: new Date().toISOString(), approved: false }])
        .select()
        .single();

      if (error) throw error;

      setNews([data, ...news]);
      setShowAddModal(false);
      setFormData({
        title: '',
        content: '',
        source_url: '',
        source_name: '',
        image_url: '',
      });
      setSuccessMessage('Notícia adicionada com sucesso!');
    } catch (err: any) {
      console.error('Error adding news:', err);
      setErrorMessage(err.message);
    }
  }

  async function handleEditNews(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNews) return;

    try {
      const { data, error } = await supabase
        .from('agro_news')
        .update(formData)
        .eq('id', selectedNews.id)
        .select()
        .single();

      if (error) throw error;

      setNews(news.map(n => n.id === selectedNews.id ? data : n));
      setShowEditModal(false);
      setSelectedNews(null);
      setSuccessMessage('Notícia atualizada com sucesso!');
    } catch (err: any) {
      console.error('Error updating news:', err);
      setErrorMessage(err.message);
    }
  }

  async function handleDeleteNews(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;

    try {
      const { error } = await supabase
        .from('agro_news')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNews(news.filter(n => n.id !== id));
      setSuccessMessage('Notícia excluída com sucesso!');
    } catch (err: any) {
      console.error('Error deleting news:', err);
      setErrorMessage(err.message);
    }
  }

  async function handleAutoFetchNews() {
    setLoading(true);
    setMessage({ type: 'info', text: 'Buscando notícias automaticamente...' });
    try {
      // Busca notícias via API própria (OpenAI)
      const res = await fetch('/api/fetch-news');
      if (!res.ok) throw new Error('Erro ao buscar notícias da OpenAI');
      // Opcional: pode retornar as notícias inseridas, mas vamos apenas recarregar
      await fetchNews();
      setMessage({ type: 'success', text: 'Notícias buscadas automaticamente com sucesso!' });
    } catch (error) {
      console.error('Erro ao buscar notícias automaticamente:', error);
      setMessage({ type: 'error', text: 'Erro ao buscar notícias automaticamente.' });
    } finally {
      setLoading(false);
    }
  };

  async function handleApproveNews(id: string) {
    try {
      const { data, error } = await supabase
        .from('agro_news')
        .update({ approved: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setNews(news.map(n => n.id === id ? { ...n, approved: true } : n));
      setSuccessMessage('Notícia aprovada com sucesso!');
    } catch (err: any) {
      setErrorMessage('Erro ao aprovar notícia: ' + err.message);
    }
  }

  function openEditModal(newsItem: NewsItem) {
    setSelectedNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      source_url: newsItem.source_url,
      source_name: newsItem.source_name,
      image_url: newsItem.image_url,
    });
    setShowEditModal(true);
  }

  const NewsModal = ({ onSubmit, isEdit = false }: { onSubmit: (e: React.FormEvent) => Promise<void>, isEdit: boolean }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {isEdit ? 'Editar Notícia' : 'Adicionar Nova Notícia'}
          </h3>
          <button
            onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Conteúdo
            </label>
            <textarea
              id="content"
              rows={5}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="source_url" className="block text-sm font-medium text-gray-700">
              URL da Fonte
            </label>
            <input
              type="url"
              id="source_url"
              value={formData.source_url}
              onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="source_name" className="block text-sm font-medium text-gray-700">
              Nome da Fonte
            </label>
            <input
              type="text"
              id="source_name"
              value={formData.source_name}
              onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
              URL da Imagem
            </label>
            <input
              type="url"
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {isEdit ? 'Salvar Alterações' : 'Adicionar Notícia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Gerenciar Notícias</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Notícia
          </button>
          <button
            onClick={handleAutoFetchNews}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            <Bot className="h-4 w-4 mr-2" />
            Buscar Notícias Automaticamente
          </button>
          <button
            onClick={fetchNews}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </button>
        </div>
      </div>
      {/* Filtros modernos */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setNewsFilter('all')} className={`px-3 py-1 rounded-full text-sm font-medium border ${newsFilter === 'all' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}>Todas</button>
        <button onClick={() => setNewsFilter('pending')} className={`px-3 py-1 rounded-full text-sm font-medium border ${newsFilter === 'pending' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300'}`}>Não aprovadas</button>
        <button onClick={() => setNewsFilter('approved')} className={`px-3 py-1 rounded-full text-sm font-medium border ${newsFilter === 'approved' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-300'}`}>Aprovadas</button>
      </div>

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

      {message.type && (
        <div className={`mb-4 p-4 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 
          message.type === 'error' ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'
        } rounded-md flex items-center justify-between`}>
          <div className="flex items-center">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : 
             message.type === 'error' ? <AlertTriangle className="h-5 w-5 mr-2" /> : 
             <RefreshCw className="h-5 w-5 mr-2" />}
            {message.text}
          </div>
          <button onClick={() => setMessage({type: null, text: ''})}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((item) => (
            <div key={item.id} className={`overflow-hidden shadow rounded-lg border transition-all duration-200 ${!item.approved ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white'}`}>
              <div className="relative h-48">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
                  }}
                />
                {!item.approved && (
                  <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded shadow">Aguardando aprovação</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                  {item.title}
                  {!item.approved && <span className="ml-2 inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold">Não aprovada</span>}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-3">{item.content}</p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Globe className="h-4 w-4 mr-1" />
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-green-600">
                    {item.source_name}
                  </a>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(item.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  {!item.approved && (
                    <button onClick={() => handleApproveNews(item.id)} className="text-white bg-green-600 hover:bg-green-700 border border-green-700 rounded px-3 py-1 text-xs font-semibold shadow">Aprovar</button>
                  )}
                  <button onClick={() => openEditModal(item)} className="text-indigo-600 hover:text-indigo-900 border border-indigo-600 rounded px-2 py-1 text-xs font-semibold">Editar</button>
                  <button onClick={() => handleDeleteNews(item.id)} className="text-white bg-red-600 hover:bg-red-700 border border-red-700 rounded px-2 py-1 text-xs font-semibold">Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAddModal && <NewsModal onSubmit={handleAddNews} isEdit={false} />}
      {showEditModal && <NewsModal onSubmit={handleEditNews} isEdit={true} />}
    </div>
  );
}