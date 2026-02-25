import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import CreatorsDiscovery from "@/components/CreatorsDiscovery";
import type { CreatorCardData } from "@nextdestination/shared";

const API_BASE = process.env.EXPRESS_API_URL || "http://localhost:3001";

export const revalidate = 300; // Revalidate every 5 minutes

export const metadata: Metadata = {
  title: "Discover Creators — Travel Influencers & Guides",
  description:
    "Find and follow top travel creators on NextDestination.ai. Browse curated itineraries from influencers, travel agents, and passionate explorers worldwide.",
  alternates: { canonical: "/creators" },
  openGraph: {
    title: "Discover Travel Creators — NextDestination.ai",
    description:
      "Follow top travel creators and get inspired by their curated itineraries. Find your next destination through trusted guides.",
  },
};

async function fetchFeatured(): Promise<CreatorCardData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/creators/featured`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchInitialCreators(): Promise<{
  creators: CreatorCardData[];
  total: number;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/creators?page=1`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { creators: [], total: 0 };
    return res.json();
  } catch {
    return { creators: [], total: 0 };
  }
}

export default async function CreatorsPage() {
  const [featured, initial] = await Promise.all([
    fetchFeatured(),
    fetchInitialCreators(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-[72px]">
        <CreatorsDiscovery
          featuredCreators={featured}
          initialCreators={initial.creators}
          initialTotal={initial.total}
        />
      </div>
    </div>
  );
}
