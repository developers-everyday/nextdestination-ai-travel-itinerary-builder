import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import { SavedItinerary, getSavedItineraries, deleteSavedItinerary } from '../services/localStorageService';
import { supabase } from '../services/supabaseClient';
import { CommunityItinerary } from '../types';
import CommunityItineraryCard from './CommunityItineraryCard';

const ProfilePage: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
    const [bucketList, setBucketList] = useState<CommunityItinerary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'bucketlist'>('upcoming');

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                try {
                    // Load local saved itineraries
                    setItineraries(getSavedItineraries());

                    // Load bucket list from Supabase
                    const { data: { session } } = await supabase.auth.getSession();

                    if (!session?.access_token) {
                        console.error("No active session for wishlist fetch");
                        setIsLoading(false);
                        return;
                    }
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/wishlist`, {
                        headers: {
                            'Authorization': `Bearer ${session?.access_token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Transform wishlist data to match CommunityItinerary if needed
                        const mapped = data.map((item: any) => ({
                            id: item.id,
                            name: item.destination ? `Trip to ${item.destination}` : 'Trip',
                            location: item.destination,
                            destination: item.destination,
                            image: item.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
                            creator: {
                                id: 'community',
                                name: 'Community Member',
                                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.id,
                                verified: true
                            },
                            saveCount: item.saveCount || 0,
                            duration: item.days?.length || 0,
                            tags: ['Wislisted'],
                            category: 'Adventure',
                            itinerary: item,
                            createdAt: item.wishlistedAt,
                            trending: false
                        }));
                        setBucketList(mapped);
                    }
                } catch (error) {
                    console.error("Failed to load profile data", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadData();
    }, [user]);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleOpenItinerary = (itinerary: SavedItinerary) => {
        navigate('/builder', { state: { itinerary } });
    };

    const handleRemix = (itinerary: CommunityItinerary) => {
        const newItinerary = {
            ...itinerary.itinerary,
            id: undefined,
            days: itinerary.itinerary.days?.map((d: any) => ({
                ...d,
                activities: d.activities?.map((a: any) => ({ ...a, id: Math.random().toString(36).substr(2, 9) }))
            })) || []
        };
        navigate('/builder', { state: { itinerary: newItinerary } });
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this itinerary?")) {
            deleteSavedItinerary(id);
            setItineraries(prev => prev.filter(i => i.id !== id));
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="pt-32 flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Please log in to view your profile</h2>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition"
                    >
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="pt-32 px-6 max-w-7xl mx-auto pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* User Details Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 sticky top-32">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-black mb-4">
                                    {user.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">My Profile</h1>
                                <p className="text-slate-500 font-medium text-sm">{user.email}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Account Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">User ID</label>
                                            <p className="text-slate-500 font-mono text-xs truncate" title={user.id}>{user.id}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Last Sign In</label>
                                            <p className="text-slate-900 font-medium text-sm">
                                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Saved Trips Section */}
                    <div className="lg:col-span-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {activeTab === 'bucketlist' ? 'My Bucket List' : 'My Saved Trips'}
                            </h2>

                            <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
                                <button
                                    onClick={() => setActiveTab('upcoming')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Upcoming
                                </button>
                                <button
                                    onClick={() => setActiveTab('past')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'past' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Past
                                </button>
                                <button
                                    onClick={() => setActiveTab('bucketlist')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'bucketlist' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Bucket List
                                </button>
                            </div>

                            <button
                                onClick={() => navigate('/')}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Plan New Trip
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-48 bg-slate-200 rounded-3xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : activeTab === 'bucketlist' ? (
                            <BucketListSection
                                trips={bucketList}
                                onRemix={handleRemix}
                            />
                        ) : (
                            <TripsList
                                trips={itineraries}
                                filter={activeTab}
                                onOpen={handleOpenItinerary}
                                onDelete={handleDelete}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

// Component to render Bucket List items grouped by destination (Airbnb style)
const BucketListSection: React.FC<{
    trips: CommunityItinerary[],
    onRemix: (item: CommunityItinerary) => void
}> = ({ trips, onRemix }) => {

    if (trips.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-pink-400 mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Your Bucket List is empty</h3>
                <p className="text-slate-500 mb-4 max-w-sm mx-auto text-sm">
                    Explore community trips and click the heart icon to save your dream destinations here.
                </p>
                <a href="/" className="text-indigo-600 font-bold hover:underline">Explore Trips</a>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map(item => (
                    <CommunityItineraryCard
                        key={item.id}
                        itinerary={item}
                        onClick={() => onRemix(item)}
                        onRemix={() => onRemix(item)}
                    />
                ))}
            </div>
        </div>
    );
};

const TripsList: React.FC<{
    trips: SavedItinerary[],
    filter: 'upcoming' | 'past',
    onOpen: (item: SavedItinerary) => void,
    onDelete: (e: React.MouseEvent, id: string) => void
}> = ({ trips, filter, onOpen, onDelete }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredTrips = trips.filter(trip => {
        if (!trip.startDate) {
            // Treat undated trips as Upcoming
            return filter === 'upcoming';
        }

        const tripDate = new Date(trip.startDate);
        if (filter === 'upcoming') {
            return tripDate >= today;
        } else {
            return tripDate < today;
        }
    });

    if (filteredTrips.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No {filter} trips found</h3>
                <p className="text-slate-500 mb-0 max-w-sm mx-auto text-sm">
                    {filter === 'upcoming'
                        ? "You don't have any upcoming trips planned yet."
                        : "You don't have any past trips in your history."}
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredTrips.map((item) => (
                <div
                    key={item.id}
                    onClick={() => onOpen(item)}
                    className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-100 transition-all cursor-pointer hover:-translate-y-1 relative flex flex-col"
                >
                    <div className="h-56 bg-slate-200 relative overflow-hidden">
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 group-hover:scale-105 transition-transform duration-500"
                            style={{
                                filter: `hue-rotate(${item.destination.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) % 360}deg)`
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-black text-3xl drop-shadow-lg tracking-tight uppercase text-center px-4">{item.destination}</span>
                        </div>
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold border border-white/30">
                            {item.days.length} Days
                        </div>

                        {item.startDate && (
                            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold border border-white/10 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(item.startDate).toLocaleDateString()}
                            </div>
                        )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {item.name || `Trip to ${item.destination}`}
                        </h3>
                        {item.startDate ? (
                            <p className="text-slate-500 text-sm font-medium mb-4">
                                Starts on {new Date(item.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        ) : (
                            <p className="text-slate-400 text-sm font-medium italic mb-4">No date set</p>
                        )}

                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                                Created {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                            <button
                                onClick={(e) => onDelete(e, item.id)}
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
    );
};

export default ProfilePage;
