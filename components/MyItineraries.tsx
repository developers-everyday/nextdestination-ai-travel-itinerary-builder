import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { SavedItinerary, getSavedItineraries, deleteSavedItinerary } from '../services/localStorageService';
import { useAuth } from './AuthContext';

const MyItineraries: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
            return;
        }

        if (user) {
            // Simulate loading for better UX
            setTimeout(() => {
                setItineraries(getSavedItineraries());
                setIsLoading(false);
            }, 500);
        }
    }, [user, loading, navigate]);

    const handleOpenItinerary = (itinerary: SavedItinerary) => {
        navigate('/builder', { state: { itinerary } });
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this itinerary?")) {
            deleteSavedItinerary(id);
            setItineraries(prev => prev.filter(i => i.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar onOpenBuilder={() => navigate('/')} />

            <main className="pt-24 px-6 max-w-7xl mx-auto pb-12">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">My Saved Trips</h1>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        Access your planned adventures and continue where you left off.
                    </p>
                </div>

                {(isLoading || loading) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-200 rounded-3xl animate-pulse"></div>
                        ))}
                    </div>
                ) : itineraries.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No trips saved yet</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Start planning your dream trip on the home page and save it here.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="py-3 px-8 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            Plan a Trip
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {itineraries.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleOpenItinerary(item)}
                                className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-100 transition-all cursor-pointer hover:-translate-y-1 relative"
                            >
                                <div className="h-48 bg-slate-200 relative overflow-hidden">
                                    {/* Placeholder Gradient based on destination string char code sum */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 group-hover:scale-105 transition-transform duration-500"
                                        style={{
                                            filter: `hue-rotate(${item.destination.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 360}deg)`
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white font-black text-3xl drop-shadow-lg tracking-tight uppercase">{item.destination}</span>
                                    </div>

                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/30">
                                        {item.days.length} Days
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {item.name || `Trip to ${item.destination}`}
                                    </h3>
                                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mt-4">
                                        <span>Created {new Date(item.createdAt || Date.now()).toLocaleDateString()}</span>
                                        <button
                                            onClick={(e) => handleDelete(e, item.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                                            title="Delete Trip"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyItineraries;
