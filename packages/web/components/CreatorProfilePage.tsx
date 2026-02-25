import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicProfile, fetchCreatorItineraries } from '@nextdestination/shared';
import Navbar from './Navbar';
import SEOHead from './SEOHead';

interface CreatorProfile {
    displayName: string;
    avatarUrl?: string;
    role: string;
    plan: string;
    bio?: string;
    isVerified?: boolean;
    createdAt?: string;
}

interface CreatorItinerary {
    id: string;
    destination: string;
    days?: any[];
    image?: string;
    image_url?: string;
    tags?: string[];
    viewCount: number;
    remixCount: number;
}

const CreatorProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<CreatorProfile | null>(null);
    const [itineraries, setItineraries] = useState<CreatorItinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const load = async () => {
            setLoading(true);
            try {
                const [profileData, tripsData] = await Promise.all([
                    fetchPublicProfile(userId),
                    fetchCreatorItineraries(userId)
                ]);
                setProfile(profileData as CreatorProfile);
                setItineraries(tripsData);
            } catch (err: any) {
                setError(err.message || 'Creator not found');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [userId]);

    // Compute aggregate stats
    const totalViews = itineraries.reduce((sum, t) => sum + (t.viewCount || 0), 0);
    const totalRemixes = itineraries.reduce((sum, t) => sum + (t.remixCount || 0), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="w-14 h-14 border-[5px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-6" />
                <p className="text-slate-500 font-bold">Loading creator profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar onOpenBuilder={() => navigate('/')} />
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-100">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">😕</div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Creator Not Found</h2>
                        <p className="text-slate-500 mb-6 font-medium">{error || 'This profile doesn\'t exist.'}</p>
                        <button onClick={() => navigate('/')} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <SEOHead
                title={`${profile.displayName} — Creator Profile`}
                description={`Browse travel itineraries by ${profile.displayName} on NextDestination.ai. ${itineraries.length} trips shared.`}
                canonicalPath={`/creator/${userId}`}
            />
            <div className="min-h-screen bg-white">
                <Navbar onOpenBuilder={() => navigate('/')} />

                <main className="pt-28 pb-20 px-6">
                    <div className="max-w-5xl mx-auto">
                        {/* Creator Header */}
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                            {/* Avatar */}
                            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-xl shadow-indigo-200 overflow-hidden flex-shrink-0">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    profile.displayName?.charAt(0)?.toUpperCase() || '?'
                                )}
                            </div>

                            {/* Info */}
                            <div className="text-center md:text-left flex-1">
                                <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                                        {profile.displayName}
                                    </h1>
                                    {profile.isVerified && (
                                        <span className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm" title="Verified Creator">✓</span>
                                    )}
                                </div>
                                {profile.bio && (
                                    <p className="text-slate-500 font-medium text-lg mb-4 max-w-lg">{profile.bio}</p>
                                )}
                                <div className="flex items-center gap-3 justify-center md:justify-start">
                                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-600">
                                        {profile.role === 'influencer' ? '🌟 Creator' : '✈️ Traveler'}
                                    </span>
                                    {profile.createdAt && (
                                        <span className="text-sm text-slate-400 font-medium">
                                            Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 mb-12">
                            {[
                                { label: 'Trips', value: itineraries.length, icon: '🗺️' },
                                { label: 'Views', value: totalViews, icon: '👀' },
                                { label: 'Remixes', value: totalRemixes, icon: '🔄' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-6 text-center hover:bg-indigo-50 transition-colors">
                                    <span className="text-2xl mb-2 block">{stat.icon}</span>
                                    <div className="text-3xl font-black text-slate-900">{stat.value.toLocaleString()}</div>
                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Itineraries Grid */}
                        <h2 className="text-2xl font-black text-slate-900 mb-6">
                            {profile.displayName}'s Trips
                        </h2>

                        {itineraries.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-4xl mb-4">🏖️</div>
                                <p className="text-slate-400 font-bold text-lg">No public trips yet</p>
                                <p className="text-slate-400 font-medium text-sm mt-1">Check back later for travel inspiration!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {itineraries.map((trip) => (
                                    <div
                                        key={trip.id}
                                        className="group bg-white border-2 border-slate-100 rounded-3xl overflow-hidden hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 hover:-translate-y-1 transition-all cursor-pointer"
                                        onClick={() => navigate(`/share/${trip.id}`)}
                                    >
                                        {/* Image */}
                                        <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 to-violet-100 relative overflow-hidden">
                                            {(trip.image || trip.image_url) ? (
                                                <img
                                                    src={trip.image || trip.image_url}
                                                    alt={trip.destination}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-6xl">
                                                    ✈️
                                                </div>
                                            )}
                                            {/* Stats overlay */}
                                            <div className="absolute bottom-3 left-3 flex gap-2">
                                                <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1">
                                                    👀 {(trip.viewCount || 0).toLocaleString()}
                                                </span>
                                                <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 flex items-center gap-1">
                                                    🔄 {(trip.remixCount || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="font-black text-lg text-slate-900 mb-1 tracking-tight">
                                                {trip.destination || 'Unknown Destination'}
                                            </h3>
                                            <p className="text-sm text-slate-400 font-medium">
                                                {trip.days?.length || 0} days • {trip.days?.reduce((s: number, d: any) => s + (d.activities?.length || 0), 0) || 0} activities
                                            </p>
                                            {trip.tags && trip.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {trip.tags.slice(0, 3).map((tag: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/share/${trip.id}`); }}
                                                className="mt-4 w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors"
                                            >
                                                Clone This Trip ✈️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default CreatorProfilePage;
