"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CommunityItineraryCard from "./CommunityItineraryCard";
import ItineraryDetailModal from "./ItineraryDetailModal";
import type { CommunityItinerary, Itinerary } from "@nextdestination/shared";
import { useItineraryStore } from "@nextdestination/shared";

const categories = [
  "All",
  "Adventure",
  "Luxury",
  "Budget",
  "Family",
  "Solo",
  "Romantic",
  "Cultural",
] as const;

function mapToCommunityItinerary(data: any): CommunityItinerary {
  const seed = (data.id || "").charCodeAt(0) || 0;
  return {
    id: data.id,
    name: data.name || `Trip to ${data.destination || "Unknown"}`,
    location: data.destination || "Unknown Location",
    destination: data.destination || "Unknown",
    image:
      data.image ||
      `https://images.unsplash.com/photo-${seed % 2 === 0
        ? "1476514525535-07fb3b4ae5f1"
        : "1503899036084-c55cdd92da26"
      }?q=80&w=800&auto=format&fit=crop`,
    creator: data.creator || {
      id: "anon",
      name: "Community Traveler",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${data.id || "User"}`,
      verified: false,
    },
    saveCount: data.saveCount || Math.floor(Math.random() * 500) + 10,
    duration: data.days?.length || data.duration || 3,
    tags: data.tags || ["Travel", data.category || "Adventure"],
    category: data.category || "Adventure",
    itinerary: data,
    createdAt: data.createdAt || new Date().toISOString(),
    trending: true,
  };
}

interface CommunityPageProps {
  initialItineraries?: CommunityItinerary[];
}

const CommunityPage: React.FC<CommunityPageProps> = ({
  initialItineraries = [],
}) => {
  const router = useRouter();
  const { setItinerary } = useItineraryStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItinerary, setSelectedItinerary] =
    useState<CommunityItinerary | null>(null);
  const [itineraries, setItineraries] =
    useState<CommunityItinerary[]>(initialItineraries);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItineraries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          }`;
        let url = `${API_BASE}/api/itineraries/trending`;
        let method = "GET";
        let body: string | undefined;
        let headers: Record<string, string> | undefined;
        const params = new URLSearchParams();

        if (searchQuery.trim()) {
          url = `${API_BASE}/api/itineraries/search`;
          method = "POST";
          headers = { "Content-Type": "application/json" };
          body = JSON.stringify({
            query: searchQuery,
            category: selectedCategory === "All" ? undefined : selectedCategory,
          });
        } else {
          if (selectedCategory !== "All") {
            params.append("category", selectedCategory);
          }
          if (params.toString()) url += `?${params.toString()}`;
        }

        const res = await fetch(url, { method, headers, body });
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

        const rawData = await res.json();
        if (Array.isArray(rawData)) {
          const mapped = rawData.map(mapToCommunityItinerary);
          const seen = new Set<string>();
          setItineraries(mapped.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          }));
        } else {
          setItineraries([]);
        }
      } catch (e: any) {
        console.error("Error fetching community itineraries", e);
        setError(e.message || "Failed to load itineraries");
        setItineraries([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchItineraries, 500);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <button
            onClick={() => router.push("/")}
            className="mb-8 flex items-center gap-2 text-white/80 hover:text-white font-bold transition-colors group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 group-hover:-translate-x-1 transition-transform"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Home
          </button>
          <div className="text-center max-w-4xl mx-auto">
            <span className="text-indigo-200 font-black uppercase tracking-[0.3em] text-xs mb-4 block">
              Community Curated
            </span>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tighter">
              Explore Real Journeys
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed mb-12">
              Discover{" "}
              {itineraries.length > 0 ? "authentic" : ""} itineraries from our
              community.
            </p>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search destinations, tags, or experiences..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-8 py-6 rounded-[2rem] text-slate-900 font-bold text-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-2xl"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-slate-400 absolute right-8 top-1/2 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <span className="text-sm font-black text-slate-500 uppercase tracking-wider shrink-0">
              Filter:
            </span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all shrink-0 ${selectedCategory === category
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <p className="text-slate-600 font-bold">
            Showing{" "}
            <span className="text-indigo-600 font-black">
              {itineraries.length}
            </span>{" "}
            {itineraries.length === 1 ? "itinerary" : "itineraries"}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-20">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[2.5rem] h-[500px] border border-slate-100 animate-pulse"
              >
                <div className="h-64 bg-slate-200 rounded-t-[2.5rem]"></div>
                <div className="p-8 space-y-4">
                  <div className="h-8 bg-slate-200 rounded-xl w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded-xl w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="bg-red-50 text-red-600 p-8 rounded-3xl inline-block">
              <h2 className="text-xl font-bold mb-2">Oops!</h2>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 underline font-bold"
              >
                Try Refreshing
              </button>
            </div>
          </div>
        ) : itineraries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-20">
            {itineraries.map((itinerary) => (
              <CommunityItineraryCard
                key={itinerary.id}
                itinerary={itinerary}
                onClick={() => setSelectedItinerary(itinerary)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">
              No itineraries found
            </h2>
            <p className="text-slate-500 font-medium mb-8">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {selectedItinerary && (
        <ItineraryDetailModal
          itinerary={selectedItinerary}
          onClose={() => setSelectedItinerary(null)}
          onCustomize={(itinerary) => {
            const rawData = itinerary.itinerary;
            const builderItinerary: Itinerary = {
              destination: itinerary.destination || itinerary.location || "Unknown",
              days: rawData?.days?.map((day: any) => ({
                day: day.day,
                theme: day.theme || `Day ${day.day}`,
                activities: (day.activities || []).map((act: any) => ({
                  id: act.id || Math.random().toString(36).substr(2, 9),
                  time: act.time || "09:00",
                  activity: act.activity || act.name || "",
                  description: act.description || "",
                  location: act.location || "",
                  type: act.type || "activity",
                })),
              })) || [{ day: 1, theme: "Day 1", activities: [] }],
              hasArrivalFlight: true,
              hasDepartureFlight: true,
            };
            setItinerary(builderItinerary);
            router.push("/builder");
          }}
        />
      )}
    </div>
  );
};

export default CommunityPage;
