import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initCapacitor, isNative } from './capacitor';
import { setStorageAdapter } from '@nextdestination/shared';
import { MobileStorageAdapter } from './services/mobileStorage';
import './index.css';

// Initialize mobile storage adapter if running natively
if (isNative) {
  const mobileStorage = new MobileStorageAdapter();
  setStorageAdapter(mobileStorage);
}

// Initialize Capacitor plugins
initCapacitor();

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
