# Backend API Routes — Test Plan

> **Feature Owner:** Backend API  
> **Source Files:** `server/routes/itineraries.js` (17KB), `server/routes/suggestions.js`, `server/routes/transport.js`, `server/routes/activities.js`, `server/routes/destinations.js`, `server/routes/recommendations.js`, `server/routes/userProfile.js`, `server/routes/wishlist.js`, `server/routes/stripe.js`, `server/routes/sitemap.js`

---

## 1. Feature Summary

The Express backend exposes 10 route modules under `/api/`. Routes use `verifyAuth` or `optionalAuth` middleware for access control, rate limiting (general 100/15min, AI 15/15min), Helmet for security headers, and request timeouts (30s default, 90s for AI routes). Each route module handles a distinct feature area.

---

## 2. Route-by-Route Unit Tests

### 2.1 `itineraries.js` (17KB — Largest Route)

| # | Test Case | Method & Path | Expected |
|---|---|---|---|
| U-API-01 | List public itineraries | `GET /api/itineraries?public=true` | 200 + array |
| U-API-02 | Get itinerary by ID | `GET /api/itineraries/:id` | 200 + itinerary object |
| U-API-03 | Get non-existent itinerary | `GET /api/itineraries/invalid-id` | 404 |
| U-API-04 | Create new itinerary (authenticated) | `POST /api/itineraries` | 201 + created ID |
| U-API-05 | Create itinerary (unauthenticated) | `POST /api/itineraries` no token | 401 |
| U-API-06 | Update own itinerary | `PUT /api/itineraries/:id` | 200 |
| U-API-07 | Update someone else's itinerary | `PUT /api/itineraries/:id` wrong user | 403 |
| U-API-08 | Delete own itinerary | `DELETE /api/itineraries/:id` | 200 |
| U-API-09 | Delete someone else's itinerary | `DELETE /api/itineraries/:id` wrong user | 403 |
| U-API-10 | Search itineraries | `GET /api/itineraries/search?q=paris` | 200 + filtered results |
| U-API-11 | Itinerary image association | `PUT /api/itineraries/:id` with image URL | Image URL saved |

### 2.2 `activities.js`

| # | Test Case | Method & Path | Expected |
|---|---|---|---|
| U-API-12 | Search activities by query | `GET /api/activities/search?q=museum` | 200 + results |
| U-API-13 | Search with empty query | `GET /api/activities/search?q=` | 400 or empty array |
| U-API-14 | Add activity to itinerary | `POST /api/activities` | 201 |
| U-API-15 | Remove activity | `DELETE /api/activities/:id` | 200 |

### 2.3 `destinations.js`

| # | Test Case | Method & Path | Expected |
|---|---|---|---|
| U-API-16 | Get destination by name | `GET /api/destinations/:name` | 200 + destination data |
| U-API-17 | Unknown destination | `GET /api/destinations/nonexistent` | 404 or AI-generated |
| U-API-18 | Destination cache hit | Pre-cached destination | Returns cached, no AI call |

### 2.4 `recommendations.js`

| # | Test Case | Method & Path | Expected |
|---|---|---|---|
| U-API-19 | Get recommendations | `GET /api/recommend` | 200 + recommendation array |
| U-API-20 | Recommendations with interests | `GET /api/recommend?interests=food,culture` | Filtered recommendations |

### 2.5 `transport.js`

| # | Test Case | Method & Path | Expected |
|---|---|---|---|
| U-API-21 | Get transport options | `GET /api/transport/options` | 200 + transport modes |
| U-API-22 | Get flight estimates | `GET /api/transport/flights` | 200 + duration/price estimates |
| U-API-23 | Get general info for destination | `GET /api/transport/general-info` | 200 + weather, currency, tips |
| U-API-24 | Get attractions | `GET /api/transport/attractions` | 200 + attraction list |

### 2.6 `sitemap.js`

| # | Test Case | Method & Path | Expected |
|---|---|---|---|
| U-API-25 | Generate sitemap XML | `GET /api/sitemap.xml` | 200, Content-Type: `application/xml` |
| U-API-26 | Sitemap includes all public pages | Parse XML output | All expected URLs present |

---

## 3. Integration Tests

| # | Test Case | Expected |
|---|---|---|
| I-API-01 | Full CRUD flow for itineraries | Create → Read → Update → Delete all succeed |
| I-API-02 | Auth middleware applied to protected routes | All protected routes reject unauthenticated requests |
| I-API-03 | Rate limiter triggers on over-limit | 101st request in 15min → 429 |
| I-API-04 | AI rate limiter (stricter) | 16th AI request in 15min → 429 |
| I-API-05 | Request timeout — normal route | Slow handler (>30s) → 504 |
| I-API-06 | Request timeout — AI route | Slow AI handler (>90s) → 504 |
| I-API-07 | CORS allows production origin | Request from `nextdestination.ai` → allowed |
| I-API-08 | CORS blocks random origin | Request from `evil.com` → blocked |
| I-API-09 | CORS allows Vercel preview | Request from `*.vercel.app` → allowed |
| I-API-10 | Health check | `GET /` → "NextDestination API is running" |
| I-API-11 | JSON body limit (10MB) | Body > 10MB → 413 |
| I-API-12 | Helmet headers present | Response has X-Frame-Options, HSTS, etc. |

---

## 4. Files to Create

```
tests/
├── unit/
│   └── routes/
│       ├── itineraries.test.js
│       ├── activities.test.js
│       ├── destinations.test.js
│       ├── recommendations.test.js
│       ├── transport.test.js
│       └── sitemap.test.js
└── integration/
    ├── api-crud.test.js
    ├── api-security.test.js
    └── api-rate-limiting.test.js
```
