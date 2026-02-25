import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NavbarShell from "@/components/NavbarShell";
import { blogPosts, getPostBySlug, getAllSlugs } from "@/lib/blog-data";
import type { BlogSection } from "@/lib/blog-data";

// ── Static Params (pre-render all blog slugs at build time) ─────────────────

export function generateStaticParams() {
    return getAllSlugs().map((slug) => ({ slug }));
}

// ── Dynamic Metadata ────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = getPostBySlug(slug);
    if (!post) return { title: "Article Not Found" };

    return {
        title: post.title,
        description: post.description,
        alternates: { canonical: `/blog/${post.slug}` },
        openGraph: {
            title: post.title,
            description: post.description,
            type: "article",
            publishedTime: post.publishedAt,
            modifiedTime: post.updatedAt,
            authors: [post.author],
            tags: post.tags,
        },
    };
}

// ── Category colors ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
    "Travel Planning": "bg-blue-50 text-blue-700",
    "Destination Guides": "bg-emerald-50 text-emerald-700",
    Inspiration: "bg-pink-50 text-pink-700",
    "Budget Travel": "bg-amber-50 text-amber-700",
};

// ── Section Renderer ────────────────────────────────────────────────────────

function renderSection(section: BlogSection, index: number) {
    switch (section.type) {
        case "heading":
            return (
                <h2
                    key={index}
                    className="text-2xl md:text-3xl font-black text-slate-900 mt-10 mb-4"
                >
                    {section.text}
                </h2>
            );

        case "paragraph":
            return (
                <p
                    key={index}
                    className="text-slate-600 leading-relaxed mb-4 text-base md:text-lg"
                >
                    {section.text}
                </p>
            );

        case "list":
            return (
                <ul
                    key={index}
                    className="list-disc list-inside space-y-2 mb-6 text-slate-600 text-base md:text-lg pl-2"
                >
                    {section.items?.map((item, i) => (
                        <li key={i} className="leading-relaxed">
                            {item}
                        </li>
                    ))}
                </ul>
            );

        case "tip":
            return (
                <div
                    key={index}
                    className="bg-indigo-50 border-l-4 border-indigo-500 px-6 py-4 rounded-r-xl mb-6"
                >
                    <p className="text-indigo-800 text-sm md:text-base font-medium leading-relaxed">
                        💡 <strong>Tip:</strong> {section.text}
                    </p>
                </div>
            );

        default:
            return null;
    }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogArticlePage({ params }: Props) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) notFound();

    // Related posts (all posts except current)
    const relatedPosts = blogPosts.filter((p) => p.slug !== post.slug);

    // ── JSON-LD ─────────────────────────────────────────────────────────────

    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: {
            "@type": "Organization",
            name: post.author,
            url: "https://nextdestination.ai",
        },
        publisher: {
            "@type": "Organization",
            name: "NextDestination Technologies",
            url: "https://nextdestination.ai",
            logo: {
                "@type": "ImageObject",
                url: "https://nextdestination.ai/favicon.svg",
            },
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://nextdestination.ai/blog/${post.slug}`,
        },
        keywords: post.tags.join(", "),
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
            {
                "@type": "ListItem",
                position: 3,
                name: post.title,
                item: `https://nextdestination.ai/blog/${post.slug}`,
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
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
                    <div className="relative max-w-3xl mx-auto px-6 py-16 md:py-24">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-white/60 mb-6">
                            <Link href="/" className="hover:text-white transition-colors">
                                Home
                            </Link>
                            <span>/</span>
                            <Link
                                href="/blog"
                                className="hover:text-white transition-colors"
                            >
                                Blog
                            </Link>
                            <span>/</span>
                            <span className="text-white/80 truncate max-w-[200px]">
                                {post.title}
                            </span>
                        </div>

                        {/* Category + Meta */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-lg backdrop-blur-sm">
                                {post.category}
                            </span>
                            <span className="text-sm text-white/60">{post.readingTime}</span>
                        </div>

                        {/* Emoji */}
                        <div className="text-6xl mb-4">{post.heroEmoji}</div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
                            {post.title}
                        </h1>

                        {/* Description */}
                        <p className="text-lg text-white/80 max-w-2xl leading-relaxed">
                            {post.description}
                        </p>

                        {/* Author + Date */}
                        <div className="flex items-center gap-4 mt-8 text-sm text-white/60">
                            <span>By {post.author}</span>
                            <span>·</span>
                            <span>
                                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Article Content */}
                <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
                    {post.sections.map((section, i) => renderSection(section, i))}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-slate-100">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </article>

                {/* In-Article CTA */}
                <section className="bg-gradient-to-br from-indigo-50 to-purple-50 py-16">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">
                            Plan Your Trip with AI
                        </h2>
                        <p className="text-slate-600 mb-8 text-lg">
                            Get a personalized day-by-day itinerary based on your destination,
                            dates, budget, and interests — in seconds.
                        </p>
                        <Link
                            href="/planning-suggestions"
                            className="inline-flex px-10 py-5 bg-indigo-600 text-white font-bold text-lg rounded-2xl hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-200"
                        >
                            ⚡ Create My Itinerary — Free
                        </Link>
                    </div>
                </section>

                {/* Related Posts */}
                <section className="max-w-5xl mx-auto px-6 py-16">
                    <h2 className="text-2xl font-black text-slate-900 mb-8">
                        More from the Blog
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedPosts.map((related) => (
                            <Link
                                key={related.slug}
                                href={`/blog/${related.slug}`}
                                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="h-28 bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
                                    {related.heroEmoji}
                                </div>
                                <div className="p-4">
                                    <span
                                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md mb-2 ${CATEGORY_COLORS[related.category] ||
                                            "bg-slate-50 text-slate-600"
                                            }`}
                                    >
                                        {related.category}
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                        {related.title}
                                    </h3>
                                    <span className="text-xs text-slate-400 mt-2 block">
                                        {related.readingTime}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Footer Breadcrumbs */}
                <div className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap gap-4 text-sm text-slate-400">
                    <Link href="/" className="hover:text-indigo-600 transition-colors">
                        Home
                    </Link>
                    <span>·</span>
                    <Link
                        href="/blog"
                        className="hover:text-indigo-600 transition-colors"
                    >
                        Blog
                    </Link>
                    <span>·</span>
                    <Link
                        href="/community"
                        className="hover:text-indigo-600 transition-colors"
                    >
                        Community
                    </Link>
                </div>
            </div>
        </>
    );
}
