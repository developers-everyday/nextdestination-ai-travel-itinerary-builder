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
  hasHotel?: boolean;
}

export interface Itinerary {
  destination: string;
  days: DayPlan[];
  hasArrivalFlight?: boolean;
  hasDepartureFlight?: boolean;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  price: string;
  rating: number;
}
