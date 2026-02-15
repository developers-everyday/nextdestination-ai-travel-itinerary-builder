/**
 * Storage Adapter Interface
 * Allows platform-agnostic storage that works on both web (localStorage) and mobile (Capacitor Preferences)
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Web storage adapter using localStorage
 */
export class WebStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
}

// Default adapter for web
let currentAdapter: StorageAdapter = new WebStorageAdapter();

/**
 * Set the storage adapter to use (call from mobile app initialization)
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
  currentAdapter = adapter;
}

/**
 * Get the current storage adapter
 */
export function getStorageAdapter(): StorageAdapter {
  return currentAdapter;
}
