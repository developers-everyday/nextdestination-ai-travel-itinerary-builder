import type { Metadata } from "next";
import NavbarShell from "@/components/NavbarShell";
import { TermsOfUse } from "@/components/FooterPages";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Read the terms of use for NextDestination.ai, the AI-powered travel planning platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <NavbarShell />
      <TermsOfUse />
    </>
  );
}
