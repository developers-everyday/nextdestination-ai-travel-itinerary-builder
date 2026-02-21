import type { Metadata } from "next";
import NavbarShell from "@/components/NavbarShell";
import { AccessibilityStatement } from "@/components/FooterPages";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "NextDestination.ai is committed to making travel planning accessible to everyone.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <>
      <NavbarShell />
      <AccessibilityStatement />
    </>
  );
}
