import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Calendar, ChevronRight, Plane } from 'lucide-react';
import { SafeAreaView, MobileButton, MobileCard } from '../components/ui';
import { useAuth } from '../components/AuthContext';
import { useHaptic } from '../hooks/useHaptic';
import { getSavedItineraries, SavedItinerary } from '@nextdestination/shared';

export const TripsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const haptic = useHaptic();
  const [trips, setTrips] = useState<SavedItinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTrips = async () => {
      setIsLoading(true);
      const savedTrips = await getSavedItineraries();
      setTrips(savedTrips.sort((a, b) => b.updatedAt - a.updatedAt));
      setIsLoading(false);
    };
    loadTrips();
  }, []);

  const handleNewTrip = async () => {
    await haptic.medium();
    navigate('/planning');
  };

  const handleTripPress = async (tripId: string) => {
    await haptic.light();
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      navigate('/builder', { state: { itinerary: trip } });
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    await haptic.warning();
    // Would call deleteSavedItinerary here
    setTrips(prev => prev.filter(t => t.id !== tripId));
  };

  if (isLoading) {
    return (
      <SafeAreaView className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="min-h-screen bg-slate-50" edges={['top']}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Trips</h1>
          <p className="text-sm text-slate-500">{trips.length} trips planned</p>
        </div>
        <MobileButton onClick={handleNewTrip} icon={<Plus className="w-5 h-5" />}>
          New Trip
        </MobileButton>
      </div>

      {/* Trip List */}
      <div className="px-4 pt-4 pb-24 overflow-y-auto">
        {trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No trips yet</h2>
            <p className="text-slate-500 mb-8">
              Start planning your next adventure
            </p>
            <MobileButton onClick={handleNewTrip} fullWidth>
              Plan Your First Trip
            </MobileButton>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <MobileCard
                key={trip.id}
                onPress={() => handleTripPress(trip.id)}
                onSwipeLeft={() => handleDeleteTrip(trip.id)}
                swipeLeftContent={
                  <span className="text-white font-medium">Delete</span>
                }
                className="rounded-2xl overflow-hidden"
              >
                <div className="flex">
                  {/* Trip Image/Icon */}
                  <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>

                  {/* Trip Details */}
                  <div className="flex-1 p-4">
                    <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">
                      {trip.name}
                    </h3>
                    <div className="flex items-center text-slate-500 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {trip.destination}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {trip.days.length} days
                      </div>
                      <span>•</span>
                      <span>
                        {new Date(trip.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Sync status */}
                    <div className="mt-2">
                      {trip.synced ? (
                        <span className="text-xs text-green-600 font-medium">Synced</span>
                      ) : (
                        <span className="text-xs text-orange-500 font-medium">Local only</span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center pr-4">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {trips.length > 0 && (
        <button
          onClick={handleNewTrip}
          className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-300 flex items-center justify-center active:scale-95 transition-transform z-40"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}
    </SafeAreaView>
  );
};
