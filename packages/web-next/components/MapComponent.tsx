"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useItineraryStore } from '@nextdestination/shared';
import { ItineraryItem } from '@nextdestination/shared';
import { MapPin } from 'lucide-react';

const MapComponent = ({ activeDay, onAddActivity }: { activeDay?: number; onAddActivity?: (item: ItineraryItem) => void }) => {
    const map = useMap();
    const { itinerary, focusedLocation, focusedPlace, zoomLevel, theme, setZoomLevel } = useItineraryStore();
    const [selectedStop, setSelectedStop] = useState<ItineraryItem | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; latLng: any; placeId?: string } | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

    const stops = useMemo(() => {
        if (!itinerary) return [];
        return itinerary.days.flatMap(day =>
            day.activities
                .filter(act =>
                    act.coordinates &&
                    Array.isArray(act.coordinates) &&
                    act.coordinates.length === 2 &&
                    typeof act.coordinates[0] === 'number' &&
                    typeof act.coordinates[1] === 'number' &&
                    !isNaN(act.coordinates[0]) &&
                    !isNaN(act.coordinates[1]) &&
                    act.coordinates[1] >= -90 && act.coordinates[1] <= 90
                )
                .map(act => ({ ...act, dayIndex: day.day }))
        );
    }, [itinerary]);

    const isFocusedLocationSaved = useMemo(() => {
        if (!focusedLocation) return false;
        return stops.some(s =>
            s.coordinates &&
            Math.abs(s.coordinates[0] - focusedLocation[0]) < 0.0001 &&
            Math.abs(s.coordinates[1] - focusedLocation[1]) < 0.0001
        );
    }, [focusedLocation, stops]);

    useEffect(() => {
        if (focusedLocation && map) {
            const [lng, lat] = focusedLocation;
            if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat) && lat >= -90 && lat <= 90) {
                map.moveCamera({ center: { lat, lng }, zoom: 15 });
                const matchingStop = stops.find(s =>
                    s.coordinates &&
                    Math.abs(s.coordinates[0] - lng) < 0.0001 &&
                    Math.abs(s.coordinates[1] - lat) < 0.0001
                );
                if (matchingStop) {
                    setSelectedStop(matchingStop);
                    setSelectedPlace(null);
                }
            }
        }
    }, [focusedLocation, map, stops]);

    useEffect(() => {
        if (focusedPlace) {
            const googlePlacesFormat = {
                name: focusedPlace.name || focusedPlace.activity,
                formatted_address: focusedPlace.formatted_address || focusedPlace.location || focusedPlace.description,
                geometry: {
                    location: {
                        lat: () => focusedPlace.coordinates?.lat || focusedPlace.coordinates?.[1] || 0,
                        lng: () => focusedPlace.coordinates?.lng || focusedPlace.coordinates?.[0] || 0
                    }
                },
                rating: focusedPlace.rating,
                user_ratings_total: focusedPlace.user_ratings_total || focusedPlace.reviews,
                place_id: focusedPlace.place_id || focusedPlace.id
            };
            setSelectedPlace(googlePlacesFormat);
            setSelectedStop(null);
        }
    }, [focusedPlace]);

    useEffect(() => {
        if (!map) return;

        const listener = map.addListener('contextmenu', (e: any) => {
            if (e.latLng && e.domEvent) {
                e.stop();
                setContextMenu({ x: e.domEvent.clientX, y: e.domEvent.clientY, latLng: e.latLng, placeId: e.placeId });
            }
        });

        const clickListener = map.addListener('click', (e: any) => {
            if (e.placeId) {
                e.stop();
                if (window.google && window.google.maps) {
                    const placesService = new google.maps.places.PlacesService(map);
                    placesService.getDetails({
                        placeId: e.placeId,
                        fields: ['name', 'formatted_address', 'geometry', 'types', 'rating', 'user_ratings_total', 'photos']
                    }, (place: any, status: any) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                            setSelectedPlace(place);
                            setSelectedStop(null);
                            setContextMenu(null);
                        }
                    });
                }
            } else {
                setContextMenu(null);
                setSelectedPlace(null);
            }
        });

        const dragListener = map.addListener('dragstart', () => {
            setContextMenu(null);
            setSelectedPlace(null);
        });

        return () => {
            if (window.google && window.google.maps) {
                google.maps.event.removeListener(listener);
                google.maps.event.removeListener(clickListener);
                google.maps.event.removeListener(dragListener);
            }
        };
    }, [map]);

    const handleAddToItinerary = () => {
        if (!contextMenu || !onAddActivity || !activeDay) return;
        if (window.google && window.google.maps) {
            const placesService = new google.maps.places.PlacesService(map!);
            if (contextMenu.placeId) {
                placesService.getDetails({
                    placeId: contextMenu.placeId,
                    fields: ['name', 'formatted_address', 'geometry', 'types', 'rating', 'user_ratings_total']
                }, (place: any, status: any) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                        const newItem: ItineraryItem = {
                            id: Math.random().toString(36).substr(2, 9),
                            activity: place.name || "New Location",
                            description: place.formatted_address,
                            location: place.formatted_address,
                            time: "10:00",
                            type: 'activity',
                            coordinates: [place.geometry.location.lng(), place.geometry.location.lat()]
                        };
                        onAddActivity(newItem);
                        setContextMenu(null);
                    } else {
                        fallbackGeocode();
                    }
                });
            } else {
                fallbackGeocode();
            }
        }
    };

    const handleAddPlaceToItinerary = () => {
        if (!selectedPlace || !onAddActivity || !activeDay) return;
        const newItem: ItineraryItem = {
            id: Math.random().toString(36).substr(2, 9),
            activity: selectedPlace.name || "New Location",
            description: selectedPlace.formatted_address,
            location: selectedPlace.formatted_address,
            time: "10:00",
            type: 'activity',
            coordinates: [selectedPlace.geometry.location.lng(), selectedPlace.geometry.location.lat()]
        };
        onAddActivity(newItem);
        setSelectedPlace(null);
    };

    const fallbackGeocode = () => {
        if (!contextMenu || !onAddActivity) return;
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: contextMenu.latLng }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
                const place = results[0];
                const newItem: ItineraryItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    activity: place.address_components[0]?.long_name || "New Location",
                    description: place.formatted_address,
                    location: place.formatted_address,
                    time: "10:00",
                    type: 'activity',
                    coordinates: [contextMenu.latLng.lng(), contextMenu.latLng.lat()]
                };
                onAddActivity(newItem);
            } else {
                const newItem: ItineraryItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    activity: "Custom Location",
                    description: `Lat: ${contextMenu.latLng.lat().toFixed(4)}, Lng: ${contextMenu.latLng.lng().toFixed(4)}`,
                    location: `${contextMenu.latLng.lat()}, ${contextMenu.latLng.lng()}`,
                    time: "10:00",
                    type: 'activity',
                    coordinates: [contextMenu.latLng.lng(), contextMenu.latLng.lat()]
                };
                onAddActivity(newItem);
            }
            setContextMenu(null);
        });
    };

    const defaultCenter = { lat: 48.8566, lng: 2.3522 };

    return (
        <div className="w-full h-full relative" onContextMenu={(e) => e.preventDefault()}>
            <Map
                defaultCenter={defaultCenter}
                defaultZoom={zoomLevel}
                defaultHeading={0}
                defaultTilt={0}
                onZoomChanged={(ev) => setZoomLevel(ev.detail.zoom)}
                style={{ width: '100%', height: '100%' }}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
                gestureHandling={'greedy'}
                disableDefaultUI={false}
            >
                {stops.map((stop, index) => {
                    const isFocused = focusedLocation &&
                        Math.abs(stop.coordinates![0] - focusedLocation[0]) < 0.0001 &&
                        Math.abs(stop.coordinates![1] - focusedLocation[1]) < 0.0001;
                    return (
                        <AdvancedMarker
                            key={stop.id || index}
                            position={{ lat: stop.coordinates![1], lng: stop.coordinates![0] }}
                            onClick={() => setSelectedStop(stop)}
                            zIndex={isFocused ? 100 : 1}
                        >
                            <div className={`flex flex-col items-center cursor-pointer group transition-all duration-300 ${isFocused ? 'scale-125' : 'hover:scale-110'}`}>
                                <div className={`p-2 rounded-full border-2 border-white shadow-lg ${isFocused
                                    ? 'bg-indigo-600 ring-4 ring-indigo-400/30'
                                    : (theme === 'dark' ? 'bg-[#06b6d4]' : 'bg-[#dc2626]')
                                    }`}>
                                    <MapPin className={`text-white ${isFocused ? 'w-6 h-6' : 'w-5 h-5'}`} />
                                </div>
                            </div>
                        </AdvancedMarker>
                    );
                })}

                {selectedStop && selectedStop.coordinates && (
                    <InfoWindow
                        position={{ lat: selectedStop.coordinates[1], lng: selectedStop.coordinates[0] }}
                        onCloseClick={() => setSelectedStop(null)}
                        maxWidth={300}
                        pixelOffset={[0, -40]}
                    >
                        <div className="flex flex-col gap-2 p-1 min-w-[200px]">
                            <h3 className="font-bold text-sm text-gray-900">{selectedStop.activity}</h3>
                            <p className="text-xs text-gray-600">{selectedStop.description}</p>
                            <p className="text-xs font-mono text-gray-400">{selectedStop.time}</p>
                        </div>
                    </InfoWindow>
                )}

                {selectedPlace && selectedPlace.geometry && (
                    <InfoWindow
                        position={{ lat: selectedPlace.geometry.location.lat(), lng: selectedPlace.geometry.location.lng() }}
                        onCloseClick={() => setSelectedPlace(null)}
                        maxWidth={300}
                        pixelOffset={[0, -20]}
                    >
                        <div className="flex flex-col gap-2 p-1 min-w-[200px]">
                            <h3 className="font-bold text-sm text-gray-900">{selectedPlace.name}</h3>
                            <p className="text-xs text-gray-600">{selectedPlace.formatted_address}</p>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-amber-500">{selectedPlace.rating || 'N/A'}</span>
                                <span className="text-[10px] text-gray-400">({selectedPlace.user_ratings_total || 0})</span>
                            </div>
                            {activeDay && onAddActivity ? (
                                <button
                                    onClick={handleAddPlaceToItinerary}
                                    className="mt-2 w-full py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors"
                                >
                                    Add to Day {activeDay}
                                </button>
                            ) : (
                                <div className="mt-2 text-xs text-red-500 italic">Select a day to add this place</div>
                            )}
                        </div>
                    </InfoWindow>
                )}
            </Map>

            {contextMenu && (
                <div
                    className="fixed z-[9999] bg-white shadow-2xl rounded-lg border border-gray-200 py-1 min-w-[160px] animate-fade-in"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    {activeDay && onAddActivity ? (
                        <>
                            <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium flex items-center gap-2"
                                onClick={handleAddToItinerary}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add to Day {activeDay}
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-medium"
                                onClick={() => setContextMenu(null)}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <div className="px-4 py-2 text-xs text-red-500">Action unavailable</div>
                    )}
                </div>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-full shadow-lg text-xs font-mono text-slate-500 pointer-events-none z-10">
                Zoom: {zoomLevel.toFixed(1)}
            </div>
        </div>
    );
};

export default MapComponent;
