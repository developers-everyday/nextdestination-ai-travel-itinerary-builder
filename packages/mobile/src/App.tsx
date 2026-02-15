import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { isNative, platform } from './capacitor';
import { AppNavigator } from './navigation/AppNavigator';
import { AuthProvider } from './components/AuthContext';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <BrowserRouter>
          <div className={`app-container ${isNative ? 'native' : 'web'} platform-${platform}`}>
            <AppNavigator />
          </div>
        </BrowserRouter>
      </APIProvider>
    </AuthProvider>
  );
};
