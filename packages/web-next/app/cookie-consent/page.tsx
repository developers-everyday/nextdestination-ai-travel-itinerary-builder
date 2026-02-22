import type { Metadata } from "next";
import NavbarShell from "@/components/NavbarShell";
import { CookieConsent } from "@/components/FooterPages";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Understand how NextDestination.ai uses cookies to improve your travel planning experience.",
  alternates: { canonical: "/cookie-consent" },
};

export default function CookieConsentPage() {
  return (
    <>
      <NavbarShell />
      <CookieConsent />
    </>
  );
}
