import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar, Cloud, Sun, CloudRain, Sparkles } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { SafeAreaView, MobileButton, MobileInput } from '../components/ui';
import { useHaptic } from '../hooks/useHaptic';
import { useItineraryStore, generateQuickItinerary, getWeather, getCoordinates } from '@nextdestination/shared';

const INTEREST_CHIPS = [
  { id: 'culture', label: 'Culture & History', emoji: '🏛️' },
  { id: 'food', label: 'Food & Dining', emoji: '🍽️' },
  { id: 'nature', label: 'Nature & Parks', emoji: '🌿' },
  { id: 'adventure', label: 'Adventure', emoji: '🎢' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { id: 'relaxation', label: 'Relaxation', emoji: '🧘' },
  { id: 'photography', label: 'Photography', emoji: '📸' },
];

interface WeatherData {
  temp: number;
  condition: string;
  icon: 'sun' | 'cloud' | 'rain';
}

export const PlanningSuggestionsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const haptic = useHaptic();
  const { setItinerary, setGenerationStatus, resetGeneration } = useItineraryStore();

  const initialDestination = (location.state as any)?.destination || '';

  const [destination, setDestination] = useState(initialDestination);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch weather when destination changes
  useEffect(() => {
    if (destination.length > 3) {
      const fetchWeatherData = async () => {
        try {
          const coords = await getCoordinates(destination);
          if (coords) {
            const weatherData = await getWeather(coords.lat, coords.lng);
            if (weatherData) {
              setWeather({
                temp: weatherData.temp,
                condition: weatherData.condition,
                icon: weatherData.condition.toLowerCase().includes('rain')
                  ? 'rain'
                  : weatherData.condition.toLowerCase().includes('cloud')
                  ? 'cloud'
                  : 'sun',
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch weather:', error);
        }
      };
      const debounce = setTimeout(fetchWeatherData, 500);
      return () => clearTimeout(debounce);
    }
  }, [destination]);

  const handleInterestToggle = async (interestId: string) => {
    await haptic.light();
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleBack = async () => {
    await haptic.light();
    navigate(-1);
  };

  const calculateDays = (): number => {
    if (!startDate || !endDate) return 3;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(diffDays + 1, 14));
  };

  const handleGenerate = async () => {
    if (!destination) {
      await haptic.error();
      return;
    }

    await haptic.medium();
    setIsGenerating(true);
    resetGeneration();
    setGenerationStatus('loading');

    try {
      const days = calculateDays();
      const interests = selectedInterests
        .map((id) => INTEREST_CHIPS.find((c) => c.id === id)?.label)
        .filter(Boolean)
        .join(', ');

      const query = interests
        ? `${days} day trip to ${destination} focusing on ${interests}`
        : `${days} day trip to ${destination}`;

      const itinerary = await generateQuickItinerary(query, days);

      if (itinerary) {
        setItinerary({
          ...itinerary,
          startDate: startDate?.toISOString(),
        });
        setGenerationStatus('complete');
        await haptic.success();
        navigate('/builder', { state: { isNew: true } });
      } else {
        throw new Error('Failed to generate itinerary');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationStatus('error');
      await haptic.error();
    } finally {
      setIsGenerating(false);
    }
  };

  const WeatherIcon = weather?.icon === 'rain' ? CloudRain : weather?.icon === 'cloud' ? Cloud : Sun;

  return (
    <SafeAreaView className="min-h-screen bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-slate-100">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-slate-900 -ml-8">
          Plan Your Trip
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        {/* Destination Input */}
        <div className="mb-6">
          <MobileInput
            label="Where are you going?"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            leftIcon={<MapPin className="w-5 h-5" />}
          />
        </div>

        {/* Weather Widget */}
        {weather && destination && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Current Weather</p>
                <p className="text-2xl font-bold text-slate-900">{weather.temp}°C</p>
                <p className="text-sm text-slate-600">{weather.condition}</p>
              </div>
              <WeatherIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            When are you traveling?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                minDate={new Date()}
                placeholderText="Select start"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || new Date()}
                placeholderText="Select end"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          {startDate && endDate && (
            <p className="mt-2 text-sm text-blue-600 font-medium">
              {calculateDays()} day trip
            </p>
          )}
        </div>

        {/* Interest Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            What interests you? (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_CHIPS.map((interest) => (
              <button
                key={interest.id}
                onClick={() => handleInterestToggle(interest.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedInterests.includes(interest.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <span className="mr-1">{interest.emoji}</span>
                {interest.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 safe-area-bottom">
        <MobileButton
          fullWidth
          onClick={handleGenerate}
          loading={isGenerating}
          disabled={!destination}
          hapticFeedback="heavy"
          icon={<Sparkles className="w-5 h-5" />}
          size="lg"
        >
          {isGenerating ? 'Generating...' : 'Generate Trip'}
        </MobileButton>
      </div>
    </SafeAreaView>
  );
};
