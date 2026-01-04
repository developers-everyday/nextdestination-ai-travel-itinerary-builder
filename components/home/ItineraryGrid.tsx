import React, { useMemo } from 'react';
import ItineraryCard, { ItineraryCardProps } from './ItineraryCard';

interface ItineraryGridProps {
    category: string;
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

const ItineraryGrid: React.FC<ItineraryGridProps> = ({ category }) => {
    const filteredItineraries = useMemo(() => {
        if (category === 'all') return MOCK_ITINERARIES;
        return MOCK_ITINERARIES.filter(it => it.category === category);
    }, [category]);

    return (
        <div className="max-w-7xl mx-auto px-6 pb-24 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {filteredItineraries.map((itinerary) => (
                    <ItineraryCard key={itinerary.id} {...itinerary} />
                ))}
            </div>

            {filteredItineraries.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-4xl mb-4">🏝️</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No trips found in this category yet.</h3>
                    <p className="text-slate-500">Try selecting a different category or search for a destination.</p>
                </div>
            )}
        </div>
    );
};

export default ItineraryGrid;
