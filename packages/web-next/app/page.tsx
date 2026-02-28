// Homepage — SSR with server-side trending fetch (revalidate: 60s)
import type { CommunityItinerary } from "@nextdestination/shared";
import HomeContent from "@/components/home/HomeContent";

const homepageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "NextDestination.ai",
      url: "https://nextdestination.ai",
      description:
        "AI-powered travel itinerary planner that creates personalized trip plans with flights, hotels, and activities.",
      applicationCategory: "TravelApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "2000",
      },
    },
    {
      "@type": "Organization",
      name: "NextDestination Technologies",
      url: "https://nextdestination.ai",
      logo: "https://nextdestination.ai/favicon.svg",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is NextDestination.ai free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! NextDestination.ai offers a free plan that lets you create AI-powered travel itineraries, browse community trips, and plan your dream vacation at no cost.",
      },
    },
    {
      "@type": "Question",
      name: "How does AI travel planning work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our AI analyzes your destination, travel dates, interests, and budget to generate a personalized day-by-day itinerary with recommended activities, hotels, flights, and transport options.",
      },
    },
    {
      "@type": "Question",
      name: "Can I customize my AI-generated itinerary?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely! Every element of your itinerary is fully customizable. Add, remove, or reorder activities, change hotels, adjust timings, and use our voice assistant for hands-free editing.",
      },
    },
    {
      "@type": "Question",
      name: "How do I share my travel itinerary?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Once your itinerary is saved, you can share it via a unique link. Recipients can view your full trip plan and even remix it to create their own version.",
      },
    },
    {
      "@type": "Question",
      name: "What destinations does NextDestination.ai support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "NextDestination.ai supports 150+ destinations worldwide, from popular cities like Paris, Tokyo, and Bali to hidden gems. Our AI can plan trips to virtually any destination.",
      },
    },
  ],
};

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
      `https://images.unsplash.com/photo-${seed % 2 === 0
        ? "1476514525535-07fb3b4ae5f1"
        : "1503899036084-c55cdd92da26"
      }?q=80&w=800&auto=format&fit=crop`,
    creator: {
      id: "community",
      name: "Explorer",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=" + item.id,
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
      `${process.env.EXPRESS_API_URL || "http://localhost:3001"
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomeContent initialTrending={initialTrending} />
    </>
  );
}
