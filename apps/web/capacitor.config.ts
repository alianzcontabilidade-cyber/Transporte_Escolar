import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.netescol.app',
  appName: 'NetEscol',
  webDir: 'dist',
  server: {
    // Em produção, usar o servidor Railway
    url: 'https://transporteescolar-production.up.railway.app',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      // Solicitar permissão de localização em segundo plano
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1B3A5C',
    },
  },
  android: {
    backgroundColor: '#1B3A5C',
    allowMixedContent: true,
  },
};

export default config;
