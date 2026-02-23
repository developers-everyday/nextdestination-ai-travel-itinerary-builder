# Shared Package — Test Plan

> **Feature Owner:** Cross-Platform Core  
> **Source Files:** `packages/shared/src/services/` (12 files), `packages/shared/src/store/` (2 files), `packages/shared/src/types/`, `packages/shared/src/utils/`, `packages/shared/src/index.ts`

---

## 1. Feature Summary

The `@nextdestination/shared` package contains TypeScript services, Zustand stores, types, and utilities shared between the web (Vite/Next.js) and mobile (Capacitor) frontends. It includes API configuration, Supabase client setup, storage adaptation, itinerary/community/transport/weather data services, local storage persistence, and state management.

---

## 2. Unit Tests

### 2.1 `apiConfig.ts` — API URL Resolution

| # | Test Case | Expected |
|---|---|---|
| U-SH-01 | Resolves API URL from `VITE_API_URL` | Correct URL returned |
| U-SH-02 | Resolves API URL from `NEXT_PUBLIC_API_URL` | Correct URL returned |
| U-SH-03 | Falls back to localhost when no env var | `http://localhost:3001` returned |
| U-SH-04 | URL does not have trailing slash | Clean URL without trailing `/` |

### 2.2 `supabaseClient.ts`

| # | Test Case | Expected |
|---|---|---|
| U-SH-05 | Creates Supabase client with correct params | Client initialised with URL + anon key |
| U-SH-06 | Handles missing env vars gracefully | Warning logged, client still created |

### 2.3 `storageAdapter.ts`

| # | Test Case | Expected |
|---|---|---|
| U-SH-07 | `getItem` returns stored value | Value retrieved from underlying storage |
| U-SH-08 | `setItem` persists value | Value written to underlying storage |
| U-SH-09 | `removeItem` clears value | Value removed from underlying storage |
| U-SH-10 | Adapter works with localStorage | Browser localStorage operations succeed |
| U-SH-11 | Adapter works in SSR (no window) | Returns null, no crash |

### 2.4 `localStorageService.ts`

| # | Test Case | Expected |
|---|---|---|
| U-SH-12 | Save itinerary to local storage | Itinerary JSON written correctly |
| U-SH-13 | Load itinerary from local storage | Correct data parsed and returned |
| U-SH-14 | Delete itinerary from local storage | Entry removed |
| U-SH-15 | Handle corrupted storage data | Returns null, clears corrupted entry |
| U-SH-16 | Storage quota exceeded | Error caught, user notified |

### 2.5 `itineraryService.ts`

| # | Test Case | Expected |
|---|---|---|
| U-SH-17 | Save itinerary API call | POST with correct body and auth header |
| U-SH-18 | Update itinerary API call | PUT with itinerary ID |
| U-SH-19 | Fetch itinerary by ID | GET returns itinerary data |
| U-SH-20 | Handle 404 for missing itinerary | Returns null, no throw |

### 2.6 `communityData.ts` (17KB)

| # | Test Case | Expected |
|---|---|---|
| U-SH-21 | Fetch community itineraries | Correct endpoint called with pagination |
| U-SH-22 | Transform raw data to card format | Fields mapped correctly |
| U-SH-23 | Filter by traveller type | Query param appended |
| U-SH-24 | Handle empty response | Returns empty array |

### 2.7 `hydrationService.ts`

| # | Test Case | Expected |
|---|---|---|
| U-SH-25 | Hydrate complete itinerary | All days, activities, metadata mapped |
| U-SH-26 | Hydrate with missing optional fields | Defaults applied |
| U-SH-27 | Hydrate empty itinerary | Empty state, no crash |

### 2.8 `weatherService.ts`

| # | Test Case | Expected |
|---|---|---|
| U-SH-28 | Fetch weather for destination | Correct API call with location |
| U-SH-29 | Parse weather response | Temperature, conditions, icon extracted |
| U-SH-30 | Handle API error | Returns null or fallback |

### 2.9 `transportService.ts`

| # | Test Case | Expected |
|---|---|---|
| U-SH-31 | Fetch transport options | Correct endpoint + params |
| U-SH-32 | Parse transport response | Modes, durations, prices extracted |

### 2.10 `geminiConfig.ts` & `geminiService.ts`

| # | Test Case | Expected |
|---|---|---|
| U-SH-33 | Gemini config loaded | API key, model name set |
| U-SH-34 | Gemini service call format | Correct prompt sent, response parsed |

### 2.11 Zustand Stores

| # | Test Case | Expected |
|---|---|---|
| U-SH-35 | Initial store state | Default values set correctly |
| U-SH-36 | Action: set itinerary data | State updated with itinerary |
| U-SH-37 | Action: update activity | Specific activity modified in state |
| U-SH-38 | Action: clear store | State reset to defaults |
| U-SH-39 | Selector returns derived data | Computed values correct |

### 2.12 Type Definitions

| # | Test Case | Expected |
|---|---|---|
| U-SH-40 | TypeScript compiles without errors | `tsc --noEmit` passes |

---

## 3. Mocking Strategy

| Dependency | Mock Approach |
|---|---|
| `fetch` / API calls | MSW or mock `fetch` |
| `localStorage` | `vi.stubGlobal('localStorage', ...)` |
| Supabase client | Mock `@supabase/supabase-js` |
| `window` (SSR tests) | `vi.stubGlobal('window', undefined)` |

---

## 4. Files to Create

```
tests/
└── unit/
    └── shared/
        ├── services/
        │   ├── apiConfig.test.ts
        │   ├── supabaseClient.test.ts
        │   ├── storageAdapter.test.ts
        │   ├── localStorageService.test.ts
        │   ├── itineraryService.test.ts
        │   ├── communityData.test.ts
        │   ├── hydrationService.test.ts
        │   ├── weatherService.test.ts
        │   ├── transportService.test.ts
        │   └── geminiService.test.ts
        ├── store/
        │   └── itineraryStore.test.ts
        └── types/
            └── typecheck.test.ts (build verification)
```
