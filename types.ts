export interface ItineraryItem {
  time: string;
  activity: string;
  location: string;
  description: string;
  type?: 'activity' | 'flight' | 'hotel';
  id?: string;
}

export interface DayPlan {
  day: number;
  theme: string;
  activities: ItineraryItem[];
  hasHotel?: boolean;
}

export interface Itinerary {
  destination: string;
  days: DayPlan[];
  hasArrivalFlight?: boolean;
  hasDepartureFlight?: boolean;
  id?: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  price: string;
  rating: number;
}

export interface ItineraryCreator {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
}

export interface CommunityItinerary {
  id: string;
  name: string;
  location: string;
  destination: string;
  image: string;
  images?: string[];
  creator: ItineraryCreator;
  saveCount: number;
  duration: number; // in days
  tags: string[];
  category: 'Adventure' | 'Luxury' | 'Budget' | 'Family' | 'Solo' | 'Romantic' | 'Cultural';
  itinerary: Itinerary;
  createdAt: string;
  trending?: boolean;
}

