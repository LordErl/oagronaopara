import { SplashScreen } from '@capacitor/splash-screen';

export const initCapacitor = async () => {
  try {
    // Oculta o Splash Screen depois de carregar a aplicação
    await SplashScreen.hide();
    
    console.log('Capacitor inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar o Capacitor:', error);
  }
};
