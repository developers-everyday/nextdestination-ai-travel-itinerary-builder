import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommunityItineraryCard from './CommunityItineraryCard';
import { CommunityItinerary } from '@nextdestination/shared';

const categories = ['All', 'Adventure', 'Luxury', 'Budget', 'Family', 'Solo', 'Romantic', 'Cultural'] as const;

const CommunityPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItinerary, setSelectedItinerary] = useState<CommunityItinerary | null>(null);

    // State for real data
    const [itineraries, setItineraries] = useState<CommunityItinerary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper to map DB response to UI format
    const mapToCommunityItinerary = (data: any): CommunityItinerary => {
        // Generate consistent pseudo-random values based on ID for visual variety
        const randomId = data.id || Math.random().toString();
        const seed = randomId.charCodeAt(0) || 0;

        return {
            id: data.id,
            name: data.name || `Trip to ${data.destination || 'Unknown'}`,
            location: data.destination || 'Unknown Location',
            destination: data.destination || 'Unknown',
            // Use real image if available, else standard fallback
            image: data.image || `https://images.unsplash.com/photo-${seed % 2 === 0 ? '1476514525535-07fb3b4ae5f1' : '1503899036084-c55cdd92da26'}?q=80&w=800&auto=format&fit=crop`,
            creator: data.creator || {
                id: 'anon',
                name: 'Community Traveler',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id || 'User'}`,
                verified: false
            },
            saveCount: data.saveCount || Math.floor(Math.random() * 500) + 10,
            duration: data.days?.length || data.duration || 3,
            tags: data.tags || ['Travel', data.category || 'Adventure'],
            category: data.category || 'Adventure',
            itinerary: data, // The raw data itself serves as the itinerary object (has days, etc)
            createdAt: data.createdAt || new Date().toISOString(),
            trending: true
        };
    };

    // Fetch data when filters change
    useEffect(() => {
        const fetchItineraries = async () => {
            setIsLoading(true);
            setError(null);
            try {
                let url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/itineraries/trending`;
                const params = new URLSearchParams();

                let method = 'GET';
                let body = undefined;
                let headers = undefined;

                if (searchQuery.trim()) {
                    // Use Search Endpoint
                    url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/itineraries/search`;
                    method = 'POST';
                    headers = { 'Content-Type': 'application/json' };
                    body = JSON.stringify({
                        query: searchQuery,
                        category: selectedCategory === 'All' ? undefined : selectedCategory
                    });
                } else {
                    // Use Trending Endpoint
                    if (selectedCategory !== 'All') {
                        params.append('category', selectedCategory);
                    }
                    if (params.toString()) {
                        url += `?${params.toString()}`;
                    }
                }

                const res = await fetch(url, { method, headers, body });
                if (!res.ok) {
                    throw new Error(`Failed to fetch: ${res.statusText}`);
                }

                const rawData = await res.json();

                // Map and set
                const mapped = Array.isArray(rawData) ? rawData.map(mapToCommunityItinerary) : [];
                setItineraries(mapped);

            } catch (e: any) {
                console.error("Error fetching community itineraries", e);
                setError(e.message || "Failed to load itineraries");
                setItineraries([]); // Clear on error? Or show empty state
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce search to avoid excessive API calls
        const timer = setTimeout(() => {
            fetchItineraries();
        }, 500);

        return () => clearTimeout(timer);
    }, [selectedCategory, searchQuery]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-32 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/')}
                        className="mb-8 flex items-center gap-2 text-white/80 hover:text-white font-bold transition-colors group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Home
                    </button>

                    <div className="text-center max-w-4xl mx-auto">
                        <span className="text-indigo-200 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Community Curated</span>
                        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tighter">
                            Explore Real Journeys
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed mb-12">
                            Discover {itineraries.length > 0 ? 'authentic' : ''} itineraries from our community.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search destinations, tags, or experiences..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-8 py-6 rounded-[2rem] text-slate-900 font-bold text-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-2xl"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 absolute right-8 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter Bar */}
            <section className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
                        <span className="text-sm font-black text-slate-500 uppercase tracking-wider shrink-0">Filter:</span>
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all shrink-0 ${selectedCategory === category
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Results Count */}
            <section className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-slate-600 font-bold">
                        Showing <span className="text-indigo-600 font-black">{itineraries.length}</span> {itineraries.length === 1 ? 'itinerary' : 'itineraries'}
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            Clear search
                        </button>
                    )}
                </div>

                {/* Itinerary Grid OR Loading/Error */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-20">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-[2.5rem] h-[500px] border border-slate-100 animate-pulse">
                                <div className="h-64 bg-slate-200 rounded-t-[2.5rem]"></div>
                                <div className="p-8 space-y-4">
                                    <div className="h-8 bg-slate-200 rounded-xl w-3/4"></div>
                                    <div className="h-4 bg-slate-200 rounded-xl w-1/2"></div>
                                    <div className="flex gap-2 pt-4">
                                        <div className="h-8 w-20 bg-slate-200 rounded-full"></div>
                                        <div className="h-8 w-20 bg-slate-200 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <div className="bg-red-50 text-red-600 p-8 rounded-3xl inline-block">
                            <h3 className="text-xl font-bold mb-2">Oops!</h3>
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()} className="mt-4 underline font-bold">Try Refreshing</button>
                        </div>
                    </div>
                ) : itineraries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-20">
                        {itineraries.map((itinerary) => (
                            <CommunityItineraryCard
                                key={itinerary.id}
                                itinerary={itinerary}
                                onClick={() => setSelectedItinerary(itinerary)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3">No itineraries found</h3>
                        <p className="text-slate-500 font-medium mb-8">Try adjusting your filters or search query</p>
                        <button
                            onClick={() => {
                                setSelectedCategory('All');
                                setSearchQuery('');
                            }}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </section>

            {/* Itinerary Detail Modal */}
            {selectedItinerary && (
                <ItineraryDetailModal
                    itinerary={selectedItinerary}
                    onClose={() => setSelectedItinerary(null)}
                    onCustomize={(itinerary) => {
                        // Navigate to builder with this itinerary
                        // Ensure we strip ID to make it a new copy
                        const safeItinerary = {
                            ...itinerary.itinerary,
                            id: undefined // Force new ID generation
                        };
                        navigate('/builder', { state: { itinerary: safeItinerary } });
                    }}
                />
            )}
        </div>
    );
};

// Itinerary Detail Modal Component
interface ItineraryDetailModalProps {
    itinerary: CommunityItinerary;
    onClose: () => void;
    onCustomize: (itinerary: CommunityItinerary) => void;
}

const ItineraryDetailModal: React.FC<ItineraryDetailModalProps> = ({ itinerary, onClose, onCustomize }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-[3rem] max-w-5xl w-full shadow-2xl animate-slide-up overflow-hidden">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 z-10 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Hero Image */}
                    <div className="h-96 relative overflow-hidden">
                        <img
                            src={itinerary.image}
                            alt={itinerary.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>

                        {/* Title Overlay */}
                        <div className="absolute bottom-8 left-8 right-8">
                            <h2 className="text-5xl font-black text-white mb-4 leading-tight">{itinerary.name}</h2>
                            <div className="flex items-center gap-6 text-white">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-bold">{itinerary.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-bold">{itinerary.duration} Days</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-12">
                        {/* Stats Bar */}
                        <div className="flex items-center justify-between mb-12 pb-8 border-b border-slate-200">
                            <div className="flex items-center gap-4">
                                <img
                                    src={itinerary.creator.avatar}
                                    className="w-16 h-16 rounded-full border-4 border-indigo-100"
                                    alt={itinerary.creator.name}
                                />
                                <div>
                                    <p className="text-sm font-bold text-slate-500">Created by</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-black text-slate-900">{itinerary.creator.name}</p>
                                        {itinerary.creator.verified && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Large Heart with Save Count */}
                            <div className="flex items-center gap-3 bg-red-50 px-6 py-4 rounded-2xl">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8 text-red-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-bold text-slate-500">Saved by</p>
                                    <p className="text-2xl font-black text-slate-900">{itinerary.saveCount.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="mb-8">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-3">
                                {itinerary.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Itinerary Preview */}
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 mb-6">Itinerary Overview</h3>
                            <div className="space-y-4">
                                {itinerary.itinerary.days.map((day, idx) => (
                                    <div key={idx} className="bg-slate-50 p-6 rounded-2xl">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
                                                {day.day}
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900">{day.theme}</h4>
                                        </div>
                                        <p className="text-slate-600 font-medium ml-13">
                                            {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'} planned
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => onCustomize(itinerary)}
                                className="flex-1 bg-indigo-600 text-white px-8 py-6 rounded-[2rem] text-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:translate-y-0"
                            >
                                Customize This Trip
                            </button>
                            <button
                                onClick={onClose}
                                className="px-8 py-6 rounded-[2rem] text-xl font-black border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPage;
