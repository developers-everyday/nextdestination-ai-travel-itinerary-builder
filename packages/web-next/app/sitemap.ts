import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-data";

const BASE_URL = "https://nextdestination.ai";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookie-consent`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/accessibility`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/sitemap-page`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.1,
    },
  ];

  // Dynamic destination pages from the backend
  let destinationRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      `${process.env.EXPRESS_API_URL || "http://localhost:3001"}/api/destinations`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const destinations: { slug: string; updatedAt?: string }[] =
        await res.json();
      destinationRoutes = destinations.map((d) => ({
        url: `${BASE_URL}/destinations/${encodeURIComponent(d.slug)}`,
        lastModified: d.updatedAt ? new Date(d.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Graceful degradation — destinations omitted if API is down
  }

  // Public shared itinerary pages
  let shareRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      `${process.env.EXPRESS_API_URL || "http://localhost:3001"
      }/api/itineraries/trending?limit=100`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const itineraries: { id: string; created_at?: string }[] =
        await res.json();
      shareRoutes = itineraries.map((it) => ({
        url: `${BASE_URL}/share/${it.id}`,
        lastModified: it.created_at ? new Date(it.created_at) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Graceful degradation
  }
  // Blog routes (from static data)
  const blogRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...destinationRoutes, ...shareRoutes, ...blogRoutes];
}
