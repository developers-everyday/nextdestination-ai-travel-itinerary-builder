import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

export async function initCapacitor() {
  if (!isNative) {
    console.log('Running in web mode');
    return;
  }

  console.log(`Running on ${platform}`);

  try {
    // Configure status bar
    if (platform === 'ios') {
      await StatusBar.setStyle({ style: Style.Dark });
    }

    // Hide splash screen after app is ready
    await SplashScreen.hide();

    // Handle keyboard events
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
    });

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active:', isActive);
    });

    // Handle back button (Android)
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    // Handle deep links
    App.addListener('appUrlOpen', ({ url }) => {
      console.log('App opened with URL:', url);
      // Handle deep linking here
    });

  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
}

export async function hideStatusBar() {
  if (isNative) {
    await StatusBar.hide();
  }
}

export async function showStatusBar() {
  if (isNative) {
    await StatusBar.show();
  }
}
