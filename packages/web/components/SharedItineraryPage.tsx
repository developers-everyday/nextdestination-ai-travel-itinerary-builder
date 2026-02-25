import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchItineraryFromBackend, pollItineraryStatus, Itinerary } from '@nextdestination/shared';
import ItineraryBuilder from './ItineraryDisplay';
import { useItineraryStore } from '../store/useItineraryStore';
import Navbar from './Navbar';
import SEOHead, { buildSharedItinerarySchema } from './SEOHead';

interface SharedItineraryPageProps {
    isScriptLoaded: boolean;
}

const SharedItineraryPage: React.FC<SharedItineraryPageProps> = ({ isScriptLoaded }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<Itinerary | null>(null);
    const [isPending, setIsPending] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const {
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
        updateDay
    } = useItineraryStore();

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        fetchItineraryFromBackend(id)
            .then(itinerary => {
                const status = (itinerary as any).status;
                if (status === 'pending') {
                    setIsPending(true);
                    setLoading(false);
                    // Start polling
                    startPolling();
                } else if (status === 'error') {
                    setError('This itinerary failed to generate. Please try again.');
                    setLoading(false);
                } else {
                    setData(itinerary);
                    setItinerary(itinerary);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [id, setItinerary]);

    const startPolling = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            if (!id) return;
            try {
                const result = await pollItineraryStatus(id);
                if (result.status === 'ready' && result.itinerary) {
                    clearInterval(pollingRef.current!);
                    pollingRef.current = null;
                    setData(result.itinerary as Itinerary);
                    setItinerary(result.itinerary as Itinerary);
                    setIsPending(false);
                } else if (result.status === 'error') {
                    clearInterval(pollingRef.current!);
                    pollingRef.current = null;
                    setIsPending(false);
                    setError('Itinerary generation failed. Please try again.');
                }
            } catch (_) {
                // Keep polling on network errors
            }
        }, 3000);
    };

    // Clone/Remix handler
    const handleCloneTrip = () => {
        if (data) {
            const clonedData = {
                ...data,
                id: undefined, // Force new ID on save
                sourceItineraryId: id, // Track the source for remix_count
                days: data.days.map(day => ({
                    ...day,
                    activities: day.activities.map(act => ({
                        ...act,
                        id: Math.random().toString(36).substr(2, 9)
                    }))
                }))
            };
            setItinerary(clonedData as Itinerary);
            useItineraryStore.setState({ generationStatus: 'complete', loadedDays: data.days?.length || 0 });
            navigate('/builder', { state: { itinerary: clonedData } });
        }
    };

    // ── Pending State ───────────────────────────────────────────────────────
    if (isPending) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                {/* Animated building state */}
                <div className="relative mb-10">
                    <div className="w-28 h-28 border-[8px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl animate-bounce">🏗️</span>
                    </div>
                </div>

                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                    Building Your Itinerary...
                </h2>
                <p className="text-lg text-slate-500 font-medium max-w-lg mb-8">
                    Our AI is transforming the transcript into a beautiful day-by-day travel plan.
                    This usually takes 10–30 seconds.
                </p>

                {/* Progress animation */}
                <div className="w-full max-w-sm">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                </div>

                <p className="mt-6 text-sm text-slate-400 font-medium animate-pulse">
                    ✨ The magic is happening...
                </p>
            </div>
        );
    }

    // ── Loading State ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-16 h-16 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Loading Trip...</h2>
                <p className="text-slate-500 font-medium">Fetching shared itinerary details</p>
            </div>
        );
    }

    // ── Error State ─────────────────────────────────────────────────────────
    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar onOpenBuilder={() => navigate('/')} />
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-100">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 text-3xl mb-6 mx-auto">
                            ⚠️
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Trip Not Found</h2>
                        <p className="text-slate-500 mb-8 font-medium">The shared link might be invalid or the trip has been removed.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <SEOHead
                title={`${data.destination} — ${data.days.length}-Day Itinerary`}
                description={`Explore this ${data.days.length}-day ${data.destination} travel itinerary with ${data.days.reduce((sum, d) => sum + d.activities.length, 0)} activities. Built on NextDestination.ai. Remix it for your own trip.`}
                canonicalPath={`/share/${id}`}
                ogImage={(data as any).image_url || undefined}
                structuredData={buildSharedItinerarySchema(
                    data.destination,
                    data.days.length,
                    data.days.flatMap(d => d.activities.map(a => a.activity)),
                    `https://nextdestination.ai/share/${id}`
                )}
            />

            {/* ── Prominent Clone CTA Banner ─────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 shadow-2xl shadow-slate-300/50 md:hidden">
                <button
                    onClick={handleCloneTrip}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                    ✈️ Clone This Trip
                </button>
            </div>

            {/* Desktop Clone CTA - floating */}
            <div className="hidden md:block fixed bottom-8 right-8 z-50">
                <button
                    onClick={handleCloneTrip}
                    className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-indigo-300 hover:shadow-3xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 group"
                >
                    <span className="text-2xl group-hover:animate-bounce">✈️</span>
                    Clone This Trip
                </button>
            </div>

            <ItineraryBuilder
                data={data}
                onBackToHome={() => navigate('/')}
                onAddActivity={addActivity}
                onAddDay={addDay}
                onRemoveDay={removeDay}
                onReorderActivity={reorderActivity}
                onRemoveActivity={removeActivity}
                onUpdateActivity={updateActivity}
                onRemoveArrivalFlight={() => setHasArrivalFlight(false)}
                onRemoveDepartureFlight={() => setHasDepartureFlight(false)}
                onRemoveHotel={(idx) => setHasHotel(idx, false)}
                onUpdateDay={updateDay}
                onItineraryChange={(i) => {
                    setItinerary(i);
                    setData(i);
                }}
                isScriptLoaded={isScriptLoaded}
            />
        </>
    );
};

export default SharedItineraryPage;
