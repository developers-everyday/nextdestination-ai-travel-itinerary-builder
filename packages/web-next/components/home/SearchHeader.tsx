"use client";

import React, { useState } from "react";
import { useApiIsLoaded } from "@vis.gl/react-google-maps";

interface SearchHeaderProps {
  onSearch: (destination: string) => void;
}

const FEATURED_DESTINATIONS = [
  { name: "Tokyo", emoji: "🗼" },
  { name: "Bali",  emoji: "🌴" },
  { name: "Paris", emoji: "🗺️" },
  { name: "NYC",   emoji: "🗽" },
  { name: "Santorini", emoji: "🏛️" },
];

const SearchHeader: React.FC<SearchHeaderProps> = ({ onSearch }) => {
  const [query, setQuery]                   = useState("");
  const [suggestions, setSuggestions]       = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isLoaded = useApiIsLoaded();

  React.useEffect(() => {
    if (!query || !isLoaded) { setSuggestions([]); return; }
    if (query.length > 2) {
      const timer = setTimeout(async () => {
        try {
          const { suggestions } =
            await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
              input: query,
              includedPrimaryTypes: ["(regions)"],
            });
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } catch {
          setSuggestions([]);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [query, isLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { onSearch(query); setShowSuggestions(false); }
  };

  const handleSelectSuggestion = (s: google.maps.places.AutocompleteSuggestion) => {
    const text = s.placePrediction?.text?.text;
    if (text) { setQuery(text); onSearch(text); setShowSuggestions(false); }
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #FF5A5A 0%, #FF8C00 55%, #FFB347 100%)",
        minHeight: "320px",
      }}
    >
      {/* Decorative background bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20"
             style={{ background: "rgba(255,255,255,0.25)" }} />
        <div className="absolute top-1/2 -left-12 w-40 h-40 rounded-full opacity-10"
             style={{ background: "rgba(255,255,255,0.3)" }} />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 rounded-full opacity-15"
             style={{ background: "rgba(255,255,255,0.2)" }} />

        {/* Floating destination emojis */}
        <span className="absolute top-8 right-[12%] text-4xl opacity-25 animate-float" style={{ animationDelay: "0s" }}>✈️</span>
        <span className="absolute bottom-10 right-[6%] text-3xl opacity-20 animate-float" style={{ animationDelay: "1.5s" }}>🌍</span>
        <span className="absolute top-6 left-[8%] text-3xl opacity-20 animate-float" style={{ animationDelay: "0.8s" }}>🏝️</span>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 pt-14 pb-10">
        {/* Headline */}
        <div className="text-center mb-8">
          <p className="inline-flex items-center gap-2 text-white/80 text-sm font-semibold mb-3 bg-white/15 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />
            AI-Powered Travel Planning
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3">
            Your next adventure<br className="hidden md:block" /> starts here
          </h1>
          <p className="text-white/80 text-base md:text-lg font-medium">
            Tell us where you want to go — we'll build the perfect itinerary.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
          <div className="flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden p-1.5 gap-2">
            {/* Location icon */}
            <div className="pl-3 shrink-0">
              <svg className="w-5 h-5 text-[#FF5A5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            <input
              type="text"
              placeholder="Where do you want to go?"
              className="flex-1 py-3 text-[#1A1A1A] text-base font-semibold placeholder:text-[#9C9891] placeholder:font-normal bg-transparent outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            <button
              type="submit"
              className="btn-brand px-6 py-3 text-sm shrink-0"
            >
              Generate Plan
            </button>
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EEECE9] rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
              {suggestions.map((s) => (
                <div
                  key={s.placePrediction?.placeId}
                  onClick={() => handleSelectSuggestion(s)}
                  className="px-5 py-3.5 hover:bg-[#FFF0F0] cursor-pointer border-b border-[#F8F7F5] last:border-none flex items-center gap-3 group transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FFF0F0] flex items-center justify-center shrink-0 group-hover:bg-[#FFE4E4] transition-colors">
                    <svg className="w-4 h-4 text-[#FF5A5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A1A] text-sm">{s.placePrediction?.text?.text}</p>
                    {s.placePrediction?.secondaryText?.text && (
                      <p className="text-xs text-[#9C9891]">{s.placePrediction.secondaryText.text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Quick destination pills */}
        <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
          <span className="text-white/60 text-xs font-medium">Popular:</span>
          {FEATURED_DESTINATIONS.map((d) => (
            <button
              key={d.name}
              onClick={() => onSearch(d.name)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all backdrop-blur-sm border border-white/20 hover:border-white/40"
            >
              <span>{d.emoji}</span>
              {d.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SearchHeader;
