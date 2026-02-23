# Community — Test Plan

> **Feature Owner:** Social & Discovery  
> **Source Files:** `packages/web-next/app/community/`, `packages/web-next/components/CommunityPage.tsx`, `packages/web-next/components/CommunityItineraryCard.tsx`, `packages/web-next/components/ItineraryDetailModal.tsx`, `packages/shared/src/services/communityData.ts`, `server/routes/itineraries.js` (public listing endpoints)

---

## 1. Feature Summary

The Community feature lets users discover, browse, and remix publicly shared itineraries from other travellers. It includes a browsable gallery with filter/sort options, itinerary cards with preview data, a detail modal for full itinerary view, and a remix flow that clones a community itinerary into the user's personal builder.

---

## 2. Unit Tests

### 2.1 Frontend Components

| # | Test Case | Expected |
|---|---|---|
| U-COMM-01 | CommunityPage renders itinerary grid | Grid of `CommunityItineraryCard` components |
| U-COMM-02 | CommunityPage loading state | Skeleton cards displayed |
| U-COMM-03 | CommunityPage empty state | "No itineraries found" message |
| U-COMM-04 | CommunityItineraryCard shows image, title, destination | All card fields rendered |
| U-COMM-05 | CommunityItineraryCard handles missing image | Placeholder shown |
| U-COMM-06 | CommunityItineraryCard click opens modal | `onCardClick` callback fired |
| U-COMM-07 | ItineraryDetailModal renders full itinerary | All days, activities, stats displayed |
| U-COMM-08 | ItineraryDetailModal remix button visible | "Remix" CTA button present |
| U-COMM-09 | Filter chips render (Solo, Couple, Family) | Three filter options visible |
| U-COMM-10 | Filter selection updates displayed itineraries | `onFilterChange` called with correct value |

### 2.2 Community Data Service (Shared)

| # | Test Case | Expected |
|---|---|---|
| U-COMM-11 | Fetch community itineraries API call | Correct URL and params |
| U-COMM-12 | Data transformation for card display | Raw API data mapped to card props |
| U-COMM-13 | Pagination support | Page number passed in request |

---

## 3. Integration Tests

| # | Test Case | Expected |
|---|---|---|
| I-COMM-01 | `GET /api/itineraries?public=true` returns public itineraries | 200 + array of public itineraries only |
| I-COMM-02 | Private itineraries excluded from community | Private itinerary not in response |
| I-COMM-03 | Filter by traveller type | `?type=solo` → only solo itineraries |
| I-COMM-04 | Remix creates new itinerary copy | POST remix → new ID, original unchanged |
| I-COMM-05 | Remix requires authentication | Unauthenticated remix → 401 |

---

## 4. E2E Tests

| # | Test Case | Steps | Expected |
|---|---|---|---|
| E-COMM-01 | Browse community page | Navigate to `/community` | Grid of itinerary cards loaded |
| E-COMM-02 | View itinerary detail | Click card → modal opens | Full itinerary details shown |
| E-COMM-03 | Filter by type | Click "Solo" filter | Grid updates to show solo trips |
| E-COMM-04 | Remix itinerary | Click remix on modal → redirected to builder | Builder opens with cloned itinerary |
| E-COMM-05 | Remix without login | Click remix when logged out | Prompted to login first |
| E-COMM-06 | Card shows correct stats | Check card on community page | Duration, activities count accurate |

---

## 5. Files to Create

```
tests/
├── unit/
│   └── components/
│       ├── CommunityPage.test.tsx
│       ├── CommunityItineraryCard.test.tsx
│       └── ItineraryDetailModal.test.tsx
├── integration/
│   └── community-api.test.js
└── e2e/
    └── community-flow.spec.ts
```
