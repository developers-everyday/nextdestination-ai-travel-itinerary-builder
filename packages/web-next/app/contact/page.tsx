import type { Metadata } from "next";
import NavbarShell from "@/components/NavbarShell";
import { ContactUs } from "@/components/FooterPages";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the NextDestination.ai team. We'd love to hear your feedback, questions, or partnership ideas.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <NavbarShell />
      <ContactUs />
    </>
  );
}
