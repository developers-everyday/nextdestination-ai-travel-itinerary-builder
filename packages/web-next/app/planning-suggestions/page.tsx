"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthContext';
import { hydrateItinerary, Itinerary, DayPlan, CommunityItinerary, getCoordinates, getWeather, useItineraryStore } from '@nextdestination/shared';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { differenceInDays } from 'date-fns';
import CommunityItineraryCard from '@/components/CommunityItineraryCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const MOCK_COMMUNITY_ITINERARIES: CommunityItinerary[] = [
  {
    id: 'mock-1',
    name: 'Hidden Gems of Tokyo',
    location: 'Tokyo, Japan',
    destination: 'Japan',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop',
    creator: { id: 'm1', name: 'SakuraTraveler', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sakura', verified: true },
    saveCount: 1240,
    duration: 5,
    tags: ['Cultural', 'Foodie'],
    category: 'Cultural',
    itinerary: { destination: 'Japan', days: [] } as any,
    createdAt: new Date().toISOString(),
    trending: true
  },
  {
    id: 'mock-2',
    name: 'Kyoto Zen Gardens',
    location: 'Kyoto, Japan',
    destination: 'Japan',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
    creator: { id: 'm2', name: 'ZenMaster', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Zen', verified: true },
    saveCount: 850,
    duration: 4,
    tags: ['Relaxing', 'Nature'],
    category: 'Romantic',
    itinerary: { destination: 'Japan', days: [] } as any,
    createdAt: new Date().toISOString(),
    trending: true
  },
];

function PlanningSuggestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const destinationParam = searchParams.get('destination');
  const [destination, setDestination] = useState<string>(destinationParam || 'Paris');

  useEffect(() => {
    if (destinationParam) {
      setDestination(destinationParam);
      return;
    }
    if (typeof window !== 'undefined') {
      const redirectDest = sessionStorage.getItem('redirectDestination');
      if (redirectDest) {
        sessionStorage.removeItem('redirectDestination');
        setDestination(redirectDest);
      }
    }
  }, [destinationParam]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const DURATION_PRESETS = [
    { label: 'Tight', days: 3, emoji: '⚡', desc: 'Quick highlights' },
    { label: 'Balanced', days: 5, emoji: '✨', desc: 'Best of both' },
    { label: 'Relaxed', days: 7, emoji: '🌿', desc: 'Take it slow' },
  ];

  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() + 5)));
  const [attractions, setAttractions] = useState<string[]>([]);
  const [selectedAttractions, setSelectedAttractions] = useState<string[]>([]);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState(true);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const { session } = useAuth();

  const handleDurationSelect = (days: number) => {
    setSelectedDuration(days);
    const newStart = startDate || new Date();
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + days - 1);
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  useEffect(() => {
    const fetchCoords = async () => {
      if (destination) {
        const coords = await getCoordinates(destination);
        setCoordinates(coords);
      }
    };
    fetchCoords();
  }, [destination]);

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (coordinates) {
        const data = await getWeather(coordinates.lat, coordinates.lng, startDate || undefined, endDate || undefined);
        setWeatherData(data);
      }
    };
    fetchWeatherData();
  }, [coordinates, startDate, endDate]);

  useEffect(() => {
    const fetchAttractions = async () => {
      setIsLoadingAttractions(true);
      try {
        const res = await fetch(`${API_URL}/api/transport/attractions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination })
        });
        const data = await res.json();
        setAttractions(data.attractions || []);
      } catch (err) {
        console.error("Failed to fetch attractions", err);
        setAttractions([]);
      } finally {
        setIsLoadingAttractions(false);
      }
    };
    if (destination) fetchAttractions();
  }, [destination]);

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    setSelectedDuration(null);
  };

  const sanitizeItinerary = (data: Itinerary): Itinerary => ({
    ...data,
    days: data.days.map(day => ({
      ...day,
      activities: day.activities.map(act => ({
        ...act,
        id: act.id || Math.random().toString(36).substr(2, 9)
      }))
    }))
  });

  const handleSelectPlan = async () => {
    if (!startDate || !endDate) {
      setError("Please select both a start and end date.");
      return;
    }

    const days = differenceInDays(endDate, startDate) + 1;

    if (days < 1) {
      setError("End date must be after start date.");
      return;
    }

    if (days > 14) {
      setError("For now, we can only plan trips up to 14 days.");
      return;
    }

    if (!session || !session.access_token) {
      alert("Please log in to generate your personalized itinerary.");
      router.push('/login');
      return;
    }

    setError(null);

    const skeletonDays: DayPlan[] = Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      theme: i === 0 ? 'Getting Started...' : 'Planning...',
      activities: []
    }));

    const skeletonItinerary: Itinerary = {
      destination,
      days: skeletonDays,
      startDate: startDate.toISOString().split('T')[0],
      hasArrivalFlight: true,
      hasDepartureFlight: true
    };

    const store = useItineraryStore.getState();
    store.setItinerary(skeletonItinerary);
    store.setGenerationStatus('loading');
    store.setGenerationJobId(null);
    store.setGenerationError(null);
    useItineraryStore.setState({ totalDays: days, loadedDays: 0 });

    router.push('/builder');

    try {
      const response = await fetch(`${API_URL}/api/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ destination, days, interests: selectedAttractions })
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Session expired. Please log in again.");
        throw new Error(`Server responded with ${response.status}`);
      }

      const { data: rawData } = await response.json();
      const hydratedData = await hydrateItinerary(rawData);
      const sanitized = sanitizeItinerary({ ...hydratedData, startDate: startDate.toISOString().split('T')[0] });

      const currentStore = useItineraryStore.getState();
      currentStore.setItinerary(sanitized);
      currentStore.setGenerationStatus('complete');
      useItineraryStore.setState({ loadedDays: sanitized.days.length });

    } catch (err: any) {
      console.error('[Perf] Sync generation failed, trying async...', err);

      try {
        const asyncRes = await fetch(`${API_URL}/api/suggestions/async`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ destination, days, interests: selectedAttractions })
        });

        if (!asyncRes.ok) throw new Error('Async endpoint failed');

        const { jobId } = await asyncRes.json();
        const currentStore = useItineraryStore.getState();
        currentStore.setGenerationJobId(jobId);

        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`${API_URL}/api/suggestions/status/${jobId}`, {
              headers: { 'Authorization': `Bearer ${session!.access_token}` }
            });
            const status = await statusRes.json();

            if (status.status === 'complete' && status.itinerary) {
              clearInterval(pollInterval);
              const hydratedData = await hydrateItinerary(status.itinerary);
              const sanitized = sanitizeItinerary({ ...hydratedData, startDate: startDate!.toISOString().split('T')[0] });
              const s = useItineraryStore.getState();
              s.setItinerary(sanitized);
              s.setGenerationStatus('complete');
              useItineraryStore.setState({ loadedDays: sanitized.days.length });
            } else if (status.status === 'error') {
              clearInterval(pollInterval);
              useItineraryStore.getState().setGenerationError(status.error || 'Generation failed');
            }
          } catch (pollErr) {
            console.error('[Perf] Poll error:', pollErr);
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(pollInterval);
          const s = useItineraryStore.getState();
          if (s.generationStatus !== 'complete') {
            s.setGenerationError('Generation timed out. Please try again.');
          }
        }, 60000);

      } catch (asyncErr: any) {
        console.error('[Perf] Async fallback also failed:', asyncErr);
        useItineraryStore.getState().setGenerationError(asyncErr?.message || 'Failed to generate itinerary');
      }
    }
  };

  const toggleAttraction = (attraction: string) => {
    setSelectedAttractions(prev =>
      prev.includes(attraction)
        ? prev.filter(a => a !== attraction)
        : [...prev, attraction]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
            Trip to <span className="text-indigo-600">{destination}</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
            Review local insights and customize your preferences for a perfect trip.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Weather Widget */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-100 transition-all cursor-default">
            <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-600 px-4 py-1 rounded-bl-2xl text-xs font-bold tracking-widest uppercase">
              {destination} {weatherData?.isHistorical ? 'Typical Weather' : (weatherData?.isForecast ? 'Forecast' : 'Current Weather')}
            </div>
            {weatherData ? (
              <div className="flex items-center justify-between mt-4">
                <div>
                  <div className="text-7xl mb-2">{weatherData.icon}</div>
                  <div className="text-slate-900 font-black text-4xl">{weatherData.temp}°C</div>
                  <div className="text-slate-500 font-medium text-lg">{weatherData.condition}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">High / Low</div>
                  <div className="text-2xl font-bold text-slate-800">{weatherData.high}° / {weatherData.low}°</div>
                  <div className="mt-4 flex flex-col items-end gap-1">
                    {weatherData.isHistorical ? (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Typical Weather</span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full inline-block">
                        {weatherData.isForecast ? 'Avg for trip' : 'Updates live'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40">
                <span className="text-slate-400">Loading weather...</span>
              </div>
            )}
          </div>

          {/* Duration Picker */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-4 right-8 opacity-[0.06] pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">How many days?</h2>
            <p className="text-slate-500 text-sm mb-5">Pick a pace or choose custom dates.</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {DURATION_PRESETS.map(preset => {
                const isActive = selectedDuration === preset.days;
                return (
                  <button
                    key={preset.days}
                    onClick={() => handleDurationSelect(preset.days)}
                    className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all text-center
                      ${isActive
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.03]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md'
                      }`}
                  >
                    <span className="text-lg mb-0.5">{preset.emoji}</span>
                    <span className="font-black text-sm">{preset.label}</span>
                    <span className={`text-xs font-bold ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>{preset.days} days</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { setSelectedDuration(null); setIsCalendarOpen(true); }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all
                ${selectedDuration === null
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <div className="text-left">
                  <span className="font-bold text-sm">Custom Dates</span>
                  {startDate && endDate && selectedDuration === null && (
                    <span className="block text-xs opacity-80">
                      {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {' → '}
                      {endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {' · '}{differenceInDays(endDate, startDate) + 1}d
                    </span>
                  )}
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${selectedDuration === null ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            {startDate && endDate && selectedDuration !== null && (
              <div className="mt-4 flex items-center justify-between px-1">
                <div className="text-indigo-600 font-bold text-sm">
                  {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {' → '}
                  {endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  Edit dates
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Modal */}
        {isCalendarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative animate-scale-in">
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Select Dates</h2>
              <div className="calendar-wrapper mb-6">
                <DatePicker
                  selected={startDate}
                  onChange={handleDateChange}
                  startDate={startDate}
                  endDate={endDate}
                  selectsRange
                  inline
                  minDate={new Date()}
                  calendarClassName="!w-full !border-0 !font-sans"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl mb-6 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</div>
                  {startDate && endDate ? (
                    <div className="text-lg font-black text-slate-900">{differenceInDays(endDate, startDate) + 1} Days</div>
                  ) : (
                    <div className="text-lg font-black text-slate-300">-- Days</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dates</div>
                  <div className="text-sm font-bold text-slate-700">
                    {startDate ? startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '--'}
                    {' - '}
                    {endDate ? endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '--'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (startDate && !endDate) setEndDate(startDate);
                  setIsCalendarOpen(false);
                }}
                className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Set Dates
              </button>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-20 h-auto xl:h-[800px] items-stretch">
          {/* Left Column: Things to Do */}
          <div className="xl:col-span-4 flex flex-col h-full">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm h-full flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Things to do</h2>
                <p className="text-slate-500 text-sm">Select experiences for your trip.</p>
              </div>

              <div className="flex-1">
                {isLoadingAttractions ? (
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
                    ))}
                  </div>
                ) : attractions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {attractions.slice(0, 5).map((attraction, index) => {
                      const isSelected = selectedAttractions.includes(attraction);
                      return (
                        <button
                          key={index}
                          onClick={() => toggleAttraction(attraction)}
                          className={`p-4 rounded-2xl text-left transition-all border-2 relative group w-full ${isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-700 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{attraction}</span>
                            {isSelected && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {startDate && endDate && (
                      <button
                        onClick={handleSelectPlan}
                        className="w-full p-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700
                                 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-between animate-fade-in"
                      >
                        <span>Generate My Plan</span>
                        <div className="bg-white/20 p-1.5 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </button>
                    )}

                    {(!startDate || !endDate) && (
                      <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 flex flex-col items-center justify-center gap-2 h-[88px] animate-pulse">
                        <span className="text-xs font-bold uppercase tracking-wider">Next Step</span>
                        <span className="text-sm font-semibold text-slate-500">Pick dates to continue</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-3xl mb-3">🌍</div>
                      <p className="text-slate-600 font-semibold text-sm mb-1">Custom Destination</p>
                      <p className="text-slate-400 text-xs">Our AI will pick the best experiences for you.</p>
                    </div>

                    {startDate && endDate ? (
                      <button
                        onClick={handleSelectPlan}
                        className="w-full p-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700
                                 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-between animate-fade-in"
                      >
                        <span>Generate My Plan</span>
                        <div className="bg-white/20 p-1.5 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 flex flex-col items-center justify-center gap-2 h-[88px] animate-pulse">
                        <span className="text-xs font-bold uppercase tracking-wider">Next Step</span>
                        <span className="text-sm font-semibold text-slate-500">Pick dates to continue</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Community Trips */}
          <div className="xl:col-span-8 h-full">
            <CommunityItinerariesSection destination={destination} compact={true} scrollable={true} />
          </div>
        </div>

        {error && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-6">
            <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] text-center shadow-2xl animate-bounce">
              <p className="text-red-900 font-bold text-lg mb-1">System Error</p>
              <p className="text-red-700 font-medium text-sm">{error}</p>
              <button onClick={() => setError(null)} className="mt-4 text-xs font-black text-red-900 uppercase tracking-widest border-b-2 border-red-200 hover:border-red-900 transition-all">Dismiss</button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .react-datepicker { font-family: inherit; border: none; }
        .react-datepicker__header { background-color: white; border-bottom: none; }
        .react-datepicker__day--selected, .react-datepicker__day--in-range, .react-datepicker__day--in-selecting-range {
          background-color: #4f46e5 !important; color: white !important;
        }
        .react-datepicker__day--keyboard-selected { background-color: transparent; color: #1e293b; }
        .react-datepicker__day:hover { background-color: #e0e7ff; border-radius: 50%; }
      `}</style>
    </div>
  );
}

const CommunityItinerariesSection: React.FC<{ destination: string; compact?: boolean; scrollable?: boolean }> = ({ destination, compact, scrollable }) => {
  const router = useRouter();
  const [itineraries, setItineraries] = useState<CommunityItinerary[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTrendingFallback, setIsTrendingFallback] = useState(false);
  const [selectedTripType, setSelectedTripType] = useState<'All' | 'Solo' | 'Couple' | 'Family'>('All');

  useEffect(() => {
    const fetchCommunityItineraries = async () => {
      setLoading(true);
      try {
        let data: any[] = [];
        let isFallback = false;

        try {
          const searchResponse = await fetch(`${API_URL}/api/itineraries/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination })
          });
          if (searchResponse.ok) data = await searchResponse.json();
        } catch (e) { console.warn('Search API failed', e); }

        if (!data || data.length === 0) {
          try {
            const trendingResponse = await fetch(`${API_URL}/api/itineraries/trending?destination=${encodeURIComponent(destination)}`);
            if (trendingResponse.ok) { data = await trendingResponse.json(); isFallback = true; }
          } catch (e) { console.warn('Trending API failed', e); }
        }

        if (data && data.length > 0) {
          setIsTrendingFallback(isFallback);
          const mapped: CommunityItinerary[] = data.map((item: any) => ({
            id: item.id || Math.random().toString(),
            name: item.metadata?.destination ? `Trip to ${item.metadata.destination}` : 'Amazing Trip',
            location: item.metadata?.destination || destination,
            destination: item.metadata?.destination || destination,
            image: item.metadata?.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
            creator: { id: 'ai', name: 'Community Traveler', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=' + (item.id || 'Felix'), verified: true },
            saveCount: Math.floor(Math.random() * 1000) + 50,
            duration: item.metadata?.days?.length || 3,
            tags: ['Community', 'Adventure'],
            category: item.metadata?.category || 'Adventure',
            itinerary: item.metadata,
            createdAt: new Date().toISOString(),
            trending: Math.random() > 0.8
          }));
          setItineraries(mapped);
        } else {
          const matchingMocks = MOCK_COMMUNITY_ITINERARIES.filter(
            mock => mock.destination?.toLowerCase() === destination?.toLowerCase() ||
              mock.location?.toLowerCase().includes(destination?.toLowerCase())
          );
          setItineraries(matchingMocks.length > 0 ? matchingMocks : []);
          if (matchingMocks.length > 0) setIsTrendingFallback(true);
        }
      } catch (err) {
        console.error("Failed to fetch community itineraries", err);
        setItineraries([]);
      } finally {
        setLoading(false);
      }
    };
    if (destination) fetchCommunityItineraries();
  }, [destination]);

  const handleRemix = (itinerary: CommunityItinerary) => {
    const newItinerary = {
      ...itinerary.itinerary,
      id: undefined,
      sourceImage: itinerary.image,
      days: itinerary.itinerary.days?.map((d: any) => ({
        ...d,
        activities: d.activities?.map((a: any) => ({ ...a, id: Math.random().toString(36).substr(2, 9) }))
      })) || []
    };
    useItineraryStore.getState().setItinerary(newItinerary);
    router.push('/builder');
  };

  const filteredItineraries = itineraries.filter(itinerary => {
    if (selectedTripType === 'All') return true;
    const category = itinerary.category || 'Adventure';
    if (selectedTripType === 'Solo') return ['Solo', 'Adventure', 'Budget'].includes(category);
    if (selectedTripType === 'Couple') return ['Romantic', 'Luxury'].includes(category);
    if (selectedTripType === 'Family') return ['Family', 'Cultural'].includes(category);
    return true;
  });

  if (loading || itineraries.length === 0) return null;

  return (
    <section className={`h-full flex flex-col ${compact ? 'bg-slate-50/50 rounded-[2.5rem] p-6 border border-slate-200' : 'bg-white py-20 border-t border-slate-100'}`}>
      <div className={`flex flex-col h-full ${compact ? '' : 'max-w-7xl mx-auto px-6'}`}>
        <div className="mb-6 items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              {isTrendingFallback ? "Trending Community Trips" : "Community Trips"}
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-slate-500 font-medium text-sm">
                {isTrendingFallback
                  ? <span>Trending in <span className="text-indigo-600 font-bold">{destination}</span></span>
                  : <span>Trips to <span className="text-indigo-600 font-bold">{destination}</span> by others.</span>
                }
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                {(['All', 'Solo', 'Couple', 'Family'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedTripType(type)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
                      ${selectedTripType === type
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`flex-1 ${scrollable ? 'overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          {filteredItineraries.length > 0 ? (
            <div className={`grid ${compact ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
              {filteredItineraries.map(itinerary => (
                <CommunityItineraryCard
                  key={itinerary.id}
                  itinerary={itinerary}
                  onClick={() => handleRemix(itinerary)}
                  onRemix={() => handleRemix(itinerary)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="text-4xl mb-2">🏖️</div>
              <p className="text-slate-500 font-medium mb-2">No {selectedTripType.toLowerCase()} trips found for {destination} yet.</p>
              <button onClick={() => setSelectedTripType('All')} className="text-indigo-600 font-bold text-sm hover:underline">Show all trips</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default function PlanningSuggestionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <PlanningSuggestionsContent />
    </Suspense>
  );
}
