
import React, { useRef, useEffect, useState } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Popup, Source, Layer, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useItineraryStore } from '../store/useItineraryStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ItineraryItem } from '../types';
import { MapPin } from 'lucide-react';

const MapComponent = () => {
    const mapRef = useRef<MapRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { itinerary, focusedLocation, zoomLevel, theme, setZoomLevel } = useItineraryStore();
    const { mapboxToken } = useSettingsStore();
    const [selectedStop, setSelectedStop] = useState<ItineraryItem | null>(null);

    // Filter activities that have valid coordinates
    const stops = React.useMemo(() => {
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
                    act.coordinates[1] >= -90 && act.coordinates[1] <= 90 // Valid latitude
                )
                .map(act => ({ ...act, dayIndex: day.day }))
        );
    }, [itinerary]);

    useEffect(() => {
        if (focusedLocation && mapRef.current) {
            const [lng, lat] = focusedLocation;
            if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat) && lat >= -90 && lat <= 90) {
                mapRef.current.flyTo({
                    center: focusedLocation,
                    zoom: 14,
                    essential: true
                });
            } else {
                console.warn("Invalid focusedLocation ignored:", focusedLocation);
            }
        }
    }, [focusedLocation]);

    // Add ResizeObserver to handle container size changes
    useEffect(() => {
        // We need to observe the container div
        const currentContainer = mapRef.current?.getMap().getContainer();

        if (!currentContainer) return;

        const resizeObserver = new ResizeObserver(() => {
            if (mapRef.current) {
                mapRef.current.resize();
            }
        });

        resizeObserver.observe(currentContainer);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    if (!mapboxToken) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-100 text-slate-500 p-6 text-center">
                <div>
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold">Mapbox Token Missing</p>
                    <p className="text-sm">Please add your Mapbox token in Settings to view the map.</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <Map
                ref={mapRef}
                mapboxAccessToken={mapboxToken}
                initialViewState={{
                    longitude: focusedLocation ? focusedLocation[0] : 2.3522, // Default to Paris
                    latitude: focusedLocation ? focusedLocation[1] : 48.8566,
                    zoom: zoomLevel
                }}
                onMove={evt => setZoomLevel(evt.viewState.zoom)}
                style={{ width: '100%', height: '100%' }}
                mapStyle={theme === 'dark' ? "mapbox://styles/mapbox/navigation-night-v1" : "mapbox://styles/mapbox/streets-v12"}
            >
                <NavigationControl position="top-right" />
                <GeolocateControl position="top-right" />

                {/* Markers */}
                {stops.map((stop, index) => (
                    <Marker
                        key={stop.id || index}
                        longitude={stop.coordinates![0]}
                        latitude={stop.coordinates![1]}
                        anchor="bottom"
                        onClick={e => {
                            e.originalEvent.stopPropagation();
                            setSelectedStop(stop);
                        }}
                    >
                        <div className="flex flex-col items-center cursor-pointer group hover:scale-110 transition-transform">
                            <div className={`p-2 rounded-full border-2 border-white shadow-lg ${theme === 'dark' ? 'bg-[#06b6d4]' : 'bg-[#dc2626]'}`}>
                                <MapPin className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </Marker>
                ))}

                {/* Popup for Selected Marker */}
                {selectedStop && selectedStop.coordinates && (
                    <Popup
                        longitude={selectedStop.coordinates[0]}
                        latitude={selectedStop.coordinates[1]}
                        anchor="top"
                        onClose={() => setSelectedStop(null)}
                        closeOnClick={false}
                        maxWidth="300px"
                    >
                        <div className="flex flex-col gap-2 p-1">
                            <h3 className="font-bold text-sm text-gray-900">{selectedStop.activity}</h3>
                            <p className="text-xs text-gray-600">{selectedStop.description}</p>
                            <p className="text-xs font-mono text-gray-400">{selectedStop.time}</p>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
};

export default MapComponent;
