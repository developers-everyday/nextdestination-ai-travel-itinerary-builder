import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SITE_URL = 'https://nextdestination.ai';

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/community', priority: '0.9', changefreq: 'daily' },
    { path: '/planning-suggestions', priority: '0.8', changefreq: 'weekly' },
    { path: '/how-it-works', priority: '0.6', changefreq: 'monthly' },
    { path: '/contact', priority: '0.3', changefreq: 'monthly' },
    { path: '/sitemap-page', priority: '0.2', changefreq: 'monthly' },
    { path: '/terms', priority: '0.2', changefreq: 'yearly' },
    { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
    { path: '/cookie-consent', priority: '0.1', changefreq: 'yearly' },
    { path: '/accessibility', priority: '0.1', changefreq: 'yearly' },
];

/**
 * GET /api/sitemap.xml
 *
 * Generates a dynamic sitemap that includes:
 * 1. Static pages (home, community, how-it-works, etc.)
 * 2. Destination landing pages (from destinations table)
 * 3. Public shared itineraries (from itineraries table)
 */
router.get('/', async (_req, res) => {
    try {
        // Fetch all destinations with data
        const { data: destinations } = await supabase
            .from('destinations')
            .select('name, updated_at')
            .not('general_info', 'is', null)
            .order('name');

        // Fetch all public itineraries
        const { data: itineraries } = await supabase
            .from('itineraries')
            .select('id, created_at, metadata')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(1000);

        const today = new Date().toISOString().split('T')[0];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

        // 1. Static pages
        for (const page of STATIC_PAGES) {
            xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
        }

        // 2. Destination pages
        if (destinations) {
            for (const dest of destinations) {
                const slug = dest.name.toLowerCase().replace(/\s+/g, '-');
                const lastmod = dest.updated_at
                    ? new Date(dest.updated_at).toISOString().split('T')[0]
                    : today;
                xml += `  <url>
    <loc>${SITE_URL}/destinations/${encodeURIComponent(slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
            }
        }

        // 3. Shared itineraries
        if (itineraries) {
            for (const itin of itineraries) {
                const lastmod = itin.created_at
                    ? new Date(itin.created_at).toISOString().split('T')[0]
                    : today;
                xml += `  <url>
    <loc>${SITE_URL}/share/${itin.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
            }
        }

        xml += `</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=600');
        res.send(xml);

    } catch (error) {
        console.error('[Sitemap] Error generating sitemap:', error);
        res.status(500).set('Content-Type', 'text/plain').send('Error generating sitemap');
    }
});

export default router;
