// Homepage — SSR with server-side trending fetch (revalidate: 60s)
import type { CommunityItinerary } from "@nextdestination/shared";
import HomeContent from "@/components/home/HomeContent";

function mapApiItem(item: any): CommunityItinerary {
  const seed = (item.id || "").charCodeAt(0) || 0;
  return {
    id: item.id,
    name: item.metadata?.destination
      ? `Trip to ${item.metadata.destination}`
      : "Trip",
    location: item.metadata?.destination || "Unknown",
    destination: item.metadata?.destination || "Unknown",
    image:
      item.metadata?.image ||
      `https://images.unsplash.com/photo-${
        seed % 2 === 0
          ? "1476514525535-07fb3b4ae5f1"
          : "1503899036084-c55cdd92da26"
      }?q=80&w=800&auto=format&fit=crop`,
    creator: {
      id: "community",
      name: "Explorer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + item.id,
      verified: true,
    },
    saveCount: item.metadata?.saveCount || 0,
    duration: item.metadata?.days?.length || 3,
    tags: ["Trending"],
    category: item.metadata?.category || "Adventure",
    itinerary: item.metadata,
    createdAt: item.created_at,
    trending: true,
  };
}

export default async function HomePage() {
  let initialTrending: CommunityItinerary[] = [];

  try {
    const res = await fetch(
      `${
        process.env.EXPRESS_API_URL || "http://localhost:3001"
      }/api/itineraries/trending`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      initialTrending = Array.isArray(data) ? data.map(mapApiItem) : [];
    }
  } catch {
    // Graceful degradation — client will fetch on mount
  }

  return <HomeContent initialTrending={initialTrending} />;
}
