"use client";

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { APIProvider } from '@vis.gl/react-google-maps';
import dynamic from 'next/dynamic';
import { useItineraryStore } from '@nextdestination/shared';
import { getDemoItinerary, Itinerary } from '@nextdestination/shared';
import ItineraryDisplay from '@/components/ItineraryDisplay';

// VoiceAgent uses navigator.mediaDevices and @elevenlabs/react — must be client-only
const VoiceAgent = dynamic(() => import('@/components/VoiceAgent'), { ssr: false });

const getEmptyItinerary = (): Itinerary => ({
  destination: "My Trip",
  days: [{ day: 1, theme: "Adventure Begins", activities: [] }],
  hasArrivalFlight: true,
  hasDepartureFlight: true
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

export default function BuilderPage() {
  const router = useRouter();

  const {
    itinerary,
    setItinerary,
    addDay,
    removeDay,
    addActivity,
    removeActivity,
    updateActivity,
    reorderActivity,
    setHasArrivalFlight,
    setHasDepartureFlight,
    setHasHotel,
    updateDay,
    generationStatus,
    loadedDays,
    totalDays,
    generationError,
    resetGeneration,
  } = useItineraryStore();

  const removeArrivalFlightWrapper = useCallback(() => setHasArrivalFlight(false), [setHasArrivalFlight]);
  const removeDepartureFlightWrapper = useCallback(() => setHasDepartureFlight(false), [setHasDepartureFlight]);
  const removeHotelWrapper = useCallback((dayIndex: number) => setHasHotel(dayIndex, false), [setHasHotel]);

  const handleAddActivity = useCallback((dayIndex: number, initialData?: any, index?: number) => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      time: "09:00",
      activity: "",
      description: "",
      location: "",
      type: "activity" as "activity",
      ...(initialData || {})
    };
    addActivity(dayIndex, newItem, index);
  }, [addActivity]);

  // No itinerary in store — show empty state
  if (!itinerary) {
    return (
      <APIProvider
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        libraries={['places']}
      >
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl">✨</div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Start Your Journey</h2>
            <p className="text-lg text-slate-600 font-medium mb-12 max-w-lg mx-auto">
              Ready to plan your next adventure? Choose how you&apos;d like to begin building your perfect itinerary.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setItinerary(getEmptyItinerary())}
                className="group p-8 bg-white border-2 border-slate-200 hover:border-indigo-600 rounded-3xl text-left transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Start from Scratch</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">Build your itinerary day by day with full control over every detail.</p>
              </button>

              <button
                onClick={() => {
                  const demoData = getDemoItinerary();
                  setItinerary({
                    ...demoData,
                    days: demoData.days.map((day: any) => ({
                      ...day,
                      activities: day.activities.map((act: any) => ({
                        ...act,
                        id: act.id || Math.random().toString(36).substr(2, 9)
                      }))
                    }))
                  } as Itinerary);
                }}
                className="group p-8 bg-white border-2 border-slate-200 hover:border-purple-600 rounded-3xl text-left transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">View Demo Trip</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">Explore a pre-built luxury trip to Paris to see what&apos;s possible.</p>
              </button>
            </div>

            <div className="mt-12">
              <button
                onClick={() => router.push('/')}
                className="text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </APIProvider>
    );
  }

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
      libraries={['places']}
    >
      <VoiceAgent />

      {/* Generation Progress Overlay */}
      {(generationStatus === 'loading' || generationStatus === 'partial') && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center transition-opacity duration-500">
          <div className="relative mb-10">
            <div className="w-24 h-24 border-[10px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-indigo-600">✈️</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Crafting Your {itinerary?.destination || ''} Trip...
          </h2>
          <p className="text-xl text-slate-500 font-semibold max-w-lg mb-8">
            Our AI is designing a perfect itinerary tailored just for you.
          </p>
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Progress</span>
              <span className="text-sm font-black text-indigo-600">
                {generationStatus === 'loading' ? 'Searching...' : `Day ${loadedDays} of ${totalDays}`}
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: generationStatus === 'loading'
                    ? '15%'
                    : `${Math.max(15, (loadedDays / Math.max(totalDays, 1)) * 100)}%`
                }}
              />
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-400 font-medium animate-pulse">This usually takes 5-10 seconds</p>
        </div>
      )}

      {/* Generation Error State */}
      {generationStatus === 'error' && generationError && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-4xl mb-8">⚠️</div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">Generation Failed</h2>
          <p className="text-lg text-slate-500 font-medium max-w-md mb-8">{generationError}</p>
          <div className="flex gap-4">
            <button
              onClick={() => { resetGeneration(); router.push('/'); }}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              ← Back Home
            </button>
            <button
              onClick={() => { resetGeneration(); router.back(); }}
              className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <ItineraryDisplay
        data={itinerary}
        onBackToHome={() => router.push('/')}
        onAddActivity={handleAddActivity}
        onAddDay={addDay}
        onRemoveDay={removeDay}
        onReorderActivity={reorderActivity}
        onRemoveActivity={removeActivity}
        onUpdateActivity={updateActivity}
        onRemoveArrivalFlight={removeArrivalFlightWrapper}
        onRemoveDepartureFlight={removeDepartureFlightWrapper}
        onRemoveHotel={removeHotelWrapper}
        onUpdateDay={updateDay}
        onItineraryChange={(i) => setItinerary(i)}
      />
    </APIProvider>
  );
}
