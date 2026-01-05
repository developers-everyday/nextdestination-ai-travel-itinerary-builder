import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { generateQuickItinerary, getDemoItinerary } from '../services/geminiService';
import { Itinerary } from '../types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { differenceInDays } from 'date-fns';

const PlanningSuggestions: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { destination } = location.state || { destination: 'Paris' }; // Default fallback
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Date Picker State
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() + 5)));

    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
    };

    // Helper to ensure all activities have IDs (reused from App.tsx - ideally should be a util)
    const sanitizeItinerary = (data: Itinerary): Itinerary => {
        return {
            ...data,
            days: data.days.map(day => ({
                ...day,
                activities: day.activities.map(act => ({
                    ...act,
                    id: act.id || Math.random().toString(36).substr(2, 9)
                }))
            }))
        };
    };

    const handleSelectPlan = async (days: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const rawData = await generateQuickItinerary(destination, days);
            const sanitized = sanitizeItinerary(rawData);
            navigate('/builder', { state: { itinerary: sanitized } });
        } catch (err: any) {
            console.error(err);
            const errorMessage = err?.message || "Unknown error occurred";
            setError(`We couldn't generate an itinerary. Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomDates = () => {
        if (!startDate || !endDate) {
            setError("Please select both a start and end date.");
            return;
        }

        const days = differenceInDays(endDate, startDate) + 1; // Include start date

        if (days < 1) {
            setError("End date must be after start date.");
            return;
        }

        if (days > 14) {
            setError("For now, we can only plan trips up to 14 days.");
            return;
        }

        handleSelectPlan(days);
    };


    const mockWeather = {
        temp: 24,
        condition: 'Sunny',
        icon: '☀️',
        high: 26,
        low: 18
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar onOpenBuilder={() => navigate('/')} />

            {isLoading && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                    <div className="w-24 h-24 border-[10px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-10"></div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Crafting Your {destination} Experience...</h2>
                    <p className="text-xl text-slate-500 font-semibold max-w-lg">Our AI is designing a perfect itinerary tailored just for you.</p>
                </div>
            )}

            <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
                        Trip to <span className="text-indigo-600">{destination}</span>
                    </h1>
                    <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                        Review the local forecast and choose the perfect duration for your adventure.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Travelling Dates Trigger */}
                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-left hover:shadow-2xl hover:shadow-indigo-100 transition-all hover:-translate-y-1 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Travelling Dates?</h2>
                        <div className="text-indigo-600 font-bold text-lg mb-6">
                            {startDate && endDate ? (
                                <>
                                    {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    {' - '}
                                    {endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </>
                            ) : 'Select your dates'}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                            <span>Click to open calendar</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                    </button>

                    {/* Weather Widget */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-100 transition-all cursor-default">
                        <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-600 px-4 py-1 rounded-bl-2xl text-xs font-bold tracking-widest uppercase">Current Weather</div>
                        <div className="flex items-center justify-between mt-4">
                            <div>
                                <div className="text-7xl mb-2">{mockWeather.icon}</div>
                                <div className="text-slate-900 font-black text-4xl">{mockWeather.temp}°C</div>
                                <div className="text-slate-500 font-medium text-lg">{mockWeather.condition}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">High / Low</div>
                                <div className="text-2xl font-bold text-slate-800">{mockWeather.high}° / {mockWeather.low}°</div>
                                <div className="mt-4 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full inline-block">
                                    Updates live
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar Modal */}
                {isCalendarOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative animate-scale-in">
                            <button
                                onClick={() => setIsCalendarOpen(false)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Select Dates</h2>
                            <div className="calendar-wrapper mb-6">
                                <DatePicker
                                    selected={startDate}
                                    onChange={handleDateChange}
                                    startDate={startDate}
                                    endDate={endDate}
                                    selectsRange
                                    inline
                                    minDate={new Date()}
                                    calendarClassName="!w-full !border-0 !font-sans"
                                />
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl mb-6 border border-slate-200">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</div>
                                    {startDate && endDate ? (
                                        <div className="text-lg font-black text-slate-900">
                                            {differenceInDays(endDate, startDate) + 1} Days
                                        </div>
                                    ) : (
                                        <div className="text-lg font-black text-slate-300">-- Days</div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dates</div>
                                    <div className="text-sm font-bold text-slate-700">
                                        {startDate ? startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '--'}
                                        {' - '}
                                        {endDate ? endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '--'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsCalendarOpen(false)}
                                    className="py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCalendarOpen(false);
                                        handleCustomDates();
                                    }}
                                    disabled={!startDate || !endDate}
                                    className={`py-4 rounded-xl font-black text-lg shadow-lg transition-all transform active:scale-95 ${startDate && endDate
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:-translate-y-1'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    Generate Plan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
                    {/* Quick Options */}
                    <div className="w-full">
                        <h2 className="text-2xl font-black text-slate-900 mb-8">Popular Durations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[3, 5, 6].map((dayCount) => (
                                <button
                                    key={dayCount}
                                    onClick={() => handleSelectPlan(dayCount)}
                                    className="group relative bg-white rounded-3xl p-6 text-left border-2 border-slate-100 hover:border-indigo-600 transition-all hover:shadow-xl hover:shadow-indigo-100 hover:-translate-y-1"
                                >
                                    <div className="text-5xl font-black text-slate-200 mb-4 group-hover:text-indigo-100 transition-colors">
                                        {dayCount}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                                        {dayCount} Days
                                    </h3>
                                    <div className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                                        Generate <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {error && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-6">
                        <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] text-center shadow-2xl animate-bounce">
                            <p className="text-red-900 font-bold text-lg mb-1">System Error</p>
                            <p className="text-red-700 font-medium text-sm">{error}</p>
                            <button onClick={() => setError(null)} className="mt-4 text-xs font-black text-red-900 uppercase tracking-widest border-b-2 border-red-200 hover:border-red-900 transition-all">Dismiss</button>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                .react-datepicker {
                    font-family: inherit;
                    border: none;
                }
                .react-datepicker__header {
                    background-color: white;
                    border-bottom: none;
                }
                .react-datepicker__day--selected, .react-datepicker__day--in-range, .react-datepicker__day--in-selecting-range {
                    background-color: #4f46e5 !important;
                    color: white !important;
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: transparent;
                    color: #1e293b;
                }
                .react-datepicker__day:hover {
                    background-color: #e0e7ff;
                    border-radius: 50%;
                }
            `}</style>
        </div>
    );
};

export default PlanningSuggestions;
