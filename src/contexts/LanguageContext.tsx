import { createContext, useContext, useState, ReactNode } from 'react';

// Definição dos tipos para as traduções
type Language = 'pt' | 'en';

interface Translations {
  pt: Record<string, string>;
  en: Record<string, string>;
}

// Traduções globais do aplicativo
export const translations: Translations = {
  pt: {
    // Navbar
    home: 'Início',
    newOffer: 'Nova Oferta',
    viewOffers: 'Ver Ofertas',
    quotes: 'Cotações',
    news: 'Notícias',
    admin: 'Admin',
    login: 'Entrar',
    logout: 'Sair',
    language: 'EN',
    
    // CreateOffer
    createOfferTitle: 'Nova Oferta',
    commodityLabel: 'Commodity',
    quantityLabel: 'Quantidade',
    unitLabel: 'Unidade',
    offerTypeLabel: 'Tipo de Oferta',
    currencyLabel: 'Moeda',
    priceLabel: 'Preço',
    validityLabel: 'Validade da Oferta',
    incotermsLabel: 'Incoterms',
    locationLabel: 'Localização',
    technicalSpecsLabel: 'Ficha Técnica',
    createOfferButton: 'Criar Oferta',
    showPricesInOtherCurrencies: 'Mostrar preços em outras moedas',
    hidePricesInOtherCurrencies: 'Esconder preços em outras moedas',
    searchLocation: 'Buscar localização',
    searchPlaceholder: 'Digite o nome do município',
    useCurrentLocation: 'Usar localização atual',
    selectOnMap: 'Selecionar no mapa',
    confirmLocation: 'Confirmar localização',
    latitude: 'Latitude',
    longitude: 'Longitude',
    
    // Hero
    heroTitle: 'Conectando o Agronegócio Global',
    heroSubtitle: 'Plataforma B2B para comércio exterior de grãos',
    heroDescription: 'Conectamos compradores e vendedores verificados em uma plataforma moderna e segura, impulsionando a eficiência e transparência nas operações do agronegócio.',
    getStarted: 'Começar Agora',
    learnMore: 'Saiba Mais',
    
    // Features
    featuresTitle: 'Tudo que você precisa em um só lugar',
    featureSecureTitle: 'Segurança e Compliance',
    featureSecureDesc: 'Verificamos todos os usuários e transações para garantir a segurança do seu negócio.',
    featureGlobalTitle: 'Alcance Global',
    featureGlobalDesc: 'Conecte-se com compradores e vendedores de todo o mundo.',
    featureEasyTitle: 'Fácil de Usar',
    featureEasyDesc: 'Interface intuitiva para criar e gerenciar ofertas de compra e venda.',
    
    // Commodities
    commoditiesTitle: 'Cotações em Tempo Real',
    commoditiesSubtitle: 'Acompanhe as principais commodities do mercado internacional',
    lastUpdated: 'Última atualização',
    errorLoadingQuotes: 'Erro ao carregar cotações',
    
    // News
    newsTitle: 'Últimas Notícias',
    newsSubtitle: 'Fique por dentro das novidades do agronegócio',
    readMore: 'Leia Mais',
    
    // Footer
    aboutUs: 'Sobre Nós',
    footerAboutText: 'O Agro Não Para é uma plataforma B2B para comércio exterior de grãos, conectando produtores e compradores de forma segura e eficiente.',
    contactUs: 'Contato',
    phone: 'Telefone',
    followUs: 'Siga-nos',
    allRightsReserved: 'Todos os direitos reservados.',
    
    // Auth
    emailLabel: 'Email',
    passwordLabel: 'Senha',
    confirmPasswordLabel: 'Confirmar Senha',
    nameLabel: 'Nome Completo',
    companyLabel: 'Empresa',
    signupButton: 'Cadastrar',
    loginButton: 'Entrar',
    alreadyHaveAccount: 'Já tem uma conta?',
    dontHaveAccount: 'Não tem uma conta?',
    signupNow: 'Cadastre-se agora',
    loginNow: 'Entre agora'
  },
  en: {
    // Navbar
    home: 'Home',
    newOffer: 'New Offer',
    viewOffers: 'View Offers',
    quotes: 'Quotes',
    news: 'News',
    admin: 'Admin',
    login: 'Login',
    logout: 'Logout',
    language: 'PT',
    
    // CreateOffer
    createOfferTitle: 'New Offer',
    commodityLabel: 'Commodity',
    quantityLabel: 'Quantity',
    unitLabel: 'Unit',
    offerTypeLabel: 'Offer Type',
    currencyLabel: 'Currency',
    priceLabel: 'Price',
    validityLabel: 'Offer Validity',
    incotermsLabel: 'Incoterms',
    locationLabel: 'Location',
    technicalSpecsLabel: 'Technical Specifications',
    createOfferButton: 'Create Offer',
    showPricesInOtherCurrencies: 'Show prices in other currencies',
    hidePricesInOtherCurrencies: 'Hide prices in other currencies',
    searchLocation: 'Search location',
    searchPlaceholder: 'Enter city name',
    useCurrentLocation: 'Use current location',
    selectOnMap: 'Select on map',
    confirmLocation: 'Confirm location',
    latitude: 'Latitude',
    longitude: 'Longitude',
    
    // Hero
    heroTitle: 'Connecting Global Agribusiness',
    heroSubtitle: 'B2B Platform for international grain trading',
    heroDescription: 'We connect verified buyers and sellers on a modern and secure platform, boosting efficiency and transparency in agribusiness operations.',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    
    // Features
    featuresTitle: 'Everything you need in one place',
    featureSecureTitle: 'Security and Compliance',
    featureSecureDesc: 'We verify all users and transactions to ensure your business security.',
    featureGlobalTitle: 'Global Reach',
    featureGlobalDesc: 'Connect with buyers and sellers from around the world.',
    featureEasyTitle: 'Easy to Use',
    featureEasyDesc: 'Intuitive interface to create and manage buy and sell offers.',
    
    // Commodities
    commoditiesTitle: 'Real-time Quotes',
    commoditiesSubtitle: 'Track major commodities in the international market',
    lastUpdated: 'Last updated',
    errorLoadingQuotes: 'Error loading quotes',
    
    // News
    newsTitle: 'Latest News',
    newsSubtitle: 'Stay up to date with agribusiness news',
    readMore: 'Read More',
    
    // Footer
    aboutUs: 'About Us',
    footerAboutText: 'O Agro Não Para is a B2B platform for international grain trading, connecting producers and buyers safely and efficiently.',
    contactUs: 'Contact Us',
    phone: 'Phone',
    followUs: 'Follow Us',
    allRightsReserved: 'All rights reserved.',
    
    // Auth
    emailLabel: 'Email',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm Password',
    nameLabel: 'Full Name',
    companyLabel: 'Company',
    signupButton: 'Sign Up',
    loginButton: 'Login',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: 'Don\'t have an account?',
    signupNow: 'Sign up now',
    loginNow: 'Login now'
  }
};

// Interface para o contexto de idioma
interface LanguageContextType {
  language: Language;
  t: Record<string, string>;
  toggleLanguage: () => void;
}

// Criação do contexto
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Hook personalizado para usar o contexto de idioma
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Props para o provedor de idioma
interface LanguageProviderProps {
  children: ReactNode;
}

// Componente provedor de idioma
export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // Inicializar o idioma a partir do localStorage
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return (savedLanguage === 'en' || savedLanguage === 'pt') ? savedLanguage : 'pt';
  });

  // Textos traduzidos para o idioma atual
  const t = translations[language];

  // Função para alternar o idioma
  const toggleLanguage = () => {
    const newLanguage = language === 'pt' ? 'en' : 'pt';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    // Forçar uma atualização da página para garantir que todas as traduções sejam aplicadas
    window.location.reload();
  };

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
