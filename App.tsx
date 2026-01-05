import React, { useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ItineraryBuilder from './components/ItineraryDisplay';
import CommunityPage from './components/CommunityPage';
import { HowItWorks, ContactUs, SiteMap, TermsOfUse, PrivacyPolicy, CookieConsent, AccessibilityStatement } from './components/FooterPages';
import { generateQuickItinerary, getDemoItinerary } from './services/geminiService';
import { Itinerary } from './types';

// New Components
import SearchHeader from './components/home/SearchHeader';
import CategoryBar from './components/home/CategoryBar';
import ItineraryGrid from './components/home/ItineraryGrid';
import SourceToggle from './components/home/SourceToggle';
import PlanningSuggestions from './components/PlanningSuggestions';

const getEmptyItinerary = (): Itinerary => ({
  destination: "My Trip",
  days: [
    {
      day: 1,
      theme: "Adventure Begins",
      activities: []
    }
  ],
  hasArrivalFlight: true,
  hasDepartureFlight: true
});

const App: React.FC = () => {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [itinerarySource, setItinerarySource] = useState<'community' | 'model'>('community');

  // Helper to ensure all activities have IDs
  const sanitizeItinerary = (data: Itinerary): Itinerary => {
    return {
      ...data,
      days: data.days.map(day => ({
        ...day,
        activities: day.activities.map(act => ({
          ...act,
          id: act.id || Math.random().toString(36).substr(2, 9)
        }))
      }))
    };
  };

  // We need a navigate hook here to redirect after search in valid react-router context
  // App is rendered inside BrowserRouter in index.tsx
  const navigate = useNavigate();

  const handleSearchAndRedirect = useCallback(async (destination: string) => {
    navigate('/planning-suggestions', { state: { destination } });
  }, [navigate]);

  const handleAddDay = useCallback(() => {
    setItinerary(prev => {
      if (!prev) return null;
      const newDayNum = prev.days.length + 1;
      return {
        ...prev,
        days: [
          ...prev.days,
          {
            day: newDayNum,
            theme: "Free Day",
            activities: []
          }
        ]
      };
    });
  }, []);

  const handleRemoveDay = useCallback((dayNum: number) => {
    setItinerary(prev => {
      if (!prev) return null;
      if (prev.days.length <= 1) return prev; // Prevent deleting the last day

      const newDays = prev.days
        .filter(d => d.day !== dayNum)
        .map((d, index) => ({
          ...d,
          day: index + 1 // Re-index days
        }));

      return {
        ...prev,
        days: newDays
      };
    });
  }, []);

  const handleRemoveActivity = useCallback((dayIndex: number, activityIndex: number) => {
    setItinerary(prev => {
      if (!prev) return null;
      const newDays = [...prev.days];
      const day = { ...newDays[dayIndex] };
      const newActivities = [...day.activities];
      newActivities.splice(activityIndex, 1);
      day.activities = newActivities;
      newDays[dayIndex] = day;
      return { ...prev, days: newDays };
    });
  }, []);

  const handleUpdateActivity = useCallback((dayIndex: number, activityIndex: number, newActivity: any) => {
    setItinerary(prev => {
      if (!prev) return null;
      const newDays = [...prev.days];
      const day = { ...newDays[dayIndex] };
      const newActivities = [...day.activities];
      newActivities[activityIndex] = { ...newActivities[activityIndex], ...newActivity };
      day.activities = newActivities;
      newDays[dayIndex] = day;
      return { ...prev, days: newDays };
    });
  }, []);

  const handleRemoveArrivalFlight = useCallback(() => {
    setItinerary(prev => {
      if (!prev) return null;
      return { ...prev, hasArrivalFlight: false };
    });
  }, []);

  const handleRemoveDepartureFlight = useCallback(() => {
    setItinerary(prev => {
      if (!prev) return null;
      return { ...prev, hasDepartureFlight: false };
    });
  }, []);

  const handleRemoveHotel = useCallback((dayIndex: number) => {
    setItinerary(prev => {
      if (!prev) return null;
      const newDays = [...prev.days];
      newDays[dayIndex] = { ...newDays[dayIndex], hasHotel: false };
      return { ...prev, days: newDays };
    });
  }, []);

  const handleReorderActivity = useCallback((dayIndex: number, oldIndex: number, newIndex: number) => {
    setItinerary(prev => {
      if (!prev) return null;
      const newDays = [...prev.days];
      const day = { ...newDays[dayIndex] };
      const newActivities = [...day.activities];

      if (newIndex < 0 || newIndex >= newActivities.length) return prev;

      const [movedActivity] = newActivities.splice(oldIndex, 1);
      newActivities.splice(newIndex, 0, movedActivity);

      day.activities = newActivities;
      newDays[dayIndex] = day;
      return { ...prev, days: newDays };
    });
  }, []);

  const handleUpdateDay = useCallback((dayIndex: number, newDayData: any) => {
    setItinerary(prev => {
      if (!prev) return null;
      const newDays = [...prev.days];
      newDays[dayIndex] = { ...newDays[dayIndex], ...newDayData };
      return { ...prev, days: newDays };
    });
  }, []);

  const handleOpenDemo = useCallback(() => {
    const demoData = getDemoItinerary();
    // Navigate to builder with demo data
    navigate('/builder', { state: { itinerary: sanitizeItinerary(demoData as Itinerary) } });
  }, [navigate]);

  return (
    <Routes>
      {/* Home Page Route */}
      <Route path="/" element={
        <div className="min-h-screen bg-white">
          <Navbar onOpenBuilder={handleOpenDemo} />
          <main className="pt-24">
            <SearchHeader onSearch={handleSearchAndRedirect} />
            <SourceToggle
              selectedSource={itinerarySource}
              onSelectSource={setItinerarySource}
            />
            <CategoryBar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <ItineraryGrid
              category={selectedCategory}
              source={itinerarySource}
            />

            {/* Dynamic AI Loading Overlay */}
            {isLoading && (
              <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-24 h-24 border-[10px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-10"></div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Initializing Your Journey...</h2>
                <p className="text-xl text-slate-500 font-semibold max-w-lg">Our AI is synchronizing global travel data and optimizing your personal route.</p>
              </div>
            )}

            {error && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-6">
                <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] text-center shadow-2xl animate-bounce">
                  <p className="text-red-900 font-bold text-lg mb-1">System Error</p>
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                  <button onClick={() => setError(null)} className="mt-4 text-xs font-black text-red-900 uppercase tracking-widest border-b-2 border-red-200 hover:border-red-900 transition-all">Dismiss</button>
                </div>
              </div>
            )}

            <footer className="bg-slate-50 py-12 border-t border-slate-200 mt-12 mb-20 md:mb-0">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100">N</div>
                    <span className="font-black text-xl text-slate-900 tracking-tighter">NextDestination<span className="text-indigo-600">.ai</span></span>
                  </div>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-sm">
                    Discover the world's most amazing adventures, curated by travelers and optimized by AI.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 text-sm">Support</h4>
                  <ul className="space-y-3 text-slate-500 text-sm">
                    <li><a href="/how-it-works" className="hover:text-indigo-600 transition-colors">How it works</a></li>
                    <li><a href="/contact" className="hover:text-indigo-600 transition-colors">Contact</a></li>
                    <li><a href="/sitemap" className="hover:text-indigo-600 transition-colors">Site Map</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 text-sm">Legal</h4>
                  <ul className="space-y-3 text-slate-500 text-sm">
                    <li><a href="/terms" className="hover:text-indigo-600 transition-colors">Terms</a></li>
                    <li><a href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</a></li>
                  </ul>
                </div>
              </div>
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200">
                <div className="text-slate-400 font-medium text-xs">
                  © 2025 NextDestination Technologies.
                </div>
              </div>
            </footer>
          </main>
        </div>
      } />

      {/* Community Page Route */}
      <Route path="/community" element={<CommunityPage />} />

      {/* Planning Suggestions Route */}
      <Route path="/planning-suggestions" element={<PlanningSuggestions />} />

      {/* Builder Page Route */}
      <Route path="/builder" element={
        <div className="min-h-screen bg-slate-50 selection:bg-indigo-100">
          <main>
            {isLoading && (
              <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-24 h-24 border-[10px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-10"></div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Initializing Your Journey...</h2>
                <p className="text-xl text-slate-500 font-semibold max-w-lg">Our AI is synchronizing global travel data and optimizing your personal route.</p>
              </div>
            )}

            <BuilderPageContent
              itinerary={itinerary}
              setItinerary={setItinerary}
              handleAddDay={handleAddDay}
              handleRemoveDay={handleRemoveDay}
              handleReorderActivity={handleReorderActivity}
              handleRemoveActivity={handleRemoveActivity}
              handleUpdateActivity={handleUpdateActivity}
              handleRemoveArrivalFlight={handleRemoveArrivalFlight}
              handleRemoveDepartureFlight={handleRemoveDepartureFlight}
              handleRemoveHotel={handleRemoveHotel}
              handleUpdateDay={handleUpdateDay}
            />

            {error && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-6">
                <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] text-center shadow-2xl animate-bounce">
                  <p className="text-red-900 font-bold text-lg mb-1">System Error</p>
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                  <button onClick={() => setError(null)} className="mt-4 text-xs font-black text-red-900 uppercase tracking-widest border-b-2 border-red-200 hover:border-red-900 transition-all">Dismiss</button>
                </div>
              </div>
            )}
          </main>
        </div>
      } />
      <Route path="/how-it-works" element={<><Navbar onOpenBuilder={handleOpenDemo} /><HowItWorks /></>} />
      <Route path="/contact" element={<><Navbar onOpenBuilder={handleOpenDemo} /><ContactUs /></>} />
      <Route path="/sitemap" element={<><Navbar onOpenBuilder={handleOpenDemo} /><SiteMap /></>} />
      <Route path="/terms" element={<><Navbar onOpenBuilder={handleOpenDemo} /><TermsOfUse /></>} />
      <Route path="/privacy" element={<><Navbar onOpenBuilder={handleOpenDemo} /><PrivacyPolicy /></>} />
      <Route path="/cookie-consent" element={<><Navbar onOpenBuilder={handleOpenDemo} /><CookieConsent /></>} />
      <Route path="/accessibility" element={<><Navbar onOpenBuilder={handleOpenDemo} /><AccessibilityStatement /></>} />
    </Routes>
  );
};

// Builder Page Content Component
interface BuilderPageContentProps {
  itinerary: Itinerary | null;
  setItinerary: React.Dispatch<React.SetStateAction<Itinerary | null>>;
  handleAddDay: () => void;
  handleRemoveDay: (dayNum: number) => void;
  handleReorderActivity: (dayIndex: number, oldIndex: number, newIndex: number) => void;
  handleRemoveActivity: (dayIndex: number, activityIndex: number) => void;
  handleUpdateActivity: (dayIndex: number, activityIndex: number, newActivity: any) => void;
  handleRemoveArrivalFlight: () => void;
  handleRemoveDepartureFlight: () => void;
  handleRemoveHotel: (dayIndex: number) => void;
  handleUpdateDay: (dayIndex: number, newDayData: any) => void;
}

const BuilderPageContent: React.FC<BuilderPageContentProps> = ({
  itinerary,
  setItinerary,
  handleAddDay,
  handleRemoveDay,
  handleReorderActivity,
  handleRemoveActivity,
  handleUpdateActivity,
  handleRemoveArrivalFlight,
  handleRemoveDepartureFlight,
  handleRemoveHotel,
  handleUpdateDay
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have an itinerary from navigation state (from community page)
  React.useEffect(() => {
    if (location.state?.itinerary) {
      setItinerary(location.state.itinerary);
    }
  }, [location.state, setItinerary]);

  if (!itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl">
              ✨
            </div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Start Your Journey</h2>
          <p className="text-lg text-slate-600 font-medium mb-12 max-w-lg mx-auto">
            Ready to plan your next adventure? Choose how you'd like to begin building your perfect itinerary.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setItinerary(getEmptyItinerary())}
              className="group p-8 bg-white border-2 border-slate-200 hover:border-indigo-600 rounded-3xl text-left transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-indigo-600 rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Start from Scratch</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Build your itinerary day by day with full control over every detail.</p>
            </button>

            <button
              onClick={() => {
                const demoData = getDemoItinerary();
                setItinerary({
                  ...demoData,
                  days: demoData.days.map(day => ({
                    ...day,
                    activities: day.activities.map(act => ({
                      ...act,
                      id: act.id || Math.random().toString(36).substr(2, 9)
                    }))
                  }))
                } as Itinerary);
              }}
              className="group p-8 bg-white border-2 border-slate-200 hover:border-purple-600 rounded-3xl text-left transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-purple-600 rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">View Demo Trip</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">Explore a pre-built luxury trip to Paris to see what's possible.</p>
            </button>
          </div>

          <div className="mt-12">
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return itinerary ? (
    <ItineraryBuilder
      data={itinerary}
      onBackToHome={() => navigate('/')}
      onAddActivity={(dayIndex, initialData) => {
        setItinerary(prev => {
          if (!prev) return null;
          const newDays = [...prev.days];
          const day = { ...newDays[dayIndex] };
          day.activities = [
            ...day.activities,
            {
              id: Math.random().toString(36).substr(2, 9),
              time: "09:00",
              activity: "",
              description: "",
              location: "",
              type: "activity",
              ...(initialData || {}) // Merge initial data if provided
            }
          ];
          newDays[dayIndex] = day;
          return { ...prev, days: newDays };
        });
      }}
      onAddDay={handleAddDay}
      onRemoveDay={handleRemoveDay}
      onReorderActivity={handleReorderActivity}
      onRemoveActivity={handleRemoveActivity}
      onUpdateActivity={handleUpdateActivity}
      onRemoveArrivalFlight={handleRemoveArrivalFlight}
      onRemoveDepartureFlight={handleRemoveDepartureFlight}
      onRemoveHotel={handleRemoveHotel}
      onUpdateDay={handleUpdateDay}
    />
  ) : null;
};

export default App;
