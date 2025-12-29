import React from 'react';

interface HotelDetailsPanelProps {
    onBack: () => void;
    onSelect: (hotel: any) => void;
    searchData: any;
}

const MOCK_HOTELS = [
    { id: 1, name: 'Grand Plaza Hotel', rating: 4.8, price: '$180', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', location: 'City Center' },
    { id: 2, name: 'Seaside Resort & Spa', rating: 4.9, price: '$250', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', location: 'Beachfront' },
    { id: 3, name: 'Urban Boutique Hotel', rating: 4.5, price: '$120', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', location: 'Downtown' },
    { id: 4, name: 'Cozy Inn', rating: 4.2, price: '$85', image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7c1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60', location: 'Suburbs' },
];

const HotelDetailsPanel: React.FC<HotelDetailsPanelProps> = ({ onBack, onSelect, searchData }) => {
    return (
        <div className="h-full flex flex-col bg-[#f8fafc] animate-slide-in-right overflow-hidden">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm shrink-0 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">Select Hotel</h2>
                    <p className="text-xs text-slate-500 font-medium">
                        {searchData?.location || 'Anywhere'} • {searchData?.guests || 2} Guest(s)
                    </p>
                </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {MOCK_HOTELS.map((hotel) => (
                    <div key={hotel.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group">
                        <div className="h-32 bg-slate-200 relative overflow-hidden">
                            {/* Image Placeholder or Actual Image */}
                            <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold text-slate-800 shadow-sm">
                                ★ {hotel.rating}
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{hotel.name}</h3>
                                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        {hotel.location}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-slate-900">{hotel.price}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">per night</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onSelect(hotel)}
                                    className="flex-1 py-2 bg-slate-50 hover:bg-orange-500 hover:text-white text-orange-600 font-bold text-xs rounded-lg border border-slate-100 hover:border-orange-500 transition-all"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => onSelect(hotel)}
                                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="text-center py-6">
                    <p className="text-xs text-slate-400 font-medium">End of results</p>
                </div>
            </div>
        </div>
    );
};

export default HotelDetailsPanel;
