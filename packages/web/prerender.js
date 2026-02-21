/**
 * prerender.js — Pre-renders SEO-critical pages after `vite build`.
 *
 * How it works:
 * 1. Serves the built `dist/` directory using Node's built-in http module
 * 2. Uses Puppeteer (system Chrome) to visit each route
 * 3. Waits for React to render, then saves the fully-rendered HTML
 * 4. Creates directory-based HTML files for each route
 *
 * This gives search engine crawlers real HTML content instead of an empty
 * <div id="root"></div>, solving the SPA indexability problem.
 *
 * Usage: node prerender.js (run after `vite build`)
 */

import puppeteer from 'puppeteer-core';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = 4173;

// Routes to pre-render (only SEO-critical public pages)
const ROUTES = [
    '/',
    '/community',
    '/planning-suggestions',
    '/how-it-works',
    '/contact',
    '/sitemap-page',
    '/terms',
    '/privacy',
    '/cookie-consent',
    '/accessibility',
    '/login',
    '/signup',
];

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
    '.webp': 'image/webp',
};

/**
 * Finds Chrome/Chromium executable on the system.
 */
function findChrome() {
    const paths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    try {
        return execSync('which google-chrome || which chromium || which chromium-browser', { encoding: 'utf-8' }).trim();
    } catch {
        return null;
    }
}

/**
 * Simple static file server with SPA fallback.
 */
function createStaticServer() {
    const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'));

    return http.createServer((req, res) => {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const filePath = path.join(DIST_DIR, url.pathname);

        // Try to serve the exact file
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            const mime = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            fs.createReadStream(filePath).pipe(res);
            return;
        }

        // SPA fallback — serve index.html for all routes
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexHtml);
    });
}

async function prerender() {
    const chromePath = findChrome();
    if (!chromePath) {
        console.error('❌ Could not find Chrome/Chromium. Install Google Chrome to use pre-rendering.');
        process.exit(1);
    }
    console.log(`🌐 Using Chrome: ${chromePath}`);

    // 1. Start static server
    const server = createStaticServer();
    await new Promise(resolve => server.listen(PORT, resolve));
    console.log(`📦 Prerender server on http://localhost:${PORT}`);

    try {
        // 2. Launch headless browser
        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: chromePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        console.log(`🚀 Pre-rendering ${ROUTES.length} routes...\n`);

        for (const route of ROUTES) {
            const url = `http://localhost:${PORT}${route}`;
            const page = await browser.newPage();

            try {
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

                // Wait for React root to render
                await page.waitForFunction(
                    () => document.querySelector('#root')?.children.length > 0,
                    { timeout: 10000 }
                );

                // Let helmet meta tags settle
                await new Promise(r => setTimeout(r, 500));

                const html = await page.content();

                // Determine output path
                const filePath = route === '/'
                    ? path.join(DIST_DIR, 'index.html')
                    : path.join(DIST_DIR, route, 'index.html');

                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                fs.writeFileSync(filePath, html, 'utf-8');
                console.log(`  ✅ ${route} → ${path.relative(DIST_DIR, filePath)}`);

            } catch (err) {
                console.error(`  ❌ ${route} — ${err.message}`);
            } finally {
                await page.close();
            }
        }

        await browser.close();
        console.log(`\n🎉 Pre-rendering complete! ${ROUTES.length} pages saved.`);

    } finally {
        server.close();
    }
}

prerender().catch(err => {
    console.error('Pre-rendering failed:', err);
    process.exit(1);
});
