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

    // Google Places Search State
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
    const [searchBounds, setSearchBounds] = useState<google.maps.LatLngBounds | null>(null);

    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

    // Initialize PlacesService
    React.useEffect(() => {
        if (isScriptLoaded && window.google && !placesService) {
            const dummy = document.createElement('div');
            setPlacesService(new window.google.maps.places.PlacesService(dummy));
        }
    }, [isScriptLoaded, placesService]);

    // Get Destination Bounds using PlacesService (instead of Geocoder)
    React.useEffect(() => {
        if (placesService && destination && window.google) {
            const request = {
                query: destination,
                fields: ['geometry']
            };

            placesService.findPlaceFromQuery(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                    // console.log("PlacesService success:", results[0]);
                    if (results[0].geometry?.viewport) {
                        setSearchBounds(results[0].geometry.viewport);
                    } else if (results[0].geometry?.location) {
                        // Create bounds from location if viewport missing (rare for regions)
                        const bounds = new window.google.maps.LatLngBounds();
                        bounds.extend(results[0].geometry.location);
                        // Expand slightly? Autocomplete bias works best with bounds.
                        // For a point, maybe just set a wide bound or rely on location?
                        // Let's rely on viewport if possible, otherwise just use location as center?
                        // But Autocomplete needs bounds or center. LocationBias can be LatLngBounds or Circle.
                        // Let's create a small circle bounds around it (e.g. 50km)
                        // Actually, let's keep it simple: strict restriction requires bounds.
                        // If no viewport, we might skip or try to synthesize one.
                        const loc = results[0].geometry.location;
                        const offset = 0.1; // roughly 10km
                        const sw = new google.maps.LatLng(loc.lat() - offset, loc.lng() - offset);
                        const ne = new google.maps.LatLng(loc.lat() + offset, loc.lng() + offset);
                        setSearchBounds(new google.maps.LatLngBounds(sw, ne));
                    }
                } else {
                    console.error("Place search failed for destination:", destination, status);
                }
            });
        }
    }, [placesService, destination]);

    React.useEffect(() => {
        if (isScriptLoaded && !autocompleteService && window.google) {
            setAutocompleteService(new window.google.maps.places.AutocompleteService());
        }
    }, [isScriptLoaded, autocompleteService]);

    React.useEffect(() => {
        if (!location || !autocompleteService) {
            setSuggestions([]);
            return;
        }

        if (location.length > 2) {
            const timer = setTimeout(() => {
                const request: google.maps.places.AutocompletionRequest = {
                    input: location,
                };

                // Apply strict location restriction if available
                if (searchBounds) {
                    // console.log("Applying search bounds restriction:", searchBounds);
                    request.locationRestriction = searchBounds;
                } else {
                    console.warn("No search bounds available for lookup, results may be global.");
                }

                autocompleteService.getPlacePredictions(
                    request,
                    (predictions, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                            setSuggestions(predictions);
                            setShowSuggestions(true);
                        } else {
                            setSuggestions([]);
                        }
                    }
                );
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [location, autocompleteService, searchBounds]);

    const handleSelectSuggestion = (place: google.maps.places.AutocompletePrediction) => {
        setLocation(place.description);
        setSuggestions([]);
        setShowSuggestions(false);
        // Optionally trigger search or just update input
        // onSearch({ location: place.description, category });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch({ location, category });
        setShowSuggestions(false);
    };

    const toggleWishlist = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setWishlist(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };



    // Mock suggestions with real images and coordinates
    const mockSuggestions = [
        {
            id: 's1',
            text: 'Guided City Walking Tour',
            type: 'activity',
            duration: '3h',
            price: '$45',
            image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            rating: 4.9,
            reviews: 128,
            coordinates: { top: 40, left: 30 }
        },
        {
            id: 's2',
            text: 'Authentic Local Food Tasting',
            type: 'meal',
            duration: '2h',
            price: '$60',
            image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            rating: 4.8,
            reviews: 85,
            coordinates: { top: 20, left: 70 }
        },
        {
            id: 's3',
            text: 'Louvre Museum Skip-the-Line',
            type: 'activity',
            duration: '4h',
            price: '$25',
            image: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            rating: 4.7,
            reviews: 210,
            coordinates: { top: 60, left: 45 }
        },
        {
            id: 's4',
            text: 'Sunset Seine River Cruise',
            type: 'activity',
            duration: '1.5h',
            price: '$35',
            image: 'https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            rating: 4.6,
            reviews: 95,
            coordinates: { top: 75, left: 20 }
        }
    ];

    // Determine search scope status for UI
    const searchScope = searchBounds
        ? { label: `Searching in ${destination}`, active: true }
        : { label: "Global Search", active: false };

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
                                {/* Mic Icon: Mute Toggle (Only visible when Active) */}
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

                                {/* Robot Icon: Start/Stop Agent */}
                                <button
                                    type="button"
                                    onClick={toggleVoice}
                                    className={`flex items-center justify-center w-8 h-8 rounded-full border cursor-pointer transition-all ${isVoiceActive ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'}`}
                                    title={isVoiceActive ? "Stop Voice Agent" : "Start Voice Agent"}
                                >
                                    <span className={`text-base ${isVoiceActive ? 'animate-pulse' : ''}`}>🤖</span>
                                </button>
                            </div>
                            {/* Status Tooltip for Voice Agent */}
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

                    {/* Main List: Grid of Vertical Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        {mockSuggestions.map(item => (
                            <div
                                key={item.id}
                                className={`group bg-white border rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer relative flex flex-col ${hoveredId === item.id ? 'border-indigo-400 shadow-md ring-1 ring-indigo-400/20' : 'border-neutral-200'}`}
                                onMouseEnter={() => setHoveredId(item.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {/* Image Section */}
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img src={item.image} alt={item.text} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <button
                                        onClick={(e) => toggleWishlist(item.id, e)}
                                        className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${wishlist.has(item.id) ? 'bg-white text-red-500 shadow-sm' : 'bg-white/30 text-white hover:bg-white hover:text-red-500'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white">
                                        {item.type === 'meal' ? 'Culinary' : 'Experience'}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-3 flex flex-col flex-1">
                                    <div className="mb-2">
                                        <div className="flex justify-between items-start mb-1 h-10">
                                            <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{item.text}</h4>
                                        </div>
                                        <div className="flex items-center gap-1 mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="text-xs font-bold text-slate-700">{item.rating}</span>
                                            <span className="text-[10px] text-slate-400">({item.reviews})</span>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-1">{item.duration} • Guided</p>
                                    </div>

                                    <div className="mt-auto pt-2 border-t border-slate-50 flex items-end justify-between">
                                        <div className="text-slate-900">
                                            <span className="text-lg font-bold">{item.price}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddActivity(item);
                                            }}
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="py-8 text-center text-xs text-slate-400">
                        End of results
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
