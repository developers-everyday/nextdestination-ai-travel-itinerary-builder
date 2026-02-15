import { useState, useEffect, useCallback } from 'react';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { isNative } from '../capacitor';

interface KeyboardState {
  isVisible: boolean;
  height: number;
}

export function useKeyboard() {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    if (!isNative) return;

    const showListener = Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
      setKeyboardState({
        isVisible: true,
        height: info.keyboardHeight,
      });
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardState({
        isVisible: false,
        height: 0,
      });
    });

    return () => {
      showListener.then(handle => handle.remove());
      hideListener.then(handle => handle.remove());
    };
  }, []);

  const show = useCallback(async () => {
    if (!isNative) return;
    try {
      await Keyboard.show();
    } catch (e) {
      console.warn('Keyboard.show not available:', e);
    }
  }, []);

  const hide = useCallback(async () => {
    if (!isNative) return;
    try {
      await Keyboard.hide();
    } catch (e) {
      console.warn('Keyboard.hide not available:', e);
    }
  }, []);

  return {
    ...keyboardState,
    show,
    hide,
  };
}
