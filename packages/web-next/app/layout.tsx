import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import Script from "next/script";
import Providers from "./Providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NextDestination.ai — AI Travel Planner | Build Your Perfect Itinerary",
    template: "%s | NextDestination.ai",
  },
  description:
    "Plan your dream trip in seconds with AI. Get personalized travel itineraries with flights, hotels, and activities. Free AI-powered travel planner for 150+ destinations.",
  metadataBase: new URL("https://nextdestination.ai"),
  keywords: [
    "AI travel planner",
    "travel itinerary builder",
    "trip planner AI",
    "AI itinerary generator",
    "travel planning app",
    "custom travel itinerary",
    "vacation planner",
  ],
  authors: [{ name: "NextDestination Technologies" }],
  openGraph: {
    type: "website",
    siteName: "NextDestination.ai",
    images: [{ url: "/og-default.png" }],
  },
  twitter: {
    card: "summary_large_image",
  },
  manifest: "/manifest.json",
  other: {
    "p:domain_verify": "d7d19831054df9e9e1eb600b6b873b76",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "NextDestination",
  },
};

const GA_ID = "G-JNN7SPCFSW";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${playfair.variable}`}>
      <head>
        <meta name="msvalidate.01" content="D18AFBE1B7E9200307D199D563C28119" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <Providers>{children}</Providers>

        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { send_page_view: false });
          `}
        </Script>
      </body>
    </html>
  );
}
