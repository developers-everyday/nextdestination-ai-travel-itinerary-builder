import type { Metadata } from "next";
import NavbarShell from "@/components/NavbarShell";
import { SiteMap } from "@/components/FooterPages";

export const metadata: Metadata = {
  title: "Site Map",
  description:
    "Navigate all pages on NextDestination.ai — the AI-powered travel itinerary planner.",
  alternates: { canonical: "/sitemap" },
};

export default function SiteMapPage() {
  return (
    <>
      <NavbarShell />
      <SiteMap />
    </>
  );
}
