import React from 'react';

// Shared wrapper for consistency
const PageWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="min-h-screen bg-white pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-10 tracking-tight">{title}</h1>
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
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">1</div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Tell Us Your Dreams</h3>
                    <p>Start by entering your destination. Whether it's a specific city like "Tokyo" or a region like "Amalfi Coast", our AI understands global geography.</p>
                </div>
            </div>
            <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">2</div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">We Build the Skeleton</h3>
                    <p>Our intelligent algorithms instantly generate a day-by-day itinerary based on the optimal route, popular attractions, and local hidden gems.</p>
                </div>
            </div>
            <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">3</div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">You Make It Yours</h3>
                    <p>Use our drag-and-drop builder to adjust timings, add new stops from our search, or remove activities. It's your trip, we just help you organize it.</p>
                </div>
            </div>
        </div>
    </PageWrapper>
);

export const ContactUs: React.FC = () => (
    <PageWrapper title="Contact Us">
        <p className="lead text-xl mb-8">We'd love to hear from you. Whether you have a question about features, pricing, or need support planning your trip.</p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Support</h3>
                <p className="mb-4">For help with your itinerary or account:</p>
                <a href="mailto:support@nextdestination.ai" className="text-indigo-600 font-bold hover:underline">support@nextdestination.ai</a>
            </div>
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Partnerships</h3>
                <p className="mb-4">For business, press, and partnership inquiries:</p>
                <a href="mailto:partners@nextdestination.ai" className="text-indigo-600 font-bold hover:underline">partners@nextdestination.ai</a>
            </div>
        </div>

        <h3>Office Location</h3>
        <p>123 Innovation Drive, Suite 100<br />San Francisco, CA 94105<br />USA</p>
    </PageWrapper>
);

export const SiteMap: React.FC = () => (
    <PageWrapper title="Site Map">
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Main</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><a href="/" className="text-indigo-600 hover:underline">Home</a></li>
                    <li><a href="/builder" className="text-indigo-600 hover:underline">Itinerary Builder</a></li>
                    <li><a href="/community" className="text-indigo-600 hover:underline">Community</a></li>
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Support & Legal</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><a href="/how-it-works" className="text-indigo-600 hover:underline">How It Works</a></li>
                    <li><a href="/contact" className="text-indigo-600 hover:underline">Contact Us</a></li>
                    <li><a href="/terms" className="text-indigo-600 hover:underline">Terms of Use</a></li>
                    <li><a href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a></li>
                </ul>
            </div>
        </div>
    </PageWrapper>
);

export const TermsOfUse: React.FC = () => (
    <PageWrapper title="Terms of Use">
        <p className="text-sm text-slate-400 mb-8">Last Updated: December 29, 2025</p>

        <h3>1. Acceptance of Terms</h3>
        <p>By accessing and using NextDestination.ai, you accept and agree to be bound by the terms and provision of this agreement.</p>

        <h3>2. Use of Service</h3>
        <p>NextDestination.ai provides an AI-powered travel itinerary building service. You agree to use this service only for lawful purposes along with personal, non-commercial use.</p>

        <h3>3. Intellectual Property</h3>
        <p>All AI-generated content, designs, and code on this website are the intellectual property of NextDestination.ai unless otherwise stated.</p>

        <h3>4. Limitation of Liability</h3>
        <p>We do our best to provide accurate travel information, but we are not responsible for any changes in schedules, closures, or other real-world discrepancies.</p>
    </PageWrapper>
);

export const PrivacyPolicy: React.FC = () => (
    <PageWrapper title="Privacy Policy">
        <p className="text-sm text-slate-400 mb-8">Last Updated: December 29, 2025</p>

        <h3>1. Information We Collect</h3>
        <p>We collect information you provide directly to us, such as your travel preferences, search queries, and account information.</p>

        <h3>2. How We Use Information</h3>
        <p>We use the information to:</p>
        <ul className="list-disc pl-5">
            <li>Generate personalized travel itineraries.</li>
            <li>Improve our AI models (anonymized data only).</li>
            <li>Communicate with you about your account.</li>
        </ul>

        <h3>3. Data Sharing</h3>
        <p>We do not sell your personal data. We may share data with service providers who help us run our operations (e.g., cloud hosting).</p>
    </PageWrapper>
);

export const CookieConsent: React.FC = () => (
    <PageWrapper title="Cookie Policy">
        <p>NextDestination.ai uses cookies to improve your experience and analyze our traffic.</p>

        <h3>Types of Cookies We Use</h3>
        <ul className="list-disc pl-5 space-y-4 mt-4">
            <li>
                <strong>Essential Cookies:</strong> Necessary for the website to function (e.g., saving your login session).
            </li>
            <li>
                <strong>Preference Cookies:</strong> Remember your settings and travel preferences.
            </li>
            <li>
                <strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website (e.g., Google Analytics).
            </li>
        </ul>

        <h3 className="mt-8">Managing Cookies</h3>
        <p>You can control and/or delete cookies as you wish through your browser settings.</p>
    </PageWrapper>
);

export const AccessibilityStatement: React.FC = () => (
    <PageWrapper title="Accessibility Statement">
        <p>NextDestination.ai is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.</p>

        <h3>Measures to Support Accessibility</h3>
        <ul className="list-disc pl-5">
            <li>Include accessibility as part of our mission statement.</li>
            <li>Integrate accessibility into our procurement practices.</li>
            <li>Provide continual accessibility training for our staff.</li>
        </ul>

        <h3>Feedback</h3>
        <p>We welcome your feedback on the accessibility of NextDestination.ai. Please let us know if you encounter accessibility barriers on <a href="mailto:support@nextdestination.ai" className="text-indigo-600 underline">support@nextdestination.ai</a>.</p>
    </PageWrapper>
);
