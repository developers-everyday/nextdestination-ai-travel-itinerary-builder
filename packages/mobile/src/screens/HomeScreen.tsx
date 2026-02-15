import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mic, MapPin, TrendingUp, ChevronRight } from 'lucide-react';
import { SafeAreaView, MobileButton, MobileCard } from '../components/ui';
import { useAuth } from '../components/AuthContext';
import { useHaptic } from '../hooks/useHaptic';
import { communityItineraries } from '@nextdestination/shared';

const CATEGORY_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'budget', label: 'Budget' },
  { id: 'family', label: 'Family' },
  { id: 'solo', label: 'Solo' },
  { id: 'romantic', label: 'Romantic' },
];

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const haptic = useHaptic();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const trendingItineraries = communityItineraries.filter(i => i.trending).slice(0, 5);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      haptic.medium();
      navigate('/planning', { state: { destination: searchQuery } });
    }
  }, [searchQuery, navigate, haptic]);

  const handleVoiceSearch = async () => {
    await haptic.light();
    // Voice search would be implemented with speech recognition
    console.log('Voice search activated');
  };

  const handleCategorySelect = async (categoryId: string) => {
    await haptic.light();
    setSelectedCategory(categoryId);
  };

  const handleItineraryPress = async (itineraryId: string) => {
    await haptic.light();
    navigate(`/share/${itineraryId}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await haptic.light();
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView className="min-h-screen bg-slate-50" edges={['top']}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {user ? `Hello, ${user.email?.split('@')[0]}` : 'NextDestination'}
            </h1>
            <p className="text-slate-500 text-sm">Where to next?</p>
          </div>
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="flex items-center bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-3">
            <MapPin className="w-5 h-5 text-blue-600 mr-3" />
            <input
              type="text"
              placeholder="Where do you want to go?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
            />
            <button
              onClick={handleVoiceSearch}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-2"
            >
              <Mic className="w-5 h-5 text-slate-400" />
            </button>
            <button
              onClick={handleSearch}
              className="p-2 bg-blue-600 rounded-xl"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Chips */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORY_CHIPS.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      {isRefreshing && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Trending Section */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-slate-900">Trending Trips</h2>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center text-blue-600 text-sm font-medium"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Carousel */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {trendingItineraries.map((itinerary) => (
            <MobileCard
              key={itinerary.id}
              onPress={() => handleItineraryPress(itinerary.id)}
              className="min-w-[280px] rounded-2xl overflow-hidden"
            >
              <div className="relative">
                <img
                  src={itinerary.image}
                  alt={itinerary.name}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-slate-700">
                  {itinerary.duration} days
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 mb-1">{itinerary.name}</h3>
                <div className="flex items-center text-slate-500 text-sm mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {itinerary.destination}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={itinerary.creator.avatar}
                      alt={itinerary.creator.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-xs text-slate-500">{itinerary.creator.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{itinerary.saveCount} saves</span>
                </div>
              </div>
            </MobileCard>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Quick Start</h2>
        <div className="grid grid-cols-2 gap-3">
          <MobileButton
            variant="secondary"
            fullWidth
            onClick={() => navigate('/planning')}
            className="py-4 flex-col gap-2"
          >
            <span className="text-2xl">✨</span>
            <span>AI Trip Planner</span>
          </MobileButton>
          <MobileButton
            variant="secondary"
            fullWidth
            onClick={() => navigate('/explore')}
            className="py-4 flex-col gap-2"
          >
            <span className="text-2xl">🌍</span>
            <span>Explore Trips</span>
          </MobileButton>
        </div>
      </div>
    </SafeAreaView>
  );
};
