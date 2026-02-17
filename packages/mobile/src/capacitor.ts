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
      handleDeepLink(url);
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

/**
 * Handle deep links from URL scheme: nextdestination://
 * Supported paths:
 * - nextdestination://share/{id} - Open shared itinerary
 * - nextdestination://auth/callback - OAuth callback
 */
export function handleDeepLink(url: string) {
  try {
    // Parse the URL
    // URL format: nextdestination://path or https://nextdestination.ai/path
    let path = '';

    if (url.startsWith('nextdestination://')) {
      path = url.replace('nextdestination://', '');
    } else if (url.includes('nextdestination.ai')) {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    }

    // Remove leading slash
    path = path.replace(/^\//, '');

    console.log('Deep link path:', path);

    // Route based on path
    if (path.startsWith('share/')) {
      const id = path.replace('share/', '');
      if (id) {
        window.location.href = `/share/${id}`;
      }
    } else if (path.startsWith('auth/callback')) {
      // OAuth callback - handled by Supabase
      console.log('OAuth callback received');
    } else if (path === 'planning') {
      window.location.href = '/planning';
    } else if (path === 'explore') {
      window.location.href = '/explore';
    }
  } catch (error) {
    console.error('Error handling deep link:', error);
  }
}

/**
 * Check for deep link on app launch
 */
export async function checkInitialDeepLink() {
  if (!isNative) return;

  try {
    const { url } = await App.getLaunchUrl() || {};
    if (url) {
      console.log('App launched with URL:', url);
      handleDeepLink(url);
    }
  } catch (error) {
    console.error('Error checking launch URL:', error);
  }
}
