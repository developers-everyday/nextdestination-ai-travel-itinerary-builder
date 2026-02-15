import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TabNavigator } from './TabNavigator';

// Auth screens
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';

// Trip flow screens
import { PlanningSuggestionsScreen } from '../screens/PlanningSuggestionsScreen';
import { BuilderScreen } from '../screens/BuilderScreen';
import { SharedItineraryScreen } from '../screens/SharedItineraryScreen';

export const AppNavigator: React.FC = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />

      {/* Trip flow routes */}
      <Route path="/planning" element={<PlanningSuggestionsScreen />} />
      <Route path="/builder" element={<BuilderScreen />} />
      <Route path="/share/:id" element={<SharedItineraryScreen />} />

      {/* Tab routes (catch-all for main app) */}
      <Route path="/*" element={<TabNavigator />} />
    </Routes>
  );
};
