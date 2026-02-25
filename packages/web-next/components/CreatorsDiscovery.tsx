"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import type { CreatorCardData, CreatorInterest } from "@nextdestination/shared";
import { fetchCreators } from "@nextdestination/shared";
import { useAuth } from "./AuthContext";
import CreatorCard from "./CreatorCard";

const INTERESTS: CreatorInterest[] = [
  "History",
  "Art",
  "Food",
  "Nature",
  "Adventure",
  "Relaxation",
  "Nightlife",
  "Shopping",
];

const INTEREST_ICONS: Record<CreatorInterest, string> = {
  History: "🏛️",
  Art: "🎨",
  Food: "🍜",
  Nature: "🌿",
  Adventure: "⛰️",
  Relaxation: "🏖️",
  Nightlife: "🌙",
  Shopping: "🛍️",
};

interface Props {
  featuredCreators: CreatorCardData[];
  initialCreators: CreatorCardData[];
  initialTotal: number;
}

const CreatorsDiscovery: React.FC<Props> = ({
  featuredCreators,
  initialCreators,
  initialTotal,
}) => {
  const { session } = useAuth();
  const [creators, setCreators] = useState<CreatorCardData[]>(initialCreators);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeInterest, setActiveInterest] = useState<CreatorInterest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_SIZE = 12;
  const hasMore = creators.length < total;

  const loadCreators = useCallback(
    async (params: {
      interest?: CreatorInterest;
      search?: string;
      page?: number;
      append?: boolean;
    }) => {
      setIsLoading(true);
      try {
        const result = await fetchCreators(
          {
            interest: params.interest || undefined,
            search: params.search || undefined,
            page: params.page || 1,
          },
          session?.access_token
        );

        if (params.append) {
          setCreators((prev) => [...prev, ...result.creators]);
        } else {
          setCreators(result.creators);
        }
        setTotal(result.total);
      } catch (err) {
        console.error("Failed to load creators:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [session?.access_token]
  );

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      loadCreators({ search: value, interest: activeInterest || undefined });
    }, 400);
  };

  // Handle interest filter
  const handleInterestClick = (interest: CreatorInterest) => {
    const newInterest = activeInterest === interest ? null : interest;
    setActiveInterest(newInterest);
    setPage(1);
    loadCreators({ interest: newInterest || undefined, search });
  };

  // Load more
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCreators({
      interest: activeInterest || undefined,
      search,
      page: nextPage,
      append: true,
    });
  };

  // Handle follow toggle on a creator card
  const handleFollowToggle = (userId: string, isFollowing: boolean) => {
    setCreators((prev) =>
      prev.map((c) => (c.userId === userId ? { ...c, isFollowing } : c))
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Discover Creators
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Follow travel creators, explore their curated itineraries, and find
            your next destination through trusted guides.
          </p>

          {/* Search Bar */}
          <div className="max-w-lg mx-auto relative">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search creators by name..."
              className="w-full px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-md text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all text-lg"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                  loadCreators({ interest: activeInterest || undefined });
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors text-xl"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      {featuredCreators.length > 0 && !search && !activeInterest && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-sm">
              ⭐
            </span>
            Featured Creators
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCreators.map((creator) => (
              <CreatorCard
                key={creator.userId}
                creator={creator}
                onFollowToggle={handleFollowToggle}
              />
            ))}
          </div>
        </section>
      )}

      {/* Interest Filter Chips */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-sm font-bold text-slate-400 flex-shrink-0 mr-1">
            Filter:
          </span>
          {INTERESTS.map((interest) => (
            <button
              key={interest}
              onClick={() => handleInterestClick(interest)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeInterest === interest
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "bg-white text-slate-600 border-2 border-slate-100 hover:border-indigo-200 hover:text-indigo-600"
              }`}
            >
              <span>{INTEREST_ICONS[interest]}</span>
              {interest}
            </button>
          ))}
        </div>
      </section>

      {/* Creators Grid */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-900">
            {activeInterest
              ? `${activeInterest} Creators`
              : search
              ? "Search Results"
              : "All Creators"}
          </h2>
          {total > 0 && (
            <span className="text-sm font-bold text-slate-400">
              {total} creator{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {creators.length === 0 && !isLoading ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-400 font-bold text-lg">
              No creators found
            </p>
            <p className="text-slate-400 font-medium text-sm mt-1">
              {search
                ? "Try a different search term"
                : activeInterest
                ? "Try a different interest filter"
                : "Check back later for new creators!"}
            </p>
            {(search || activeInterest) && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveInterest(null);
                  setPage(1);
                  loadCreators({});
                }}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <CreatorCard
                  key={creator.userId}
                  creator={creator}
                  onFollowToggle={handleFollowToggle}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-full font-bold hover:border-indigo-200 hover:text-indigo-600 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Loading skeleton for initial load */}
        {isLoading && creators.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden animate-pulse"
              >
                <div className="h-24 bg-slate-200" />
                <div className="px-5 -mt-10">
                  <div className="w-20 h-20 rounded-2xl bg-slate-200 border-4 border-white" />
                  <div className="mt-3 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-32" />
                    <div className="h-3 bg-slate-100 rounded w-20" />
                    <div className="h-4 bg-slate-100 rounded w-full mt-2" />
                  </div>
                </div>
                <div className="px-5 pb-5 mt-4">
                  <div className="h-8 bg-slate-100 rounded w-40 border-t border-slate-100 pt-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16 mt-8">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Become a Creator
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Share your travel experiences, build a following, and inspire
            travelers worldwide.
          </p>
          <a
            href="/create-from-transcript"
            className="inline-flex px-10 py-5 bg-white text-indigo-700 font-bold text-lg rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl"
          >
            Start Creating
          </a>
        </div>
      </section>
    </div>
  );
};

export default CreatorsDiscovery;
