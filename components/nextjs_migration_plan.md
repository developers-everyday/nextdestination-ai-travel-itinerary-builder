# Next.js Hybrid Migration — Planning Document

## Goal
Migrate the frontend from Vite SPA to **Next.js** (App Router) while keeping the Express.js backend on Render. This gives us native SSR/SSG for SEO pages without losing server-side flexibility.

---

## Architecture

```
┌──────────────────────────┐      ┌──────────────────────────┐
│   Next.js on Vercel      │      │   Express.js on Render   │
│                          │      │                          │
│  /                  SSR  │─────▶│  /api/suggestions   AI   │
│  /community         SSR  │      │  /api/itineraries   CRUD │
│  /destinations/:id  ISR  │      │  /api/transport     AI   │
│  /share/:id         ISR  │      │  /api/activities    DB   │
│  /planning-*        CSR  │      │  /api/stripe        Pay  │
│  /builder           CSR  │      │  /api/destinations  DB   │
│  /how-it-works      SSG  │      │  /api/sitemap.xml   SEO  │
│  /terms, /privacy   SSG  │      │  /api/profile       Auth │
│                          │      │  /api/wishlist      Auth │
│  Built-in:               │      │                          │
│  • Image optimization    │      │  Keeps:                  │
│  • Sitemap generation    │      │  • Rate limiting         │
│  • Metadata API          │      │  • Request timeouts      │
│  • Route handlers        │      │  • Sentry error tracking │
│                          │      │  • WebSocket support     │
└──────────────────────────┘      └──────────────────────────┘
```

---

## Current App Inventory

### Pages to Migrate (by rendering strategy)

| Route | Current Component | Next.js Strategy | Priority |
|-------|------------------|-----------------|----------|
| `/` | Home (SearchHeader, CategoryBar, ItineraryGrid, HomeChatWidget) | **SSR** | P0 |
| `/community` | CommunityPage | **SSR** | P0 |
| `/destinations/:city` | DestinationPage | **ISR** (revalidate: 3600) | P0 |
| `/share/:id` | SharedItineraryPage | **ISR** (revalidate: 86400) | P0 |
| `/planning-suggestions` | PlanningSuggestions | **CSR** (`"use client"`) | P1 |
| `/builder` | ItineraryDisplay | **CSR** (`"use client"`) | P1 |
| `/login` | LoginPage | **CSR** | P2 |
| `/signup` | SignupPage | **CSR** | P2 |
| `/profile` | ProfilePage | **CSR** | P2 |
| `/upgrade/success` | UpgradeSuccess | **CSR** | P2 |
| `/how-it-works` | FooterPages.HowItWorks | **SSG** | P2 |
| `/contact` | FooterPages.ContactUs | **SSG** | P2 |
| `/terms` | FooterPages.TermsOfUse | **SSG** | P2 |
| `/privacy` | FooterPages.PrivacyPolicy | **SSG** | P2 |
| `/cookie-consent` | FooterPages.CookieConsent | **SSG** | P2 |
| `/accessibility` | FooterPages.AccessibilityStatement | **SSG** | P2 |
| `/sitemap-page` | FooterPages.SiteMap | **SSG** | P2 |

### Shared Infrastructure

| Item | Current | Next.js Equivalent |
|------|---------|-------------------|
| Routing | `react-router-dom` | Next.js App Router (file-based) |
| SEO | `react-helmet-async` + `SEOHead.tsx` | `generateMetadata()` + `metadata` export |
| State | Zustand (`useItineraryStore`) | Zustand (keep as-is, works with `"use client"`) |
| Auth | `AuthContext` + Supabase | Keep as-is, wrap in `"use client"` |
| Maps | `@vis.gl/react-google-maps` | Keep as-is, `"use client"` |
| Voice | ElevenLabs `VoiceAgent` | Keep as-is, `"use client"` |
| Styling | TailwindCSS + index.css | TailwindCSS (native Next.js support) |
| Analytics | `usePageTracking` hook | Next.js `<Script>` + route change via `usePathname` |

---

## Migration Strategy

### Phase 1: Scaffold & Core Pages (Day 1)
1. Initialize Next.js inside `packages/web-next/` (keep old `packages/web/` until migration complete)
2. Set up `next.config.js` with rewrites to Express backend
3. Create `app/layout.tsx` (root layout with Navbar, AuthProvider, fonts, Tailwind)
4. Migrate homepage (`/`) as SSR page
5. Migrate `/community` as SSR page
6. Set up Vercel environment variables

### Phase 2: SEO-Critical Dynamic Pages (Day 2)
7. Migrate `/destinations/[city]` with ISR
8. Migrate `/share/[id]` with ISR
9. Implement `generateMetadata()` for dynamic SEO
10. Build dynamic `sitemap.ts` using Next.js sitemap generation
11. Move `robots.ts` to Next.js built-in format

### Phase 3: Interactive Pages (Day 3)
12. Migrate `/planning-suggestions` as Client Component
13. Migrate `/builder` as Client Component
14. Migrate `/login`, `/signup`, `/profile` as Client Components
15. Wire up Zustand store, VoiceAgent, Google Maps

### Phase 4: Polish & Cutover (Day 4)
16. Migrate footer pages as SSG
17. Image optimization with `next/image`
18. Remove `react-helmet-async`, `react-router-dom` dependencies
19. Update Vercel project to point to `packages/web-next/`
20. Final testing, cutover, remove old `packages/web/`

---

## Key Decisions to Make

1. **Monorepo structure**: Keep `packages/web-next/` alongside `packages/web/` during migration, or replace in-place?
2. **`@nextdestination/shared` package**: Keep as-is (it's framework-agnostic services) — just import into Next.js
3. **Environment variables**: Next.js uses `NEXT_PUBLIC_` prefix instead of `VITE_` — need to update all env refs
4. **Google Maps API key loading**: Currently via `<APIProvider>` — works the same in Next.js with `"use client"`
5. **Capacitor mobile app**: `packages/mobile` imports from `@nextdestination/shared` — unaffected by frontend migration

---

## Files That DON'T Need Changes
- `server/` — entire Express backend stays as-is
- `packages/shared/` — framework-agnostic, works with Next.js
- `packages/mobile/` — separate app, unaffected
- `database/` — no changes needed
