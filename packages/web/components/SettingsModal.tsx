
import { useState, useEffect } from "react";
import { X, Save, RotateCcw } from "lucide-react";
import { useSettingsStore } from "../store/useSettingsStore";
import { useItineraryStore } from "../store/useItineraryStore";

export default function SettingsModal() {
    const { mapboxToken, elevenLabsAgentId, isSettingsOpen, setMapboxToken, setElevenLabsAgentId, setSettingsOpen, resetToDefaults } = useSettingsStore();
    const { theme } = useItineraryStore();

    const [localMapboxToken, setLocalMapboxToken] = useState(mapboxToken);
    const [localAgentId, setLocalAgentId] = useState(elevenLabsAgentId);

    // Sync local state when store changes or modal opens
    useEffect(() => {
        setLocalMapboxToken(mapboxToken);
        setLocalAgentId(elevenLabsAgentId);
    }, [mapboxToken, elevenLabsAgentId, isSettingsOpen]);

    const handleSave = () => {
        setMapboxToken(localMapboxToken);
        setElevenLabsAgentId(localAgentId);
        setSettingsOpen(false);
        // Ideally, we might want to trigger a reload or re-init here if necessary, 
        // but for now relying on reactivity. 
        if (localMapboxToken !== mapboxToken) {
            // Maybe reload map
        }
    };

    const handleReset = () => {
        if (confirm("Are you sure you want to reset settings to default environment variables?")) {
            resetToDefaults();
        }
    };

    if (!isSettingsOpen) {
        return null;
    }

    const isDark = theme === 'dark';

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                className={`w-full max-w-md rounded-xl shadow-2xl p-6 relative ${isDark ? 'bg-[#1e293b] text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'}`}
            >
                <button
                    onClick={() => setSettingsOpen(false)}
                    className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6">Settings</h2>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Mapbox Public Token
                        </label>
                        <input
                            type="text"
                            value={localMapboxToken}
                            onChange={(e) => setLocalMapboxToken(e.target.value)}
                            className={`w-full rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 transition-all ${isDark
                                ? 'bg-[#0f172a] border border-gray-700 focus:ring-blue-500/50 text-white placeholder-gray-600'
                                : 'bg-gray-50 border border-gray-200 focus:ring-blue-500/20 text-gray-900 placeholder-gray-400'}`}
                            placeholder="pk.eyJ1..."
                        />
                        <p className="text-[10px] text-gray-500">
                            Required for map rendering and geocoding.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            ElevenLabs Agent ID
                        </label>
                        <input
                            type="text"
                            value={localAgentId}
                            onChange={(e) => setLocalAgentId(e.target.value)}
                            className={`w-full rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 transition-all ${isDark
                                ? 'bg-[#0f172a] border border-gray-700 focus:ring-blue-500/50 text-white placeholder-gray-600'
                                : 'bg-gray-50 border border-gray-200 focus:ring-blue-500/20 text-gray-900 placeholder-gray-400'}`}
                            placeholder="Enter Agent ID"
                        />
                        <p className="text-[10px] text-gray-500">
                            Required for the conversational voice agent.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between gap-4">
                    <button
                        onClick={handleReset}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isDark
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                    >
                        <RotateCcw size={14} />
                        Reset Defaults
                    </button>

                    <button
                        onClick={handleSave}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-lg ${isDark
                            ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
                    >
                        <Save size={14} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
