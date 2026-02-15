import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Share2, MapPin, Clock, Calendar, User, Heart, Copy, Check } from 'lucide-react';
import { SafeAreaView, MobileButton, MobileCard } from '../components/ui';
import { useHaptic } from '../hooks/useHaptic';
import { useItineraryStore, communityItineraries, CommunityItinerary, fetchItineraryFromBackend } from '@nextdestination/shared';

export const SharedItineraryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const haptic = useHaptic();
  const { setItinerary } = useItineraryStore();

  const [itinerary, setLocalItinerary] = useState<CommunityItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadItinerary = async () => {
      setIsLoading(true);

      // First check community itineraries
      const communityItem = communityItineraries.find((i) => i.id === id);
      if (communityItem) {
        setLocalItinerary(communityItem);
        setIsLoading(false);
        return;
      }

      // Otherwise try to fetch from backend
      try {
        const backendItinerary = await fetchItineraryFromBackend(id!);
        if (backendItinerary) {
          // Convert to community format for display
          setLocalItinerary({
            id: id!,
            name: `Trip to ${backendItinerary.destination}`,
            location: backendItinerary.destination,
            destination: backendItinerary.destination,
            image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
            creator: {
              id: 'unknown',
              name: 'Traveler',
              avatar: 'https://ui-avatars.com/api/?name=Traveler',
            },
            saveCount: 0,
            duration: backendItinerary.days.length,
            tags: [],
            category: 'Adventure',
            itinerary: backendItinerary,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Failed to fetch itinerary:', error);
      }

      setIsLoading(false);
    };

    if (id) {
      loadItinerary();
    }
  }, [id]);

  const handleBack = async () => {
    await haptic.light();
    navigate(-1);
  };

  const handleRemix = async () => {
    if (!itinerary) return;
    await haptic.success();
    setItinerary({
      ...itinerary.itinerary,
      sourceImage: itinerary.image,
    });
    navigate('/builder', { state: { isNew: true } });
  };

  const handleSave = async () => {
    await haptic.success();
    setIsSaved(true);
  };

  const handleShare = async () => {
    await haptic.light();
    const shareUrl = `${window.location.origin}/share/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: itinerary?.name,
          text: `Check out this trip: ${itinerary?.name}`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copy
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </SafeAreaView>
    );
  }

  if (!itinerary) {
    return (
      <SafeAreaView className="min-h-screen bg-slate-50" edges={['top']}>
        <div className="flex items-center px-4 py-3">
          <button onClick={handleBack} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-slate-500 text-center mb-4">Itinerary not found</p>
          <MobileButton onClick={() => navigate('/explore')}>
            Browse Itineraries
          </MobileButton>
        </div>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="min-h-screen bg-white" edges={['top']}>
      {/* Header Image */}
      <div className="relative">
        <img
          src={itinerary.image}
          alt={itinerary.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 p-2 bg-white/90 rounded-full shadow-lg"
        >
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-lg"
        >
          {copied ? (
            <Check className="w-6 h-6 text-green-600" />
          ) : (
            <Share2 className="w-6 h-6 text-slate-700" />
          )}
        </button>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-2xl font-bold text-white mb-2">{itinerary.name}</h1>
          <div className="flex items-center gap-4 text-white/90 text-sm">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {itinerary.destination}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {itinerary.duration} days
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-32 overflow-y-auto">
        {/* Creator Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img
              src={itinerary.creator.avatar}
              alt={itinerary.creator.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-slate-900">{itinerary.creator.name}</span>
                {itinerary.creator.verified && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-500">{itinerary.saveCount} saves</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            className={`p-2 rounded-full transition-colors ${
              isSaved ? 'bg-red-100' : 'bg-slate-100'
            }`}
          >
            <Heart
              className={`w-6 h-6 ${isSaved ? 'text-red-500 fill-red-500' : 'text-slate-400'}`}
            />
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            {itinerary.category}
          </span>
          {itinerary.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Day-by-Day Preview */}
        <h2 className="text-lg font-bold text-slate-900 mb-4">Itinerary</h2>
        <div className="space-y-4">
          {itinerary.itinerary.days.map((day) => (
            <MobileCard key={day.day} className="p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-900">Day {day.day}</span>
                <span className="text-sm text-blue-600">{day.theme}</span>
              </div>
              <div className="space-y-2">
                {day.activities.slice(0, 3).map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400 shrink-0">{activity.time}</span>
                    <span className="text-slate-700">{activity.activity}</span>
                  </div>
                ))}
                {day.activities.length > 3 && (
                  <span className="text-sm text-slate-400">
                    +{day.activities.length - 3} more activities
                  </span>
                )}
              </div>
            </MobileCard>
          ))}
        </div>
      </div>

      {/* Fixed Remix Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 safe-area-bottom">
        <MobileButton
          fullWidth
          onClick={handleRemix}
          hapticFeedback="heavy"
          size="lg"
          icon={<Copy className="w-5 h-5" />}
        >
          Remix This Trip
        </MobileButton>
      </div>
    </SafeAreaView>
  );
};
