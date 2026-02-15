import { Preferences } from '@capacitor/preferences';
import { StorageAdapter } from '@nextdestination/shared';

/**
 * Mobile storage adapter using Capacitor Preferences
 * Provides persistent storage on iOS/Android
 */
export class MobileStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    const result = await Preferences.get({ key });
    return result.value;
  }

  async setItem(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  async removeItem(key: string): Promise<void> {
    await Preferences.remove({ key });
  }
}

/**
 * Initialize the mobile storage adapter
 * Call this during app startup before any storage operations
 */
export function createMobileStorageAdapter(): MobileStorageAdapter {
  return new MobileStorageAdapter();
}
