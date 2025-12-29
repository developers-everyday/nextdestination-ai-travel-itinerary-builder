import React from 'react';

interface HotelDetailsPanelProps {
    onBack: () => void;
    onSelect: (hotel: any) => void;
    searchData: any;
}

const MOCK_HOTELS = [
    { id: 1, name: 'Grand Plaza Hotel', rating: 4.8, price: '$180', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', location: 'City Center', coordinates: { top: 40, left: 30 } },
    { id: 2, name: 'Seaside Resort & Spa', rating: 4.9, price: '$250', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', location: 'Beachfront', coordinates: { top: 20, left: 70 } },
    { id: 3, name: 'Urban Boutique Hotel', rating: 4.5, price: '$120', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', location: 'Downtown', coordinates: { top: 60, left: 45 } },
    { id: 4, name: 'Cozy Inn', rating: 4.2, price: '$85', image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7c1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', location: 'Suburbs', coordinates: { top: 75, left: 20 } },
    { id: 5, name: 'Mountain View Lodge', rating: 4.7, price: '$210', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', location: 'Highlands', coordinates: { top: 30, left: 85 } },
];

const HotelDetailsPanel: React.FC<HotelDetailsPanelProps> = ({ onBack, onSelect, searchData }) => {
    const [hoveredHotelId, setHoveredHotelId] = React.useState<number | null>(null);

    return (
        <div className="h-full flex flex-col bg-white animate-slide-in-right overflow-hidden">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm shrink-0 flex items-center gap-4 z-20">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">Stays in {searchData?.location || 'Area'}</h2>
                    <p className="text-xs text-slate-500 font-medium">
                        {searchData?.location || 'Anywhere'} • {searchData?.checkIn ? `${searchData.checkIn} - ${searchData.checkOut}` : 'Any dates'} • {searchData?.guests || 2} Guest(s)
                    </p>
                </div>
            </div>

            {/* Split Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: List */}
                <div className="w-[55%] overflow-y-auto p-4 space-y-6 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 scrollbar-hide">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-slate-800">{MOCK_HOTELS.length} places to stay</h3>
                    </div>

                    {MOCK_HOTELS.map((hotel) => (
                        <div
                            key={hotel.id}
                            className={`group cursor-pointer transition-all duration-300 ${hoveredHotelId === hotel.id ? 'transform scale-[1.02]' : ''}`}
                            onMouseEnter={() => setHoveredHotelId(hotel.id)}
                            onMouseLeave={() => setHoveredHotelId(null)}
                        >
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                                <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
                                <button className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 hover:bg-white text-white hover:text-red-500 transition-all backdrop-blur-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-800 shadow-sm uppercase tracking-wider">
                                    Guest Favourite
                                </div>
                            </div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center justify-between w-full">
                                        <h3 className="font-bold text-slate-800 text-base">{hotel.name}</h3>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold">★ {hotel.rating}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-0.5">{hotel.location}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">1 bed • 2 guests</p>

                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="font-bold text-slate-900 text-lg">{hotel.price}</span>
                                        <span className="text-slate-500 text-sm"> total</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="py-8 text-center text-xs text-slate-400">
                        End of results
                    </div>
                </div>

                {/* Right Panel: Map */}
                <div className="flex-1 bg-[#e2e8f0] relative overflow-hidden">
                    {/* Simulated Map Background Pattern */}
                    <div className="absolute inset-0 opacity-40"
                        style={{
                            backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)',
                            backgroundSize: '30px 30px'
                        }}
                    ></div>

                    {/* Simulated Map Features (Roads/Blocks) - purely aesthetic */}
                    <div className="absolute top-1/4 left-0 w-full h-2 bg-white/50 transform -rotate-6"></div>
                    <div className="absolute top-0 right-1/3 h-full w-3 bg-white/50 transform rotate-12"></div>
                    <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-green-100/50 rounded-full blur-xl"></div>

                    {/* Map Markers */}
                    {MOCK_HOTELS.map((hotel) => (
                        <div
                            key={hotel.id}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 ${hoveredHotelId === hotel.id ? 'scale-110 z-20' : 'scale-100'
                                }`}
                            style={{ top: `${hotel.coordinates.top}%`, left: `${hotel.coordinates.left}%` }}
                            onMouseEnter={() => setHoveredHotelId(hotel.id)}
                            onMouseLeave={() => setHoveredHotelId(null)}
                            onClick={() => onSelect(hotel)}
                        >
                            <button
                                className={`px-3 py-1.5 rounded-full font-bold text-xs shadow-md transition-all ${hoveredHotelId === hotel.id
                                        ? 'bg-slate-900 text-white scale-110 shadow-xl'
                                        : 'bg-white text-slate-900 hover:scale-105'
                                    }`}
                            >
                                {hotel.price}
                            </button>
                        </div>
                    ))}

                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer hover:bg-slate-50">
                        <span>Map Area</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelDetailsPanel;
