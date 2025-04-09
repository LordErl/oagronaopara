import React, { useState, useEffect } from 'react';
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

// Wrapper component to get URL parameters
function EmailConfirmationWrapper() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email') || undefined;
  
  return <EmailConfirmation email={email} />;
}

function App() {
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
    setShowLoginModal(true);
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
        <Routes>
          <Route
            path="/confirm-email"
            element={<EmailConfirmationWrapper />}
          />
          <Route
            path="/review-contract"
            element={<ContractReview />}
          />
          <Route
            path="*"
            element={
              <>
                <Navbar 
                  onCreateOfferClick={() => {
                    setShowCreateOffer(true);
                    setShowOffersMarketplace(false);
                  }}
                  onViewOffersClick={handleViewOffersClick}
                  onHomeClick={handleHomeClick}
                />
                <Routes>
                  <Route
                    path="/admin/*"
                    element={
                      isAdmin ? (
                        <Dashboard />
                      ) : (
                        <Navigate to="/" replace />
                      )
                    }
                  />
                  <Route
                    path="/"
                    element={
                      showCreateOffer ? (
                        <CreateOffer onClose={() => setShowCreateOffer(false)} />
                      ) : showOffersMarketplace ? (
                        <OffersMarketplace />
                      ) : (
                        <>
                          <Hero onGetStartedClick={handleGetStartedClick} />
                          <Features />
                          <News />
                          <Commodities />
                        </>
                      )
                    }
                  />
                </Routes>

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
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;