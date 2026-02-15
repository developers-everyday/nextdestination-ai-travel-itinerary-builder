import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { isNative, platform } from './capacitor';

// Placeholder components - you'll import/create mobile-specific components
const Home: React.FC = () => (
  <div className="min-h-screen bg-slate-50 safe-area-inset">
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gradient">NextDestination</h1>
      <p className="text-slate-600 mt-2">Your Journey, Refined</p>

      <div className="mt-8 p-4 bg-white rounded-2xl shadow-sm">
        <p className="text-sm text-slate-500">
          Platform: <span className="font-medium">{platform}</span>
        </p>
        <p className="text-sm text-slate-500">
          Native: <span className="font-medium">{isNative ? 'Yes' : 'No (Web)'}</span>
        </p>
      </div>

      <div className="mt-8">
        <p className="text-slate-600">
          Mobile app is ready! Start building your mobile-specific components.
        </p>
      </div>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className={`app-container ${isNative ? 'native' : 'web'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Add more routes as you build mobile-specific screens */}
        </Routes>
      </div>
    </BrowserRouter>
  );
};
