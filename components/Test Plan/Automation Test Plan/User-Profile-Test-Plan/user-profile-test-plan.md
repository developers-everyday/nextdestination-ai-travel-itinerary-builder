# User Profile — Test Plan

> **Feature Owner:** User Management  
> **Source Files:** `packages/web-next/app/profile/`, `packages/web-next/components/SettingsModal.tsx`, `server/routes/userProfile.js`, `server/routes/wishlist.js`, `packages/shared/src/services/userProfileService.ts`

---

## 1. Feature Summary

The User Profile feature allows authenticated users to view and edit their profile, manage saved itineraries, view and manage their wishlist, and adjust settings. The backend supports profile CRUD with avatar upload (via Supabase Storage) and a wishlist system linked to itineraries.

---

## 2. Unit Tests

### 2.1 Frontend Components

| # | Test Case | Expected |
|---|---|---|
| U-PROF-01 | Profile page renders user info | Name, email, avatar displayed |
| U-PROF-02 | Profile page shows itinerary list | "My Itineraries" section with cards |
| U-PROF-03 | Profile page shows wishlist | Wishlist items rendered |
| U-PROF-04 | Empty itinerary list shows empty state | "No itineraries yet" message |
| U-PROF-05 | Settings modal opens and populates | Form fields pre-filled with current data |
| U-PROF-06 | Settings form validation | Required fields flagged, invalid email caught |

### 2.2 User Profile Service (Shared)

| # | Test Case | Expected |
|---|---|---|
| U-PROF-07 | `fetchProfile` API call format | GET `/api/profile` with auth header |
| U-PROF-08 | `updateProfile` sends correct body | PUT with name, bio, avatar fields |
| U-PROF-09 | Service handles 404 gracefully | Returns null, no throw |

### 2.3 Backend Routes

| # | Test Case | Input | Expected |
|---|---|---|---|
| U-PROF-10 | GET `/api/profile` extracts user from token | Valid auth token | Profile data returned |
| U-PROF-11 | PUT `/api/profile` updates fields | `{ name, bio }` | 200, fields updated |
| U-PROF-12 | POST `/api/wishlist` adds item | `{ itinerary_id }` | 201, item added |
| U-PROF-13 | DELETE `/api/wishlist/:id` removes item | Valid wishlist item ID | 200, item removed |
| U-PROF-14 | GET `/api/wishlist` lists user's items | Valid auth | Array of wishlist items |
| U-PROF-15 | Wishlist duplicate prevention | Add same itinerary twice | Error or idempotent response |

---

## 3. Integration Tests

| # | Test Case | Expected |
|---|---|---|
| I-PROF-01 | Profile CRUD flow | Create → Read → Update → Read | All operations successful |
| I-PROF-02 | Wishlist CRUD flow | Add → List → Remove → List | Correct items at each step |
| I-PROF-03 | Profile with no auth | GET `/api/profile` no token | 401 |
| I-PROF-04 | Avatar upload | Multipart upload | Supabase Storage URL returned |

---

## 4. E2E Tests

| # | Test Case | Steps | Expected |
|---|---|---|---|
| E-PROF-01 | View profile | Login → navigate to `/profile` | Profile page renders with user data |
| E-PROF-02 | Edit profile | Click edit → change name → save | Name updated, toast shown |
| E-PROF-03 | View my itineraries | Navigate to profile | Itinerary cards visible |
| E-PROF-04 | Delete itinerary from profile | Click delete on itinerary card | Itinerary removed from list |
| E-PROF-05 | Add to wishlist | On community page, click heart | Item appears in profile wishlist |
| E-PROF-06 | Remove from wishlist | On profile, click remove on wishlist item | Item removed |
| E-PROF-07 | Open and save settings | Click settings → change preference → save | Settings persisted |

---

## 5. Files to Create

```
tests/
├── unit/
│   ├── routes/
│   │   ├── userProfile.test.js
│   │   └── wishlist.test.js
│   └── services/
│       └── userProfileService.test.ts
├── integration/
│   ├── profile-api.test.js
│   └── wishlist-api.test.js
└── e2e/
    └── profile-flow.spec.ts
```
