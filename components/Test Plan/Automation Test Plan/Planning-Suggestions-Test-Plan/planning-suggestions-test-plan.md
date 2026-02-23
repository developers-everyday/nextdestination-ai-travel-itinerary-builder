# Planning & Suggestions — Test Plan

> **Feature Owner:** AI Planning Engine  
> **Source Files:** `packages/web-next/app/planning-suggestions/`, `server/routes/suggestions.js`, `server/routes/transport.js`, `server/services/gemini.js`, `packages/shared/src/services/geminiService.ts`, `packages/shared/src/services/transportService.ts`, `packages/shared/src/services/weatherService.ts`

---

## 1. Feature Summary

The Planning & Suggestions feature is the primary AI-powered flow where users select a destination, set trip duration (Tight/Balanced/Relaxed or custom dates), configure traveller type (solo/couple/family), and generate a full AI itinerary via Google Gemini. The backend caches attractions in the database to reduce AI calls. Transport info, weather data, and destination insights are fetched in parallel.

---

## 2. Unit Tests

### 2.1 Frontend — Planning Suggestions Page

| # | Test Case | Expected |
|---|---|---|
| U-PLAN-01 | Duration chips render (Tight 3d, Balanced 5d, Relaxed 7d) | Three chips visible with correct labels |
| U-PLAN-02 | Selecting a preset chip updates date range | Start date + preset days = end date |
| U-PLAN-03 | Custom Dates opens date picker | Calendar component appears |
| U-PLAN-04 | Traveller type filters render (Solo, Couple, Family) | Three filter buttons visible |
| U-PLAN-05 | Generate button disabled without destination | Button disabled or shows tooltip |
| U-PLAN-06 | Loading state during AI generation | Spinner/skeleton shown, button disabled |
| U-PLAN-07 | Error state renders on generation failure | Error message with retry option |

### 2.2 Backend — `suggestions.js` Route

| # | Test Case | Input | Expected |
|---|---|---|---|
| U-PLAN-08 | Missing destination param | `{}` | 400 Bad Request |
| U-PLAN-09 | Valid request body parsed correctly | `{ destination, days, interests }` | Passed to Gemini service |
| U-PLAN-10 | Gemini response validation | Malformed AI response | Graceful error, not crash |

### 2.3 Backend — `gemini.js` Service

| # | Test Case | Expected |
|---|---|---|
| U-PLAN-11 | Itinerary prompt construction | Prompt includes destination, days, interests, traveller type |
| U-PLAN-12 | Response JSON parsing | Valid JSON extracted from AI text response |
| U-PLAN-13 | Malformed response handled | Returns error, does not crash |
| U-PLAN-14 | Retry logic on transient failure | Retries up to N times before failing |

### 2.4 Backend — Attraction Caching

| # | Test Case | Expected |
|---|---|---|
| U-PLAN-15 | Cache hit returns DB data | DB query returns data → no AI call made |
| U-PLAN-16 | Cache miss triggers AI call | DB returns null → Gemini called → result saved to DB |
| U-PLAN-17 | Cache write after AI response | After Gemini returns, data inserted into destinations table |

### 2.5 Shared Services

| # | Test Case | Service | Expected |
|---|---|---|---|
| U-PLAN-18 | Transport service API call format | `transportService` | Correct URL, headers, body |
| U-PLAN-19 | Weather service response parsing | `weatherService` | Temperature, conditions, icon extracted |
| U-PLAN-20 | Weather service handles API error | `weatherService` | Returns fallback or null, no throw |

---

## 3. Integration Tests

| # | Test Case | Setup | Expected |
|---|---|---|---|
| I-PLAN-01 | `POST /api/suggestions` returns valid itinerary | Mock Gemini, real Express | 200 + itinerary JSON matching schema |
| I-PLAN-02 | `GET /api/transport/attractions` cache hit | Pre-seed DB with attractions | 200 + cached data, no AI call |
| I-PLAN-03 | `GET /api/transport/attractions` cache miss | Empty DB | 200 + AI-generated data, DB updated |
| I-PLAN-04 | `GET /api/transport/general-info` | Mock Gemini | 200 + destination info (weather, currency, scams) |
| I-PLAN-05 | Rate limiter blocks excessive AI requests | Send 16 requests within 15min | 16th request gets 429 |
| I-PLAN-06 | Request timeout (90s for AI routes) | Gemini mock hangs | 504 after timeout |

---

## 4. E2E Tests

| # | Test Case | Steps | Expected |
|---|---|---|---|
| E-PLAN-01 | Full planning flow — preset duration | Enter destination → select "Balanced 5d" → Generate | Itinerary generated, builder opens |
| E-PLAN-02 | Full planning flow — custom dates | Enter destination → select Custom → pick dates → Generate | Correct date range used |
| E-PLAN-03 | Traveller type filter applied | Select "Family" → Generate | Itinerary includes family-friendly activities |
| E-PLAN-04 | Community trip filters | Apply "Solo" filter on community trips section | Filtered results shown |
| E-PLAN-05 | Generation error shown | Mock Gemini failure | User-friendly error message displayed |
| E-PLAN-06 | Destination autocomplete | Type partial destination name | Suggestions dropdown appears |

---

## 5. Mocking Strategy

| Dependency | Mock Approach |
|---|---|
| Google Gemini (`@google/genai`) | MSW / manual mock returning fixture JSON |
| Supabase DB (attractions cache) | Test database or mocked Supabase client |
| Weather API | MSW handler returning fixture weather data |
| Google Maps Geocoding | Mocked response with known coordinates |

---

## 6. Files to Create

```
tests/
├── unit/
│   ├── routes/
│   │   └── suggestions.test.js
│   ├── services/
│   │   ├── gemini.test.js
│   │   └── weatherService.test.ts
│   └── components/
│       └── PlanningSuggestions.test.tsx
├── integration/
│   ├── suggestions-api.test.js
│   └── transport-api.test.js
└── e2e/
    └── planning-flow.spec.ts
```
