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

| Item | Current | Next.js Equivalent | Notes |
|------|---------|-------------------|-------|
| Routing | `react-router-dom` | Next.js App Router (file-based) | Remove `react-router-dom` |
| SEO | `react-helmet-async` + `SEOHead.tsx` | `generateMetadata()` + `metadata` export | Remove `react-helmet-async` |
| State | Zustand (`useItineraryStore`) | Zustand (keep as-is, `"use client"`) | No changes needed |
| Auth | `AuthContext` + Supabase | Wrap in client boundary `Providers.tsx` | **Cannot go in root layout directly — see Known Issues #1** |
| Maps | `@vis.gl/react-google-maps` | Keep as-is, `"use client"` + `{ ssr: false }` | Uses `window.google` internally |
| Voice | ElevenLabs `VoiceAgent` | `next/dynamic` with `{ ssr: false }` | Uses `navigator.mediaDevices` — must be SSR-disabled |
| Styling | TailwindCSS v4 + index.css | TailwindCSS v4 via `@tailwindcss/postcss` | **Not v3 — requires specific setup, see Known Issues #5** |
| Analytics | `usePageTracking` hook | Rewrite using `usePathname` + `next/script` | **Must be rewritten — uses `react-router-dom` internally** |
| Drag & Drop | `@dnd-kit` | Keep as-is, `"use client"` | Uses browser APIs, must be in client component |
| Sentry | `@sentry/react` in `index.tsx` | Migrate to `@sentry/nextjs` | Current package misses server-side errors |

---

## Known Issues & Required Fixes

These are confirmed blockers based on the actual codebase. Skipping any of these will cause build failures or broken UI.

---

### Issue 1 (CRITICAL): `AuthContext` Cannot Live Directly in Root Layout

**Why it breaks:** `AuthContext.tsx` uses browser APIs at the module level — `window.location`, `window.history.replaceState()`, `sessionStorage` — which Next.js will execute on the server during SSR, throwing a `ReferenceError`.

The plan says *"Create `app/layout.tsx` with Navbar, AuthProvider"* — this will fail because `layout.tsx` is a Server Component by default.

**Fix:** Introduce a `Providers.tsx` client boundary that wraps all browser-dependent providers. Root layout remains a pure Server Component.

```tsx
// app/Providers.tsx
"use client"
import { AuthProvider } from '../components/AuthContext'
import Navbar from '../components/Navbar'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      {children}
    </AuthProvider>
  )
}

// app/layout.tsx  ← Server Component, no "use client"
import Providers from './Providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

`Navbar.tsx` also uses `window.matchMedia` for PWA install detection — it must live inside this client boundary, not in the root layout directly.

---

### Issue 2 (CRITICAL): `React.lazy()` → `next/dynamic`

**Why it breaks:** Server Components cannot use `React.lazy()`. The current `App.tsx` uses it extensively for code splitting. All lazy imports must be converted to `next/dynamic`.

**Affected components in current `App.tsx`:**
- `VoiceAgent` — uses `navigator.mediaDevices.getUserMedia()` → **must use `{ ssr: false }`**
- `ItineraryDisplay`, `PlanningSuggestions`, `LoginPage`, `SignupPage`, `ProfilePage`, `UpgradeSuccess`, `SettingsModal`, `FooterPages` → convert to `next/dynamic`

```ts
// Before (Vite)
const VoiceAgent = React.lazy(() => import('./components/VoiceAgent'))

// After (Next.js)
import dynamic from 'next/dynamic'

const VoiceAgent = dynamic(() => import('../components/VoiceAgent'), { ssr: false })
const ItineraryDisplay = dynamic(() => import('../components/ItineraryDisplay'))
```

Components with direct browser API access that also need `{ ssr: false }`:
- `VoiceAgent` — `navigator.mediaDevices.getUserMedia()`
- `Map` — `window.google`
- `HotelDetailsPanel` — `window.google`, `document.createElement()`
- `ActivitySearchPanel` — `window.addEventListener()` for voice events

---

### Issue 3 (CRITICAL): `VITE_*` → `NEXT_PUBLIC_*` — Full Scope

**Why it breaks:** `import.meta.env.VITE_*` is a Vite-specific API. Next.js uses `process.env.NEXT_PUBLIC_*`. Both the variable names in `.env` files AND the access patterns in source files must change. Missing one returns `undefined` silently in production.

**All variables to rename:**

| Old Variable | New Variable | Files to Update |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `App.tsx` |
| `VITE_GOOGLE_MAP_ID` | `NEXT_PUBLIC_GOOGLE_MAP_ID` | `Map.tsx`, `HotelDetailsPanel.tsx` |
| `VITE_API_URL` | `NEXT_PUBLIC_API_URL` | `PlanningSuggestions.tsx`, `ActivitySearchPanel.tsx`, `ProfilePage.tsx`, `UpgradeSuccess.tsx`, `CommunityPage.tsx`, `ItineraryGrid.tsx`, `CommunityItineraryCard.tsx` |
| `VITE_SENTRY_DSN` | `NEXT_PUBLIC_SENTRY_DSN` | `index.tsx` (becomes `instrumentation.ts`) |

**Access pattern change (every file):**
```ts
// Before
import.meta.env.VITE_API_URL

// After
process.env.NEXT_PUBLIC_API_URL
```

Do a global find-replace of `import.meta.env.VITE_` → `process.env.NEXT_PUBLIC_` across the entire `packages/web-next/` directory as a first pass.

---

### Issue 4 (CRITICAL): `@nextdestination/shared` Requires `transpilePackages`

**Why it breaks:** Next.js does not auto-transpile local workspace packages. Without explicit config, imports from `@nextdestination/shared` (Zustand stores, types, services) will fail at build time with module resolution errors.

**Fix — add to `next.config.js` on Day 1:**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@nextdestination/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.EXPRESS_API_URL}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

---

### Issue 5 (CRITICAL): Tailwind CSS v4 Setup Is Different from v3

**Why it breaks:** The project uses **Tailwind v4** (`tailwindcss: "^4.1.18"`). Running `create-next-app --tailwind` installs v3 by default and the styles will either not work or conflict. Tailwind v4 has no `tailwind.config.js` — it uses a CSS-first configuration approach.

**Correct setup for Tailwind v4 in Next.js:**

```bash
npm install tailwindcss @tailwindcss/postcss
```

`postcss.config.mjs`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

`app/globals.css`:
```css
@import "tailwindcss";
/* existing custom styles below */
```

Do **not** create a `tailwind.config.js` — v4 reads config from the CSS file itself.

---

### Issue 6 (MEDIUM): SSR Homepage Needs Server-Side Data Fetching

**Why it matters:** The plan marks `/` as SSR, but `ItineraryGrid` currently fetches data inside the component using client-side state. If data fetching stays client-side, the server renders an empty grid — identical to CSR with no SEO benefit.

**Required refactor for real SSR:** Decouple data fetching from the component. Fetch in the Server Component page and pass as props.

```tsx
// app/page.tsx (Server Component)
async function HomePage() {
  // Runs on the server — crawlers see real content
  const itineraries = await fetch(
    `${process.env.EXPRESS_API_URL}/api/itineraries`,
    { next: { revalidate: 60 } }
  ).then(r => r.json())

  return (
    <>
      <SearchHeader />
      <CategoryBar />
      <ItineraryGrid initialData={itineraries} />  {/* prop, not internal fetch */}
    </>
  )
}
```

`ItineraryGrid` becomes a `"use client"` component that accepts `initialData` and uses it for first render, then optionally refetches for interactions.

This is the most significant component refactor in the entire migration for SSR pages.

---

### Issue 7 (MEDIUM): `usePageTracking` Hook Must Be Rewritten

**Why it breaks:** The current hook imports `useLocation` from `react-router-dom`, which won't exist in Next.js.

**Rewrite for Next.js:**
```ts
// hooks/usePageTracking.ts
"use client"
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function usePageTracking() {
  const pathname = usePathname()
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: pathname,
      })
    }
  }, [pathname])
}
```

Also move the GA `<script>` tag from `index.html` to `app/layout.tsx` using `next/script`:
```tsx
import Script from 'next/script'

// inside layout.tsx <body>:
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
  strategy="afterInteractive"
/>
```

---

### Issue 8 (MEDIUM): `window.innerWidth` Causes Hydration Mismatches

**Why it breaks:** `ItineraryDisplay.tsx` uses `window.innerWidth` for responsive logic. The server renders without a window, the client renders with one — React throws a hydration mismatch warning that can break interactive state.

**Fix — use state initialized after mount:**
```ts
// Before
const isMobile = window.innerWidth < 768

// After
const [isMobile, setIsMobile] = useState(false)
useEffect(() => {
  setIsMobile(window.innerWidth < 768)
}, [])
```

Since `/builder` is CSR-only, this is lower urgency but should be fixed before any component is shared with an SSR page.

---

### Issue 9 (LOW): Migrate Sentry to `@sentry/nextjs`

**Why it matters:** `@sentry/react` only captures client-side errors. With Next.js SSR, server errors (data fetch failures, ISR errors) are invisible. `@sentry/nextjs` adds server-side capture automatically.

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

This generates `sentry.client.config.ts`, `sentry.server.config.ts`, and `instrumentation.ts`. Remove the current Sentry init from `index.tsx`.

Not a launch blocker, but do before going to production.

---

## Migration Strategy (Revised Timeline)

The original 4-day plan is too compressed given the required refactors above. Revised to 3 weeks for safety with a parallel old app as fallback.

### Week 1: Foundation & Low-Risk Pages

**Day 1 — Scaffold correctly (do not skip any step):**
1. `npx create-next-app@latest packages/web-next --typescript --no-tailwind --app`
2. Install Tailwind v4 correctly (Issue #5 setup)
3. Add `transpilePackages: ['@nextdestination/shared']` to `next.config.js` (Issue #4)
4. Add Express backend rewrites to `next.config.js`
5. Global find-replace `import.meta.env.VITE_` → `process.env.NEXT_PUBLIC_` (Issue #3)
6. Update `.env` file with `NEXT_PUBLIC_` prefixed variable names

**Day 2 — Root layout & auth boundary:**
7. Create `app/Providers.tsx` as `"use client"` wrapper for `AuthContext` + `Navbar` (Issue #1)
8. Create `app/layout.tsx` as Server Component importing `Providers`
9. Port `globals.css` / base styles
10. Verify app boots with auth working

**Day 3-4 — SSG footer pages (zero risk, immediate SEO win):**
11. Migrate all `FooterPages` components: `/how-it-works`, `/contact`, `/terms`, `/privacy`, `/cookie-consent`, `/accessibility`, `/sitemap-page`
12. Add `generateMetadata()` for each
13. Verify Vercel deploys these correctly

---

### Week 2: SSR/ISR Pages (The SEO Core)

**Day 5-6 — Homepage SSR with real server fetch:**
14. Refactor `ItineraryGrid` to accept `initialData` prop (Issue #6)
15. Create `app/page.tsx` as Server Component with server-side fetch
16. Migrate `SearchHeader`, `CategoryBar`, `HomeChatWidget` as client components
17. Rewrite `usePageTracking` hook (Issue #7)
18. Add GA `<Script>` to layout

**Day 7 — Community page SSR:**
19. Migrate `CommunityPage` — same data-fetch decoupling pattern as homepage

**Day 8-9 — ISR dynamic pages:**
20. Migrate `/destinations/[city]` with `revalidate: 3600`
21. Migrate `/share/[id]` with `revalidate: 86400`
22. Implement `generateMetadata()` for both (dynamic title/description/OG tags)
23. Build `app/sitemap.ts` for Next.js sitemap generation
24. Add `app/robots.ts`

---

### Week 3: Interactive Pages & Cutover

**Day 10-11 — CSR interactive pages:**
25. Convert `React.lazy()` → `next/dynamic` throughout (Issue #2)
26. Migrate `/planning-suggestions` — `"use client"`, wire Zustand
27. Migrate `/builder` (`ItineraryDisplay`) — `"use client"`, wire VoiceAgent with `{ ssr: false }`, Maps, DnD
28. Fix `window.innerWidth` hydration issue in `ItineraryDisplay` (Issue #8)

**Day 12 — Auth pages:**
29. Migrate `/login`, `/signup` as `"use client"` with `noindex` metadata
30. Migrate `/profile`, `/upgrade/success` as `"use client"`

**Day 13-14 — Polish & cutover:**
31. `next/image` for image optimization throughout
32. Migrate Sentry to `@sentry/nextjs` (Issue #9)
33. Remove `react-helmet-async`, `react-router-dom` from dependencies
34. Full end-to-end test: auth flow, voice agent, maps, itinerary generation, Stripe redirect
35. Update Vercel project root to `packages/web-next/`
36. Monitor for 48 hours, then remove `packages/web/`

---

## Pre-Migration Checklist (Do Before Writing Any Next.js Code)

- [ ] Tailwind v4 setup confirmed (postcss plugin, CSS import, no config file)
- [ ] `transpilePackages: ['@nextdestination/shared']` in `next.config.js`
- [ ] All `VITE_*` variables renamed to `NEXT_PUBLIC_*` in `.env` files
- [ ] All `import.meta.env.VITE_` replaced with `process.env.NEXT_PUBLIC_` in source
- [ ] `Providers.tsx` client boundary created before any page is migrated
- [ ] Express backend rewrite configured in `next.config.js`

---

## Key Decisions (Resolved)

1. **Monorepo structure**: Keep `packages/web-next/` alongside `packages/web/` during migration. Remove `packages/web/` only after 48h of stable production traffic on the new app.
2. **`@nextdestination/shared` package**: Keep as-is — add `transpilePackages` to Next.js config. No changes to the shared package itself.
3. **Environment variables**: All `VITE_*` → `NEXT_PUBLIC_*`. Do as a bulk find-replace before migration starts.
4. **Google Maps API key**: Works the same via `<APIProvider>` inside `"use client"` components. Use `next/dynamic` with `{ ssr: false }` for `Map.tsx` and `HotelDetailsPanel.tsx`.
5. **Capacitor mobile app**: `packages/mobile` imports from `@nextdestination/shared` — completely unaffected.
6. **`AuthContext` placement**: Must go in `Providers.tsx` (client boundary), never directly in `layout.tsx`.
7. **VoiceAgent**: Must use `next/dynamic` with `{ ssr: false }` — uses `navigator.mediaDevices`, incompatible with SSR.
8. **Sentry**: Migrate to `@sentry/nextjs` before production cutover to capture server-side errors.

---

## Files That DON'T Need Changes

- `server/` — entire Express backend stays as-is
- `packages/shared/` — framework-agnostic, works with Next.js (add `transpilePackages` in Next.js config, not here)
- `packages/mobile/` — separate app, unaffected
- `database/` — no changes needed
