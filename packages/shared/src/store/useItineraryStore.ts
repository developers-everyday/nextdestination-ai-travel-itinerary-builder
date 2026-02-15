import { create } from 'zustand';
import { Itinerary, DayPlan, ItineraryItem } from '../types';

export type GenerationStatus = 'idle' | 'loading' | 'partial' | 'complete' | 'error';

export type RightPanelMode = 'MAP' | 'TRANSPORT_INFO' | 'ACTIVITY_SEARCH' | 'HOTEL_DETAILS';

export interface ItineraryState {
    itinerary: Itinerary | null;
    focusedLocation: [number, number] | null; // [lng, lat]
    focusedPlace: any | null; // Detailed place info for preview
    zoomLevel: number;
    theme: 'light' | 'dark';

    // Builder Page State (shared with Voice Agent)
    activeDay: number;
    setActiveDay: (day: number) => void;
    rightPanelMode: RightPanelMode;
    setRightPanelMode: (mode: RightPanelMode) => void;

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

    // Journey Mode (Narration / Flyover)
    isJourneyActive: boolean;
    currentStopIndex: number;
    startJourney: () => void;
    stopJourney: () => void;
    nextStop: () => string;
    prevStop: () => string;

    // Voice Agent State
    isVoiceActive: boolean;
    voiceStatus: string;
    isMuted: boolean;
    setVoiceState: (isActive: boolean, status: string) => void;
    voiceActionToast: string | null;
    setVoiceActionToast: (msg: string | null) => void;

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

    // Builder Page State
    activeDay: 1,
    setActiveDay: (day) => set({ activeDay: day }),
    rightPanelMode: 'ACTIVITY_SEARCH' as RightPanelMode,
    setRightPanelMode: (mode) => set({ rightPanelMode: mode }),

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
    }),

    // Journey Mode
    isJourneyActive: false,
    currentStopIndex: 0,

    startJourney: () => {
        const state = get();
        if (!state.itinerary) return;
        const dayIndex = state.activeDay - 1;
        const day = state.itinerary.days[dayIndex];
        if (!day || day.activities.length === 0) return;

        const firstActivity = day.activities[0];
        set({
            isJourneyActive: true,
            currentStopIndex: 0,
        });
        if (firstActivity.coordinates) {
            set({ focusedLocation: firstActivity.coordinates });
        }
    },

    stopJourney: () => set({ isJourneyActive: false, currentStopIndex: 0 }),

    nextStop: () => {
        const state = get();
        if (!state.itinerary || !state.isJourneyActive) return "Journey not active.";
        const dayIndex = state.activeDay - 1;
        const day = state.itinerary.days[dayIndex];
        if (!day) return "No day found.";

        const nextIndex = state.currentStopIndex + 1;
        if (nextIndex >= day.activities.length) {
            set({ isJourneyActive: false, currentStopIndex: 0 });
            return "End of the day's activities.";
        }

        const nextActivity = day.activities[nextIndex];
        set({ currentStopIndex: nextIndex });
        if (nextActivity.coordinates) {
            set({ focusedLocation: nextActivity.coordinates });
        }
        return `Stop ${nextIndex + 1}: ${nextActivity.activity}`;
    },

    prevStop: () => {
        const state = get();
        if (!state.itinerary || !state.isJourneyActive) return "Journey not active.";
        const dayIndex = state.activeDay - 1;
        const day = state.itinerary.days[dayIndex];
        if (!day) return "No day found.";

        const prevIndex = state.currentStopIndex - 1;
        if (prevIndex < 0) return "Already at the first stop.";

        const prevActivity = day.activities[prevIndex];
        set({ currentStopIndex: prevIndex });
        if (prevActivity.coordinates) {
            set({ focusedLocation: prevActivity.coordinates });
        }
        return `Stop ${prevIndex + 1}: ${prevActivity.activity}`;
    },

    // Voice Agent Integration
    isVoiceActive: false,
    voiceStatus: 'Idle',
    isMuted: false,
    setVoiceState: (isActive, status) => set({ isVoiceActive: isActive, voiceStatus: status, isMuted: false }),
    voiceActionToast: null,
    setVoiceActionToast: (msg) => set({ voiceActionToast: msg }),

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
