# Homepage & Navigation — Test Plan

> **Feature Owner:** Frontend UI  
> **Source Files:** `packages/web-next/app/page.tsx`, `packages/web-next/components/Navbar.tsx`, `packages/web-next/components/NavbarShell.tsx`, `packages/web-next/components/FooterPages.tsx`, `packages/web-next/components/home/SearchHeader.tsx`, `packages/web-next/components/home/CategoryBar.tsx`, `packages/web-next/components/home/HomeChatWidget.tsx`, `packages/web-next/components/home/ItineraryGrid.tsx`, `packages/web-next/components/home/ItineraryCard.tsx`, `packages/web-next/components/home/HomeContent.tsx`

---

## 1. Feature Summary

The homepage is the primary landing surface for NextDestination.ai. It features a search header for destination input, a category filter bar, an AI chat widget for conversational planning, and a grid of curated/community itineraries. The Navbar provides navigation, auth-state display, and a mobile hamburger menu. Footer pages include Terms, Privacy, Accessibility, Contact, and How It Works.

---

## 2. Unit Tests

### 2.1 Component Rendering

| # | Test Case | Component | Expected |
|---|---|---|---|
| U-HOME-01 | SearchHeader renders input and CTA | `SearchHeader` | Search input visible, submit button present |
| U-HOME-02 | CategoryBar renders all categories | `CategoryBar` | All category chips rendered |
| U-HOME-03 | CategoryBar selection callback fires | `CategoryBar` | `onSelect` prop called with correct category |
| U-HOME-04 | ItineraryCard renders with data | `ItineraryCard` | Title, image, destination, duration displayed |
| U-HOME-05 | ItineraryCard handles missing image | `ItineraryCard` | Fallback/placeholder shown |
| U-HOME-06 | ItineraryGrid shows loading skeleton | `ItineraryGrid` | Skeleton cards visible when `isLoading=true` |
| U-HOME-07 | ItineraryGrid shows empty state | `ItineraryGrid` | Empty message when `items=[]` |
| U-HOME-08 | HomeContent composes sub-components | `HomeContent` | Search, category, grid all present |

### 2.2 Navbar

| # | Test Case | Expected |
|---|---|---|
| U-NAV-01 | Navbar renders logo and nav links | Logo, Home, Community, How It Works links visible |
| U-NAV-02 | Navbar shows login/signup when logged out | Login and Signup buttons present |
| U-NAV-03 | Navbar shows user avatar + dropdown when logged in | Avatar, profile link, logout option |
| U-NAV-04 | Mobile hamburger toggles menu | Click hamburger → menu opens, click again → closes |
| U-NAV-05 | Active page link is highlighted | Current route link has active styling |

---

## 3. Integration Tests

| # | Test Case | Setup | Expected |
|---|---|---|---|
| I-HOME-01 | Homepage loads itinerary data from API | Mock `/api/itineraries` response | Grid populated with itineraries |
| I-HOME-02 | Search header submits destination | Type destination, submit | Navigates to `/planning-suggestions?destination=X` |
| I-HOME-03 | Category filter updates grid | Select category | Grid re-fetches filtered data |
| I-HOME-04 | Chat widget sends message to AI | Type message, send | Response rendered in chat |

---

## 4. E2E Tests

| # | Test Case | Steps | Expected |
|---|---|---|---|
| E-HOME-01 | Homepage renders fully | Navigate to `/` | Hero, search, categories, itinerary grid all visible |
| E-HOME-02 | Search and navigate | Type "Paris" in search → submit | Navigated to planning suggestions with Paris |
| E-HOME-03 | Click itinerary card | Click a card in the grid | Navigates to itinerary detail or builder |
| E-HOME-04 | Category filtering | Click "Adventure" category chip | Grid updates to show adventure itineraries |
| E-HOME-05 | Navbar navigation | Click "Community" in navbar | Navigated to `/community` |
| E-HOME-06 | Mobile responsive layout | Set viewport to 375px | Hamburger menu visible, grid adapts |
| E-HOME-07 | Footer page accessibility | Navigate to `/terms`, `/privacy`, `/accessibility` | Pages render correctly with proper headings |
| E-HOME-08 | SEO meta tags present | Check `<head>` on `/` | Title, description, OG tags present |
| E-HOME-09 | Chat widget conversation | Open chat → type "Plan trip to Tokyo" → receive response | AI response appears in chat bubble |

---

## 5. Mocking Strategy

| Dependency | Mock Approach |
|---|---|
| Itinerary API | MSW handler for `/api/itineraries` |
| Auth context | Wrap components in mock `AuthContext.Provider` |
| Next.js router | Mock `useRouter` / `usePathname` |

---

## 6. Files to Create

```
tests/
├── unit/
│   └── components/
│       ├── home/
│       │   ├── SearchHeader.test.tsx
│       │   ├── CategoryBar.test.tsx
│       │   ├── ItineraryCard.test.tsx
│       │   └── ItineraryGrid.test.tsx
│       └── Navbar.test.tsx
├── integration/
│   └── homepage.test.ts
└── e2e/
    └── homepage.spec.ts
```
