import React, { useState, useEffect, useCallback } from 'react';
import { searchFlightsTP, lookupIataCode } from '@nextdestination/shared';

interface IataResult {
    code: string;
    name: string;
    country: string;
    type: string;
}

interface FlightResult {
    id: string;
    airline: string;
    flightNumber: string;
    departure: string;
    arrival: string;
    departureDate: string;
    returnDate?: string;
    duration: string;
    price: string;
    priceRaw?: number;
    transfers: number;
    origin: string;
    destination: string;
    affiliateLink?: string;
    source: string;
    type: string;
}

interface FlightSearchPanelProps {
    onClose: () => void;
    onSelectFlight: (flight: any) => void;
    destination?: string;
    startDate?: string;
}

const FlightSearchPanel: React.FC<FlightSearchPanelProps> = ({ onClose, onSelectFlight, destination, startDate }) => {
    // Search form state
    const [fromQuery, setFromQuery] = useState('');
    const [toQuery, setToQuery] = useState(destination || '');
    const [fromCode, setFromCode] = useState('');
    const [toCode, setToCode] = useState('');
    const [departDate, setDepartDate] = useState(startDate || '');
    const [returnDate, setReturnDate] = useState('');

    // Autocomplete state
    const [fromSuggestions, setFromSuggestions] = useState<IataResult[]>([]);
    const [toSuggestions, setToSuggestions] = useState<IataResult[]>([]);
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);

    // Results state
    const [results, setResults] = useState<FlightResult[]>([]);
    const [affiliateSearchUrl, setAffiliateSearchUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    // Debounced IATA lookup
    const lookupCity = useCallback(async (query: string, setter: (r: IataResult[]) => void) => {
        if (query.length < 2) {
            setter([]);
            return;
        }
        try {
            const data = await lookupIataCode(query);
            setter(data.results || []);
        } catch {
            setter([]);
        }
    }, []);

    // From autocomplete
    useEffect(() => {
        if (!fromQuery || fromCode) return;
        const timer = setTimeout(() => lookupCity(fromQuery, setFromSuggestions), 300);
        return () => clearTimeout(timer);
    }, [fromQuery, fromCode, lookupCity]);

    // To autocomplete
    useEffect(() => {
        if (!toQuery || toCode) return;
        const timer = setTimeout(() => lookupCity(toQuery, setToSuggestions), 300);
        return () => clearTimeout(timer);
    }, [toQuery, toCode, lookupCity]);

    // Auto-lookup destination on mount
    useEffect(() => {
        if (destination && !toCode) {
            lookupCity(destination, (results) => {
                if (results.length > 0) {
                    setToCode(results[0].code);
                    setToQuery(`${results[0].name} (${results[0].code})`);
                }
            });
        }
    }, [destination]);

    const handleSelectFrom = (item: IataResult) => {
        setFromCode(item.code);
        setFromQuery(`${item.name} (${item.code})`);
        setFromSuggestions([]);
        setShowFromDropdown(false);
    };

    const handleSelectTo = (item: IataResult) => {
        setToCode(item.code);
        setToQuery(`${item.name} (${item.code})`);
        setToSuggestions([]);
        setShowToDropdown(false);
    };

    const handleSearch = async () => {
        if (!fromCode || !toCode) {
            setError('Please select origin and destination cities');
            return;
        }

        setLoading(true);
        setError('');
        setSearched(true);

        try {
            const data = await searchFlightsTP(fromCode, toCode, departDate, returnDate);
            setResults(data.results || []);
            setAffiliateSearchUrl(data.affiliateSearchUrl || '');
        } catch (err) {
            setError('Failed to search flights. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToItinerary = (flight: FlightResult) => {
        onSelectFlight({
            ...flight,
            activity: `${flight.airline} ${flight.flightNumber}`,
            description: `${fromQuery} → ${toQuery}\nDeparts: ${flight.departure} | Arrives: ${flight.arrival}\nDuration: ${flight.duration} | Price: ${flight.price}${flight.transfers > 0 ? ` | ${flight.transfers} stop${flight.transfers > 1 ? 's' : ''}` : ' | Direct'}`,
            time: flight.departure,
            location: `${fromQuery} → ${toQuery}`,
        });
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white transform rotate-45" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Search Flights</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Search Form */}
            <div className="px-6 py-4 space-y-4 border-b border-slate-100 shrink-0">
                {/* From */}
                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">From</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="City or Airport"
                            value={fromQuery}
                            onChange={(e) => {
                                setFromQuery(e.target.value);
                                setFromCode('');
                                setShowFromDropdown(true);
                            }}
                            onFocus={() => fromSuggestions.length > 0 && setShowFromDropdown(true)}
                            onBlur={() => setTimeout(() => setShowFromDropdown(false), 200)}
                        />
                    </div>
                    {showFromDropdown && fromSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                            {fromSuggestions.map((item) => (
                                <button
                                    key={item.code}
                                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-none"
                                    onMouseDown={() => handleSelectFrom(item)}
                                >
                                    <span className="font-bold text-sm text-slate-800">{item.name}</span>
                                    <span className="ml-2 text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{item.code}</span>
                                    {item.country && <span className="ml-2 text-xs text-slate-400">{item.country}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Swap button */}
                <div className="flex items-center justify-center -my-2 relative z-10">
                    <button
                        onClick={() => {
                            const tempQ = fromQuery; const tempC = fromCode;
                            setFromQuery(toQuery); setFromCode(toCode);
                            setToQuery(tempQ); setToCode(tempC);
                        }}
                        className="bg-white border border-slate-200 p-2 rounded-full shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all hover:shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                    </button>
                </div>

                {/* To */}
                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">To</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="City or Airport"
                            value={toQuery}
                            onChange={(e) => {
                                setToQuery(e.target.value);
                                setToCode('');
                                setShowToDropdown(true);
                            }}
                            onFocus={() => toSuggestions.length > 0 && setShowToDropdown(true)}
                            onBlur={() => setTimeout(() => setShowToDropdown(false), 200)}
                        />
                    </div>
                    {showToDropdown && toSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                            {toSuggestions.map((item) => (
                                <button
                                    key={item.code}
                                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-none"
                                    onMouseDown={() => handleSelectTo(item)}
                                >
                                    <span className="font-bold text-sm text-slate-800">{item.name}</span>
                                    <span className="ml-2 text-xs font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{item.code}</span>
                                    {item.country && <span className="ml-2 text-xs text-slate-400">{item.country}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Depart</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={departDate}
                            onChange={(e) => setDepartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Return <span className="text-slate-400 normal-case">(optional)</span></label>
                        <input
                            type="date"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    disabled={loading || !fromCode || !toCode}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Searching...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Search Flights
                        </>
                    )}
                </button>

                {error && (
                    <p className="text-xs text-red-500 font-medium text-center">{error}</p>
                )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {!searched && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <p className="text-sm font-medium">Search for flights to add to your itinerary</p>
                        <p className="text-xs mt-1">Enter origin and destination to find flights</p>
                    </div>
                )}

                {searched && !loading && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <p className="text-sm font-medium">No flights found</p>
                        <p className="text-xs mt-1">Try different cities or dates</p>
                        {affiliateSearchUrl && (
                            <a
                                href={affiliateSearchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                            >
                                Search on Aviasales →
                            </a>
                        )}
                    </div>
                )}

                {results.length > 0 && (
                    <div className="space-y-3">
                        {/* Results header */}
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {results.length} flight{results.length !== 1 ? 's' : ''} found
                            </p>
                            {affiliateSearchUrl && (
                                <a
                                    href={affiliateSearchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                                >
                                    See all on Aviasales
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>

                        {/* Flight cards */}
                        {results.map((flight) => (
                            <div
                                key={flight.id}
                                className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all bg-white group"
                            >
                                {/* Top row: Airline + Price */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                            <span className="text-xs font-black text-blue-700">{flight.airline.slice(0, 2).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{flight.airline}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{flight.flightNumber}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${flight.priceRaw ? 'text-green-600' : 'text-slate-500'}`}>{flight.price}</p>
                                        {flight.source === 'estimate' && (
                                            <p className="text-[10px] text-amber-500 font-medium">Estimated</p>
                                        )}
                                    </div>
                                </div>

                                {/* Time row */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-center">
                                        <p className="text-lg font-black text-slate-800">{flight.departure}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{flight.origin}</p>
                                    </div>
                                    <div className="flex-1 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <div className="h-[1px] flex-1 bg-slate-200" />
                                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap px-2 py-0.5 bg-slate-50 rounded-full">
                                                {flight.duration}
                                            </span>
                                            <div className="h-[1px] flex-1 bg-slate-200" />
                                        </div>
                                        <p className="text-center text-[10px] font-medium text-slate-400 mt-0.5">
                                            {flight.transfers === 0 ? '✈️ Direct' : `${flight.transfers} stop${flight.transfers > 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-slate-800">{flight.arrival}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{flight.destination}</p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAddToItinerary(flight)}
                                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add to Itinerary
                                    </button>
                                    {flight.affiliateLink && (
                                        <a
                                            href={flight.affiliateLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md"
                                        >
                                            Book
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlightSearchPanel;
