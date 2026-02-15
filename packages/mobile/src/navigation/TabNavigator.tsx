import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Map, User } from 'lucide-react';
import { TAB_CONFIG, TabName } from './types';
import { useHaptic } from '../hooks/useHaptic';

// Import screens (will be created)
import { HomeScreen } from '../screens/HomeScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { TripsScreen } from '../screens/TripsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  home: Home,
  compass: Compass,
  map: Map,
  user: User,
};

interface TabBarItemProps {
  tab: typeof TAB_CONFIG[number];
  isActive: boolean;
  onPress: () => void;
}

const TabBarItem: React.FC<TabBarItemProps> = ({ tab, isActive, onPress }) => {
  const Icon = iconMap[tab.icon];

  return (
    <button
      onClick={onPress}
      className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
        isActive ? 'text-blue-600' : 'text-slate-400'
      }`}
    >
      <Icon size={24} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
      <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
        {tab.label}
      </span>
    </button>
  );
};

const TabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { light } = useHaptic();

  const getActiveTab = (): TabName => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'Home';
    if (path === '/explore') return 'Explore';
    if (path === '/trips') return 'Trips';
    if (path === '/profile') return 'Profile';
    return 'Home';
  };

  const activeTab = getActiveTab();

  const handleTabPress = (tab: TabName) => {
    light();
    const routes: Record<TabName, string> = {
      Home: '/',
      Explore: '/explore',
      Trips: '/trips',
      Profile: '/profile',
    };
    navigate(routes[tab]);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-50">
      <div className="flex items-center h-16">
        {TAB_CONFIG.map((tab) => (
          <TabBarItem
            key={tab.name}
            tab={tab}
            isActive={activeTab === tab.name}
            onPress={() => handleTabPress(tab.name)}
          />
        ))}
      </div>
    </div>
  );
};

export const TabNavigator: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/explore" element={<CommunityScreen />} />
          <Route path="/trips" element={<TripsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Routes>
      </div>
      <TabBar />
    </div>
  );
};
