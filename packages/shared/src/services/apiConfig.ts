/**
 * Universal API URL resolver — works in both Vite and Next.js environments.
 *
 * Resolution order:
 *   1. Vite:    import.meta.env.VITE_API_URL
 *   2. Next.js: process.env.NEXT_PUBLIC_API_URL  (statically replaced at build time)
 *   3. Fallback: http://localhost:3001
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getApiUrl(): string {
    // Vite — import.meta.env is populated by Vite at build time
    try {
        const viteUrl = (import.meta as any)?.env?.VITE_API_URL;
        if (viteUrl) return viteUrl as string;
    } catch {
        // import.meta not available (e.g. in Node/Next.js)
    }

    // Next.js — process.env.NEXT_PUBLIC_* is statically replaced at build time
    // by webpack / turbopack. The literal string MUST appear here for the
    // replacement to work, so we cannot use dynamic property access.
    if (typeof process !== 'undefined') {
        // @ts-ignore — process may not be typed in the shared package
        const nextUrl = process.env.NEXT_PUBLIC_API_URL;
        if (nextUrl) return nextUrl;
    }

    return 'http://localhost:3001';
}

