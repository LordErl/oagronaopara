import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, Activity, Settings, FileText, BarChart, Database, Mail, FileImage, Globe, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ContractTemplateManager from './ContractTemplateManager';
import OffersManager from './OffersManager';
import UserManager from './UserManager';
import SettingsManager from './SettingsManager';
import EmailLogsViewer from './EmailLogsViewer';
import AdminPassportUpload from './AdminPassportUpload';
import ContractManager from './ContractManager';
import NewsManager from './NewsManager';
import QuotesManager from './QuotesManager';

interface Stats {
  totalUsers: number;
  totalOffers: number;
  activeOffers: number;
  pendingContracts: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOffers: 0,
    activeOffers: 0,
    pendingContracts: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'contracts' | 'contract-templates' | 'offers' | 'users' | 'settings' | 'emails' | 'passport' | 'news' | 'quotes'>('overview');

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    fetchStats();
  }, []);

  async function checkAdminStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data || !data.is_admin) {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      window.location.href = '/';
    }
  }

  async function fetchStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [
        { count: usersCount }, 
        { count: offersCount }, 
        { count: activeOffersCount },
        { count: pendingContractsCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('offers').select('*', { count: 'exact', head: true }),
        supabase.from('offers').select('*', { 
          count: 'exact',
          head: true,
          filter: (query) => query.gte('valid_until', today)
        }),
        supabase.from('contracts').select('*', {
          count: 'exact',
          head: true,
          filter: (query) => query.eq('partner_accepted', true).eq('admin_validated', false)
        })
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalOffers: offersCount || 0,
        activeOffers: activeOffersCount || 0,
        pendingContracts: pendingContractsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-semibold text-gray-900">Dashboard Administrativo</h1>
            <p className="mt-2 text-sm text-gray-700">
              Visão geral das métricas e atividades da plataforma.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveSection('overview')}
              className={`${
                activeSection === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveSection('users')}
              className={`${
                activeSection === 'users'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Gerenciar Usuários
            </button>
            <button
              onClick={() => setActiveSection('offers')}
              className={`${
                activeSection === 'offers'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Gerenciar Ofertas
            </button>
            <button
              onClick={() => setActiveSection('contracts')}
              className={`${
                activeSection === 'contracts'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative`}
            >
              Gerenciar Contratos
              {stats.pendingContracts > 0 && (
                <span className="absolute top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {stats.pendingContracts}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSection('contract-templates')}
              className={`${
                activeSection === 'contract-templates'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Modelos de Contrato
            </button>
            <button
              onClick={() => setActiveSection('news')}
              className={`${
                activeSection === 'news'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Gerenciar Notícias
            </button>
            <button
              onClick={() => setActiveSection('quotes')}
              className={`${
                activeSection === 'quotes'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Gerenciar Cotações
            </button>
            <button
              onClick={() => setActiveSection('passport')}
              className={`${
                activeSection === 'passport'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Passaporte Admin
            </button>
            <button
              onClick={() => setActiveSection('emails')}
              className={`${
                activeSection === 'emails'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Logs de Email
            </button>
            <button
              onClick={() => setActiveSection('settings')}
              className={`${
                activeSection === 'settings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Configurações
            </button>
          </nav>
        </div>

        {activeSection === 'overview' ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Stats Cards */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total de Usuários</dt>
                        <dd className="text-lg font-semibold text-gray-900">{loading ? '...' : stats.totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShoppingBag className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total de Ofertas</dt>
                        <dd className="text-lg font-semibold text-gray-900">{loading ? '...' : stats.totalOffers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Ofertas Ativas</dt>
                        <dd className="text-lg font-semibold text-gray-900">{loading ? '...' : stats.activeOffers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Contratos Pendentes</dt>
                        <dd className={`text-lg font-semibold ${stats.pendingContracts > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {loading ? '...' : stats.pendingContracts}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Ações Rápidas</h3>
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setActiveSection('news')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Gerenciar Notícias
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('quotes')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Gerenciar Cotações
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('contracts')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Gerenciar Contratos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : activeSection === 'contract-templates' ? (
          <div className="mt-8">
            <ContractTemplateManager />
          </div>
        ) : activeSection === 'contracts' ? (
          <div className="mt-8">
            <ContractManager />
          </div>
        ) : activeSection === 'offers' ? (
          <div className="mt-8">
            <OffersManager />
          </div>
        ) : activeSection === 'users' ? (
          <div className="mt-8">
            <UserManager />
          </div>
        ) : activeSection === 'emails' ? (
          <div className="mt-8">
            <EmailLogsViewer />
          </div>
        ) : activeSection === 'passport' ? (
          <div className="mt-8">
            <AdminPassportUpload />
          </div>
        ) : activeSection === 'news' ? (
          <div className="mt-8">
            <NewsManager />
          </div>
        ) : activeSection === 'quotes' ? (
          <div className="mt-8">
            <QuotesManager />
          </div>
        ) : (
          <div className="mt-8">
            <SettingsManager />
          </div>
        )}
      </div>
    </div>
  );
}