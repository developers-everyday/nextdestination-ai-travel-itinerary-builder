import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import { submitTranscript } from '@nextdestination/shared';

const TranscriptImportPage: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const [transcript, setTranscript] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validExts = ['.txt', '.vtt', '.srt'];
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!validExts.includes(ext)) {
            setError('Please upload a .txt, .vtt, or .srt file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setTranscript(event.target?.result as string);
            setError(null);
        };
        reader.readAsText(file);
    };

    const handleSubmit = async () => {
        if (!transcript.trim() || transcript.trim().length < 50) {
            setError('Please paste at least 50 characters of transcript text');
            return;
        }

        if (!session?.access_token) {
            setError('You must be logged in to generate itineraries');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitTranscript(transcript, session.access_token);
            // Redirect immediately to the share page (where user will see pending state)
            navigate(`/share/${result.id}`);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar onOpenBuilder={() => navigate('/')} />

            <main className="pt-28 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-indigo-200">
                            🎬
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                            Turn Your Video Into<br />
                            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                a Shareable Trip
                            </span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium max-w-lg mx-auto">
                            Paste your travel video transcript and get an instant shareable link.
                            Your itinerary builds in the background — share the link right away!
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="flex items-center justify-center gap-4 mb-10">
                        {[
                            { emoji: '📝', text: 'Paste transcript' },
                            { emoji: '⚡', text: 'Get link instantly' },
                            { emoji: '✨', text: 'Itinerary builds itself' }
                        ].map((step, i) => (
                            <React.Fragment key={i}>
                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full">
                                    <span className="text-lg">{step.emoji}</span>
                                    <span className="text-sm font-bold text-slate-600">{step.text}</span>
                                </div>
                                {i < 2 && <span className="text-slate-300 font-bold">→</span>}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 mb-6 hover:border-indigo-300 transition-colors focus-within:border-indigo-500 focus-within:shadow-lg focus-within:shadow-indigo-50">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                Video Transcript
                            </label>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Upload file
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.vtt,.srt"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>

                        <textarea
                            value={transcript}
                            onChange={(e) => { setTranscript(e.target.value); setError(null); }}
                            placeholder={`Paste your travel video transcript here...\n\nExample:\n"Hey guys! So I just landed in Bali and let me tell you, this place is incredible. Day one we checked into the COMO Uma Ubud resort — highly recommend. We spent the morning at the Tirta Empul temple, had lunch at Locavore, and then did a sunset hike on the Campuhan Ridge Walk..."`}
                            rows={12}
                            className="w-full resize-none text-slate-800 font-medium text-base leading-relaxed focus:outline-none placeholder:text-slate-300 placeholder:font-normal"
                        />

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                            <span className="text-xs text-slate-400 font-medium">
                                {transcript.length.toLocaleString()} characters
                                {transcript.length > 0 && transcript.length < 50 && ' (minimum 50)'}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                Supports .txt, .vtt, .srt files
                            </span>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-center">
                            <p className="text-red-700 font-bold text-sm">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || transcript.trim().length < 50}
                        className="w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-xl flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating your share link...
                            </>
                        ) : (
                            <>
                                ✨ Generate My Itinerary
                            </>
                        )}
                    </button>

                    {/* Info Note */}
                    <p className="text-center text-sm text-slate-400 font-medium mt-6">
                        You'll get an instant share link — paste it in your bio right away!<br />
                        The itinerary builds in the background (10–30 seconds).
                    </p>
                </div>
            </main>
        </div>
    );
};

export default TranscriptImportPage;
