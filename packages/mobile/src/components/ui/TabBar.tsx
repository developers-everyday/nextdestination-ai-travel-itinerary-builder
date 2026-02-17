import React from 'react';
import { Home, Compass, Map, User } from 'lucide-react';
import { useHaptic } from '../../hooks/useHaptic';

export type TabName = 'Home' | 'Explore' | 'Trips' | 'Profile';

interface TabConfig {
  name: TabName;
  label: string;
  icon: 'home' | 'compass' | 'map' | 'user';
}

const TAB_CONFIG: TabConfig[] = [
  { name: 'Home', label: 'Home', icon: 'home' },
  { name: 'Explore', label: 'Explore', icon: 'compass' },
  { name: 'Trips', label: 'Trips', icon: 'map' },
  { name: 'Profile', label: 'Profile', icon: 'user' },
];

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  home: Home,
  compass: Compass,
  map: Map,
  user: User,
};

interface TabBarItemProps {
  tab: TabConfig;
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

interface TabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabPress }) => {
  const { light } = useHaptic();

  const handleTabPress = (tab: TabName) => {
    light();
    onTabPress(tab);
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
