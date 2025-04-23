import { Leaf } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroProps {
  onGetStartedClick: () => void;
}

export default function Hero({ onGetStartedClick }: HeroProps) {
  const { t } = useLanguage();
  
  return (
    <div className="pt-16 bg-gradient-to-br from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Leaf className="h-12 w-12 text-white transform rotate-45" />
            </div>
          </div>
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">{t.heroTitle}</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">{t.heroSubtitle}</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            {t.heroDescription || (t.language === 'pt' 
              ? 'Conectamos compradores e vendedores verificados em uma plataforma moderna e segura, impulsionando a eficiência e transparência nas operações do agronegócio.'
              : 'We connect verified buyers and sellers on a modern and secure platform, boosting efficiency and transparency in agribusiness operations.')}
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <button
                onClick={onGetStartedClick}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 md:py-4 md:text-lg md:px-10"
              >
                {t.getStarted}
              </button>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <button
                onClick={onGetStartedClick}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                {t.learnMore}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}