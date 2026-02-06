import React, { useState, useEffect } from 'react';
import { CommunityItinerary } from '../types';
import { supabase } from '../services/supabaseClient';

interface CommunityItineraryCardProps {
    itinerary: CommunityItinerary;
    onClick: () => void;
    onRemix?: (e: React.MouseEvent) => void;
}

const CommunityItineraryCard: React.FC<CommunityItineraryCardProps> = ({ itinerary, onClick, onRemix }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [saveCount, setSaveCount] = useState(itinerary.saveCount);
    const [isHovered, setIsHovered] = useState(false);

    // Check initial wishlist status
    useEffect(() => {
        const checkWishlistStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('wishlists')
                .select('id')
                .eq('user_id', user.id)
                .eq('itinerary_id', itinerary.id)
                .single();

            if (data) setIsSaved(true);
        };

        // Only check if it's a real ID (not a mock)
        if (itinerary.id && !itinerary.id.startsWith('mock-')) {
            checkWishlistStatus();
        }
    }, [itinerary.id]);

    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            const { data, error } = await supabase.auth.getUser();
            if (error || !data?.user) {
                alert("Please log in to save trips to your wishlist!");
                return;
            }
        } catch (err) {
            console.error("Auth check failed:", err);
            alert("Please log in to save trips to your wishlist!");
            return;
        }

        // Validate UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!itinerary.id || itinerary.id.startsWith('mock-') || !uuidRegex.test(itinerary.id)) {
            alert("This itinerary cannot be added to wishlist yet (Community/Mock item).");
            return;
        }

        // Optimistic Update
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        setSaveCount(prev => newSavedState ? prev + 1 : Math.max(0, prev - 1));

        try {
            // Using the API endpoint we created
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                console.error("No active session found");
                throw new Error("No active session");
            }

            const response = await fetch('http://localhost:3001/api/wishlist/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ itineraryId: itinerary.id })
            });

            if (!response.ok) {
                throw new Error('Failed to update wishlist');
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            // Revert on error
            setIsSaved(!newSavedState);
            setSaveCount(prev => !newSavedState ? prev + 1 : Math.max(0, prev - 1));
        }
    };

    return (
        <div
            onClick={onClick}
            className="group relative rounded-[2.5rem] overflow-hidden bg-white border border-slate-200 hover:border-indigo-400 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:-translate-y-2 active:translate-y-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Section */}
            <div className="h-80 relative overflow-hidden">
                <img
                    src={itinerary.image}
                    alt={itinerary.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

                {/* Trending Badge - Top Left */}
                {itinerary.trending && (
                    <div className="absolute top-6 left-6">
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-white">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Trending Now
                        </div>
                    </div>
                )}

                {/* Heart Icon with Save Count - Top Right */}
                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={handleToggleWishlist}
                        className={`backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg transition-all active:scale-95 ${isSaved ? 'bg-white text-red-500' : 'bg-white/90 text-slate-900 hover:bg-white'
                            }`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transition-transform ${isSaved ? 'fill-current scale-110' : 'text-red-500 group-hover:scale-110'}`}
                            viewBox="0 0 20 20"
                            fill={isSaved ? "currentColor" : "currentColor"}
                        >
                            {isSaved ? (
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            ) : (
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            )}
                        </svg>
                        <span className={`text-sm font-black ${isSaved ? 'text-red-500' : 'text-slate-900'}`}>
                            {saveCount.toLocaleString()}
                        </span>
                    </button>
                </div>

                {/* Duration Badge - Bottom Left */}
                <div className="absolute bottom-6 left-6">
                    <div className="bg-indigo-600/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white">
                        {itinerary.duration} {itinerary.duration === 1 ? 'Day' : 'Days'}
                    </div>
                </div>

                {/* Remix Button - Bottom Right */}
                {onRemix && (
                    <div className="absolute bottom-6 right-6 z-20">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemix(e);
                            }}
                            className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg hover:bg-white hover:text-indigo-600 transition-all text-slate-900 font-bold"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Remix</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-8">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors flex-1">
                        {itinerary.name}
                    </h3>
                </div>

                <p className="text-slate-600 font-bold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {itinerary.location}
                </p>

                {/* Creator Info */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                        <img
                            src={itinerary.creator.avatar}
                            className="w-10 h-10 rounded-full border-2 border-indigo-500/30"
                            alt={itinerary.creator.name}
                        />
                        <div>
                            <p className="text-xs font-bold text-slate-500">Creator</p>
                            <div className="flex items-center gap-1">
                                <p className="text-sm font-black text-slate-900">{itinerary.creator.name}</p>
                                {itinerary.creator.verified && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityItineraryCard;
