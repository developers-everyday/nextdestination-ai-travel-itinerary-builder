import type { Metadata } from "next";
import NavbarShell from "@/components/NavbarShell";
import { PrivacyPolicy } from "@/components/FooterPages";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how NextDestination.ai collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <NavbarShell />
      <PrivacyPolicy />
    </>
  );
}
