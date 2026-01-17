import React, { useEffect, useState, useMemo } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useItineraryStore } from '../store/useItineraryStore';
import { ItineraryItem } from '../types';
import { MapPin } from 'lucide-react';

const MapComponent = () => {
    const map = useMap();
    const { itinerary, focusedLocation, zoomLevel, theme, setZoomLevel } = useItineraryStore();
    const [selectedStop, setSelectedStop] = useState<ItineraryItem | null>(null);

    // Filter activities that have valid coordinates
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

    useEffect(() => {
        if (focusedLocation && map) {
            const [lng, lat] = focusedLocation;
            if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat) && lat >= -90 && lat <= 90) {
                map.moveCamera({
                    center: { lat, lng },
                    zoom: 14 // Use a good zoom for focused view
                });
            } else {
                console.warn("Invalid focusedLocation ignored:", focusedLocation);
            }
        }
    }, [focusedLocation, map]);

    // Handle Zoom Changes (manual listener since onZoomChanged prop is also available but hook is cleaner if map instance needed)
    // Actually Map component has onZoomChanged. using that is easier.

    // Default Center (Paris)
    const defaultCenter = { lat: 48.8566, lng: 2.3522 };

    return (
        <div className="w-full h-full relative">
            <Map
                defaultCenter={defaultCenter}
                defaultZoom={zoomLevel}
                defaultHeading={0} // Allows rotation
                defaultTilt={0}    // Allows tilt
                onZoomChanged={(ev) => setZoomLevel(ev.detail.zoom)}
                style={{ width: '100%', height: '100%' }}
                mapId={import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID"} // Use env var
                gestureHandling={'greedy'}
                disableDefaultUI={false}
            >
                {/* Markers */}
                {stops.map((stop, index) => (
                    <AdvancedMarker
                        key={stop.id || index}
                        position={{ lat: stop.coordinates![1], lng: stop.coordinates![0] }}
                        onClick={() => setSelectedStop(stop)}
                    >
                        <div className="flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform">
                            <div className={`p-2 rounded-full border-2 border-white shadow-lg ${theme === 'dark' ? 'bg-[#06b6d4]' : 'bg-[#dc2626]'}`}>
                                <MapPin className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </AdvancedMarker>
                ))}

                {/* InfoWindow for Selected Marker */}
                {selectedStop && selectedStop.coordinates && (
                    <InfoWindow
                        position={{ lat: selectedStop.coordinates[1], lng: selectedStop.coordinates[0] }}
                        onCloseClick={() => setSelectedStop(null)}
                        maxWidth={300}
                    >
                        <div className="flex flex-col gap-2 p-1 min-w-[200px]">
                            <h3 className="font-bold text-sm text-gray-900">{selectedStop.activity}</h3>
                            <p className="text-xs text-gray-600">{selectedStop.description}</p>
                            <p className="text-xs font-mono text-gray-400">{selectedStop.time}</p>
                        </div>
                    </InfoWindow>
                )}
            </Map>
        </div>
    );
};

export default MapComponent;
