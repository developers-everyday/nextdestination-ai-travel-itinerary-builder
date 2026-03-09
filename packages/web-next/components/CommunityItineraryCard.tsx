"use client";

import React, { useState, useEffect } from "react";
import type { CommunityItinerary } from "@nextdestination/shared";
import { supabase } from "@/lib/supabaseClient";

interface CommunityItineraryCardProps {
  itinerary: CommunityItinerary;
  onClick: () => void;
  onRemix?: (e: React.MouseEvent) => void;
}

const CommunityItineraryCard: React.FC<CommunityItineraryCardProps> = ({
  itinerary,
  onClick,
  onRemix,
}) => {
  const [isSaved,   setIsSaved]   = useState(false);
  const [saveCount, setSaveCount] = useState(itinerary.saveCount);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/wishlist/check/${itinerary.id}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (response.ok) {
          const { isWishlisted } = await response.json();
          setIsSaved(isWishlisted);
        }
      } catch {}
    };
    if (itinerary.id && !itinerary.id.startsWith("mock-")) checkWishlistStatus();
  }, [itinerary.id]);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) { alert("Please log in to save trips!"); return; }
    } catch { alert("Please log in to save trips!"); return; }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!itinerary.id || itinerary.id.startsWith("mock-") || !uuidRegex.test(itinerary.id)) {
      alert("This itinerary cannot be added to wishlist yet.");
      return;
    }

    const newState = !isSaved;
    setIsSaved(newState);
    setSaveCount((prev) => newState ? prev + 1 : Math.max(0, prev - 1));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No session");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/wishlist/toggle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ itineraryId: itinerary.id }),
        }
      );
      if (!response.ok) throw new Error("Failed");
    } catch {
      setIsSaved(!newState);
      setSaveCount((prev) => !newState ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        boxShadow: "0 2px 12px 0 rgba(0,0,0,0.07)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px 0 rgba(0,0,0,0.14)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px 0 rgba(0,0,0,0.07)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Image container */}
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={itinerary.image}
          alt={itinerary.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top-left badge: Trending */}
        {itinerary.trending && (
          <div className="absolute top-3 left-3 z-10">
            <span className="flex items-center gap-1.5 bg-white/95 text-[#FF5A5A] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A5A] animate-pulse-dot" />
              Trending
            </span>
          </div>
        )}

        {/* Top-right: Save / Wishlist */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
            isSaved ? "bg-[#FF5A5A]" : "bg-white/90 hover:bg-white"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 transition-colors ${isSaved ? "text-white fill-white" : "text-[#1A1A1A]"}`}
            viewBox="0 0 20 20"
            fill={isSaved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isSaved ? 0 : 1.5}
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Bottom-left: Duration badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <span
            className="text-white text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "linear-gradient(135deg, #FF5A5A, #FF8C00)" }}
          >
            {itinerary.duration} {itinerary.duration === 1 ? "Day" : "Days"}
          </span>
        </div>

        {/* Bottom-right: Save count */}
        <div className="absolute bottom-3 right-3 z-10">
          <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-1 rounded-full">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd" />
            </svg>
            {saveCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Destination name */}
        <h3 className="font-bold text-[#1A1A1A] text-base leading-tight mb-1 line-clamp-1 group-hover:text-[#FF5A5A] transition-colors">
          {itinerary.location}
        </h3>
        <p className="text-[#6B6863] text-sm mb-3 line-clamp-1">{itinerary.name}</p>

        {/* Footer: creator + remix */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F0EFED]">
          <div className="flex items-center gap-2">
            <img
              src={itinerary.creator.avatar}
              className="w-7 h-7 rounded-full border border-[#EEECE9] object-cover"
              alt={itinerary.creator.name}
            />
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-[#1A1A1A] max-w-[90px] truncate">
                {itinerary.creator.name}
              </span>
              {itinerary.creator.verified && (
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#FF5A5A" />
                  <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>

          {onRemix && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemix(e); }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#FF5A5A] hover:bg-[#FFF0F0] px-2.5 py-1.5 rounded-full transition-colors border border-[#FFD0D0] hover:border-[#FF5A5A]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Remix
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityItineraryCard;
