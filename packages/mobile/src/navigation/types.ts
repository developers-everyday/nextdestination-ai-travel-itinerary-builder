import { Itinerary } from '@nextdestination/shared';

// Tab Navigator Routes
export type TabRoutes = {
  Home: undefined;
  Explore: undefined;
  Trips: undefined;
  Profile: undefined;
};

// Main App Routes (includes both tabs and modal screens)
export type AppRoutes = {
  // Tab screens
  MainTabs: undefined;

  // Auth screens (modal presentation)
  Login: undefined;
  Signup: undefined;

  // Trip flow screens
  PlanningSuggestions: {
    destination?: string;
    query?: string;
  };
  Builder: {
    itinerary?: Itinerary;
    isNew?: boolean;
  };
  SharedItinerary: {
    id: string;
  };

  // Settings
  Settings: undefined;

  // Detail screens
  ActivityDetail: {
    activityId: string;
    dayIndex: number;
  };
  HotelSearch: {
    dayIndex: number;
  };
  FlightSearch: {
    type: 'arrival' | 'departure';
  };
};

// Navigation helpers
export type TabName = keyof TabRoutes;
export type ScreenName = keyof AppRoutes;

// Tab configuration
export interface TabConfig {
  name: TabName;
  label: string;
  icon: string;
  activeIcon: string;
}

export const TAB_CONFIG: TabConfig[] = [
  {
    name: 'Home',
    label: 'Home',
    icon: 'home',
    activeIcon: 'home',
  },
  {
    name: 'Explore',
    label: 'Explore',
    icon: 'compass',
    activeIcon: 'compass',
  },
  {
    name: 'Trips',
    label: 'Trips',
    icon: 'map',
    activeIcon: 'map',
  },
  {
    name: 'Profile',
    label: 'Profile',
    icon: 'user',
    activeIcon: 'user',
  },
];
