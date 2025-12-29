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
    const [tripType, setTripType] = React.useState<'oneway' | 'roundtrip'>('oneway');
    const [selectedOutbound, setSelectedOutbound] = React.useState<number | null>(null);
    const [selectedReturn, setSelectedReturn] = React.useState<number | null>(null);
    const [departureDate, setDepartureDate] = React.useState(searchData?.date || '');
    const [returnDate, setReturnDate] = React.useState('');

    const handleFlightSelect = (flightId: number, leg: 'outbound' | 'return') => {
        if (leg === 'outbound') {
            setSelectedOutbound(flightId);
            if (tripType === 'oneway') {
                // Immediate select for one way
                onSelect(MOCK_FLIGHTS.find(f => f.id === flightId));
            }
        } else {
            setSelectedReturn(flightId);
        }
    };

    const handleConfirmRoundTrip = () => {
        if (selectedOutbound && selectedReturn) {
            const outbound = MOCK_FLIGHTS.find(f => f.id === selectedOutbound);
            const returnFlight = MOCK_FLIGHTS.find(f => f.id === selectedReturn);
            onSelect({ outbound, returnFlight });
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#f8fafc] animate-slide-in-right overflow-hidden">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm shrink-0 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-slate-800 leading-tight">Select Flight</h2>
                        <div className="flex flex-col gap-1 mt-1">
                            <p className="text-xs text-slate-500 font-medium">
                                {searchData?.from || 'Origin'} <span className="text-slate-300 mx-1">→</span> {searchData?.to || 'Destination'} • {searchData?.passengers || 1} Traveler(s)
                            </p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={departureDate}
                                    onChange={(e) => setDepartureDate(e.target.value)}
                                    className="bg-transparent border-b border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all w-24"
                                />
                                {tripType === 'roundtrip' && (
                                    <>
                                        <span className="text-slate-300 text-xs">&</span>
                                        <input
                                            type="date"
                                            value={returnDate}
                                            onChange={(e) => setReturnDate(e.target.value)}
                                            className="bg-transparent border-b border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all w-24"
                                            placeholder="Return Date"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trip Type Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setTripType('oneway')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${tripType === 'oneway'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        One Way
                    </button>
                    <button
                        onClick={() => setTripType('roundtrip')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${tripType === 'roundtrip'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Round Trip
                    </button>
                </div>
            </div>

            {/* Results List */}
            <div className={`flex-1 overflow-hidden flex ${tripType === 'roundtrip' ? 'flex-row' : 'flex-col'}`}>

                {/* Outbound Column */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${tripType === 'roundtrip' ? 'border-r border-slate-200 bg-slate-50/50' : ''}`}>
                    {tripType === 'roundtrip' && (
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#f8fafc]/95 backdrop-blur py-2 z-10 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outbound</span>
                            <span className="text-[10px] text-slate-400 font-mono">{searchData?.from || 'ORG'} → {searchData?.to || 'DST'}</span>
                        </div>
                    )}

                    {MOCK_FLIGHTS.map((flight) => (
                        <div
                            key={`out-${flight.id}`}
                            className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all group cursor-pointer ${selectedOutbound === flight.id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-300'
                                }`}
                            onClick={() => handleFlightSelect(flight.id, 'outbound')}
                        >
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
                                </div>
                            </div>
                            <div className="flex items-center justify-between relative">
                                <div className="absolute top-1/2 left-12 right-12 h-px bg-slate-200 -z-10"></div>
                                <div className="text-center">
                                    <div className="text-sm font-bold text-slate-700">{flight.departure}</div>
                                    <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{searchData?.from?.substring(0, 3).toUpperCase() || 'ORG'}</div>
                                </div>
                                <div className="bg-white px-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform rotate-90 transition-colors ${selectedOutbound === flight.id ? 'text-indigo-600' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-bold text-slate-700">{flight.arrival}</div>
                                    <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{searchData?.to?.substring(0, 3).toUpperCase() || 'DST'}</div>
                                </div>
                            </div>
                            {tripType === 'oneway' && (
                                <button className="w-full mt-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-all">
                                    Select Flight
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Return Column (Round Trip Only) */}
                {tripType === 'roundtrip' && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white/95 backdrop-blur py-2 z-10 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Return</span>
                            <span className="text-[10px] text-slate-400 font-mono">{searchData?.to || 'DST'} → {searchData?.from || 'ORG'}</span>
                        </div>

                        {MOCK_FLIGHTS.map((flight) => (
                            <div
                                key={`ret-${flight.id}`}
                                className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all group cursor-pointer ${selectedReturn === flight.id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-300'
                                    }`}
                                onClick={() => handleFlightSelect(flight.id, 'return')}
                            >
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
                                    </div>
                                </div>
                                <div className="flex items-center justify-between relative">
                                    <div className="absolute top-1/2 left-12 right-12 h-px bg-slate-200 -z-10"></div>
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-slate-700">{flight.departure}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{searchData?.to?.substring(0, 3).toUpperCase() || 'DST'}</div>
                                    </div>
                                    <div className="bg-white px-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform -rotate-90 transition-colors ${selectedReturn === flight.id ? 'text-indigo-600' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-slate-700">{flight.arrival}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{searchData?.from?.substring(0, 3).toUpperCase() || 'ORG'}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Action for Round Trip */}
            {tripType === 'roundtrip' && (
                <div className="p-4 bg-white border-t border-slate-200">
                    <button
                        disabled={!selectedOutbound || !selectedReturn}
                        onClick={handleConfirmRoundTrip}
                        className="w-full py-3 bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        Confirm Round Trip
                    </button>
                </div>
            )}
        </div>
    );
};

export default FlightDetailsPanel;
