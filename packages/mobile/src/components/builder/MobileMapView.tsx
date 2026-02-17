import React, { useEffect, useMemo } from 'react';
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Navigation } from 'lucide-react';
import { ItineraryItem } from '@nextdestination/shared';
import { useHaptic } from '../../hooks/useHaptic';

interface MobileMapViewProps {
  activities: ItineraryItem[];
  destination: string;
  onActivityPress?: (index: number) => void;
}

export const MobileMapView: React.FC<MobileMapViewProps> = ({
  activities,
  destination,
  onActivityPress,
}) => {
  const map = useMap();
  const haptic = useHaptic();

  // Calculate center from activities
  const center = useMemo(() => {
    const activitiesWithCoords = activities.filter(a => a.coordinates);
    if (activitiesWithCoords.length > 0) {
      const avgLat = activitiesWithCoords.reduce((sum, a) => sum + (a.coordinates?.[1] || 0), 0) / activitiesWithCoords.length;
      const avgLng = activitiesWithCoords.reduce((sum, a) => sum + (a.coordinates?.[0] || 0), 0) / activitiesWithCoords.length;
      return { lat: avgLat, lng: avgLng };
    }

    // Default to a generic location if no coordinates
    return { lat: 48.8566, lng: 2.3522 }; // Paris as fallback
  }, [activities]);

  // Fit bounds to show all markers
  useEffect(() => {
    if (!map || activities.length === 0) return;

    const activitiesWithCoords = activities.filter(a => a.coordinates);
    if (activitiesWithCoords.length <= 1) return;

    const bounds = new google.maps.LatLngBounds();
    activitiesWithCoords.forEach(activity => {
      if (activity.coordinates) {
        bounds.extend({
          lat: activity.coordinates[1],
          lng: activity.coordinates[0],
        });
      }
    });

    map.fitBounds(bounds, 60);
  }, [map, activities]);

  const handleMarkerClick = async (index: number) => {
    await haptic.light();
    onActivityPress?.(index);
  };

  const handleRecenter = async () => {
    await haptic.light();
    if (map && center) {
      map.panTo(center);
      map.setZoom(13);
    }
  };

  const getMarkerColor = (type?: string) => {
    switch (type) {
      case 'flight':
        return '#3b82f6'; // blue
      case 'hotel':
        return '#8b5cf6'; // purple
      default:
        return '#ef4444'; // red
    }
  };

  return (
    <div className="flex-1 relative">
      {/* Map */}
      <Map
        defaultCenter={center}
        defaultZoom={13}
        mapId="mobile-builder-map"
        gestureHandling="greedy"
        disableDefaultUI={true}
        className="w-full h-full"
      >
        {activities.map((activity, index) => {
          if (!activity.coordinates) return null;

          return (
            <AdvancedMarker
              key={activity.id || index}
              position={{
                lat: activity.coordinates[1],
                lng: activity.coordinates[0],
              }}
              onClick={() => handleMarkerClick(index)}
            >
              <div className="relative">
                <Pin
                  background={getMarkerColor(activity.type)}
                  borderColor="#fff"
                  glyphColor="#fff"
                >
                  <span className="text-xs font-bold">{index + 1}</span>
                </Pin>
              </div>
            </AdvancedMarker>
          );
        })}
      </Map>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="p-3 bg-white rounded-full shadow-lg active:bg-slate-100"
        >
          <Navigation className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Bottom Activity Pills */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-12">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-slate-900">
              {activities.length} activities
            </span>
            <span className="text-sm text-blue-600 font-medium">
              {activities.filter(a => a.coordinates).length} on map
            </span>
          </div>

          {/* Activity Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {activities.slice(0, 5).map((activity, index) => (
              <button
                key={activity.id || index}
                onClick={() => handleMarkerClick(index)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-full whitespace-nowrap text-sm"
              >
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <span className="text-slate-700 truncate max-w-[100px]">
                  {activity.activity}
                </span>
              </button>
            ))}
            {activities.length > 5 && (
              <span className="px-3 py-2 text-sm text-slate-400">
                +{activities.length - 5} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
