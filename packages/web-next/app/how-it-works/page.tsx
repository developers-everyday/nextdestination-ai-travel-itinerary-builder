import type { Metadata } from "next";
import NavbarShell from "@/components/NavbarShell";
import { HowItWorks } from "@/components/FooterPages";

export const metadata: Metadata = {
  title: "How It Works — AI-Powered Travel Planning",
  description:
    "See how NextDestination.ai uses AI to create personalized travel itineraries in 3 simple steps. Plan smarter, travel better.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <>
      <NavbarShell />
      <HowItWorks />
    </>
  );
}
