import React, { useEffect, useState, useCallback } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';

interface HotelDetailsPanelProps {
    onBack: () => void;
    onSelect: (hotel: any) => void;
    searchData: any;
}

const HotelDetailsPanel: React.FC<HotelDetailsPanelProps> = ({ onBack, onSelect, searchData }) => {
    const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);
    const [hotels, setHotels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedHotel, setSelectedHotel] = useState<any | null>(null);

    // Search Area State
    const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
    const [lastSearchCenter, setLastSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
    const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null);

    const performSearch = useCallback((query?: string, location?: google.maps.LatLngLiteral) => {
        if (!window.google || !window.google.maps || !window.google.maps.places) return;

        setIsLoading(true);
        setShowSearchAreaButton(false);
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));

        const request: google.maps.places.TextSearchRequest | google.maps.places.PlaceSearchRequest = query
            ? { query }
            : {
                location: location as google.maps.LatLng,
                radius: 5000,
                type: 'lodging',
                keyword: 'hotel'
            };

        const callback = (results: any[], status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                // Formatting results to match our UI needs
                const formattedHotels = results.map(place => ({
                    id: place.place_id,
                    name: place.name,
                    rating: place.rating,
                    user_ratings_total: place.user_ratings_total,
                    price: place.price_level ? '💰'.repeat(place.price_level) : '',
                    // Get first photo if available
                    image: place.photos && place.photos.length > 0
                        ? place.photos[0].getUrl({ maxWidth: 400 })
                        : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', // Fallback
                    location: place.formatted_address || place.vicinity,
                    // Coordinates for map
                    coordinates: {
                        lat: place.geometry?.location?.lat(),
                        lng: place.geometry?.location?.lng()
                    },
                    raw: place
                }));
                setHotels(formattedHotels);

                // Update last search center
                if (location) {
                    setLastSearchCenter(location);
                } else if (results.length > 0) {
                    setLastSearchCenter({
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng()
                    });
                }
            } else {
                console.error("Places Search failed:", status);
                setHotels([]);
            }
            setIsLoading(false);
        };

        if (query) {
            service.textSearch({ query }, callback);
        } else {
            service.nearbySearch(request as google.maps.places.PlaceSearchRequest, callback);
        }
    }, []);

    // Initial Search
    useEffect(() => {
        const query = `hotels in ${searchData?.location || 'Paris'}`;
        // If we have coordinates in searchData, use them for the initial center
        if (searchData?.coordinates) {
            const center = { lat: searchData.coordinates[1], lng: searchData.coordinates[0] };
            setLastSearchCenter(center);
            // We can also perform a nearby search if we have coords, but text search is often better for "hotels in X"
            // Let's stick to text search but ensure map centers on the location
        }
        performSearch(query);
    }, [searchData, performSearch]);

    // Handle Map Camera Change
    const handleCameraChanged = (ev: any) => {
        const newCenter = ev.detail.center;
        setCurrentMapCenter(newCenter);

        if (lastSearchCenter) {
            const dist = Math.sqrt(
                Math.pow(newCenter.lat - lastSearchCenter.lat, 2) +
                Math.pow(newCenter.lng - lastSearchCenter.lng, 2)
            );
            // roughly 0.02 degrees is about 2km, show button if moved enough
            if (dist > 0.02) {
                setShowSearchAreaButton(true);
            }
        }
    };

    const handleSearchArea = () => {
        if (currentMapCenter) {
            performSearch(undefined, currentMapCenter);
        }
    };

    const handleAddToItinerary = (hotel: any, e?: React.MouseEvent) => {
        e?.stopPropagation();
        onSelect(hotel.raw || { ...hotel, activity: hotel.name, type: 'hotel' });
    };

    // Calculate default center:
    // 1. Hotels center (if results found)
    // 2. Search location coordinates (if provided)
    // 3. Last search center (if moved)
    // 4. Fallback (Paris)
    const defaultCenter = hotels.length > 0
        ? hotels[0].coordinates
        : (searchData?.coordinates ? { lat: searchData.coordinates[1], lng: searchData.coordinates[0] } : { lat: 48.8566, lng: 2.3522 });

    return (
        <div className="h-full flex flex-col bg-white animate-slide-in-right overflow-hidden">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm shrink-0 flex items-center gap-4 z-20">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">Stays in {searchData?.location || 'Area'}</h2>
                    <p className="text-xs text-slate-500 font-medium">
                        {searchData?.location || 'Anywhere'}
                    </p>
                </div>
            </div>

            {/* Split Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: List */}
                <div className="w-full lg:w-[55%] overflow-y-auto p-4 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 scrollbar-hide">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-800">
                            {isLoading ? 'Searching...' : `${hotels.length} places found`}
                        </h3>
                        <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Powered by Google</div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse flex gap-4 p-3 border border-slate-100 rounded-xl">
                                    <div className="w-32 h-24 bg-slate-200 rounded-lg"></div>
                                    <div className="flex-1 py-1">
                                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {hotels.map((hotel) => (
                                <div
                                    key={hotel.id}
                                    className={`group cursor-pointer transition-all duration-300 ${hoveredHotelId === hotel.id ? 'transform scale-[1.02] ring-2 ring-indigo-500/20' : ''}`}
                                    onMouseEnter={() => setHoveredHotelId(hotel.id)}
                                    // onMouseLeave={() => setHoveredHotelId(null)} 
                                    onClick={() => setSelectedHotel(hotel)} // Just select, don't auto-add on card click
                                >
                                    {/* Card Content */}
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-slate-100">
                                        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
                                        <button className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 hover:bg-white text-white hover:text-red-500 transition-all backdrop-blur-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-start">
                                        <div className="w-full">
                                            <div className="flex items-center justify-between w-full">
                                                <h3 className="font-bold text-slate-800 text-base truncate pr-2">{hotel.name}</h3>
                                                {hotel.rating && (
                                                    <div className="flex items-center gap-1 shrink-0 bg-green-50 px-1.5 py-0.5 rounded text-green-700">
                                                        <span className="text-xs font-bold">★ {hotel.rating}</span>
                                                        <span className="text-[10px] opacity-70">({hotel.user_ratings_total})</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{hotel.location}</p>

                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="font-bold text-slate-900 text-sm">{hotel.price}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleAddToItinerary(hotel, e)}
                                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && hotels.length === 0 && (
                        <div className="py-12 text-center text-slate-400">
                            <p>No hotels found in this area.</p>
                        </div>
                    )}
                </div>

                {/* Right Panel: Map */}
                <div className="flex-1 bg-[#e2e8f0] relative overflow-hidden">
                    <Map
                        defaultCenter={defaultCenter}
                        defaultZoom={13}
                        center={selectedHotel ? selectedHotel.coordinates : undefined}
                        mapId={import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
                        style={{ width: '100%', height: '100%' }}
                        gestureHandling={'greedy'}
                        disableDefaultUI={false}
                        onCameraChanged={handleCameraChanged}
                    >
                        {hotels.map((hotel) => (
                            <AdvancedMarker
                                key={hotel.id}
                                position={hotel.coordinates}
                                onClick={() => setSelectedHotel(hotel)}
                                title={hotel.name}
                                zIndex={hoveredHotelId === hotel.id || selectedHotel?.id === hotel.id ? 100 : 1}
                            >
                                <div
                                    className={`
                                        group relative flex flex-col items-center cursor-pointer transition-all duration-300
                                        ${(hoveredHotelId === hotel.id || selectedHotel?.id === hotel.id) ? 'scale-110 z-50' : 'hover:scale-105'}
                                    `}
                                    onMouseEnter={() => setHoveredHotelId(hotel.id)}
                                >
                                    <div className={`
                                        p-2 rounded-full border-2 border-white shadow-lg transition-colors
                                        ${(hoveredHotelId === hotel.id || selectedHotel?.id === hotel.id) ? 'bg-indigo-600' : 'bg-white'}
                                    `}>
                                        <MapPin className={`
                                            w-4 h-4 
                                            ${(hoveredHotelId === hotel.id || selectedHotel?.id === hotel.id) ? 'text-white' : 'text-slate-700'}
                                        `} />
                                    </div>
                                </div>
                            </AdvancedMarker>
                        ))}

                        {selectedHotel && (
                            <InfoWindow
                                position={selectedHotel.coordinates}
                                onCloseClick={() => setSelectedHotel(null)}
                                pixelOffset={[0, -40]}
                            >
                                <div className="p-2 min-w-[200px]">
                                    <h3 className="font-bold text-slate-900">{selectedHotel.name}</h3>
                                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{selectedHotel.location}</p>
                                    <img src={selectedHotel.image} alt={selectedHotel.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                                    <button
                                        onClick={() => handleAddToItinerary(selectedHotel)}
                                        className="w-full py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700"
                                    >
                                        Add to Itinerary
                                    </button>
                                </div>
                            </InfoWindow>
                        )}
                    </Map>

                    {/* Search Area Button */}
                    {showSearchAreaButton && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                            <button
                                onClick={handleSearchArea}
                                className="bg-white px-4 py-2 rounded-full shadow-lg font-bold text-sm text-indigo-600 hover:bg-slate-50 transition-all flex items-center gap-2 animate-bounce-in"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Search this area
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HotelDetailsPanel;
