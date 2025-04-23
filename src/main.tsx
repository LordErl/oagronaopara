import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initCapacitor } from './capacitor';
import { LanguageProvider } from './contexts/LanguageContext';

// Inicializa o Capacitor para componentes nativos
if (window.matchMedia('(display-mode: standalone)').matches || 
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())) {
  initCapacitor().catch(console.error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);
