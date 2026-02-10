import React, { useMemo, useState, useEffect } from 'react';
import ItineraryCard, { ItineraryCardProps } from './ItineraryCard';
import { communityItineraries } from '../../services/communityData';
import CommunityItineraryCard from '../CommunityItineraryCard';
import { useNavigate } from 'react-router-dom';
import { CommunityItinerary } from '../../types';

interface ItineraryGridProps {
    category: string;
    source: 'community' | 'model';
}

const MOCK_ITINERARIES: ItineraryCardProps[] = [
    {
        id: '1',
        title: 'Amalfi Coast Dream',
        location: 'Positano, Italy',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800',
        rating: 4.98,
        days: 5,
        price: 3200,
        category: 'beach',
        isGuestFavorite: true
    },
    {
        id: '2',
        title: 'Kyoto Cultural Walk',
        location: 'Kyoto, Japan',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
        rating: 4.95,
        days: 7,
        price: 2450,
        category: 'history',
        isGuestFavorite: true
    },
    {
        id: '3',
        title: 'Safari Adventure',
        location: 'Serengeti, Tanzania',
        image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800',
        rating: 5.0,
        days: 10,
        price: 5800,
        category: 'adventure',
        isGuestFavorite: false
    },
    {
        id: '4',
        title: 'Swiss Alps Escape',
        location: 'Zermatt, Switzerland',
        image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&q=80&w=800',
        rating: 4.88,
        days: 4,
        price: 2100,
        category: 'mountain',
        isGuestFavorite: false
    },
    {
        id: '5',
        title: 'Bali Spiritual Retreat',
        location: 'Ubud, Indonesia',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
        rating: 4.92,
        days: 14,
        price: 1800,
        category: 'nature',
        isGuestFavorite: true
    },
    {
        id: '6',
        title: 'New York City Lights',
        location: 'New York, USA',
        image: 'https://images.unsplash.com/photo-1496442226666-8d4a0e29f122?auto=format&fit=crop&q=80&w=800',
        rating: 4.85,
        days: 3,
        price: 1500,
        category: 'city',
        isGuestFavorite: false
    },
    {
        id: '7',
        title: 'Parisian Romance',
        location: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
        rating: 4.96,
        days: 4,
        price: 2800,
        category: 'city',
        isGuestFavorite: true
    },
    {
        id: '8',
        title: 'Iceland Northern Lights',
        location: 'Reykjavik, Iceland',
        image: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&q=80&w=800',
        rating: 4.99,
        days: 6,
        price: 3500,
        category: 'nature',
        isGuestFavorite: true
    },
    {
        id: '9',
        title: 'Santorini Sunset',
        location: 'Santorini, Greece',
        image: 'https://images.unsplash.com/photo-1613395877344-13d4c2ce5d49?auto=format&fit=crop&q=80&w=800',
        rating: 4.94,
        days: 5,
        price: 2900,
        category: 'beach',
        isGuestFavorite: false
    },
    {
        id: '10',
        title: 'Tokyo Food Tour',
        location: 'Tokyo, Japan',
        image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800',
        rating: 4.89,
        days: 5,
        price: 2200,
        category: 'foodie',
        isGuestFavorite: true
    },
    {
        id: '11',
        title: 'Machu Picchu Trek',
        location: 'Cusco, Peru',
        image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&q=80&w=800',
        rating: 4.97,
        days: 8,
        price: 2600,
        category: 'adventure',
        isGuestFavorite: true
    },
    {
        id: '12',
        title: 'Maldives Overwater',
        location: 'Malé, Maldives',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800',
        rating: 4.99,
        days: 6,
        price: 6500,
        category: 'luxury',
        isGuestFavorite: true
    }
];

const ItineraryGrid: React.FC<ItineraryGridProps> = ({ category, source }) => {
    const navigate = useNavigate();
    const [fetchedItineraries, setFetchedItineraries] = useState<CommunityItinerary[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (source === 'community') {
            const fetchTrending = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/itineraries/trending`);
                    if (response.ok) {
                        const data = await response.json();
                        // Map backend data to CommunityItinerary format
                        const mapped: CommunityItinerary[] = data.map((item: any) => ({
                            id: item.id,
                            name: item.metadata?.destination ? `Trip to ${item.metadata.destination}` : 'Trip',
                            location: item.metadata?.destination || 'Unknown',
                            destination: item.metadata?.destination || 'Unknown',
                            image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
                            creator: {
                                id: 'community',
                                name: 'Explorer',
                                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.id,
                                verified: true
                            },
                            saveCount: item.metadata?.saveCount || Math.floor(Math.random() * 500),
                            duration: item.metadata?.days?.length || 3,
                            tags: ['Trending'],
                            category: 'Adventure', // Mock category if missing
                            itinerary: item.metadata,
                            createdAt: item.created_at,
                            trending: true
                        }));
                        setFetchedItineraries(mapped);
                    }
                } catch (error) {
                    console.error("Error fetching trending itineraries:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchTrending();
        }
    }, [source]);

    const displayItineraries = useMemo(() => {
        if (source === 'community') {
            // Prioritize fetched itineraries (Real DB data), fallback to static mocks
            let itineraries = fetchedItineraries.length > 0 ? fetchedItineraries : communityItineraries;

            // Filter
            if (category !== 'all') {
                itineraries = itineraries.filter(it =>
                    it.category.toLowerCase() === category.toLowerCase() ||
                    it.tags.some(tag => tag.toLowerCase() === category.toLowerCase())
                );
            }
            return itineraries;
        } else {
            // Mock AI Itineraries
            if (category === 'all') return MOCK_ITINERARIES;
            return MOCK_ITINERARIES.filter(it => it.category === category);
        }
    }, [category, source, fetchedItineraries]);

    const handleRemix = (itinerary: CommunityItinerary) => {
        // Clone and navigate
        const newItinerary = {
            ...itinerary.itinerary,
            id: undefined, // Clear ID to ensure it's treated as new/unsaved
            days: itinerary.itinerary.days?.map((d: any) => ({
                ...d,
                activities: d.activities?.map((a: any) => ({ ...a, id: Math.random().toString(36).substr(2, 9) }))
            })) || []
        };
        navigate('/builder', { state: { itinerary: newItinerary } });
    };

    const handleCommunityCardClick = (itinerary: any) => {
        handleRemix(itinerary);
    };

    return (
        <div className="max-w-7xl mx-auto px-6 pb-24 pt-6">
            {source === 'model' && (
                <div className="flex justify-center mb-10">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center gap-2"
                    >
                        Generate Your Own Trip
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {source === 'community' ? (
                    displayItineraries.map((itinerary: any) => (
                        <CommunityItineraryCard
                            key={itinerary.id}
                            itinerary={itinerary}
                            onClick={() => handleCommunityCardClick(itinerary)}
                            onRemix={() => handleRemix(itinerary)}
                        />
                    ))
                ) : (
                    displayItineraries.map((itinerary: any) => (
                        <ItineraryCard key={itinerary.id} {...itinerary} />
                    ))
                )}
            </div>

            {displayItineraries.length === 0 && !loading && (
                <div className="text-center py-20">
                    <div className="text-4xl mb-4">🏝️</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No trips found in this category yet.</h3>
                    <p className="text-slate-500">Try selecting a different category or search for a destination.</p>
                </div>
            )}

            {loading && source === 'community' && (
                <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading community trips...</p>
                </div>
            )}

            {/* View All Button */}
            <div className="flex justify-center mt-16">
                {source === 'community' && (
                    <button
                        onClick={() => navigate('/community')}
                        className="px-8 py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center gap-2"
                    >
                        View all Community Itineraries
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ItineraryGrid;
