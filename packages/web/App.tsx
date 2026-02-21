import React, { useState, useCallback, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Navbar from './components/Navbar';
import SEOHead, { homePageSchema, faqSchema, communityPageSchema, howItWorksSchema } from './components/SEOHead';
import { usePageTracking } from './components/usePageTracking';
import { generateQuickItinerary, getDemoItinerary } from '@nextdestination/shared';
import { Itinerary } from '@nextdestination/shared';

// Home-page components — eagerly loaded because they are the first thing every
// visitor sees. Keeping them in the main bundle avoids a flash on the landing page.
import SearchHeader from './components/home/SearchHeader';
import CategoryBar from './components/home/CategoryBar';
import ItineraryGrid from './components/home/ItineraryGrid';
import HomeChatWidget from './components/home/HomeChatWidget';

// Infrastructure — tiny, always needed
import { useItineraryStore } from './store/useItineraryStore';
import RequireAuth from './components/RequireAuth';
import { APIProvider } from '@vis.gl/react-google-maps';

// ── Lazy-loaded components ─────────────────────────────────────────────────
// Vite splits each lazy import into a separate chunk that is only downloaded
// when the user first navigates to the relevant route or triggers the feature.
// This cuts the initial JS payload that every visitor must parse and execute.

// Route-specific pages
const ItineraryBuilder = React.lazy(() => import('./components/ItineraryDisplay'));
const CommunityPage = React.lazy(() => import('./components/CommunityPage'));
const PlanningSuggestions = React.lazy(() => import('./components/PlanningSuggestions'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const SignupPage = React.lazy(() => import('./components/SignupPage'));
const SharedItineraryPage = React.lazy(() => import('./components/SharedItineraryPage'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));
const UpgradeSuccess = React.lazy(() => import('./components/UpgradeSuccess'));

// Always-mounted but activation-gated — load silently in background, never
// show a spinner (user doesn't interact with these until well after page load)
const VoiceAgent = React.lazy(() => import('./components/VoiceAgent'));
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));

// Footer pages — rarely visited; no reason to ship in the main bundle.
// All come from the same module so it is fetched only once by the browser.
const HowItWorks = React.lazy(() => import('./components/FooterPages').then(m => ({ default: m.HowItWorks })));
const ContactUs = React.lazy(() => import('./components/FooterPages').then(m => ({ default: m.ContactUs })));
const SiteMap = React.lazy(() => import('./components/FooterPages').then(m => ({ default: m.SiteMap })));
const TermsOfUse = React.lazy(() => import('./components/FooterPages').then(m => ({ default: m.TermsOfUse })));
const PrivacyPolicy = React.lazy(() => import('./components/FooterPages').then(m => ({ default: m.PrivacyPolicy })));
const CookieConsent = React.lazy(() => import('./components/FooterPages').then(m => ({ default: m.CookieConsent })));
const AccessibilityStatement = React.lazy(() => import('./components/FooterPages').then(m => ({ default: m.AccessibilityStatement })));

// Shared full-page loading fallback — matches the app's visual language
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

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

const TravelApp: React.FC = () => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // GA4 SPA route-change tracking
  usePageTracking();


  // Use centralized store
  const {
    itinerary,
    setItinerary,
    addDay,
    removeDay,
    addActivity,
    removeActivity,
    updateActivity,
    reorderActivity,
    setHasArrivalFlight,
    setHasDepartureFlight,
    setHasHotel,
    updateDay
  } = useItineraryStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const removeArrivalFlightWrapper = useCallback(() => setHasArrivalFlight(false), [setHasArrivalFlight]);
  const removeDepartureFlightWrapper = useCallback(() => setHasDepartureFlight(false), [setHasDepartureFlight]);
  const removeHotelWrapper = useCallback((dayIndex: number) => setHasHotel(dayIndex, false), [setHasHotel]);

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

  const handleOpenDemo = useCallback(() => {
    const demoData = getDemoItinerary();
    // Navigate to builder with demo data
    setItinerary(sanitizeItinerary(demoData as Itinerary));
    navigate('/builder', { state: { itinerary: sanitizeItinerary(demoData as Itinerary) } });
  }, [navigate, setItinerary]);

  return (
    <APIProvider
      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""} // Assuming environment variable is set
      onLoad={() => setIsGoogleMapsLoaded(true)}
      libraries={['places']}
    >
      <AuthProvider>
        {/* null fallback — these load silently; no spinner shown to user */}
        <Suspense fallback={null}><VoiceAgent /></Suspense>
        <Suspense fallback={null}><SettingsModal /></Suspense>
        <Routes>
          {/* Home Page Route */}
          <Route path="/" element={
            <div className="min-h-screen bg-white">
              <SEOHead
                title="AI Travel Planner — Build Your Perfect Itinerary"
                description="Plan your dream trip in seconds with AI. Get personalized travel itineraries with flights, hotels, and activities. Free AI-powered travel planner for 150+ destinations."
                canonicalPath="/"
                structuredData={{ '@context': 'https://schema.org', '@graph': [...homePageSchema['@graph'], ...faqSchema.mainEntity.map(q => q)] }}
              />
              <Navbar onOpenBuilder={handleOpenDemo} />
              <main className="pt-24">
                <SearchHeader
                  onSearch={handleSearchAndRedirect}
                  isScriptLoaded={isGoogleMapsLoaded}
                />

                <CategoryBar
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
                <ItineraryGrid
                  category={selectedCategory}
                  source="community"
                />

                <HomeChatWidget
                  onGenerate={(data) => {
                    if (data.destination) {
                      setIsLoading(true);
                      generateQuickItinerary(data.destination, data.days || 3, data.interests || [])
                        .then((itineraryData: any) => {
                          setItinerary(sanitizeItinerary(itineraryData));
                          navigate('/builder', { state: { itinerary: sanitizeItinerary(itineraryData) } });
                        })
                        .catch((err: any) => setError(err.message))
                        .finally(() => setIsLoading(false));
                    }
                  }}
                  onBrowse={(data) => {
                    navigate('/planning-suggestions', { state: { destination: data.destination || "Paris" } });
                  }}
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
                  {/* Footer content unchanged */}
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
          <Route path="/community" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead
                title="Community Travel Itineraries — Real Trips by Real Travelers"
                description="Browse and remix travel itineraries created by our community. Solo trips, couple getaways, and family vacations to 150+ destinations."
                canonicalPath="/community"
                structuredData={communityPageSchema}
              />
              <CommunityPage />
            </Suspense>
          } />

          {/* Planning Suggestions Route */}
          <Route path="/planning-suggestions" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead
                title="Plan Your Trip — AI Itinerary Builder"
                description="Create a custom travel itinerary with AI. Choose your destination, dates, travel style and interests — our AI builds your perfect plan in seconds."
                canonicalPath="/planning-suggestions"
              />
              <PlanningSuggestions />
            </Suspense>
          } />

          {/* Login Page Route */}
          <Route path="/login" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead title="Log In" description="Log in to NextDestination.ai to access your saved itineraries and travel plans." canonicalPath="/login" noindex />
              <LoginPage />
            </Suspense>
          } />

          {/* Signup Page Route */}
          <Route path="/signup" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead title="Sign Up" description="Create your free NextDestination.ai account and start building AI-powered travel itineraries." canonicalPath="/signup" noindex />
              <SignupPage />
            </Suspense>
          } />

          {/* Profile Page Route */}
          <Route path="/profile" element={
            <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>
          } />

          {/* Upgrade Success Route */}
          <Route path="/upgrade/success" element={
            <Suspense fallback={<PageLoader />}><UpgradeSuccess /></Suspense>
          } />

          {/* Shared Itinerary Route */}
          <Route path="/share/:id" element={
            <Suspense fallback={<PageLoader />}>
              <SharedItineraryPage isScriptLoaded={isGoogleMapsLoaded} />
            </Suspense>
          } />

          {/* Builder Page Route - Protected */}
          <Route path="/builder" element={
            <RequireAuth>
              <BuilderPageContent
                itinerary={itinerary}
                setItinerary={setItinerary}
                handleAddDay={addDay}
                handleRemoveDay={removeDay}
                handleReorderActivity={reorderActivity}
                handleRemoveActivity={removeActivity}
                handleUpdateActivity={updateActivity}
                handleRemoveArrivalFlight={removeArrivalFlightWrapper}
                handleRemoveDepartureFlight={removeDepartureFlightWrapper}
                handleRemoveHotel={removeHotelWrapper}
                handleUpdateDay={updateDay}
                handleAddActivity={(dayIndex, initialData, index) => {
                  const newItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    time: "09:00",
                    activity: "",
                    description: "",
                    location: "",
                    type: "activity" as "activity",
                    ...(initialData || {})
                  };
                  addActivity(dayIndex, newItem, index);
                }}
                isScriptLoaded={isGoogleMapsLoaded}
              />
            </RequireAuth>
          } />

          {/* Footer pages — all lazy; share one downloaded chunk */}
          <Route path="/how-it-works" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead title="How It Works — AI-Powered Travel Planning" description="See how NextDestination.ai uses AI to create personalized travel itineraries in 3 simple steps. Plan smarter, travel better." canonicalPath="/how-it-works" structuredData={howItWorksSchema} />
              <Navbar onOpenBuilder={handleOpenDemo} /><HowItWorks />
            </Suspense>
          } />
          <Route path="/contact" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead title="Contact Us" description="Get in touch with the NextDestination.ai team. We'd love to hear your feedback, questions, or partnership ideas." canonicalPath="/contact" />
              <Navbar onOpenBuilder={handleOpenDemo} /><ContactUs />
            </Suspense>
          } />
          <Route path="/sitemap" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead title="Site Map" description="Navigate all pages on NextDestination.ai — the AI-powered travel itinerary planner." canonicalPath="/sitemap" />
              <Navbar onOpenBuilder={handleOpenDemo} /><SiteMap />
            </Suspense>
          } />
          <Route path="/terms" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead title="Terms of Use" description="Read the terms of use for NextDestination.ai, the AI-powered travel planning platform." canonicalPath="/terms" />
              <Navbar onOpenBuilder={handleOpenDemo} /><TermsOfUse />
            </Suspense>
          } />
          <Route path="/privacy" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead title="Privacy Policy" description="Learn how NextDestination.ai collects, uses, and protects your personal data." canonicalPath="/privacy" />
              <Navbar onOpenBuilder={handleOpenDemo} /><PrivacyPolicy />
            </Suspense>
          } />
          <Route path="/cookie-consent" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead title="Cookie Policy" description="Understand how NextDestination.ai uses cookies to improve your travel planning experience." canonicalPath="/cookie-consent" />
              <Navbar onOpenBuilder={handleOpenDemo} /><CookieConsent />
            </Suspense>
          } />
          <Route path="/accessibility" element={
            <Suspense fallback={<PageLoader />}>
              <SEOHead title="Accessibility Statement" description="NextDestination.ai is committed to making travel planning accessible to everyone." canonicalPath="/accessibility" />
              <Navbar onOpenBuilder={handleOpenDemo} /><AccessibilityStatement />
            </Suspense>
          } />
        </Routes>
      </AuthProvider >
    </APIProvider>
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
  handleAddActivity: (dayIndex: number, initialData?: any, index?: number) => void;
  isScriptLoaded: boolean;
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
  handleUpdateDay,
  handleAddActivity,
  isScriptLoaded
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have an itinerary from navigation state (from community page)
  React.useEffect(() => {
    if (location.state?.itinerary) {
      setItinerary(location.state.itinerary);
      // If coming from community remix, mark generation as complete
      useItineraryStore.setState({ generationStatus: 'complete', loadedDays: location.state.itinerary.days?.length || 0 });
    }
  }, [location.state, setItinerary]);

  // Read generation status from store
  const { generationStatus, loadedDays, totalDays, generationError, resetGeneration } = useItineraryStore();

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

  return (
    <>
      {/* Generation Progress Overlay */}
      {(generationStatus === 'loading' || generationStatus === 'partial') && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center transition-opacity duration-500">
          <div className="relative mb-10">
            <div className="w-24 h-24 border-[10px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-indigo-600">✈️</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Crafting Your {itinerary?.destination || ''} Trip...
          </h2>
          <p className="text-xl text-slate-500 font-semibold max-w-lg mb-8">
            Our AI is designing a perfect itinerary tailored just for you.
          </p>
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Progress</span>
              <span className="text-sm font-black text-indigo-600">
                {generationStatus === 'loading' ? 'Searching...' : `Day ${loadedDays} of ${totalDays}`}
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: generationStatus === 'loading'
                    ? '15%'
                    : `${Math.max(15, (loadedDays / Math.max(totalDays, 1)) * 100)}%`
                }}
              />
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-400 font-medium animate-pulse">
            This usually takes 5-10 seconds
          </p>
        </div>
      )}

      {/* Generation Error State */}
      {generationStatus === 'error' && generationError && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-4xl mb-8">⚠️</div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">Generation Failed</h2>
          <p className="text-lg text-slate-500 font-medium max-w-md mb-8">{generationError}</p>
          <div className="flex gap-4">
            <button
              onClick={() => { resetGeneration(); navigate('/'); }}
              className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              ← Back Home
            </button>
            <button
              onClick={() => { resetGeneration(); navigate(-1); }}
              className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {itinerary && (
        <Suspense fallback={<PageLoader />}>
          <ItineraryBuilder
            data={itinerary}
            onBackToHome={() => navigate('/')}
            onAddActivity={handleAddActivity}
            onAddDay={handleAddDay}
            onRemoveDay={handleRemoveDay}
            onReorderActivity={handleReorderActivity}
            onRemoveActivity={handleRemoveActivity}
            onUpdateActivity={handleUpdateActivity}
            onRemoveArrivalFlight={handleRemoveArrivalFlight}
            onRemoveDepartureFlight={handleRemoveDepartureFlight}
            onRemoveHotel={handleRemoveHotel}
            onUpdateDay={handleUpdateDay}
            onItineraryChange={(i) => setItinerary(i)}
            isScriptLoaded={isScriptLoaded}
          />
        </Suspense>
      )}
    </>
  );
};

export default TravelApp;
