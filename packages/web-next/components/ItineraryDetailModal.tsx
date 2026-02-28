"use client";

import React from "react";
import type { CommunityItinerary } from "@nextdestination/shared";

interface ItineraryDetailModalProps {
  itinerary: CommunityItinerary;
  onClose: () => void;
  onCustomize: (itinerary: CommunityItinerary) => void;
}

const ItineraryDetailModal: React.FC<ItineraryDetailModalProps> = ({
  itinerary,
  onClose,
  onCustomize,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-[3rem] max-w-5xl w-full shadow-2xl animate-slide-up overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-8 right-8 z-10 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-slate-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="h-96 relative overflow-hidden">
            <img
              src={itinerary.image}
              alt={itinerary.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <h2 className="text-5xl font-black text-white mb-4 leading-tight">
                {itinerary.name}
              </h2>
              <div className="flex items-center gap-6 text-white">
                <span className="font-bold flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {itinerary.location}
                </span>
                <span className="font-bold">{itinerary.duration} Days</span>
              </div>
            </div>
          </div>

          <div className="p-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12 pb-8 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <img
                  src={itinerary.creator.avatar}
                  className="w-16 h-16 rounded-full border-4 border-indigo-100"
                  alt={itinerary.creator.name}
                />
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Created by
                  </p>
                  <p className="text-xl font-black text-slate-900">
                    {itinerary.creator.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-red-50 px-6 py-4 rounded-2xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-bold text-slate-500">Saved by</p>
                  <p className="text-2xl font-black text-slate-900">
                    {itinerary.saveCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">
                Tags
              </h3>
              <div className="flex flex-wrap gap-3">
                {itinerary.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {itinerary.itinerary?.days && (
              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-6">
                  Itinerary Overview
                </h3>
                <div className="space-y-4">
                  {itinerary.itinerary.days.map((day: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
                          {day.day}
                        </div>
                        <h4 className="text-lg font-black text-slate-900">
                          {day.theme}
                        </h4>
                      </div>
                      <p className="text-slate-600 font-medium ml-13">
                        {day.activities?.length || 0}{" "}
                        {day.activities?.length === 1
                          ? "activity"
                          : "activities"}{" "}
                        planned
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => onCustomize(itinerary)}
                className="flex-1 bg-indigo-600 text-white px-8 py-6 rounded-[2rem] text-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:translate-y-0"
              >
                Customize This Trip
              </button>
              <button
                onClick={onClose}
                className="px-8 py-6 rounded-[2rem] text-xl font-black border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDetailModal;
