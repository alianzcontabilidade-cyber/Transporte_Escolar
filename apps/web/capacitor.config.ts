import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.netescol.app',
  appName: 'NetEscol',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1B3A5C',
      showSpinner: true,
      spinnerColor: '#2DB5B0',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1B3A5C',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  android: {
    backgroundColor: '#1B3A5C',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
