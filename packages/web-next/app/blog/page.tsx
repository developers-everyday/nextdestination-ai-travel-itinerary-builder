import type { Metadata } from "next";
import Link from "next/link";
import NavbarShell from "@/components/NavbarShell";
import { blogPosts } from "@/lib/blog-data";

// ── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
    title: "Travel Blog — Tips, Guides & Itinerary Ideas",
    description:
        "Expert travel planning tips, destination guides, budget breakdowns, and day-by-day itinerary ideas. Plan smarter, travel better with NextDestination.ai.",
    alternates: { canonical: "/blog" },
    openGraph: {
        title: "Travel Blog — NextDestination.ai",
        description:
            "Expert travel planning tips, destination guides, and AI-powered itinerary ideas.",
    },
};

// ── JSON-LD ─────────────────────────────────────────────────────────────────

const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "NextDestination.ai Travel Blog",
    description:
        "Expert travel planning tips, destination guides, budget breakdowns, and itinerary ideas.",
    url: "https://nextdestination.ai/blog",
    publisher: {
        "@type": "Organization",
        name: "NextDestination Technologies",
        url: "https://nextdestination.ai",
    },
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://nextdestination.ai",
        },
        {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: "https://nextdestination.ai/blog",
        },
    ],
};

// ── Category colors ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
    "Travel Planning": "bg-blue-50 text-blue-700",
    "Destination Guides": "bg-emerald-50 text-emerald-700",
    Inspiration: "bg-pink-50 text-pink-700",
    "Budget Travel": "bg-amber-50 text-amber-700",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BlogIndexPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <NavbarShell />

            <div className="min-h-screen bg-white pt-[72px]">
                {/* Hero */}
                <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
                        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
                    </div>
                    <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm font-medium transition-colors"
                        >
                            ← Back to Home
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                            Travel Blog
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 max-w-2xl">
                            Expert tips, destination guides, and itinerary ideas to help you
                            plan smarter and travel better.
                        </p>
                    </div>
                </section>

                {/* Posts Grid */}
                <section className="max-w-5xl mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogPosts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Emoji Hero */}
                                <div className="h-44 bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                                    {post.heroEmoji}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Category + Reading Time */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <span
                                            className={`px-2.5 py-1 text-xs font-bold rounded-lg ${CATEGORY_COLORS[post.category] ||
                                                "bg-slate-50 text-slate-600"
                                                }`}
                                        >
                                            {post.category}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">
                                            {post.readingTime}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                        {post.title}
                                    </h2>

                                    {/* Description */}
                                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                                        {post.description}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                        <span className="text-xs text-slate-400">
                                            {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                        <span className="text-xs text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                                            Read →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-black mb-4">
                            Ready to Plan Your Trip?
                        </h2>
                        <p className="text-lg text-white/80 mb-8">
                            Let AI create a personalized day-by-day itinerary based on your
                            destination, dates, and interests.
                        </p>
                        <Link
                            href="/planning-suggestions"
                            className="inline-flex px-10 py-5 bg-white text-indigo-700 font-bold text-lg rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl"
                        >
                            ⚡ Create My Itinerary — Free
                        </Link>
                    </div>
                </section>

                {/* Breadcrumb Footer */}
                <div className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap gap-4 text-sm text-slate-400">
                    <Link href="/" className="hover:text-indigo-600 transition-colors">
                        Home
                    </Link>
                    <span>·</span>
                    <Link
                        href="/community"
                        className="hover:text-indigo-600 transition-colors"
                    >
                        Community Trips
                    </Link>
                    <span>·</span>
                    <span className="text-slate-600 font-medium">Blog</span>
                </div>
            </div>
        </>
    );
}
