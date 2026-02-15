import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Heart, Clock, X } from 'lucide-react';
import { SafeAreaView, MobileCard, BottomSheet, MobileButton } from '../components/ui';
import { useHaptic } from '../hooks/useHaptic';
import { communityItineraries, CommunityItinerary } from '@nextdestination/shared';

const CATEGORIES = ['All', 'Adventure', 'Luxury', 'Budget', 'Family', 'Solo', 'Romantic', 'Cultural'];
const DURATIONS = ['Any', '1-3 days', '4-7 days', '8+ days'];

export const CommunityScreen: React.FC = () => {
  const navigate = useNavigate();
  const haptic = useHaptic();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDuration, setSelectedDuration] = useState('Any');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const filteredItineraries = useMemo(() => {
    return communityItineraries.filter((itinerary) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          itinerary.name.toLowerCase().includes(query) ||
          itinerary.destination.toLowerCase().includes(query) ||
          itinerary.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && itinerary.category !== selectedCategory) {
        return false;
      }

      // Duration filter
      if (selectedDuration !== 'Any') {
        if (selectedDuration === '1-3 days' && itinerary.duration > 3) return false;
        if (selectedDuration === '4-7 days' && (itinerary.duration < 4 || itinerary.duration > 7)) return false;
        if (selectedDuration === '8+ days' && itinerary.duration < 8) return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedDuration]);

  const handleItineraryPress = async (itinerary: CommunityItinerary) => {
    await haptic.light();
    navigate(`/share/${itinerary.id}`);
  };

  const handleCategorySelect = async (category: string) => {
    await haptic.light();
    setSelectedCategory(category);
  };

  const handleOpenFilters = async () => {
    await haptic.light();
    setShowFilterSheet(true);
  };

  const handleClearFilters = async () => {
    await haptic.light();
    setSelectedCategory('All');
    setSelectedDuration('Any');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory !== 'All' || selectedDuration !== 'Any';

  return (
    <SafeAreaView className="min-h-screen bg-slate-50" edges={['top']}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Explore Trips</h1>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-white rounded-xl border border-slate-200 px-4 py-3">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              placeholder="Search destinations, styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
          </div>
          <button
            onClick={handleOpenFilters}
            className={`p-3 rounded-xl border transition-colors ${
              hasActiveFilters
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Category Chips */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategorySelect(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-2 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {filteredItineraries.length} itineraries found
        </p>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Itinerary Grid */}
      <div className="px-4 pb-24 overflow-y-auto">
        {filteredItineraries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No itineraries match your search</p>
            <MobileButton
              variant="secondary"
              onClick={handleClearFilters}
              className="mt-4"
            >
              Clear Filters
            </MobileButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItineraries.map((itinerary) => (
              <MobileCard
                key={itinerary.id}
                onPress={() => handleItineraryPress(itinerary)}
                className="rounded-2xl overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={itinerary.image}
                    alt={itinerary.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-slate-700">
                      {itinerary.category}
                    </span>
                    {itinerary.trending && (
                      <span className="px-2 py-1 bg-orange-500 rounded-full text-xs font-medium text-white">
                        Trending
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <button className="p-2 bg-white/90 rounded-full">
                      <Heart className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 mb-1">{itinerary.name}</h3>
                  <div className="flex items-center text-slate-500 text-sm mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    {itinerary.destination}
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4 mr-1" />
                    {itinerary.duration} days
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {itinerary.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Creator */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <img
                        src={itinerary.creator.avatar}
                        alt={itinerary.creator.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-slate-600">{itinerary.creator.name}</span>
                      {itinerary.creator.verified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{itinerary.saveCount} saves</span>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        title="Filters"
        snapPoints={[50]}
      >
        <div className="space-y-6">
          {/* Duration */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Duration</h3>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((duration) => (
                <button
                  key={duration}
                  onClick={() => setSelectedDuration(duration)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedDuration === duration
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {duration}
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <MobileButton
            fullWidth
            onClick={() => setShowFilterSheet(false)}
          >
            Apply Filters
          </MobileButton>
        </div>
      </BottomSheet>
    </SafeAreaView>
  );
};
