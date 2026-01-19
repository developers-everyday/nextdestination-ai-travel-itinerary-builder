import React, { useState } from 'react';
import MapComponent from './Map';
import { useItineraryStore } from '../store/useItineraryStore';
import { useSettingsStore } from '../store/useSettingsStore';

interface ActivitySearchPanelProps {
    onSearch: (searchData: any) => void;
    onCancel?: () => void;
    onAddActivity: (activity: any) => void;
    isScriptLoaded?: boolean;
    destination?: string;
}

const ActivitySearchPanel: React.FC<ActivitySearchPanelProps> = ({ onSearch, onCancel, onAddActivity, isScriptLoaded, destination }) => {
    const { toggleVoice, isVoiceActive, voiceStatus, isMuted, toggleMute } = useItineraryStore();
    const { setSettingsOpen } = useSettingsStore();

    const [location, setLocation] = useState('');
    const [category, setCategory] = useState('All');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());

    // New State for Backend Search
    // New State for Backend Search
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Fetch Initial Suggestions
    React.useEffect(() => {
        const fetchInitialSuggestions = async () => {
            if (!destination) return;

            // Clear previous results to avoid stale data while loading
            setSearchResults([]);

            try {
                const response = await fetch(`http://localhost:3001/api/activities/popular?destination=${encodeURIComponent(destination)}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.results && data.results.length > 0) {
                        setSearchResults(data.results.map((item: any) => ({
                            place_id: item.id || Math.random().toString(),
                            structured_formatting: {
                                main_text: item.name,
                                secondary_text: item.location || item.description
                            },
                            ...item
                        })));
                    } else {
                        setSearchResults([]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch initial suggestions:", error);
                setSearchResults([]);
            }
        };


        fetchInitialSuggestions();
    }, [destination]);

    // Search Scope
    const searchScope = destination
        ? { label: `Searching in ${destination}`, active: true }
        : { label: "Global Search", active: false };

    // Debounced Search Effect
    React.useEffect(() => {
        if (!location || location.length < 3) {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await fetch('http://localhost:3001/api/activities/search', { // Ensure port matches server
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: location,
                        destination: destination || 'Global'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.results) {
                        setSearchResults(data.results.map((item: any) => ({
                            place_id: item.id || Math.random().toString(),
                            structured_formatting: {
                                main_text: item.name,
                                secondary_text: item.location || item.description
                            },
                            ...item // Keep all other props
                        })));
                        setSuggestions(data.results.map((item: any) => ({ // Also update suggestions for the dropdown
                            place_id: item.id || Math.random().toString(),
                            structured_formatting: {
                                main_text: item.name,
                                secondary_text: item.location || item.description
                            },
                            ...item
                        })));
                        setShowSuggestions(true);
                    }
                }
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        }, 800); // 800ms debounce to avoid too many LLM calls

        return () => clearTimeout(timer);
    }, [location, destination]);

    const handleSelectSuggestion = (item: any) => {
        setLocation(item.name);
        setSearchResults([]); // Clear search results when a suggestion is selected, or re-run search
        setShowSuggestions(false);
        // You might want to auto-add or select the item here
        // For now, let's format it to look like a suggestion for the list
        // But wait, the list below is mockSuggestions. We should probably update the list
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch({ location, category });
        setShowSuggestions(false); // Hide suggestions after explicit search
    };

    const toggleWishlist = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setWishlist(prev => {
            const newWishlist = new Set(prev);
            if (newWishlist.has(id)) {
                newWishlist.delete(id);
            } else {
                newWishlist.add(id);
            }
            return newWishlist;
        });
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden animate-slide-in-right">
            {/* Split Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: List */}
                <div className="w-full lg:w-[55%] overflow-y-auto p-4 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 scrollbar-hide bg-slate-50 flex flex-col">

                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                {onCancel && (
                                    <button
                                        onClick={onCancel}
                                        className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                                <h2 className="text-lg font-bold text-slate-800">Search Activities</h2>
                            </div>
                            {/* Scope Badge */}
                            <div className={`px-2 py-1 rounded-md text-[10px] font-bold border ${searchScope.active ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {searchScope.label}
                            </div>
                        </div>
                        <form onSubmit={handleSearch} className="relative z-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 text-sm placeholder:text-slate-400 shadow-sm"
                                placeholder="Search activities..."
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />

                            {/* Dropdown for Suggestions */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[60] overflow-hidden">
                                    {suggestions.map((place, idx) => (
                                        <div
                                            key={place.place_id || idx}
                                            className="px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer transition-colors font-medium border-b border-slate-50 last:border-none flex flex-col"
                                            onClick={() => handleSelectSuggestion(place)}
                                        >
                                            <span className="font-bold">{place.structured_formatting.main_text}</span>
                                            <span className="text-xs text-slate-400">{place.structured_formatting.secondary_text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {/* Mic Icon */}
                                {isVoiceActive && (
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        className={`p-1.5 rounded-full transition-colors relative ${isMuted ? 'text-red-500 bg-red-50' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                                        title={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        )}
                                    </button>
                                )}

                                {/* Robot Icon */}
                                <button
                                    type="button"
                                    onClick={toggleVoice}
                                    className={`flex items-center justify-center w-8 h-8 rounded-full border cursor-pointer transition-all ${isVoiceActive ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'}`}
                                    title={isVoiceActive ? "Stop Voice Agent" : "Start Voice Agent"}
                                >
                                    <span className={`text-base ${isVoiceActive ? 'animate-pulse' : ''}`}>🤖</span>
                                </button>
                            </div>
                            {/* Status Tooltip */}
                            {voiceStatus !== 'Idle' && (
                                <div className="absolute top-full left-0 mt-2 w-full flex justify-center pointer-events-none">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border shadow-sm ${voiceStatus.startsWith('Error') ? 'text-red-500 border-red-200' : 'text-indigo-600 border-indigo-200'}`}>
                                        {voiceStatus}
                                    </span>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="flex justify-between items-center mb-4 px-1 mt-6">
                        <h3 className="text-sm font-bold text-slate-800">Top Suggestions</h3>
                        <div className="flex gap-2">
                            <button className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-2 py-1 rounded shadow-sm border border-slate-200">Sort by: Recomm...</button>
                        </div>
                    </div>

                    {/* Main List */}
                    <div className="grid grid-cols-2 gap-4">
                        {isSearching ? (
                            <div className="col-span-2 text-center py-10 text-slate-400">Searching...</div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    className={`group bg-white border rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer relative flex flex-col ${hoveredId === item.id ? 'border-indigo-400 shadow-md ring-1 ring-indigo-400/20' : 'border-neutral-200'}`}
                                    onMouseEnter={() => setHoveredId(item.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    {/* Image Section */}
                                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                        {item.metadata?.image || item.image ? (
                                            <img src={item.metadata?.image || item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => toggleWishlist(item.id, e)}
                                            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${wishlist.has(item.id) ? 'bg-white text-red-500 shadow-sm' : 'bg-white/30 text-white hover:bg-white hover:text-red-500'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white">
                                            {item.metadata?.type || item.type || 'Activity'}
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-3 flex flex-col flex-1">
                                        <div className="mb-2">
                                            <div className="flex justify-between items-start mb-1 h-10">
                                                <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{item.name}</h4>
                                            </div>
                                            <div className="flex items-center gap-1 mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                <span className="text-xs font-bold text-slate-700">{item.metadata?.rating || item.rating || '4.5'}</span>
                                                <span className="text-[10px] text-slate-400">({item.metadata?.reviews || item.reviews || '100+'})</span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1">{item.metadata?.duration || item.duration || '2h'} • Guided</p>
                                        </div>

                                        <div className="mt-auto pt-2 border-t border-slate-50 flex items-end justify-between">
                                            <div className="text-slate-900">
                                                <span className="text-lg font-bold">{item.metadata?.price || item.price || '$30'}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddActivity({
                                                        activity: item.name,
                                                        location: item.location,
                                                        description: item.description,
                                                        coordinates: [item.coordinates?.lng || 0, item.coordinates?.lat || 0],
                                                        ...item
                                                    });
                                                }}
                                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))) : (
                            <div className="col-span-2 text-center py-10 text-slate-400">
                                No activities found. Try searching for something!
                            </div>
                        )}
                    </div>
                    <div className="py-8 text-center text-xs text-slate-400">
                        {searchResults.length > 0 ? "End of results" : ""}
                    </div>
                </div>

                {/* Right Panel: Map */}
                <div className="flex-1 bg-[#e2e8f0] relative overflow-hidden hidden lg:block h-full">
                    <MapComponent />
                </div>
            </div>
        </div>
    );
};

export default ActivitySearchPanel;
