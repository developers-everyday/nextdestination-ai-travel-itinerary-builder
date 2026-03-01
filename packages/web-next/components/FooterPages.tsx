import React from "react";

// Shared wrapper for consistency
const PageWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="min-h-screen bg-white pt-32 pb-20">
    <div className="max-w-4xl mx-auto px-6">
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-10 tracking-tight">
        {title}
      </h1>
      <div className="prose prose-lg prose-slate max-w-none text-slate-600">
        {children}
      </div>
    </div>
  </div>
);

export const HowItWorks: React.FC = () => (
  <PageWrapper title="How NextDestination.ai Works">
    <div className="space-y-12">
      <div className="flex gap-6 items-start">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
          1
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Tell Us Your Dreams</h2>
          <p>
            Start by entering your destination. Whether it&apos;s a specific city like
            &quot;Tokyo&quot; or a region like &quot;Amalfi Coast&quot;, our AI understands
            global geography.
          </p>
        </div>
      </div>
      <div className="flex gap-6 items-start">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
          2
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">We Build the Skeleton</h2>
          <p>
            Our intelligent algorithms instantly generate a day-by-day itinerary based on
            the optimal route, popular attractions, and local hidden gems.
          </p>
        </div>
      </div>
      <div className="flex gap-6 items-start">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
          3
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">You Make It Yours</h2>
          <p>
            Use our drag-and-drop builder to adjust timings, add new stops from our
            search, or remove activities. It&apos;s your trip, we just help you organize
            it.
          </p>
        </div>
      </div>
    </div>
  </PageWrapper>
);

export const ContactUs: React.FC = () => (
  <PageWrapper title="Contact Us">
    <p className="lead text-xl mb-8">
      We&apos;d love to hear from you. Whether you have a question about features,
      pricing, or need support planning your trip.
    </p>
    <div className="grid md:grid-cols-2 gap-8 mb-12">
      <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Support</h2>
        <p className="mb-4">For help with your itinerary or account:</p>
        <a
          href="mailto:support@nextdestination.ai"
          className="text-indigo-600 font-bold hover:underline"
        >
          support@nextdestination.ai
        </a>
      </div>
      <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Partnerships</h2>
        <p className="mb-4">For business, press, and partnership inquiries:</p>
        <a
          href="mailto:partners@nextdestination.ai"
          className="text-indigo-600 font-bold hover:underline"
        >
          partners@nextdestination.ai
        </a>
      </div>
    </div>
    <h2>Office Location</h2>
    <p>
      123 Innovation Drive, Suite 100
      <br />
      San Francisco, CA 94105
      <br />
      USA
    </p>
  </PageWrapper>
);

export const SiteMap: React.FC = () => (
  <PageWrapper title="Site Map">
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Main</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <a href="/" className="text-indigo-600 hover:underline">
              Home
            </a>
          </li>
          <li>
            <a href="/builder" className="text-indigo-600 hover:underline">
              Itinerary Builder
            </a>
          </li>
          <li>
            <a href="/community" className="text-indigo-600 hover:underline">
              Community
            </a>
          </li>
          <li>
            <a href="/blog" className="text-indigo-600 hover:underline">
              Blog
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Support & Legal</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <a href="/how-it-works" className="text-indigo-600 hover:underline">
              How It Works
            </a>
          </li>
          <li>
            <a href="/contact" className="text-indigo-600 hover:underline">
              Contact Us
            </a>
          </li>
          <li>
            <a href="/terms" className="text-indigo-600 hover:underline">
              Terms of Use
            </a>
          </li>
          <li>
            <a href="/privacy" className="text-indigo-600 hover:underline">
              Privacy Policy
            </a>
          </li>
        </ul>
      </div>
    </div>
  </PageWrapper>
);

export const TermsOfUse: React.FC = () => (
  <PageWrapper title="Terms of Use">
    <p className="text-sm text-slate-400 mb-8">Last Updated: December 29, 2025</p>
    <h2>1. Acceptance of Terms</h2>
    <p>
      By accessing and using NextDestination.ai, you accept and agree to be bound by the
      terms and provision of this agreement.
    </p>
    <h2>2. Use of Service</h2>
    <p>
      NextDestination.ai provides an AI-powered travel itinerary building service. You
      agree to use this service only for lawful purposes along with personal,
      non-commercial use.
    </p>
    <h2>3. Intellectual Property</h2>
    <p>
      All AI-generated content, designs, and code on this website are the intellectual
      property of NextDestination.ai unless otherwise stated.
    </p>
    <h2>4. Limitation of Liability</h2>
    <p>
      We do our best to provide accurate travel information, but we are not responsible
      for any changes in schedules, closures, or other real-world discrepancies.
    </p>
  </PageWrapper>
);

export const PrivacyPolicy: React.FC = () => (
  <PageWrapper title="Privacy Policy">
    <p className="text-sm text-slate-400 mb-8">Last Updated: March 1, 2026</p>

    <h2>1. Who We Are</h2>
    <p>
      NextDestination.ai is an AI-powered travel planning platform. We help travelers
      plan trips, discover destinations, and connect with a community of fellow
      travelers. We are not a travel agency, tour operator, or direct travel service
      provider &mdash; we provide planning tools and informational content to help you
      organize your own trips.
    </p>

    <h2>2. Information We Collect</h2>
    <p>We collect the following types of information when you use our platform:</p>
    <ul className="list-disc pl-5 space-y-2">
      <li>
        <strong>Account Information:</strong> When you create an account, we collect
        your email address, display name, and profile picture through our
        authentication provider (Supabase Auth). You may also sign in via third-party
        providers such as Google, in which case we receive basic profile information
        from that provider.
      </li>
      <li>
        <strong>Travel Preferences &amp; Itineraries:</strong> Destinations, dates,
        interests, budget preferences, and the itineraries you create or save on the
        platform.
      </li>
      <li>
        <strong>Usage Data:</strong> Pages visited, features used, search queries,
        browser type, device information, IP address, and referring URLs. This helps
        us understand how our platform is used and improve it.
      </li>
      <li>
        <strong>Payment Information:</strong> If you subscribe to a paid plan, payment
        details are collected and processed securely by Stripe. We do not store your
        full credit card number on our servers.
      </li>
      <li>
        <strong>Community Content:</strong> Any content you post publicly, such as
        shared itineraries, comments, or community posts.
      </li>
      <li>
        <strong>Cookies &amp; Similar Technologies:</strong> We use cookies and local
        storage to maintain your session, remember preferences, and gather analytics.
        See our{" "}
        <a href="/cookie-consent" className="text-indigo-600 underline">
          Cookie Policy
        </a>{" "}
        for details.
      </li>
    </ul>

    <h2>3. How We Use Your Information</h2>
    <p>We use the information we collect to:</p>
    <ul className="list-disc pl-5 space-y-2">
      <li>
        Generate personalized, AI-powered travel itineraries based on your preferences
        and destination choices.
      </li>
      <li>
        Provide and maintain your account, saved itineraries, and subscription
        services.
      </li>
      <li>
        Personalize your experience by remembering your travel preferences and
        interests.
      </li>
      <li>
        Power community features, including shared itineraries and traveler
        interactions.
      </li>
      <li>
        Analyze platform usage to improve our features, fix bugs, and develop new
        tools.
      </li>
      <li>
        Communicate with you about account activity, new features, and service
        updates. You can opt out of non-essential communications at any time.
      </li>
      <li>
        Detect and prevent fraud, abuse, and security threats.
      </li>
    </ul>

    <h2>4. AI-Generated Content</h2>
    <p>
      NextDestination.ai uses Google&apos;s Gemini AI and Google Maps APIs to generate
      travel itineraries, destination information, and activity suggestions. Please be
      aware of the following:
    </p>
    <ul className="list-disc pl-5 space-y-2">
      <li>
        AI-generated content is provided as suggestions and informational starting
        points &mdash; not as guaranteed facts or professional travel advice.
      </li>
      <li>
        Attraction hours, prices, availability, and other real-world details may
        change without notice. Always verify critical details directly with venues and
        service providers before your trip.
      </li>
      <li>
        Your travel preferences and destination inputs are sent to these AI services
        to generate results. We do not send your personal account information (such as
        your email or payment details) to AI providers.
      </li>
    </ul>

    <h2>5. Third-Party Services</h2>
    <p>
      We integrate with the following third-party services to operate our platform.
      Each has its own privacy policy governing how it handles your data:
    </p>
    <ul className="list-disc pl-5 space-y-2">
      <li>
        <strong>Supabase:</strong> Authentication, database, and cloud infrastructure.
      </li>
      <li>
        <strong>Stripe:</strong> Payment processing for subscriptions.
      </li>
      <li>
        <strong>Google Maps Platform:</strong> Maps, places, and geolocation services
        within itineraries.
      </li>
      <li>
        <strong>Google Analytics:</strong> Website traffic and usage analytics.
      </li>
      <li>
        <strong>Affiliate Partners:</strong> We may display links to travel services
        through affiliate networks such as Travelpayouts, Booking.com, Skyscanner,
        GetYourGuide, and others. When you click an affiliate link and make a purchase
        on a partner site, that partner&apos;s privacy policy applies to your
        transaction. We may receive a commission but do not share your personal data
        with these partners.
      </li>
    </ul>

    <h2>6. Cookies</h2>
    <p>
      We use essential cookies for authentication and site functionality, preference
      cookies to remember your settings, and analytics cookies to understand how the
      platform is used. For full details on the types of cookies we use and how to
      manage them, please see our{" "}
      <a href="/cookie-consent" className="text-indigo-600 underline">
        Cookie Policy
      </a>
      .
    </p>

    <h2>7. Data Sharing</h2>
    <p>
      We do not sell, rent, or trade your personal information to third parties. We may
      share your data only in the following limited circumstances:
    </p>
    <ul className="list-disc pl-5 space-y-2">
      <li>
        <strong>Service Providers:</strong> With trusted providers who help us operate
        the platform (hosting, payment processing, analytics), under strict
        contractual obligations to protect your data.
      </li>
      <li>
        <strong>Legal Requirements:</strong> When required by law, regulation, legal
        process, or governmental request.
      </li>
      <li>
        <strong>Safety &amp; Security:</strong> To protect the rights, safety, or
        property of NextDestination.ai, our users, or the public.
      </li>
      <li>
        <strong>With Your Consent:</strong> When you explicitly choose to share
        content publicly (e.g., community posts or shared itineraries).
      </li>
    </ul>

    <h2>8. Data Retention &amp; Deletion</h2>
    <p>
      We retain your account data and saved itineraries for as long as your account is
      active. Usage and analytics data is retained in aggregated or anonymized form.
      If you wish to delete your account and all associated personal data, you can do
      so from your profile settings or by contacting us at{" "}
      <a
        href="mailto:support@nextdestination.ai"
        className="text-indigo-600 underline"
      >
        support@nextdestination.ai
      </a>
      . Upon receiving a deletion request, we will remove your personal data within 30
      days, except where retention is required by law.
    </p>

    <h2>9. Your Rights</h2>
    <p>
      Depending on your location, you may have the following rights regarding your
      personal data:
    </p>
    <ul className="list-disc pl-5 space-y-2">
      <li>
        <strong>Access:</strong> Request a copy of the personal data we hold about
        you.
      </li>
      <li>
        <strong>Correction:</strong> Request that we correct inaccurate or incomplete
        data.
      </li>
      <li>
        <strong>Deletion:</strong> Request that we delete your personal data.
      </li>
      <li>
        <strong>Portability:</strong> Request your data in a structured,
        machine-readable format.
      </li>
      <li>
        <strong>Objection:</strong> Object to certain types of processing, such as
        direct marketing.
      </li>
    </ul>
    <p>
      To exercise any of these rights, contact us at{" "}
      <a
        href="mailto:support@nextdestination.ai"
        className="text-indigo-600 underline"
      >
        support@nextdestination.ai
      </a>
      . We will respond within 30 days.
    </p>

    <h2>10. Children&apos;s Privacy</h2>
    <p>
      NextDestination.ai is not intended for children under the age of 13. We do not
      knowingly collect personal information from children under 13. If we become aware
      that we have collected data from a child under 13, we will take steps to delete
      it promptly. If you believe a child has provided us with personal data, please
      contact us at{" "}
      <a
        href="mailto:support@nextdestination.ai"
        className="text-indigo-600 underline"
      >
        support@nextdestination.ai
      </a>
      .
    </p>

    <h2>11. International Data Transfers</h2>
    <p>
      Our platform is hosted on cloud infrastructure that may process and store data in
      various countries. By using NextDestination.ai, you acknowledge that your data
      may be transferred to and processed in countries other than your own. We take
      appropriate measures to ensure your data is protected in accordance with this
      policy regardless of where it is processed.
    </p>

    <h2>12. Changes to This Policy</h2>
    <p>
      We may update this Privacy Policy from time to time to reflect changes in our
      practices or applicable laws. When we make material changes, we will update the
      &quot;Last Updated&quot; date at the top of this page and, where appropriate,
      notify you via email or a prominent notice on our platform. We encourage you to
      review this policy periodically.
    </p>

    <h2>13. Contact Us</h2>
    <p>
      If you have any questions, concerns, or requests regarding this Privacy Policy or
      how we handle your data, please contact us at:
    </p>
    <p>
      <a
        href="mailto:support@nextdestination.ai"
        className="text-indigo-600 underline"
      >
        support@nextdestination.ai
      </a>
    </p>
  </PageWrapper>
);

export const CookieConsent: React.FC = () => (
  <PageWrapper title="Cookie Policy">
    <p>NextDestination.ai uses cookies to improve your experience and analyze our traffic.</p>
    <h2>Types of Cookies We Use</h2>
    <ul className="list-disc pl-5 space-y-4 mt-4">
      <li>
        <strong>Essential Cookies:</strong> Necessary for the website to function (e.g.,
        saving your login session).
      </li>
      <li>
        <strong>Preference Cookies:</strong> Remember your settings and travel
        preferences.
      </li>
      <li>
        <strong>Analytics Cookies:</strong> Help us understand how visitors interact with
        our website (e.g., Google Analytics).
      </li>
    </ul>
    <h2 className="mt-8">Managing Cookies</h2>
    <p>
      You can control and/or delete cookies as you wish through your browser settings.
    </p>
  </PageWrapper>
);

export const AccessibilityStatement: React.FC = () => (
  <PageWrapper title="Accessibility Statement">
    <p>
      NextDestination.ai is committed to ensuring digital accessibility for people with
      disabilities. We are continually improving the user experience for everyone and
      applying the relevant accessibility standards.
    </p>
    <h2>Measures to Support Accessibility</h2>
    <ul className="list-disc pl-5">
      <li>Include accessibility as part of our mission statement.</li>
      <li>Integrate accessibility into our procurement practices.</li>
      <li>Provide continual accessibility training for our staff.</li>
    </ul>
    <h2>Feedback</h2>
    <p>
      We welcome your feedback on the accessibility of NextDestination.ai. Please let us
      know if you encounter accessibility barriers on{" "}
      <a
        href="mailto:support@nextdestination.ai"
        className="text-indigo-600 underline"
      >
        support@nextdestination.ai
      </a>
      .
    </p>
  </PageWrapper>
);
