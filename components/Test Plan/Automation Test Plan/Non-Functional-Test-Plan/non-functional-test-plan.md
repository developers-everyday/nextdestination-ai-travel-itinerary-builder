# Non-Functional & Cross-Cutting — Test Plan

> **Feature Owner:** Platform & Infrastructure  
> **Source Files:** `server/index.js` (rate limiting, CORS, Helmet, timeouts), `packages/web-next/app/robots.ts`, `packages/web-next/app/sitemap.ts`, `packages/web-next/app/layout.tsx`, `packages/web-next/instrumentation.ts`, `load-tests/k6-load.js`, `load-tests/k6-smoke.js`

---

## 1. Feature Summary

Non-functional tests cover security (Helmet headers, CORS, rate limiting), performance (request timeouts, response compression, bundle size), SEO (robots.txt, sitemap, meta tags), accessibility (WCAG compliance), and load/stress testing (k6). These are cross-cutting concerns that span the entire application.

---

## 2. Unit Tests

### 2.1 Security

| # | Test Case | Expected |
|---|---|---|
| U-NF-01 | Helmet sets X-Frame-Options | Header present in response |
| U-NF-02 | Helmet sets X-Content-Type-Options: nosniff | Header present |
| U-NF-03 | Helmet sets HSTS | Strict-Transport-Security header present |
| U-NF-04 | CORS allows `nextdestination.ai` | Request allowed |
| U-NF-05 | CORS allows `www.nextdestination.ai` | Request allowed |
| U-NF-06 | CORS allows `*.vercel.app` | Vercel preview requests allowed |
| U-NF-07 | CORS blocks unknown origin | Request rejected with CORS error |
| U-NF-08 | CORS allows no-origin (mobile/curl) | Request allowed |
| U-NF-09 | Trust proxy set to 1 | `app.get('trust proxy')` === 1 |

### 2.2 Rate Limiting

| # | Test Case | Expected |
|---|---|---|
| U-NF-10 | General limiter: 100 requests allowed (prod) | Requests 1-100 succeed |
| U-NF-11 | General limiter: 101st request blocked | 429 + retry message |
| U-NF-12 | General limiter: 500 requests allowed (dev) | Dev mode relaxed limit |
| U-NF-13 | AI limiter: 15 requests allowed | Requests 1-15 succeed |
| U-NF-14 | AI limiter: 16th request blocked | 429 + AI-specific message |
| U-NF-15 | Rate limit headers (RateLimit-*) present | Standard headers in response |
| U-NF-16 | Sitemap exempt from rate limiter | `/api/sitemap.xml` always accessible |

### 2.3 Request Timeouts

| # | Test Case | Expected |
|---|---|---|
| U-NF-17 | Default routes timeout at 30s | Slow handler → 504 after 30s |
| U-NF-18 | AI routes timeout at 90s | `/api/suggestions` slow → 504 after 90s |
| U-NF-19 | Transport routes timeout at 90s | `/api/transport/*` slow → 504 after 90s |
| U-NF-20 | Timer cleared on successful response | No phantom timeout errors |
| U-NF-21 | Timer cleared on client disconnect | No orphaned timers |

### 2.4 Response Compression

| # | Test Case | Expected |
|---|---|---|
| U-NF-22 | JSON responses are gzip compressed | `Content-Encoding: gzip` header present |
| U-NF-23 | Small responses may skip compression | Threshold behaviour correct |

---

## 3. Integration Tests

### 3.1 SEO

| # | Test Case | Expected |
|---|---|---|
| I-NF-01 | `robots.txt` serves correct content | Allow/Disallow rules, sitemap URL present |
| I-NF-02 | Sitemap includes all public pages | All routes listed with correct priorities |
| I-NF-03 | Sitemap includes community itineraries | Dynamic itinerary URLs present |
| I-NF-04 | Meta tags on homepage | `<title>`, `<meta description>`, OG tags present |
| I-NF-05 | Meta tags on itinerary share page | Dynamic title/description from itinerary |
| I-NF-06 | Canonical URLs set correctly | Each page has unique canonical URL |

### 3.2 Error Handling

| # | Test Case | Expected |
|---|---|---|
| I-NF-07 | Sentry captures server errors | Error passed to `next(err)` → Sentry logs it |
| I-NF-08 | Sentry client configured | Client-side errors captured |
| I-NF-09 | Graceful 500 error response | JSON error body, not stack trace |
| I-NF-10 | 404 for unknown API routes | `GET /api/nonexistent` → appropriate error |

---

## 4. E2E Tests

### 4.1 Accessibility

| # | Test Case | Expected |
|---|---|---|
| E-NF-01 | Axe scan on homepage | No critical/serious violations |
| E-NF-02 | Axe scan on builder page | No critical/serious violations |
| E-NF-03 | Axe scan on community page | No critical/serious violations |
| E-NF-04 | Keyboard navigation | All interactive elements reachable via Tab |
| E-NF-05 | Focus visible indicators | Focus ring visible on all interactive elements |
| E-NF-06 | Screen reader labels | ARIA labels on icons, buttons, inputs |

### 4.2 Responsive Design

| # | Test Case | Viewport | Expected |
|---|---|---|---|
| E-NF-07 | Mobile layout — homepage | 375×812 | No horizontal scroll, stacked layout |
| E-NF-08 | Tablet layout — builder | 768×1024 | Appropriate breakpoint layout |
| E-NF-09 | Desktop layout — builder | 1440×900 | Full multi-panel layout |
| E-NF-10 | Touch interactions on mobile | 375×812 | Buttons have adequate touch targets |

### 4.3 Performance

| # | Test Case | Expected |
|---|---|---|
| E-NF-11 | Lighthouse Performance score | ≥ 80 on homepage |
| E-NF-12 | Lighthouse Accessibility score | ≥ 90 |
| E-NF-13 | Lighthouse SEO score | ≥ 90 |
| E-NF-14 | Bundle size check | JS bundle < threshold (TBD) |
| E-NF-15 | LCP (Largest Contentful Paint) | < 2.5s |
| E-NF-16 | CLS (Cumulative Layout Shift) | < 0.1 |

---

## 5. Load & Stress Tests (Existing + Extensions)

| # | Test Case | Tool | Expected |
|---|---|---|---|
| L-NF-01 | Smoke test — all endpoints respond | k6 (existing) | All return 200 |
| L-NF-02 | Load test — 100 concurrent users | k6 (existing) | p95 < 2s, 0% errors |
| L-NF-03 | Stress test — ramp to 500 users | k6 (extend) | Graceful degradation, no crash |
| L-NF-04 | AI endpoint under load | k6 (extend) | Rate limiter kicks in, no overload |
| L-NF-05 | Soak test — 1hr sustained load | k6 (extend) | No memory leaks, stable response times |

---

## 6. Files to Create / Extend

```
tests/
├── unit/
│   └── middleware/
│       ├── cors.test.js
│       ├── rateLimiter.test.js
│       └── timeout.test.js
├── integration/
│   ├── seo.test.js
│   └── error-handling.test.js
├── e2e/
│   ├── accessibility.spec.ts
│   ├── responsive.spec.ts
│   └── performance.spec.ts
load-tests/
├── k6-stress.js (NEW)
├── k6-soak.js (NEW)
└── k6-ai-endpoints.js (NEW)
```
