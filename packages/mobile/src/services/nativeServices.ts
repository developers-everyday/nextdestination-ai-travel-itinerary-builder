import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNative, platform } from '../capacitor';

/**
 * Haptic feedback service
 */
export const haptic = {
  light: async () => {
    if (!isNative) return;
    await Haptics.impact({ style: ImpactStyle.Light });
  },
  medium: async () => {
    if (!isNative) return;
    await Haptics.impact({ style: ImpactStyle.Medium });
  },
  heavy: async () => {
    if (!isNative) return;
    await Haptics.impact({ style: ImpactStyle.Heavy });
  },
  success: async () => {
    if (!isNative) return;
    await Haptics.notification({ type: NotificationType.Success });
  },
  warning: async () => {
    if (!isNative) return;
    await Haptics.notification({ type: NotificationType.Warning });
  },
  error: async () => {
    if (!isNative) return;
    await Haptics.notification({ type: NotificationType.Error });
  },
  selection: async () => {
    if (!isNative) return;
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  },
};

/**
 * Keyboard service
 */
export const keyboard = {
  show: async () => {
    if (!isNative) return;
    await Keyboard.show();
  },
  hide: async () => {
    if (!isNative) return;
    await Keyboard.hide();
  },
  addListener: Keyboard.addListener.bind(Keyboard),
  removeAllListeners: Keyboard.removeAllListeners.bind(Keyboard),
};

/**
 * Status bar service
 */
export const statusBar = {
  setStyle: async (style: 'light' | 'dark') => {
    if (!isNative) return;
    await StatusBar.setStyle({
      style: style === 'dark' ? Style.Dark : Style.Light,
    });
  },
  setBackgroundColor: async (color: string) => {
    if (!isNative || platform !== 'android') return;
    await StatusBar.setBackgroundColor({ color });
  },
  hide: async () => {
    if (!isNative) return;
    await StatusBar.hide();
  },
  show: async () => {
    if (!isNative) return;
    await StatusBar.show();
  },
};

/**
 * Platform detection helpers
 */
export const platformInfo = {
  isNative,
  platform,
  isIOS: platform === 'ios',
  isAndroid: platform === 'android',
  isWeb: !isNative,
};
