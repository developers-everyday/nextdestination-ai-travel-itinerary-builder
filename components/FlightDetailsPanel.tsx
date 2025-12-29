import React from 'react';

interface FlightDetailsPanelProps {
    onBack: () => void;
    onSelect: (flight: any) => void;
    searchData: any;
}

const MOCK_FLIGHTS = [
    { id: 1, airline: 'SkyHigh Air', departure: '10:00 AM', arrival: '1:30 PM', duration: '3h 30m', price: '$245', stops: 'Non-stop' },
    { id: 2, airline: 'Oceanic', departure: '2:15 PM', arrival: '6:45 PM', duration: '4h 30m', price: '$190', stops: '1 Stop' },
    { id: 3, airline: 'Air Global', departure: '6:00 AM', arrival: '11:00 AM', duration: '5h 00m', price: '$310', stops: 'Non-stop' },
    { id: 4, airline: 'JetStream', departure: '8:45 PM', arrival: '11:30 PM', duration: '2h 45m', price: '$180', stops: 'Non-stop' },
];

const FlightDetailsPanel: React.FC<FlightDetailsPanelProps> = ({ onBack, onSelect, searchData }) => {
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
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">Select Flight</h2>
                    <p className="text-xs text-slate-500 font-medium">
                        {searchData?.from || 'Origin'} <span className="text-slate-300 mx-1">→</span> {searchData?.to || 'Destination'} • {searchData?.passengers || 1} Traveler(s)
                    </p>
                </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {MOCK_FLIGHTS.map((flight) => (
                    <div key={flight.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-slate-800">{flight.airline}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">{flight.stops}</span>
                                    <span className="text-xs text-slate-400">{flight.duration}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-xl font-black text-slate-900">{flight.price}</span>
                                <span className="text-[10px] text-slate-400 font-medium">per person</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between relative">
                            {/* Visual Route Line */}
                            <div className="absolute top-1/2 left-16 right-16 h-px bg-slate-200 -z-10"></div>

                            <div className="text-center">
                                <div className="text-sm font-bold text-slate-700">{flight.departure}</div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{searchData?.from?.substring(0, 3).toUpperCase() || 'ORG'}</div>
                            </div>

                            <div className="bg-white px-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" transform="rotate(90)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </div>

                            <div className="text-center">
                                <div className="text-sm font-bold text-slate-700">{flight.arrival}</div>
                                <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{searchData?.to?.substring(0, 3).toUpperCase() || 'DST'}</div>
                            </div>
                        </div>

                        <button
                            onClick={() => onSelect(flight)}
                            className="w-full mt-4 py-2 bg-slate-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold text-xs rounded-lg border border-indigo-100 hover:border-indigo-600 transition-all"
                        >
                            Select Flight
                        </button>
                    </div>
                ))}

                <div className="text-center py-6">
                    <p className="text-xs text-slate-400 font-medium">End of results</p>
                </div>
            </div>
        </div>
    );
};

export default FlightDetailsPanel;
