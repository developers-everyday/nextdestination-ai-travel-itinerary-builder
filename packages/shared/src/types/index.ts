export interface ItineraryItem {
  time: string;
  activity: string;
  location: string;
  description: string;
  type?: 'activity' | 'flight' | 'hotel';
  id?: string;
  coordinates?: [number, number];
  placeId?: string;
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
  startDate?: string; // ISO Date String
  isPublic?: boolean;
  userId?: string;
  sourceImage?: string;  // Transient: original image URL from remixed itinerary
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

// User Roles & Plans
export type UserRole = 'explorer' | 'influencer' | 'agent' | 'admin';
export type UserPlan = 'starter' | 'explorer' | 'custom';

// Creator Discovery
export type SocialPlatform = 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'website';
export type SocialLinks = Partial<Record<SocialPlatform, string>>;
export type CreatorInterest = 'History' | 'Art' | 'Food' | 'Nature' | 'Adventure' | 'Relaxation' | 'Nightlife' | 'Shopping';

export interface CreatorCardData {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  bio: string | null;
  isVerified: boolean;
  followerCount: number;
  tripCount: number;
  interests: CreatorInterest[];
  socialLinks: SocialLinks | null;
  isFollowing?: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  plan: UserPlan;
  generationsUsed: number;
  savesUsed: number;
  maxGenerations: number;
  maxSaves: number;
  hasVoiceAgent: boolean;
  hasAffiliate: boolean;
  canSellPackages: boolean;
  bio: string | null;
  isVerified: boolean;
  socialLinks?: SocialLinks | null;
  interests?: CreatorInterest[];
  followerCount?: number;
  followingCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
