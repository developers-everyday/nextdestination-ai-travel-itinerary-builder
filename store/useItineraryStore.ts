
import { create } from 'zustand';
import { Itinerary, DayPlan, ItineraryItem } from '../types';

type GenerationStatus = 'idle' | 'loading' | 'partial' | 'complete' | 'error';

interface ItineraryState {
    itinerary: Itinerary | null;
    focusedLocation: [number, number] | null; // [lng, lat]
    focusedPlace: any | null; // Detailed place info for preview
    zoomLevel: number;
    theme: 'light' | 'dark';

    // Generation Status (Progressive Loading)
    generationStatus: GenerationStatus;
    loadedDays: number;
    totalDays: number;
    generationJobId: string | null;
    generationError: string | null;

    // Actions
    setItinerary: (itinerary: Itinerary | null) => void;
    setFocusedLocation: (location: [number, number] | null) => void;
    setFocusedPlace: (place: any | null) => void;
    setZoomLevel: (zoom: number) => void;
    setTheme: (theme: 'light' | 'dark') => void;

    // Generation Actions
    setGenerationStatus: (status: GenerationStatus) => void;
    setGenerationJobId: (id: string | null) => void;
    setGenerationError: (error: string | null) => void;
    appendDay: (day: DayPlan) => void;
    replaceAllDays: (days: DayPlan[]) => void;
    resetGeneration: () => void;

    // Itinerary Actions
    addDay: () => void;
    removeDay: (dayNum: number) => void;

    // Activity Actions
    addActivity: (dayIndex: number, activity: ItineraryItem, index?: number) => void;
    removeActivity: (dayIndex: number, activityIndex: number) => void;
    updateActivity: (dayIndex: number, activityIndex: number, updates: Partial<ItineraryItem>) => void;
    reorderActivity: (dayIndex: number, oldIndex: number, newIndex: number) => void;

    // Specific Actions
    updateDay: (dayIndex: number, updates: Partial<DayPlan>) => void;
    setHasArrivalFlight: (has: boolean) => void;
    setHasDepartureFlight: (has: boolean) => void;
    setHasHotel: (dayIndex: number, has: boolean) => void;

    // Agent Specific Helpers
    startJourney: () => void; // Placeholder for future story mode
    stopJourney: () => void;
    nextStop: () => void;
    prevStop: () => void;

    // Voice Agent State
    isVoiceActive: boolean;
    voiceStatus: string;
    isMuted: boolean;
    setVoiceState: (isActive: boolean, status: string) => void;

    // Voice Agent Actions
    voiceToggleCallback: (() => void) | null;
    setVoiceToggleCallback: (cb: () => void) => void;
    toggleVoice: () => void;
    toggleMute: () => void;
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
    itinerary: null,
    focusedLocation: null,
    focusedPlace: null,
    zoomLevel: 12,
    theme: 'light',

    // Generation status defaults
    generationStatus: 'idle' as GenerationStatus,
    loadedDays: 0,
    totalDays: 0,
    generationJobId: null,
    generationError: null,

    setItinerary: (itinerary) => set({ itinerary }),
    setFocusedLocation: (location) => set({ focusedLocation: location }),
    setFocusedPlace: (place) => set({ focusedPlace: place }),
    setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
    setTheme: (theme) => set({ theme }),

    // Generation actions
    setGenerationStatus: (status) => set({ generationStatus: status }),
    setGenerationJobId: (id) => set({ generationJobId: id }),
    setGenerationError: (error) => set({ generationError: error, generationStatus: error ? 'error' : 'idle' }),

    appendDay: (day) => set((state) => {
        if (!state.itinerary) return state;
        const newDays = [...state.itinerary.days, day];
        return {
            itinerary: { ...state.itinerary, days: newDays },
            loadedDays: newDays.length,
            generationStatus: newDays.length >= state.totalDays ? 'complete' : 'partial'
        };
    }),

    replaceAllDays: (days) => set((state) => {
        if (!state.itinerary) return state;
        return {
            itinerary: { ...state.itinerary, days },
            loadedDays: days.length,
            generationStatus: 'complete'
        };
    }),

    resetGeneration: () => set({
        generationStatus: 'idle',
        loadedDays: 0,
        totalDays: 0,
        generationJobId: null,
        generationError: null
    }),

    addDay: () => set((state) => {
        if (!state.itinerary) return state;
        const newDayNum = state.itinerary.days.length + 1;
        return {
            itinerary: {
                ...state.itinerary,
                days: [
                    ...state.itinerary.days,
                    {
                        day: newDayNum,
                        theme: "Free Day",
                        activities: []
                    }
                ]
            }
        };
    }),

    removeDay: (dayNum) => set((state) => {
        if (!state.itinerary) return state;
        if (state.itinerary.days.length <= 1) return state;

        const newDays = state.itinerary.days
            .filter(d => d.day !== dayNum)
            .map((d, index) => ({
                ...d,
                day: index + 1
            }));

        return {
            itinerary: {
                ...state.itinerary,
                days: newDays
            }
        };
    }),

    addActivity: (dayIndex, activity, index) => set((state) => {
        if (!state.itinerary) return state;
        const newDays = [...state.itinerary.days];
        const day = { ...newDays[dayIndex] };

        // Ensure day exists
        if (!day) return state;

        const newActivities = [...day.activities];
        const newActivity = { ...activity, id: activity.id || Math.random().toString(36).substr(2, 9) };

        if (typeof index === 'number' && index >= 0 && index <= newActivities.length) {
            newActivities.splice(index, 0, newActivity);
        } else {
            newActivities.push(newActivity);
        }

        day.activities = newActivities;
        newDays[dayIndex] = day;

        return {
            itinerary: {
                ...state.itinerary,
                days: newDays
            }
        };
    }),

    removeActivity: (dayIndex, activityIndex) => set((state) => {
        if (!state.itinerary) return state;
        const newDays = [...state.itinerary.days];
        const day = { ...newDays[dayIndex] };
        if (!day) return state;

        const newActivities = [...day.activities];
        newActivities.splice(activityIndex, 1);
        day.activities = newActivities;
        newDays[dayIndex] = day;

        return {
            itinerary: {
                ...state.itinerary,
                days: newDays
            }
        };
    }),

    updateActivity: (dayIndex, activityIndex, updates) => set((state) => {
        if (!state.itinerary) return state;
        const newDays = [...state.itinerary.days];
        const day = { ...newDays[dayIndex] };
        if (!day) return state;

        const newActivities = [...day.activities];
        if (!newActivities[activityIndex]) return state;

        newActivities[activityIndex] = { ...newActivities[activityIndex], ...updates };
        day.activities = newActivities;
        newDays[dayIndex] = day;

        return {
            itinerary: {
                ...state.itinerary,
                days: newDays
            }
        };
    }),

    reorderActivity: (dayIndex, oldIndex, newIndex) => set((state) => {
        if (!state.itinerary) return state;
        const newDays = [...state.itinerary.days];
        const day = { ...newDays[dayIndex] };
        if (!day) return state;

        const newActivities = [...day.activities];
        if (newIndex < 0 || newIndex >= newActivities.length) return state;

        const [movedActivity] = newActivities.splice(oldIndex, 1);
        newActivities.splice(newIndex, 0, movedActivity);

        day.activities = newActivities;
        newDays[dayIndex] = day;

        return {
            itinerary: {
                ...state.itinerary,
                days: newDays
            }
        };
    }),

    updateDay: (dayIndex, updates) => set((state) => {
        if (!state.itinerary) return state;
        const newDays = [...state.itinerary.days];
        if (!newDays[dayIndex]) return state;

        newDays[dayIndex] = { ...newDays[dayIndex], ...updates };

        return {
            itinerary: {
                ...state.itinerary,
                days: newDays
            }
        };
    }),

    setHasArrivalFlight: (has) => set((state) => {
        if (!state.itinerary) return state;
        return { itinerary: { ...state.itinerary, hasArrivalFlight: has } };
    }),

    setHasDepartureFlight: (has) => set((state) => {
        if (!state.itinerary) return state;
        return { itinerary: { ...state.itinerary, hasDepartureFlight: has } };
    }),

    setHasHotel: (dayIndex, has) => set((state) => {
        if (!state.itinerary) return state;
        const newDays = [...state.itinerary.days];
        if (!newDays[dayIndex]) return state;
        newDays[dayIndex] = { ...newDays[dayIndex], hasHotel: has };
        return {
            itinerary: {
                ...state.itinerary,
                days: newDays
            }
        };
    }), // Added missing comma and function closure

    startJourney: () => console.log("Journey started"),
    stopJourney: () => console.log("Journey stopped"),
    nextStop: () => console.log("Next stop"),
    prevStop: () => console.log("Prev stop"),

    // Voice Agent Integration
    isVoiceActive: false,
    voiceStatus: 'Idle',
    isMuted: false,
    setVoiceState: (isActive, status) => set({ isVoiceActive: isActive, voiceStatus: status, isMuted: false }),

    // Callback registration for the headless agent
    voiceToggleCallback: () => console.warn("Voice agent not connected"),
    setVoiceToggleCallback: (cb) => set({ voiceToggleCallback: cb }),

    // Action called by UI components
    toggleVoice: () => {
        const state = get();
        if (state.voiceToggleCallback) {
            state.voiceToggleCallback();
        }
    },
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted }))
}));
