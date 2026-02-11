import React, { useState } from 'react';

interface SearchHeaderProps {
    onSearch: (destination: string) => void;
    isScriptLoaded: boolean;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ onSearch, isScriptLoaded }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    React.useEffect(() => {
        if (!query) {
            setSuggestions([]);
            return;
        }

        if (query.length > 2) {
            const timer = setTimeout(async () => {
                try {
                    const request = {
                        input: query,
                        includedPrimaryTypes: ['(regions)'], // prioritizing regions/cities for trip planning
                    };
                    const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
                    setSuggestions(suggestions);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Error fetching suggestions:", error);
                    setSuggestions([]);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (suggestion: google.maps.places.AutocompleteSuggestion) => {
        const placeText = suggestion.placePrediction?.text?.text;
        if (placeText) {
            setQuery(placeText);
            onSearch(placeText); // Auto-search on selection
            setShowSuggestions(false);
        }
    };

    return (
        <div className="bg-white border-b border-slate-100 pt-10 pb-10 px-6">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="relative z-40 max-w-3xl mx-auto">
                    <div className="bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 hover:shadow-2xl hover:shadow-indigo-200/30 transition-all duration-300 relative">
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex-1 flex items-center px-6 py-4 gap-4 bg-slate-50/50 rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Where do you want to go? (e.g., Paris, Tokyo...)"
                                    className="w-full bg-transparent outline-none text-slate-900 font-bold text-lg placeholder:text-slate-400 placeholder:font-medium"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 shrink-0"
                            >
                                Generate Plan
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                                {suggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.placePrediction?.placeId}
                                        onClick={() => handleSelectSuggestion(suggestion)}
                                        className="px-6 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none group flex items-center gap-3"
                                    >
                                        <div className="p-2 bg-slate-100 rounded-full text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{suggestion.placePrediction?.text?.text}</div>
                                            <div className="text-xs text-slate-500">{suggestion.placePrediction?.text?.matches?.[0]?.text}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SearchHeader;
