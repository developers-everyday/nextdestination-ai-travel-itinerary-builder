# Authentication & Authorization — Test Plan

> **Feature Owner:** Auth Module  
> **Source Files:** `server/middleware/auth.js`, `server/middleware/roleAuth.js`, `packages/shared/src/services/supabaseClient.ts`, `packages/web-next/components/AuthContext.tsx`, `packages/web-next/components/RequireAuth.tsx`, `packages/web-next/app/login/`, `packages/web-next/app/signup/`, `packages/web-next/app/auth/`

---

## 1. Feature Summary

Authentication in NextDestination.ai uses **Supabase Auth** (email/password + social providers). The backend validates JWT tokens via two Express middleware functions: `verifyAuth` (strict) and `optionalAuth` (permissive). A role-based middleware (`roleAuth.js`) gates premium features by plan tier. The frontend uses a React context (`AuthContext`) to manage session state and a `RequireAuth` wrapper for protected routes.

---

## 2. Unit Tests

### 2.1 `verifyAuth` Middleware

| # | Test Case | Input | Expected Output |
|---|---|---|---|
| U-AUTH-01 | Missing Authorization header | `req.headers = {}` | 401 + `"Unauthorized: No valid token provided"` |
| U-AUTH-02 | Token is the string `"undefined"` | `Authorization: Bearer undefined` | 401 |
| U-AUTH-03 | Token is the string `"null"` | `Authorization: Bearer null` | 401 |
| U-AUTH-04 | Valid cached token (within TTL) | Token in `tokenCache`, not expired | `req.user` set, `next()` called, no Supabase call |
| U-AUTH-05 | Expired cached token | Token in cache, `expiresAt` in the past | Supabase `getUser()` called |
| U-AUTH-06 | Valid token, Supabase returns user | Supabase mock returns `{ user }` | `req.user` set, token added to cache, `next()` called |
| U-AUTH-07 | Invalid token, Supabase returns error | Supabase mock returns `{ error }` | 401 + `"Unauthorized: Invalid token"` |
| U-AUTH-08 | Cache FIFO eviction at capacity | Cache has `MAX_CACHE_SIZE` entries | Oldest entry evicted, new entry added |
| U-AUTH-09 | Supabase throws exception | Supabase mock throws | 500 + `"Internal Server Error during auth"` |

### 2.2 `optionalAuth` Middleware

| # | Test Case | Input | Expected Output |
|---|---|---|---|
| U-AUTH-10 | No token provided | No Authorization header | `req.user` is `undefined`, `next()` called |
| U-AUTH-11 | Valid token provided | Valid Bearer token | `req.user` is set, `next()` called |
| U-AUTH-12 | Invalid token provided | Invalid Bearer token | `req.user` is `undefined`, `next()` called (no rejection) |
| U-AUTH-13 | Supabase exception (silent catch) | Supabase mock throws | `req.user` is `undefined`, `next()` called |

### 2.3 `roleAuth` Middleware

| # | Test Case | Input | Expected Output |
|---|---|---|---|
| U-AUTH-14 | User with required role | `req.user.role = 'premium'`, required: `'premium'` | `next()` called |
| U-AUTH-15 | User without required role | `req.user.role = 'free'`, required: `'premium'` | 403 Forbidden |
| U-AUTH-16 | Admin bypasses all role checks | `req.user.role = 'admin'` | `next()` called |
| U-AUTH-17 | No user on request (not authenticated) | `req.user = undefined` | 401 Unauthorized |

### 2.4 Token Cache Housekeeping

| # | Test Case | Expected |
|---|---|---|
| U-AUTH-18 | Interval purge removes expired entries | After simulated timer tick, expired entries are gone |
| U-AUTH-19 | Non-expired entries survive purge | After tick, valid entries remain |

---

## 3. Integration Tests

| # | Test Case | Setup | Expected |
|---|---|---|---|
| I-AUTH-01 | Protected route rejects unauthenticated request | `GET /api/profile` with no token | 401 |
| I-AUTH-02 | Protected route accepts valid token | `GET /api/profile` with valid token | 200 + user data |
| I-AUTH-03 | Optional-auth route works anonymously | `GET /api/itineraries` (uses optionalAuth) | 200, `req.user` absent |
| I-AUTH-04 | Rate limiter interacts correctly with auth | Rapid requests with valid tokens | Rate limit triggered at threshold, auth still validated |
| I-AUTH-05 | Expired Supabase token is rejected | Token that Supabase rejects | 401 |

---

## 4. E2E Tests

| # | Test Case | Steps | Expected |
|---|---|---|---|
| E-AUTH-01 | Signup with valid credentials | Navigate to `/signup`, fill form, submit | Account created, redirect to home/builder |
| E-AUTH-02 | Signup with existing email | Use already-registered email | Error message displayed |
| E-AUTH-03 | Signup with weak password | Enter short/weak password | Validation error shown |
| E-AUTH-04 | Login with valid credentials | Navigate to `/login`, enter creds, submit | Logged in, navbar shows user, redirect |
| E-AUTH-05 | Login with wrong password | Enter wrong password | Error message, stays on login |
| E-AUTH-06 | Logout | Click logout in navbar | Session cleared, redirected to home |
| E-AUTH-07 | Access protected route when not logged in | Navigate to `/profile` directly | Redirected to `/login` |
| E-AUTH-08 | Session persists on page reload | Login, reload page | Still logged in |
| E-AUTH-09 | Deep link redirect after login | Navigate to `/builder` → redirected to login → login | Redirected back to `/builder` |

---

## 5. Mocking Strategy

| Dependency | Mock Approach |
|---|---|
| Supabase Auth (`getUser`) | Mock `@supabase/supabase-js` `createClient` in unit/integration tests |
| Token cache (`Map`) | Inject pre-populated cache for cache-hit tests |
| Timer (`setInterval`) | Use `vi.useFakeTimers()` for cache purge tests |

---

## 6. Files to Create

```
tests/
├── unit/
│   ├── middleware/
│   │   ├── auth.test.js
│   │   └── roleAuth.test.js
├── integration/
│   └── auth-routes.test.js
└── e2e/
    └── auth-flow.spec.ts
```
