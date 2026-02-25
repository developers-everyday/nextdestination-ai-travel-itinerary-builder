// Services
// supabaseClient is intentionally NOT exported — each app (web-next, server)
// uses its own dedicated Supabase client to avoid cross-environment pollution.
export * from './services/geminiService';
export * from './services/itineraryService';
export * from './services/userProfileService';
export * from './services/creatorService';
export * from './services/transportService';
export * from './services/weatherService';
export * from './services/communityData';
export * from './services/hydrationService';
export * from './services/localStorageService';
export * from './services/storageAdapter';

// Stores
export * from './store/useItineraryStore';
export * from './store/useSettingsStore';

// Types
export * from './types';
