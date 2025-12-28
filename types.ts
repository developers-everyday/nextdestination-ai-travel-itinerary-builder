export interface ItineraryItem {
  time: string;
  activity: string;
  location: string;
  description: string;
  type?: 'activity' | 'flight' | 'hotel';
}

export interface DayPlan {
  day: number;
  theme: string;
  activities: ItineraryItem[];
}

export interface Itinerary {
  destination: string;
  days: DayPlan[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  price: string;
  rating: number;
}
