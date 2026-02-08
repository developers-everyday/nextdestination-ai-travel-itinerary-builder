import React, { useState, useEffect } from 'react';
import { getTransportOptions, getGeneralInfo } from '../services/transportService';

interface TransportInfoPanelProps {
    destination: string;
    dayActivities: any[];
    currentDay: number;
    isFirstDay: boolean;
    isLastDay: boolean;
    onClose: () => void;
}

const TransportInfoPanel: React.FC<TransportInfoPanelProps> = ({ destination, dayActivities, currentDay, isFirstDay, isLastDay, onClose }) => {
    const [transportOptions, setTransportOptions] = useState<any>(null);
    const [generalInfo, setGeneralInfo] = useState<any>(null);
    const [loadingTransport, setLoadingTransport] = useState(false);
    const [loadingInfo, setLoadingInfo] = useState(false);

    // Auto-fetch General Info on mount
    useEffect(() => {
        const fetchInfo = async () => {
            if (!generalInfo && destination) {
                setLoadingInfo(true);
                try {
                    const data = await getGeneralInfo(destination);
                    setGeneralInfo(data.info);
                } catch (e) {
                    console.error("Failed to load generic info", e);
                } finally {
                    setLoadingInfo(false);
                }
            }
        };
        fetchInfo();
    }, [destination, generalInfo]);

    const handleGenerateTransport = async () => {
        setLoadingTransport(true);
        try {
            const loc = isFirstDay ? "Airport" : "";
            const data = await getTransportOptions(destination, dayActivities, loc);
            setTransportOptions(data.options);
        } catch (e) {
            console.error("Failed to load transport", e);
        } finally {
            setLoadingTransport(false);
        }
    };

    return (
        <div className="w-full h-full bg-[#f8fafc] overflow-y-auto p-4 md:p-8 animate-fade-in relative z-50">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-50 md:hidden"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <h1 className="text-2xl font-bold text-slate-800 mb-6">Transport and Info</h1>

            {/* General Information Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">General Information</h2>
                </div>

                {loadingInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse"></div>
                        ))}
                    </div>
                ) : generalInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Forecast */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Forecast</div>
                                <div className="font-bold text-slate-800 text-lg mb-1">{generalInfo.weather?.tempRange || "N/A"}</div>
                                <div className="text-sm text-slate-600 font-medium">{generalInfo.weather?.condition || "Moderate"}</div>
                            </div>
                            <div className="text-indigo-500 mt-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Currency */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Currency & Budget</div>
                                <div className="font-bold text-slate-800 text-lg mb-1">{generalInfo.currency?.name || "Local Currency"} ({generalInfo.currency?.symbol})</div>
                                <div className="text-xs text-slate-500">Cost Level: <span className="font-medium text-slate-700">{generalInfo.currency?.costLevel}</span></div>
                            </div>
                            <div className="text-emerald-500 mt-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Language */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Language</div>
                                <div className="font-bold text-slate-800 text-lg mb-1">{generalInfo.language?.official || "Local"}</div>
                                <div className="text-xs text-slate-500 italic">"{generalInfo.language?.englishPrevalence}"</div>
                            </div>
                            <div className="text-blue-500 mt-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                            </div>
                        </div>

                        {/* Visa */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Visa Requirements</div>
                                <div className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{generalInfo.visa?.summary || "Check Online"}</div>
                            </div>
                            <div className="text-violet-500 mt-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-400 text-sm">Unavailable</div>
                )}

                {/* Additional Info Grid (Scams, Packing, Culture) */}
                {generalInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 animate-fade-in-up">
                        {/* Scams */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Safety & Scams</div>
                            </div>
                            <ul className="space-y-2">
                                {generalInfo.scams?.length > 0 ? generalInfo.scams.map((scam: any, i: number) => (
                                    <li key={i} className="text-sm text-slate-600">
                                        <span className="font-bold text-rose-600 block">{scam.name}</span>
                                        {scam.description}
                                    </li>
                                )) : <li className="text-sm text-slate-400">No specific alerts.</li>}
                            </ul>
                        </div>

                        {/* Packing */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Packing Essentials</div>
                            </div>
                            <ul className="space-y-2">
                                {generalInfo.packing?.length > 0 ? generalInfo.packing.map((item: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                        <span className="text-indigo-400">•</span> {item}
                                    </li>
                                )) : <li className="text-sm text-slate-400">Standard travel gear.</li>}
                            </ul>
                        </div>

                        {/* Culture/Considerations */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Local Considerations</div>
                            </div>
                            <ul className="space-y-2">
                                {generalInfo.considerations?.length > 0 ? generalInfo.considerations.map((item: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                        <span className="text-amber-400">•</span> {item}
                                    </li>
                                )) : <li className="text-sm text-slate-400">Be respectful.</li>}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Transport Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Getting There & Around</h2>
                    </div>
                </div>

                {!transportOptions ? (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-sm">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Explore Transport Options</h3>
                            <p className="text-slate-500 mb-6">Find the best ways to travel within {destination}. Compare costs, travel times, and convenience.</p>
                            <button
                                onClick={handleGenerateTransport}
                                disabled={loadingTransport}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
                            >
                                {loadingTransport ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Analyzing Routes...
                                    </>
                                ) : (
                                    <>
                                        Generate Options
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                        {transportOptions.suggestions?.map((opt: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col relative group">
                                {opt.bestFor && (
                                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 uppercase tracking-wide">
                                        Best for: {opt.bestFor}
                                    </div>
                                )}

                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-3xl">
                                                {opt.mode.toLowerCase().includes('train') ? '🚄' :
                                                    opt.mode.toLowerCase().includes('bus') ? '🚌' :
                                                        opt.mode.toLowerCase().includes('flight') ? '✈️' :
                                                            opt.mode.toLowerCase().includes('taxi') ? '🚕' : '🚗'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg leading-tight">{opt.mode}</h3>
                                                <div className="text-xs font-semibold text-slate-400 mt-0.5">{opt.description}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-baseline justify-between mb-6">
                                        <div className="text-2xl font-black text-slate-900">{opt.estimatedCost}</div>
                                        <div className="font-bold text-slate-500">{opt.estimatedTime}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pros</div>
                                            <ul className="space-y-1">
                                                {opt.pros?.map((pro: string, i: number) => (
                                                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                                        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        {pro}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cons</div>
                                            <ul className="space-y-1">
                                                {opt.cons?.map((con: string, i: number) => (
                                                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                                        <svg className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        {con}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {opt.bookingLink && (
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                                        <a
                                            href={opt.bookingLink.startsWith('http') ? opt.bookingLink : '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors"
                                        >
                                            View Schedule / Book
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransportInfoPanel;
