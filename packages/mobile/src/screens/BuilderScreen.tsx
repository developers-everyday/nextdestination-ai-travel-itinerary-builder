import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SafeAreaView } from '../components/ui';
import { BuilderHeader, DaySelector, ActivityList, AddActivitySheet } from '../components/builder';
import { useHaptic } from '../hooks/useHaptic';
import { useAuth } from '../components/AuthContext';
import {
  useItineraryStore,
  saveItinerary,
  saveItineraryToBackend,
  ItineraryItem,
} from '@nextdestination/shared';

export const BuilderScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const haptic = useHaptic();
  const { session } = useAuth();

  const {
    itinerary,
    activeDay,
    setActiveDay,
    addDay,
    removeActivity,
    addActivity,
    reorderActivity,
    setItinerary,
  } = useItineraryStore();

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isSaving, setIsSaving] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Load itinerary from location state if provided
  useEffect(() => {
    const state = location.state as { itinerary?: any; tripId?: string } | null;
    if (state?.itinerary && !itinerary) {
      setItinerary(state.itinerary);
    }
  }, [location.state, itinerary, setItinerary]);

  // If no itinerary, redirect to planning
  useEffect(() => {
    if (!itinerary) {
      const timeout = setTimeout(() => {
        navigate('/planning');
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [itinerary, navigate]);

  if (!itinerary) {
    return (
      <SafeAreaView className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </SafeAreaView>
    );
  }

  const currentDay = itinerary.days.find((d) => d.day === activeDay) || itinerary.days[0];
  const dayIndex = itinerary.days.findIndex((d) => d.day === activeDay);

  const handleBack = async () => {
    await haptic.light();
    navigate(-1);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save locally first
      await saveItinerary(itinerary);

      // If authenticated, save to backend
      if (session?.access_token) {
        await saveItineraryToBackend(itinerary, session.access_token);
      }

      await haptic.success();
    } catch (error) {
      console.error('Failed to save:', error);
      await haptic.error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    await haptic.light();
    const shareUrl = `${window.location.origin}/share/${itinerary.id || 'new'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Trip to ${itinerary.destination}`,
          text: `Check out my trip to ${itinerary.destination}!`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleMore = async () => {
    await haptic.light();
    setShowMoreMenu(!showMoreMenu);
  };

  const handleDaySelect = (day: number) => {
    setActiveDay(day);
  };

  const handleAddDay = async () => {
    await haptic.success();
    addDay();
    // Switch to the new day
    setActiveDay(itinerary.days.length + 1);
  };

  const handleActivityPress = (activityIndex: number) => {
    // Would open activity detail/edit sheet
    console.log('Activity pressed:', activityIndex);
  };

  const handleActivityDelete = async (activityIndex: number) => {
    await haptic.warning();
    removeActivity(dayIndex, activityIndex);
  };

  const handleActivityReorder = (oldIndex: number, newIndex: number) => {
    reorderActivity(dayIndex, oldIndex, newIndex);
  };

  const handleAddActivity = (activity: ItineraryItem) => {
    addActivity(dayIndex, activity);
    setShowAddActivity(false);
  };

  return (
    <SafeAreaView className="min-h-screen bg-slate-50 flex flex-col" edges={['top']}>
      {/* Header */}
      <BuilderHeader
        title={`Trip to ${itinerary.destination}`}
        onBack={handleBack}
        onSave={handleSave}
        onShare={handleShare}
        onMore={handleMore}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isSaving={isSaving}
      />

      {/* Day Selector */}
      <DaySelector
        days={itinerary.days}
        activeDay={activeDay}
        onDaySelect={handleDaySelect}
        onAddDay={handleAddDay}
      />

      {/* Content */}
      {viewMode === 'list' ? (
        <ActivityList
          day={currentDay}
          dayIndex={dayIndex}
          onActivityPress={handleActivityPress}
          onActivityDelete={handleActivityDelete}
          onActivityReorder={handleActivityReorder}
          onAddActivity={() => setShowAddActivity(true)}
        />
      ) : (
        <div className="flex-1 bg-slate-200 flex items-center justify-center">
          <p className="text-slate-500">Map view coming soon</p>
        </div>
      )}

      {/* Add Activity Sheet */}
      <AddActivitySheet
        isOpen={showAddActivity}
        onClose={() => setShowAddActivity(false)}
        onAddActivity={handleAddActivity}
        destination={itinerary.destination}
      />
    </SafeAreaView>
  );
};
