
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
    <div className="relative w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pt-32 pb-24 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Floating Gradient Orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" style={{ animation: 'float 6s ease-in-out infinite' }}></div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Your Journey, Your Way
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 mb-6 tracking-tight leading-none">
            Planning Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Next Destination?
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
            Travel planning shouldn’t be complicated. We’re here to make it effortless for every traveler.
          </p>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 hover:shadow-2xl hover:shadow-indigo-200/30 transition-all duration-300">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center px-6 py-4 gap-4 bg-slate-50/50 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Where do you want to go? (e.g., Paris, Tokyo, Bali...)"
                  className="w-full bg-transparent outline-none text-slate-900 font-semibold text-lg placeholder:text-slate-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-300/50 group active:scale-95"
              >
                Generate Plan
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </form>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex flex-col items-center gap-2 px-6 py-4 bg-white rounded-2xl shadow-md border border-slate-100 group hover:border-indigo-300 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-slate-900 font-black text-base">Custom Itineraries</span>
            </div>
            <span className="text-slate-500 text-xs font-medium">Because every journey is unique</span>
          </div>
          <div className="flex flex-col items-center gap-2 px-6 py-4 bg-white rounded-2xl shadow-md border border-slate-100 group hover:border-purple-300 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-slate-900 font-black text-base">Community-Driven</span>
            </div>
            <span className="text-slate-500 text-xs font-medium">Learning from people's experience</span>
          </div>
          <div className="flex flex-col items-center gap-2 px-6 py-4 bg-white rounded-2xl shadow-md border border-slate-100 group hover:border-pink-300 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
              <span className="text-slate-900 font-black text-base">Powered by AI</span>
            </div>
            <span className="text-slate-500 text-xs font-medium">An assistant to make your trip unforgettable</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-slate-200">
          <div className="text-center">
            <div className="text-3xl font-black text-slate-900 mb-1">10K+</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Trips Planned</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-slate-900 mb-1">150+</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Destinations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-slate-900 mb-1">2K+</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Active Planners</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
