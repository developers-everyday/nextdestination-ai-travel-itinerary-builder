
import { create } from 'zustand';
import { Itinerary, DayPlan, ItineraryItem } from '../types';

interface ItineraryState {
    itinerary: Itinerary | null;
    focusedLocation: [number, number] | null; // [lng, lat]
    zoomLevel: number;
    theme: 'light' | 'dark';

    // Actions
    setItinerary: (itinerary: Itinerary | null) => void;
    setFocusedLocation: (location: [number, number] | null) => void;
    setZoomLevel: (zoom: number) => void;
    setTheme: (theme: 'light' | 'dark') => void;

    // Itinerary Actions
    addDay: () => void;
    removeDay: (dayNum: number) => void;

    // Activity Actions
    addActivity: (dayIndex: number, activity: ItineraryItem) => void;
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
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
    itinerary: null,
    focusedLocation: null,
    zoomLevel: 12,
    theme: 'light',

    setItinerary: (itinerary) => set({ itinerary }),
    setFocusedLocation: (location) => set({ focusedLocation: location }),
    setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
    setTheme: (theme) => set({ theme }),

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

    addActivity: (dayIndex, activity) => set((state) => {
        if (!state.itinerary) return state;
        const newDays = [...state.itinerary.days];
        const day = { ...newDays[dayIndex] };

        // Ensure day exists
        if (!day) return state;

        day.activities = [
            ...day.activities,
            { ...activity, id: activity.id || Math.random().toString(36).substr(2, 9) }
        ];
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
}));
