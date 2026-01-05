import React from 'react';
import { CommunityItinerary } from '../types';

interface CommunityItineraryCardProps {
    itinerary: CommunityItinerary;
    onClick: () => void;
}

const CommunityItineraryCard: React.FC<CommunityItineraryCardProps> = ({ itinerary, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="group relative rounded-[2.5rem] overflow-hidden bg-white border border-slate-200 hover:border-indigo-400 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:-translate-y-2 active:translate-y-0"
        >
            {/* Image Section */}
            <div className="h-80 relative overflow-hidden">
                <img
                    src={itinerary.image}
                    alt={itinerary.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

                {/* Trending Badge */}
                {itinerary.trending && (
                    <div className="absolute top-6 left-6">
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-white">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Trending Now
                        </div>
                    </div>
                )}

                {/* Heart Icon with Save Count - Top Right */}
                <div className="absolute top-6 right-6">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg group-hover:bg-white transition-all">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-black text-slate-900">
                            {itinerary.saveCount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Duration Badge - Bottom Left */}
                <div className="absolute bottom-6 left-6">
                    <div className="bg-indigo-600/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-white">
                        {itinerary.duration} {itinerary.duration === 1 ? 'Day' : 'Days'}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors flex-1">
                        {itinerary.name}
                    </h3>
                </div>

                <p className="text-slate-600 font-bold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {itinerary.location}
                </p>



                {/* Creator Info */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                        <img
                            src={itinerary.creator.avatar}
                            className="w-10 h-10 rounded-full border-2 border-indigo-500/30"
                            alt={itinerary.creator.name}
                        />
                        <div>
                            <p className="text-xs font-bold text-slate-500">Creator</p>
                            <div className="flex items-center gap-1">
                                <p className="text-sm font-black text-slate-900">{itinerary.creator.name}</p>
                                {itinerary.creator.verified && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CommunityItineraryCard;
