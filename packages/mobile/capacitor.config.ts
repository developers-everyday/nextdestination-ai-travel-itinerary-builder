import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.nextdestination.app',
  appName: 'NextDestination',
  webDir: 'dist',
  server: {
    // Uncomment for development with live reload
    // url: 'http://YOUR_LOCAL_IP:3001',
    // cleartext: true,
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'NextDestination',
    backgroundColor: '#f8fafc',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#f8fafc',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#f8fafc',
    },
  },
};

export default config;
