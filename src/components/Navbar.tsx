import { useState, useEffect } from 'react';
import { Leaf, Menu, X, Instagram, MessageCircle, Plus, Settings, ShoppingBag, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SignupModal from './auth/SignupModal';
import LoginModal from './auth/LoginModal';
import { useLanguage } from '../contexts/LanguageContext';

interface NavbarProps {
  onCreateOfferClick: () => void;
  onViewOffersClick: () => void;
  onHomeClick: () => void;
}

export default function Navbar({ onCreateOfferClick, onViewOffersClick, onHomeClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { language, t, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

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
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }

      setIsAdmin(data?.is_admin || false);
    } catch (err) {
      console.error('Error in checkAdminStatus:', err);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    onHomeClick();
  };

  const handleAuthClick = () => {
    if (user) {
      handleLogout();
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const scrollToSection = (id: string) => {
    // First go to home page if not already there
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // If already on home page, just scroll and reset view states
      onHomeClick();
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleSignupClick = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(true);
  };

  const handleLoginClick = () => {
    setIsSignupModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleHomeClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    onHomeClick();
  };

  const handleAdminClick = () => {
    navigate('/admin');
    setIsOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-lg fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button onClick={handleHomeClick} className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Leaf className="h-5 w-5 text-white transform rotate-45" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-800">oagronaopara.tec.br</span>
              </button>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={handleHomeClick} className="text-gray-600 hover:text-green-600">{t.home}</button>
              {user && (
                <>
                  <button 
                    onClick={onCreateOfferClick}
                    className="text-gray-600 hover:text-green-600 flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.newOffer}</span>
                  </button>
                  <button 
                    onClick={onViewOffersClick}
                    className="text-gray-600 hover:text-green-600 flex items-center space-x-1"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>{t.viewOffers}</span>
                  </button>
                </>
              )}
              <button
                onClick={() => scrollToSection('commodities')}
                className="text-gray-600 hover:text-green-600"
              >
                {t.quotes}
              </button>
              <button
                onClick={() => scrollToSection('news')}
                className="text-gray-600 hover:text-green-600"
              >
                {t.news}
              </button>
              {isAdmin && (
                <button
                  onClick={handleAdminClick}
                  className="text-gray-600 hover:text-green-600 flex items-center space-x-1"
                >
                  <Settings className="h-4 w-4" />
                  <span>{t.admin}</span>
                </button>
              )}
              <div className="flex items-center space-x-4">
                <a 
                  href="https://instagram.com/oagronaoparabr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-pink-600 transition-colors"
                  title="Siga-nos no Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://wa.me/5563991338936" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                  title="Fale conosco no WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
                <button
                  onClick={toggleLanguage}
                  className="text-gray-600 hover:text-blue-600 flex items-center space-x-1"
                  title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
                >
                  <Globe className="h-4 w-4" />
                  <span>{t.language}</span>
                </button>
              </div>
              <button 
                onClick={handleAuthClick}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                {user ? t.logout : t.login}
              </button>
            </div>

            <div className="md:hidden flex items-center space-x-4">
              <a 
                href="https://instagram.com/oagronaoparabr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-pink-600 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://wa.me/5563991338936" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <button
                onClick={toggleLanguage}
                className="text-gray-600 hover:text-blue-600"
                title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
              >
                <Globe className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => {
                handleHomeClick();
                setIsOpen(false);
              }} className="block w-full text-left px-3 py-2 text-gray-600 hover:text-green-600">{t.home}</button>
              {user && (
                <>
                  <button
                    onClick={() => {
                      onCreateOfferClick();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-600 hover:text-green-600 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.newOffer}</span>
                  </button>
                  <button
                    onClick={() => {
                      onViewOffersClick();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-600 hover:text-green-600 flex items-center space-x-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>{t.viewOffers}</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  scrollToSection('commodities');
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-green-600"
              >
                {t.quotes}
              </button>
              <button
                onClick={() => {
                  scrollToSection('news');
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-600 hover:text-green-600"
              >
                {t.news}
              </button>
              {isAdmin && (
                <button
                  onClick={handleAdminClick}
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-green-600 flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>{t.admin}</span>
                </button>
              )}
              <button 
                onClick={() => {
                  handleAuthClick();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {user ? t.logout : t.login}
              </button>
            </div>
          </div>
        )}
      </nav>

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSignupClick={handleSignupClick}
      />

      <SignupModal 
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onLoginClick={handleLoginClick}
      />
    </>
  );
}