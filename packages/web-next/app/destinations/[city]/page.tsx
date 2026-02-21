// /destinations/[city] — ISR: revalidate every hour
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";

export const revalidate = 3600;

interface Attraction {
  name: string;
  description?: string;
  type?: string;
  rating?: number;
  duration?: string;
}

interface CommunityTrip {
  id: string;
  destination: string;
  days: number;
  category: string;
  tags: string[];
  imageUrl: string | null;
  createdAt: string;
}

interface DestinationData {
  name: string;
  generalInfo: Record<string, any> | null;
  attractions: Attraction[];
  communityTrips: CommunityTrip[];
  updatedAt: string;
}

type Props = { params: Promise<{ city: string }> };

async function fetchDestination(city: string): Promise<DestinationData | null> {
  try {
    const res = await fetch(
      `${
        process.env.EXPRESS_API_URL || "http://localhost:3001"
      }/api/destinations/${encodeURIComponent(city)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const data = await fetchDestination(city);
  if (!data) return { title: "Destination Not Found" };

  const attractionCount = data.attractions?.length || 0;
  const tripCount = data.communityTrips?.length || 0;

  return {
    title: `${data.name} Travel Guide — Things to Do & Itinerary Ideas`,
    description: `Explore ${data.name}: top attractions, safety tips, visa info, and ${tripCount} community itineraries. Plan your ${data.name} trip with AI.`,
    alternates: { canonical: `/destinations/${city}` },
    openGraph: {
      title: `${data.name} Travel Guide`,
      description: `${attractionCount} attractions · ${tripCount} community trips · AI itinerary builder`,
    },
  };
}

export default async function DestinationRoute({ params }: Props) {
  const { city } = await params;
  const data = await fetchDestination(city);

  if (!data) notFound();

  const displayName = data.name;
  const slug = city;
  const attractionCount = data.attractions?.length || 0;
  const tripCount = data.communityTrips?.length || 0;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: displayName,
    description: `Travel guide and itinerary ideas for ${displayName}. Explore top attractions, safety info, and community trip plans.`,
    url: `https://nextdestination.ai/destinations/${slug}`,
    touristType: ["Couples", "Families", "Solo Travelers"],
    ...(attractionCount > 0 && {
      includesAttraction: data.attractions.slice(0, 10).map((a) => ({
        "@type": "TouristAttraction",
        name: a.name,
        ...(a.description && { description: a.description }),
      })),
    }),
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <div className="pt-[72px]">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm font-medium transition-colors"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              {displayName}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl">
              Everything you need to plan your perfect {displayName} trip —
              attractions, travel tips, and community itineraries.
            </p>
            <div className="flex gap-4 mt-8">
              <Link
                href={`/planning-suggestions?destination=${encodeURIComponent(displayName)}`}
                className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg"
              >
                ⚡ Plan Your Trip with AI
              </Link>
              <a
                href="#community-trips"
                className="px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-2xl hover:bg-white/20 transition-colors border border-white/20"
              >
                Browse Trips
              </a>
            </div>
            <div className="flex gap-6 mt-10 text-sm text-white/60 font-medium">
              {attractionCount > 0 && (
                <span>📍 {attractionCount} Attractions</span>
              )}
              {tripCount > 0 && <span>📋 {tripCount} Community Trips</span>}
            </div>
          </div>
        </section>

        {/* General Info */}
        {data.generalInfo && Object.keys(data.generalInfo).length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-black text-slate-900 mb-8">
              Essential Travel Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(data.generalInfo).map(([key, value]) => {
                if (!value || typeof value !== "object") return null;
                return (
                  <div
                    key={key}
                    className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{getInfoIcon(key)}</span>
                      <h3 className="text-lg font-bold text-slate-900 capitalize">
                        {formatInfoKey(key)}
                      </h3>
                    </div>
                    <div className="text-slate-600 text-sm leading-relaxed space-y-2">
                      {renderInfoContent(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Attractions */}
        {attractionCount > 0 && (
          <section className="bg-slate-50 py-16">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                Top Things to Do
              </h2>
              <p className="text-slate-500 mb-8">
                Must-visit attractions and activities in {displayName}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.attractions.map((attraction, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">
                        {getAttractionIcon(attraction.type)}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">
                          {attraction.name}
                        </h3>
                        {attraction.description && (
                          <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                            {attraction.description}
                          </p>
                        )}
                        <div className="flex gap-3 mt-3 text-xs text-slate-400 font-medium">
                          {attraction.rating && (
                            <span>⭐ {attraction.rating}</span>
                          )}
                          {attraction.duration && (
                            <span>⏱ {attraction.duration}</span>
                          )}
                          {attraction.type && (
                            <span className="capitalize">
                              🏷 {attraction.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Community Trips */}
        {tripCount > 0 && (
          <section id="community-trips" className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              Community Itineraries
            </h2>
            <p className="text-slate-500 mb-8">
              Real {displayName} trips planned by travelers like you
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.communityTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/share/${trip.id}`}
                  className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  {trip.imageUrl ? (
                    <img
                      src={trip.imageUrl}
                      alt={`${trip.destination} trip`}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-4xl">
                      🗺️
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {trip.destination} — {trip.days}-Day Trip
                    </h3>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg">
                        {trip.category}
                      </span>
                      {trip.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/community"
                className="inline-flex px-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                View All Community Trips →
              </Link>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Ready to Plan Your {displayName} Trip?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Let AI create a personalized itinerary based on your dates,
              budget, and interests.
            </p>
            <Link
              href={`/planning-suggestions?destination=${encodeURIComponent(displayName)}`}
              className="inline-flex px-10 py-5 bg-white text-indigo-700 font-bold text-lg rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl"
            >
              ⚡ Create My {displayName} Itinerary — Free
            </Link>
          </div>
        </section>

        {/* Footer breadcrumbs */}
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <span>·</span>
          <Link
            href="/community"
            className="hover:text-indigo-600 transition-colors"
          >
            Community Trips
          </Link>
          <span>·</span>
          <Link
            href="/how-it-works"
            className="hover:text-indigo-600 transition-colors"
          >
            How It Works
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getInfoIcon(key: string): string {
  const icons: Record<string, string> = {
    visa: "🛂",
    safety: "🛡️",
    scams: "⚠️",
    health: "🏥",
    currency: "💰",
    language: "🗣️",
    transport: "🚌",
    weather: "☀️",
    culture: "🎭",
    food: "🍜",
    internet: "📶",
    emergency: "🚨",
    best_time: "📅",
    electricity: "🔌",
    tipping: "💵",
  };
  return icons[key.toLowerCase()] || "📌";
}

function formatInfoKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getAttractionIcon(type?: string): string {
  if (!type) return "📍";
  const icons: Record<string, string> = {
    museum: "🏛️",
    temple: "⛩️",
    park: "🌿",
    beach: "🏖️",
    market: "🛍️",
    restaurant: "🍽️",
    landmark: "🏛️",
    nature: "🌄",
    entertainment: "🎭",
    shopping: "🛒",
    historic: "🏰",
    adventure: "🧗",
  };
  return icons[type.toLowerCase()] || "📍";
}

function renderInfoContent(value: any): React.ReactNode {
  if (typeof value === "string") return <p>{value}</p>;
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1">
        {value.map((item, i) => (
          <li key={i}>
            {typeof item === "string" ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).map(([k, v]) => (
      <div key={k}>
        <span className="font-semibold text-slate-700 capitalize">
          {formatInfoKey(k)}:{" "}
        </span>
        <span>{typeof v === "string" ? v : JSON.stringify(v)}</span>
      </div>
    ));
  }
  return <p>{String(value)}</p>;
}
