import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Trip Planner — Build Your Custom Itinerary",
  description:
    "Enter your destination, dates, and travel style. Our AI generates a personalized day-by-day itinerary with hotels, activities, and local tips in seconds.",
  alternates: { canonical: "/planning-suggestions" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
