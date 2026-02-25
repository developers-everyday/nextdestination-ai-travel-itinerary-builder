import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";

export const revalidate = 3600; // Revalidate every hour

interface CreatorProfile {
    displayName: string;
    avatarUrl?: string;
    role: string;
    bio?: string;
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

type Props = { params: Promise<{ userId: string }> };

const API_BASE = process.env.EXPRESS_API_URL || "http://localhost:3001";

async function fetchProfile(userId: string): Promise<CreatorProfile | null> {
    try {
        const res = await fetch(`${API_BASE}/api/profile/${userId}`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function fetchItineraries(userId: string): Promise<CreatorItinerary[]> {
    try {
        const res = await fetch(`${API_BASE}/api/itineraries/by-user/${userId}`, {
            next: { revalidate: 300 },
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { userId } = await params;
    const profile = await fetchProfile(userId);
    if (!profile) return { title: "Creator Profile" };

    return {
        title: `${profile.displayName} — Creator Profile`,
        description: `Browse travel itineraries by ${profile.displayName} on NextDestination.ai`,
        alternates: { canonical: `/creator/${userId}` },
    };
}

export default async function CreatorPage({ params }: Props) {
    const { userId } = await params;
    const [profile, itineraries] = await Promise.all([
        fetchProfile(userId),
        fetchItineraries(userId),
    ]);

    if (!profile) notFound();

    const totalViews = itineraries.reduce((s, t) => s + (t.viewCount || 0), 0);
    const totalRemixes = itineraries.reduce(
        (s, t) => s + (t.remixCount || 0),
        0
    );

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="pt-[72px]">
                {/* Hero */}
                <section className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white py-20 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
                        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
                    </div>
                    <div className="relative max-w-5xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                            {/* Avatar */}
                            <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-5xl font-black shadow-xl overflow-hidden flex-shrink-0 border-2 border-white/20">
                                {profile.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt={profile.displayName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    profile.displayName?.charAt(0)?.toUpperCase() || "?"
                                )}
                            </div>

                            <div className="text-center md:text-left flex-1">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                    {profile.displayName}
                                </h1>
                                {profile.bio && (
                                    <p className="text-lg text-white/70 mb-4 max-w-lg">
                                        {profile.bio}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 justify-center md:justify-start">
                                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-sm border border-white/20">
                                        {profile.role === "influencer"
                                            ? "🌟 Creator"
                                            : "✈️ Traveler"}
                                    </span>
                                    {profile.createdAt && (
                                        <span className="text-sm text-white/50 font-medium">
                                            Joined{" "}
                                            {new Date(profile.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 mt-10 max-w-md">
                            {[
                                { label: "Trips", value: itineraries.length, icon: "🗺️" },
                                { label: "Views", value: totalViews, icon: "👀" },
                                { label: "Remixes", value: totalRemixes, icon: "🔄" },
                            ].map((stat, i) => (
                                <div
                                    key={i}
                                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10"
                                >
                                    <span className="text-lg mb-1 block">{stat.icon}</span>
                                    <div className="text-2xl font-black">
                                        {stat.value.toLocaleString()}
                                    </div>
                                    <div className="text-xs font-bold text-white/50 uppercase tracking-wider mt-0.5">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Itineraries Grid */}
                <section className="max-w-5xl mx-auto px-6 py-16">
                    <h2 className="text-3xl font-black text-slate-900 mb-8">
                        {profile.displayName}&apos;s Trips
                    </h2>

                    {itineraries.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-4xl mb-4">🏖️</div>
                            <p className="text-slate-400 font-bold text-lg">
                                No public trips yet
                            </p>
                            <p className="text-slate-400 font-medium text-sm mt-1">
                                Check back later for travel inspiration!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {itineraries.map((trip) => (
                                <Link
                                    key={trip.id}
                                    href={`/share/${trip.id}`}
                                    className="group bg-white border-2 border-slate-100 rounded-3xl overflow-hidden hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 hover:-translate-y-1 transition-all"
                                >
                                    {/* Image */}
                                    <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 to-violet-100 relative overflow-hidden">
                                        {trip.image || trip.image_url ? (
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
                                            {trip.destination || "Unknown Destination"}
                                        </h3>
                                        <p className="text-sm text-slate-400 font-medium">
                                            {trip.days?.length || 0} days •{" "}
                                            {trip.days?.reduce(
                                                (s: number, d: any) =>
                                                    s + (d.activities?.length || 0),
                                                0
                                            ) || 0}{" "}
                                            activities
                                        </p>
                                        {trip.tags && trip.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {trip.tags.slice(0, 3).map((tag: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* CTA */}
                <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-black mb-4">
                            Want Your Own Travel Page?
                        </h2>
                        <p className="text-lg text-white/80 mb-8">
                            Create shareable itineraries from your travel videos —
                            automatically.
                        </p>
                        <Link
                            href="/create-from-transcript"
                            className="inline-flex px-10 py-5 bg-white text-indigo-700 font-bold text-lg rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl"
                        >
                            🎬 Create from Transcript — Free
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
