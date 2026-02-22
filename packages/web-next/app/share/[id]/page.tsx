// /share/[id] — ISR: revalidate every 24 hours
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";

export const revalidate = 86400;

interface Activity {
  activity: string;
  duration?: string;
  location?: string;
  description?: string;
}

interface Day {
  day: number;
  theme: string;
  activities: Activity[];
}

interface SharedItinerary {
  destination: string;
  days: Day[];
  totalBudget?: number;
  image_url?: string;
}

type Props = { params: Promise<{ id: string }> };

async function fetchItinerary(id: string): Promise<SharedItinerary | null> {
  try {
    const res = await fetch(
      `${
        process.env.EXPRESS_API_URL || "http://localhost:3001"
      }/api/itineraries/${id}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchItinerary(id);
  if (!data) return { title: "Shared Itinerary" };

  const totalActivities = data.days.reduce(
    (sum, d) => sum + (d.activities?.length || 0),
    0
  );

  return {
    title: `${data.destination} — ${data.days.length}-Day Itinerary`,
    description: `Explore this ${data.days.length}-day ${data.destination} travel itinerary with ${totalActivities} activities. Built on NextDestination.ai. Remix it for your own trip.`,
    alternates: { canonical: `/share/${id}` },
    openGraph: {
      title: `${data.destination} Trip — ${data.days.length} Days`,
      description: `${totalActivities} activities across ${data.days.length} days in ${data.destination}. Remix it for your own trip.`,
      ...(data.image_url && { images: [{ url: data.image_url }] }),
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const data = await fetchItinerary(id);

  if (!data) notFound();

  const totalActivities = data.days.reduce(
    (sum, d) => sum + (d.activities?.length || 0),
    0
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Trip",
    name: `${data.destination} — ${data.days.length}-Day Itinerary`,
    description: `A ${data.days.length}-day travel itinerary for ${data.destination} with ${totalActivities} activities.`,
    url: `https://nextdestination.ai/share/${id}`,
    touristType: ["Solo Travelers", "Couples", "Families"],
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
          {data.image_url && (
            <div className="absolute inset-0">
              <img
                src={data.image_url}
                alt={data.destination}
                className="w-full h-full object-cover opacity-30"
              />
            </div>
          )}
          <div className="relative max-w-4xl mx-auto px-6 py-20 md:py-28">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm font-medium transition-colors"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              {data.destination}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-8">
              A {data.days.length}-day itinerary with {totalActivities}{" "}
              activities — crafted on NextDestination.ai
            </p>
            <Link
              href={`/planning-suggestions?destination=${encodeURIComponent(data.destination)}&days=${data.days.length}`}
              className="inline-flex px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              ⚡ Create Your Own {data.destination} Itinerary
            </Link>
            <div className="flex gap-6 mt-8 text-sm text-white/60 font-medium">
              <span>📅 {data.days.length} Days</span>
              <span>🎯 {totalActivities} Activities</span>
              {data.totalBudget && (
                <span>💰 ${data.totalBudget.toLocaleString()} estimated</span>
              )}
            </div>
          </div>
        </section>

        {/* Day-by-Day */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-black text-slate-900 mb-8">
            Day-by-Day Itinerary
          </h2>
          <div className="space-y-8">
            {data.days.map((day) => (
              <div
                key={day.day}
                className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm"
              >
                <div className="bg-indigo-600 px-8 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {day.day}
                  </div>
                  <h3 className="text-xl font-black text-white">{day.theme}</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {(day.activities || []).map((act, i) => (
                    <div
                      key={i}
                      className="px-8 py-5 flex items-start gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">
                          {act.activity}
                        </p>
                        {act.location && (
                          <p className="text-sm text-slate-500 mt-0.5">
                            📍 {act.location}
                          </p>
                        )}
                        {act.description && (
                          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                            {act.description}
                          </p>
                        )}
                        {act.duration && (
                          <p className="text-xs text-slate-400 mt-1">
                            ⏱ {act.duration}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Love This Trip?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Create your own personalized version with AI — adjust dates,
              budget, and interests.
            </p>
            <Link
              href={`/planning-suggestions?destination=${encodeURIComponent(data.destination)}&days=${data.days.length}`}
              className="inline-flex px-10 py-5 bg-white text-indigo-700 font-bold text-lg rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl"
            >
              ⚡ Remix This Trip — Free
            </Link>
          </div>
        </section>

        {/* Footer breadcrumbs */}
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-wrap gap-4 text-sm text-slate-400">
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
            href={`/destinations/${encodeURIComponent(data.destination.toLowerCase())}`}
            className="hover:text-indigo-600 transition-colors"
          >
            {data.destination} Travel Guide
          </Link>
        </div>
      </div>
    </div>
  );
}
