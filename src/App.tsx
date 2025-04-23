import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import News from './components/News';
import Commodities from './components/Commodities';
import CreateOffer from './components/offers/CreateOffer';
import OffersMarketplace from './components/offers/OffersMarketplace';
import Dashboard from './components/admin/Dashboard';
import LoginModal from './components/auth/LoginModal';
import SignupModal from './components/auth/SignupModal';
import EmailConfirmation from './components/auth/EmailConfirmation';
import ContractReview from './components/ContractReview';
import { useLanguage } from './contexts/LanguageContext';

// Wrapper component to get URL parameters
function EmailConfirmationWrapper() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email') || undefined;
  
  return <EmailConfirmation email={email} />;
}

function App() {
  const { t } = useLanguage();
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showOffersMarketplace, setShowOffersMarketplace] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows are returned

      if (!error && data) {
        setIsAdmin(data.is_admin || false);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  }

  const handleGetStartedClick = () => {
    // Se o usuário não estiver logado, mostra o modal de login
    if (!user) {
      setShowLoginModal(true);
    } else {
      // Se estiver logado, vai direto para criar oferta
      setShowCreateOffer(true);
      setShowOffersMarketplace(false);
    }
  };

  const handleSignupClick = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleLoginClick = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  const handleViewOffersClick = () => {
    setShowOffersMarketplace(true);
    setShowCreateOffer(false);
  };

  const handleHomeClick = () => {
    setShowOffersMarketplace(false);
    setShowCreateOffer(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar 
          onCreateOfferClick={() => {
            setShowCreateOffer(true);
            setShowOffersMarketplace(false);
          }}
          onViewOffersClick={handleViewOffersClick}
          onHomeClick={handleHomeClick}
        />
        
        <div className="pt-16">
          <Routes>
            <Route path="/" element={
              <>
                {!showCreateOffer && !showOffersMarketplace && (
                  <>
                    <Hero onGetStartedClick={handleGetStartedClick} />
                    <Features />
                    <div id="commodities">
                      <Commodities />
                    </div>
                    <div id="news">
                      <News />
                    </div>
                  </>
                )}
                {showCreateOffer && <CreateOffer onClose={handleHomeClick} />}
                {showOffersMarketplace && <OffersMarketplace onClose={handleHomeClick} />}
              </>
            } />
            <Route 
              path="/admin" 
              element={
                isAdmin ? <Dashboard /> : <Navigate to="/" />
              } 
            />
            <Route path="/confirm" element={<EmailConfirmationWrapper />} />
            <Route path="/contract/:id" element={<ContractReview />} />
          </Routes>
        </div>
        
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">{t.aboutUs || 'Sobre Nós'}</h3>
                <p className="text-gray-300">
                  {t.footerAboutText || 'O Agro Não Para é uma plataforma B2B para comércio exterior de grãos, conectando produtores e compradores de forma segura e eficiente.'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">{t.contactUs || 'Contato'}</h3>
                <p className="text-gray-300">Email: contato@oagronaopara.tec.br</p>
                <p className="text-gray-300">{t.phone || 'Telefone'}: +55 63 99133-8936</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">{t.followUs || 'Siga-nos'}</h3>
                <div className="flex space-x-4">
                  <a href="https://instagram.com/oagronaoparabr" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                    Instagram
                  </a>
                  <a href="https://wa.me/5563991338936" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-700 pt-8 text-center">
              <p className="text-gray-300">
                &copy; {new Date().getFullYear()} O Agro Não Para. {t.allRightsReserved || 'Todos os direitos reservados.'}
              </p>
            </div>
          </div>
        </footer>
        
        <LoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSignupClick={handleSignupClick}
        />

        <SignupModal 
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onLoginClick={handleLoginClick}
        />
      </div>
    </Router>
  );
}

export default App;