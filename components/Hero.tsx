
import React, { useState } from 'react';

interface HeroProps {
  onSearch: (destination: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <div className="relative h-[95vh] min-h-[750px] w-full flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=2000" 
          alt="Breathtaking mountain lake" 
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-slate-50" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-sm animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
          Now powered by Gemini 3.0
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tight drop-shadow-2xl">
          Your World, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Customized by AI</span>
        </h1>
        <p className="text-xl md:text-2xl text-white/95 mb-12 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-md">
          Don't settle for generic trips. Generate a 100% custom itinerary that syncs with your preferences and navigates with integrated maps.
        </p>

        {/* Search Bar */}
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl p-3 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-3 border border-white/50"
        >
          <div className="flex-1 flex items-center px-5 py-4 gap-4 bg-white/50 rounded-2xl border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Dream destination (e.g. Amalfi Coast, Tokyo...)" 
              className="w-full bg-transparent outline-none text-slate-900 font-bold text-lg placeholder:text-slate-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 group active:scale-95"
          >
            Create My Plan
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </form>

        <div className="mt-10 flex flex-wrap justify-center gap-10 text-white/80 font-semibold tracking-wide uppercase text-xs">
          <span className="flex items-center gap-2 group cursor-default">
            <div className="w-2 h-2 rounded-full bg-indigo-400 group-hover:scale-150 transition-transform" /> 
            AI Customization
          </span>
          <span className="flex items-center gap-2 group cursor-default">
            <div className="w-2 h-2 rounded-full bg-purple-400 group-hover:scale-150 transition-transform" /> 
            Integrated Maps
          </span>
          <span className="flex items-center gap-2 group cursor-default">
            <div className="w-2 h-2 rounded-full bg-pink-400 group-hover:scale-150 transition-transform" /> 
            Community Insights
          </span>
        </div>
      </div>
    </div>
  );
};

export default Hero;
