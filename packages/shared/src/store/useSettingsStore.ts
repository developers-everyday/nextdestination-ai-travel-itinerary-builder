import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

export interface SettingsState {
    mapboxToken: string;
    elevenLabsAgentId: string;
    isSettingsOpen: boolean;
    setMapboxToken: (token: string) => void;
    setElevenLabsAgentId: (id: string) => void;
    setSettingsOpen: (isOpen: boolean) => void;
    resetToDefaults: () => void;
}

// Get env vars safely (works in both web and mobile)
const getEnvVar = (key: string): string => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return (import.meta.env as Record<string, string>)[key] || '';
    }
    return '';
};

// Custom storage that works in both environments
const customStorage: StateStorage = {
    getItem: (name: string): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(name);
    },
    setItem: (name: string, value: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(name, value);
    },
    removeItem: (name: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(name);
    },
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            mapboxToken: getEnvVar('VITE_MAPBOX_TOKEN'),
            elevenLabsAgentId: getEnvVar('VITE_ELEVENLABS_AGENT_ID'),
            isSettingsOpen: false,
            setMapboxToken: (token) => set({ mapboxToken: token }),
            setElevenLabsAgentId: (id) => set({ elevenLabsAgentId: id }),
            setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
            resetToDefaults: () => set({
                mapboxToken: getEnvVar('VITE_MAPBOX_TOKEN'),
                elevenLabsAgentId: getEnvVar('VITE_ELEVENLABS_AGENT_ID')
            }),
        }),
        {
            name: 'settings-storage-v2',
            storage: createJSONStorage(() => customStorage),
            partialize: (state) => ({
                mapboxToken: state.mapboxToken,
                elevenLabsAgentId: state.elevenLabsAgentId
            }),
        }
    )
);
