import type { Metadata } from "next";
import NavbarShell from "@/components/NavbarShell";
import { HowItWorks } from "@/components/FooterPages";

const howItWorksSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Plan a Trip with NextDestination.ai",
  description:
    "Learn how to use AI to plan your perfect travel itinerary in 3 simple steps.",
  step: [
    {
      "@type": "HowToStep",
      name: "Enter Your Destination",
      text: "Type in your dream destination and let our AI understand your travel preferences.",
    },
    {
      "@type": "HowToStep",
      name: "Customize Your Plan",
      text: "Review AI-generated suggestions for activities, hotels, and flights. Customize everything to your liking.",
    },
    {
      "@type": "HowToStep",
      name: "Share & Go",
      text: "Save your itinerary, share it with travel companions, or remix community trips.",
    },
  ],
};

export const metadata: Metadata = {
  title: "How It Works — AI-Powered Travel Planning",
  description:
    "See how NextDestination.ai uses AI to create personalized travel itineraries in 3 simple steps. Plan smarter, travel better.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howItWorksSchema) }}
      />
      <NavbarShell />
      <HowItWorks />
    </>
  );
}
