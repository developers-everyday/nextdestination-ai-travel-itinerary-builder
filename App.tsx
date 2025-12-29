
import React, { useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import ItineraryBuilder from './components/ItineraryDisplay';
import CommunityPage from './components/CommunityPage';
import { generateQuickItinerary, getDemoItinerary } from './services/geminiService';
import { Itinerary } from './types';

const App: React.FC = () => {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSearch = useCallback(async (destination: string) => {
    setIsLoading(true);
    setError(null);
    setItinerary(null);

    try {
      const rawData = await generateQuickItinerary(destination);
      setItinerary(sanitizeItinerary(rawData));
    } catch (err) {
      setError("We couldn't generate an itinerary for that destination right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Day reordering removed as per user request

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

  const handleOpenDemo = useCallback(() => {
    const demoData = getDemoItinerary();
    setItinerary(sanitizeItinerary(demoData as Itinerary));
  }, []);

  const communityItineraries = [
    {
      name: "Hidden Gems of Positano",
      location: "Amalfi Coast, Italy",
      img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800",
      user: "Marco G.",
      userImg: "https://i.pravatar.cc/150?u=marco",
      trips: 1240
    },
    {
      name: "Cyberpunk Tokyo Nightlife",
      location: "Shibuya, Japan",
      img: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=800",
      user: "Sarah K.",
      userImg: "https://i.pravatar.cc/150?u=sarah",
      trips: 890
    },
    {
      name: "Luxury Retreat in Bali",
      location: "Ubud, Indonesia",
      img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800",
      user: "Julian P.",
      userImg: "https://i.pravatar.cc/150?u=julian",
      trips: 2105
    }
  ];

  return (
    <Routes>
      {/* Home Page Route */}
      <Route path="/" element={
        <div className="min-h-screen bg-slate-50 selection:bg-indigo-100">
          <Navbar onOpenBuilder={handleOpenDemo} />
          <main>
            <Hero onSearch={handleSearch} />
            <Features />

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
            {/* Community Inspiration Section */}
            <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
              <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
                  <div className="max-w-2xl">
                    <span className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Crowdsourced Magic</span>
                    <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tighter">Inspired by <br />True Travelers</h2>
                    <p className="text-slate-400 text-xl leading-relaxed font-medium">
                      Explore successful itineraries shared by the community and let our AI customize them to fit your exact dates and budget.
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/community'}
                    className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all shadow-2xl active:scale-95 shrink-0"
                  >
                    Explore the Community
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {communityItineraries.map((trip, idx) => (
                    <div key={idx} className="group relative rounded-[2.5rem] overflow-hidden bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-500">
                      <div className="h-80 relative overflow-hidden">
                        <img src={trip.img} alt={trip.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                        <div className="absolute top-6 left-6">
                          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Trending Now
                          </div>
                        </div>
                      </div>
                      <div className="p-8">
                        <h3 className="text-2xl font-black text-white mb-2 group-hover:text-indigo-400 transition-colors">{trip.name}</h3>
                        <p className="text-slate-400 font-bold mb-8 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {trip.location}
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <img src={trip.userImg} className="w-10 h-10 rounded-full border-2 border-indigo-500/30" alt={trip.user} />
                            <div>
                              <p className="text-xs font-bold text-slate-300">Creator</p>
                              <p className="text-sm font-black text-white">{trip.user}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-300">Remixed</p>
                            <p className="text-sm font-black text-indigo-400">{trip.trips} times</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Footer Section */}
            <section className="py-32 bg-white relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-50" />

              <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                <h2 className="text-6xl md:text-7xl font-black text-slate-900 mb-10 tracking-tighter leading-tight">Plan Your Perfect Trip in Minutes.</h2>
                <p className="text-2xl text-slate-600 mb-14 font-medium leading-relaxed">No more scattered tabs and endless research. Build your complete itinerary with everything you need.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button
                    onClick={() => window.location.href = '/builder'}
                    className="bg-indigo-600 text-white px-12 py-6 rounded-[2rem] text-xl font-black shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-700 hover:-translate-y-1 transition-all w-full sm:w-auto active:translate-y-0"
                  >
                    Create My Itinerary
                  </button>
                  <button className="bg-slate-50 text-slate-900 px-12 py-6 rounded-[2rem] text-xl font-black hover:bg-slate-100 transition-all w-full sm:w-auto border border-slate-200">
                    View Demo
                  </button>
                </div>
              </div>
            </section>

            <footer className="bg-slate-50 py-20 border-t border-slate-200">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-100">N</div>
                    <span className="font-black text-2xl text-slate-900 tracking-tighter">NextDestination<span className="text-indigo-600">.ai</span></span>
                  </div>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-sm mb-8">
                    Travel planning shouldn’t be complicated. We’re here to make it effortless for every traveler.
                  </p>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Product</h4>
                  <ul className="space-y-4 text-slate-500 font-bold text-sm">
                    <li><a href="#" className="hover:text-indigo-600 transition-colors">AI Builder</a></li>
                    <li><a href="#" className="hover:text-indigo-600 transition-colors">Map Sync</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 mb-6 uppercase tracking-widest text-xs">Company</h4>
                  <ul className="space-y-4 text-slate-500 font-bold text-sm">
                    <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
                    <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
                  </ul>
                </div>
              </div>
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-slate-200/50">
                <div className="text-slate-400 font-bold text-sm">
                  © 2025 NextDestination Technologies. All rights reserved.
                </div>
              </div>
            </footer>
          </main>
        </div>
      } />

      {/* Community Page Route */}
      <Route path="/community" element={<CommunityPage />} />

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
  handleRemoveHotel
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have an itinerary from navigation state (from community page)
  React.useEffect(() => {
    if (location.state?.itinerary && !itinerary) {
      setItinerary(location.state.itinerary);
    }
  }, [location.state, itinerary, setItinerary]);

  if (!itinerary && !location.state?.itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">No itinerary loaded</h2>
          <p className="text-slate-600 font-medium mb-8">Start by creating a new itinerary or exploring the community.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return itinerary ? (
    <ItineraryBuilder
      data={itinerary}
      onBackToHome={() => navigate('/')}
      onAddActivity={(dayIndex) => {
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
              type: "activity"
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
    />
  ) : null;
};

export default App;
