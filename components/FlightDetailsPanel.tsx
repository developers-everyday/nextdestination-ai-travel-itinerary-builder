import React, { useEffect, useState } from 'react';
import { searchFlights } from '../services/geminiService';

interface FlightDetailsPanelProps {
    onBack: () => void;
    onSelect: (flight: any) => void;
    searchData: any;
}

const FlightDetailsPanel: React.FC<FlightDetailsPanelProps> = ({ onBack, onSelect, searchData }) => {
    const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
    const [selectedOutbound, setSelectedOutbound] = useState<number | null>(null);
    const [selectedReturn, setSelectedReturn] = useState<number | null>(null);
    const [departureDate, setDepartureDate] = useState(searchData?.date || '');
    const [returnDate, setReturnDate] = useState('');

    const [flights, setFlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFlights = async () => {
            if (searchData?.from && searchData?.to && searchData?.date) {
                setLoading(true);
                // Artificial delay to show loading state if API is too fast (optional, but good for UX)
                // const delay = new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    const results = await searchFlights(searchData.from, searchData.to, searchData.date);
                    // Add IDs if missing
                    const flightsWithIds = results.map((f: any, index: number) => ({
                        ...f,
                        id: index + 1 // Simple ID generation
                    }));
                    setFlights(flightsWithIds);
                } catch (error) {
                    console.error("Failed to fetch flights", error);
                    setFlights([]);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchFlights();
    }, [searchData]);


    const handleFlightSelect = (flightId: number, leg: 'outbound' | 'return') => {
        if (leg === 'outbound') {
            setSelectedOutbound(flightId);
            if (tripType === 'oneway') {
                // Immediate select for one way
                onSelect(flights.find(f => f.id === flightId));
            }
        } else {
            setSelectedReturn(flightId);
        }
    };

    const handleConfirmRoundTrip = () => {
        if (selectedOutbound && selectedReturn) {
            const outbound = flights.find(f => f.id === selectedOutbound);
            const returnFlight = flights.find(f => f.id === selectedReturn); // In real app, would fetch separate return flights
            // For now, allow selecting from same list or logic would need enhancement for return leg search
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
                                {searchData?.from || 'Origin'} <span className="text-slate-300 mx-1">→</span> {searchData?.to || 'Destination'}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">{departureDate}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Trip Type Toggle - Simplified for One Way initially as per prompt 'flight schedule' focus */}
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">One Way</span>
                    {/* Logic for Round Trip requires more complex return flight search, keeping simple for now */}
                </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-semibold">Finding flights...</p>
                    </div>
                ) : flights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <p className="text-sm font-semibold">No flights found.</p>
                    </div>
                ) : (
                    flights.map((flight) => (
                        <div
                            key={`out-${flight.id}`}
                            className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all group cursor-pointer ${selectedOutbound === flight.id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-300'
                                }`}
                            onClick={() => handleFlightSelect(flight.id, 'outbound')}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-800">{flight.airline} <span className="text-xs font-normal text-slate-500">({flight.flightNumber})</span></h3>
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
                            <button className="w-full mt-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                                Select Flight
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FlightDetailsPanel;
