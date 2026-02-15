import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight, MapPin, Calendar, Heart, LogOut, User, Bookmark } from 'lucide-react';
import { SafeAreaView, MobileButton, MobileCard } from '../components/ui';
import { useAuth } from '../components/AuthContext';
import { useHaptic } from '../hooks/useHaptic';
import { getSavedItineraries, SavedItinerary } from '@nextdestination/shared';

type TabType = 'upcoming' | 'past' | 'saved';

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut, loading } = useAuth();
  const haptic = useHaptic();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [savedTrips, setSavedTrips] = useState<SavedItinerary[]>([]);

  useEffect(() => {
    const loadSavedTrips = async () => {
      const trips = await getSavedItineraries();
      setSavedTrips(trips);
    };
    loadSavedTrips();
  }, []);

  const handleTabChange = async (tab: TabType) => {
    await haptic.light();
    setActiveTab(tab);
  };

  const handleSignOut = async () => {
    await haptic.warning();
    await signOut();
    navigate('/');
  };

  const handleTripPress = async (tripId: string) => {
    await haptic.light();
    navigate('/builder', { state: { tripId } });
  };

  const handleDeleteTrip = async (tripId: string) => {
    await haptic.warning();
    // Delete trip logic would go here
    setSavedTrips(prev => prev.filter(t => t.id !== tripId));
  };

  if (loading) {
    return (
      <SafeAreaView className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="min-h-screen bg-slate-50" edges={['top']}>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
            <User className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to view your profile</h2>
          <p className="text-slate-500 text-center mb-8">
            Save trips, track your travel history, and more
          </p>
          <MobileButton onClick={() => navigate('/login')} fullWidth>
            Sign In
          </MobileButton>
          <MobileButton
            variant="ghost"
            onClick={() => navigate('/signup')}
            fullWidth
            className="mt-3"
          >
            Create Account
          </MobileButton>
        </div>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="min-h-screen bg-slate-50" edges={['top']}>
      {/* Header with Settings */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <Settings className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">
                {userProfile?.displayName || user.email?.split('@')[0] || 'Traveler'}
              </h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              {userProfile && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                    {userProfile.role}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full capitalize">
                    {userProfile.plan} Plan
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-around mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{savedTrips.length}</div>
              <div className="text-xs text-slate-500">Trips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {userProfile?.generationsUsed || 0}
              </div>
              <div className="text-xs text-slate-500">Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {userProfile?.savesUsed || 0}
              </div>
              <div className="text-xs text-slate-500">Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="px-4 mb-4">
        <div className="flex bg-slate-200 rounded-xl p-1">
          {(['upcoming', 'past', 'saved'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {tab === 'upcoming' ? 'Upcoming' : tab === 'past' ? 'Past' : 'Saved'}
            </button>
          ))}
        </div>
      </div>

      {/* Trip List */}
      <div className="px-4 flex-1 overflow-y-auto pb-24">
        {savedTrips.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No trips yet</p>
            <MobileButton
              variant="secondary"
              onClick={() => navigate('/planning')}
              className="mt-4"
            >
              Plan Your First Trip
            </MobileButton>
          </div>
        ) : (
          <div className="space-y-3">
            {savedTrips.map((trip) => (
              <MobileCard
                key={trip.id}
                onPress={() => handleTripPress(trip.id)}
                onSwipeLeft={() => handleDeleteTrip(trip.id)}
                swipeLeftContent={
                  <span className="text-white font-medium">Delete</span>
                }
                className="p-4 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{trip.name}</h3>
                    <div className="flex items-center text-slate-500 text-sm mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(trip.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </div>

      {/* Sign Out Button */}
      <div className="absolute bottom-24 left-0 right-0 px-4">
        <MobileButton
          variant="ghost"
          fullWidth
          onClick={handleSignOut}
          icon={<LogOut className="w-5 h-5" />}
          className="text-red-600"
        >
          Sign Out
        </MobileButton>
      </div>
    </SafeAreaView>
  );
};
