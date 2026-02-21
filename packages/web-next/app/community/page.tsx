// Community page — SSR with server-side initial data fetch
import type { Metadata } from "next";
import type { CommunityItinerary } from "@nextdestination/shared";
import Navbar from "@/components/Navbar";
import CommunityPage from "@/components/CommunityPage";

export const metadata: Metadata = {
  title: "Community Itineraries — Real Journeys by Travelers",
  description:
    "Browse authentic travel itineraries shared by the NextDestination.ai community. Discover real trips, filter by style, and remix them for your own adventure.",
  alternates: { canonical: "/community" },
  openGraph: {
    title: "Community Travel Itineraries — NextDestination.ai",
    description:
      "Explore real itineraries from travelers worldwide. Adventure, luxury, budget, and more.",
  },
};

function mapApiItem(data: any): CommunityItinerary {
  const seed = (data.id || "").charCodeAt(0) || 0;
  return {
    id: data.id,
    name: data.name || `Trip to ${data.destination || "Unknown"}`,
    location: data.destination || "Unknown Location",
    destination: data.destination || "Unknown",
    image:
      data.image ||
      `https://images.unsplash.com/photo-${
        seed % 2 === 0
          ? "1476514525535-07fb3b4ae5f1"
          : "1503899036084-c55cdd92da26"
      }?q=80&w=800&auto=format&fit=crop`,
    creator: data.creator || {
      id: "anon",
      name: "Community Traveler",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id || "User"}`,
      verified: false,
    },
    saveCount: data.saveCount || 0,
    duration: data.days?.length || data.duration || 3,
    tags: data.tags || ["Travel", data.category || "Adventure"],
    category: data.category || "Adventure",
    itinerary: data,
    createdAt: data.createdAt || new Date().toISOString(),
    trending: true,
  };
}

export default async function CommunityRoute() {
  let initialItineraries: CommunityItinerary[] = [];

  try {
    const res = await fetch(
      `${
        process.env.EXPRESS_API_URL || "http://localhost:3001"
      }/api/itineraries/trending`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      initialItineraries = Array.isArray(data) ? data.map(mapApiItem) : [];
    }
  } catch {
    // Graceful degradation
  }

  return (
    <div className="pt-[72px]">
      <Navbar />
      <CommunityPage initialItineraries={initialItineraries} />
    </div>
  );
}
