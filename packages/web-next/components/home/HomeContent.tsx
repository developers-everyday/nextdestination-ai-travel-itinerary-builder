"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APIProvider } from "@vis.gl/react-google-maps";
import type { CommunityItinerary } from "@nextdestination/shared";
import Navbar from "@/components/Navbar";
import SearchHeader from "./SearchHeader";
import CategoryBar from "./CategoryBar";
import ItineraryGrid from "./ItineraryGrid";
import HomeChatWidget from "./HomeChatWidget";

interface HomeContentProps {
  initialTrending: CommunityItinerary[];
}

export default function HomeContent({ initialTrending }: HomeContentProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const router = useRouter();

  const handleSearch = (destination: string) => {
    router.push(
      `/planning-suggestions?destination=${encodeURIComponent(destination)}`
    );
  };

  const handleGenerate = (data: any) => {
    const params = new URLSearchParams();
    if (data.destination) params.set("destination", data.destination);
    if (data.days) params.set("days", String(data.days));
    if (data.interests?.length)
      params.set("interests", data.interests.join(","));
    router.push(`/planning-suggestions?${params.toString()}`);
  };

  const handleBrowse = (data: any) => {
    const params = new URLSearchParams();
    if (data.destination) params.set("destination", data.destination);
    router.push(`/community?${params.toString()}`);
  };

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={["places"]}
    >
      <Navbar />
      <main className="pt-[68px]" style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
        <SearchHeader onSearch={handleSearch} />
        <CategoryBar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <ItineraryGrid
          category={selectedCategory}
          source="community"
          initialData={initialTrending}
        />
      </main>
      <HomeChatWidget onGenerate={handleGenerate} onBrowse={handleBrowse} />
    </APIProvider>
  );
}
