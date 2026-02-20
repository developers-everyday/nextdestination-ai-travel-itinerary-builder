import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  structuredData?: object;
}

const SITE_NAME = 'NextDestination.ai';
const SITE_URL = 'https://nextdestination.ai';
const DEFAULT_DESCRIPTION = 'Plan your dream trip in seconds with AI. Get personalized travel itineraries with flights, hotels, and activities. Free AI-powered travel planner for 150+ destinations.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

/**
 * Reusable SEO <head> component.
 * Drop into any page/route to set title, description, OG tags, canonical, and JSON-LD.
 */
const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '/',
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  structuredData,
}) => {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — AI Travel Planner | Build Your Perfect Itinerary`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

// ── Pre-built structured data objects ──────────────────────────────────────

export const homePageSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'NextDestination.ai',
      url: 'https://nextdestination.ai',
      description: 'AI-powered travel itinerary planner that creates personalized trip plans with flights, hotels, and activities.',
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '2000',
      },
    },
    {
      '@type': 'Organization',
      name: 'NextDestination Technologies',
      url: 'https://nextdestination.ai',
      logo: 'https://nextdestination.ai/favicon.svg',
      sameAs: [],
    },
  ],
};

export const communityPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Community Travel Itineraries',
  description: 'Browse and remix real travel itineraries created by our community of travelers. Solo trips, couple getaways, and family vacations to 150+ destinations.',
  url: 'https://nextdestination.ai/community',
  isPartOf: {
    '@type': 'WebSite',
    name: 'NextDestination.ai',
    url: 'https://nextdestination.ai',
  },
};

export const howItWorksSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Plan a Trip with NextDestination.ai',
  description: 'Learn how to use AI to plan your perfect travel itinerary in 3 simple steps.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Enter Your Destination',
      text: 'Type in your dream destination and let our AI understand your travel preferences.',
    },
    {
      '@type': 'HowToStep',
      name: 'Customize Your Plan',
      text: 'Review AI-generated suggestions for activities, hotels, and flights. Customize everything to your liking.',
    },
    {
      '@type': 'HowToStep',
      name: 'Share & Go',
      text: 'Save your itinerary, share it with travel companions, or remix community trips.',
    },
  ],
};

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is NextDestination.ai free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! NextDestination.ai offers a free plan that lets you create AI-powered travel itineraries, browse community trips, and plan your dream vacation at no cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does AI travel planning work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI analyzes your destination, travel dates, interests, and budget to generate a personalized day-by-day itinerary with recommended activities, hotels, flights, and transport options.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I customize my AI-generated itinerary?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely! Every element of your itinerary is fully customizable. Add, remove, or reorder activities, change hotels, adjust timings, and use our voice assistant for hands-free editing.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I share my travel itinerary?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Once your itinerary is saved, you can share it via a unique link. Recipients can view your full trip plan and even remix it to create their own version.',
      },
    },
    {
      '@type': 'Question',
      name: 'What destinations does NextDestination.ai support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'NextDestination.ai supports 150+ destinations worldwide, from popular cities like Paris, Tokyo, and Bali to hidden gems. Our AI can plan trips to virtually any destination.',
      },
    },
  ],
};

/**
 * Build JSON-LD for a shared itinerary page.
 */
export const buildSharedItinerarySchema = (
  destination: string,
  dayCount: number,
  activityNames: string[],
  shareUrl: string,
) => ({
  '@context': 'https://schema.org',
  '@type': 'TouristTrip',
  name: `${destination} — ${dayCount}-Day Itinerary`,
  description: `A ${dayCount}-day travel itinerary for ${destination} with ${activityNames.length} activities, curated on NextDestination.ai.`,
  url: shareUrl,
  itinerary: {
    '@type': 'ItemList',
    numberOfItems: activityNames.length,
    itemListElement: activityNames.slice(0, 10).map((name, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'TouristAttraction',
        name,
      },
    })),
  },
});

export default SEOHead;
