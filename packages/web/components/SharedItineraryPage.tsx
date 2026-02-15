import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchItineraryFromBackend, Itinerary } from '@nextdestination/shared';
import ItineraryBuilder from './ItineraryDisplay';
import { useItineraryStore } from '../store/useItineraryStore';
import Navbar from './Navbar';

interface SharedItineraryPageProps {
    isScriptLoaded: boolean;
}

const SharedItineraryPage: React.FC<SharedItineraryPageProps> = ({ isScriptLoaded }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<Itinerary | null>(null);

    // We reuse the store actions effectively "importing" the itinerary into the user's session if they edit
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
        if (id) {
            setLoading(true);
            fetchItineraryFromBackend(id)
                .then(itinerary => {
                    setData(itinerary);
                    setItinerary(itinerary); // Load into store so editing works immediately
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [id, setItinerary]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-16 h-16 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Loading Trip...</h2>
                <p className="text-slate-500 font-medium">Fetching shared itinerary details</p>
            </div>
        );
    }

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

    // Pass dummy functions or real store functions? 
    // If we want the user to be able to edit their OWN copy of the shared trip, we just pass the store functions.
    // The 'data' prop for ItineraryBuilder drives the view.
    // Note: ItineraryBuilder takes 'data' content. We updated the store, so we can pass 'data' or 'store.itinerary'.
    // We'll pass the fetched 'data' initially, but updates go to store. 
    // Wait, ItineraryBuilder uses local 'data' prop to render? 
    // Let's check ItineraryBuilder props again. It takes `data` and `onItineraryChange`.
    // If we want it to be editable, we should keep `data` in sync with store or state.
    // In `App.tsx`, it passes `itinerary` from store.

    return (
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
                setData(i); // Update local state so UI reflects changes
            }}
            // Assume script loaded or handle loading state? 
            // If we want the user to be able to edit their OWN copy of the shared trip, we just pass the store functions.
            // The 'data' prop for ItineraryBuilder drives the view.
            // Note: ItineraryBuilder takes 'data' content. We updated the store, so we can pass 'data' or 'store.itinerary'.
            // We'll pass the fetched 'data' initially, but updates go to store. 
            // Wait, ItineraryBuilder uses local 'data' prop to render? 
            // Let's check ItineraryBuilder props again. It takes `data` and `onItineraryChange`.
            // If we want it to be editable, we should keep `data` in sync with store or state.
            // In `App.tsx`, it passes `itinerary` from store.
            isScriptLoaded={isScriptLoaded}
        />
    );
};

export default SharedItineraryPage;
