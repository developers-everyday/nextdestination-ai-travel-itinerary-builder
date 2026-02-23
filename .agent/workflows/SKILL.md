---
name: Automation Testing
description: How to work with the NextDestination.ai automation test plans, create tests, and maintain test documentation.
---

# Automation Testing Skill

This skill provides guidance on the structure, location, and usage of all automation test plans and test files for the **NextDestination.ai** travel itinerary builder application.

---

## 📁 Test Plan Documentation Structure

All test plan documentation lives under:

```
components/Test Plan/Automation Test Plan/
```

### Directory Layout

```
components/Test Plan/Automation Test Plan/
├── automation_test_plan_overview.md         ← Broad overview of the entire test strategy
├── Authentication-Test-Plan/
│   └── authentication-test-plan.md          ← Auth middleware, login/signup, sessions
├── Homepage-Navigation-Test-Plan/
│   └── homepage-navigation-test-plan.md     ← Landing page, navbar, footer, search
├── Planning-Suggestions-Test-Plan/
│   └── planning-suggestions-test-plan.md    ← AI generation, duration chips, caching
├── Itinerary-Builder-Test-Plan/
│   └── itinerary-builder-test-plan.md       ← DnD, activity/hotel search, map, save
├── User-Profile-Test-Plan/
│   └── user-profile-test-plan.md            ← Profile CRUD, wishlist, settings
├── Community-Test-Plan/
│   └── community-test-plan.md               ← Browse, filter, detail modal, remix
├── Payments-Stripe-Test-Plan/
│   └── payments-stripe-test-plan.md         ← Checkout, webhooks, plan gating
├── Backend-API-Routes-Test-Plan/
│   └── backend-api-routes-test-plan.md      ← All 10 Express route modules
├── Backend-Services-Test-Plan/
│   └── backend-services-test-plan.md        ← Gemini, Maps, image gen, templates
├── Shared-Package-Test-Plan/
│   └── shared-package-test-plan.md          ← 12 services, Zustand stores, types
└── Non-Functional-Test-Plan/
    └── non-functional-test-plan.md          ← Security, performance, SEO, a11y, load
```

---

## 🧪 Test Levels

Each feature plan breaks tests into three levels following the **test pyramid**:

| Level | Prefix | Purpose | Speed |
|---|---|---|---|
| **Unit** | `U-XXX-##` | Pure functions, isolated logic, component rendering | Fast |
| **Integration** | `I-XXX-##` | API routes with mocked externals, service interactions | Moderate |
| **E2E** | `E-XXX-##` | Full user journeys across frontend + backend | Slow |

---

## 🛠 Suggested Tooling (Pending Final Decision)

| Purpose | Tool |
|---|---|
| Unit tests | **Vitest** |
| API integration tests | **Vitest + Supertest** |
| E2E browser tests | **Playwright** |
| Component tests | **React Testing Library** |
| API mocking | **MSW (Mock Service Worker)** |
| Accessibility | **Axe-core** (via Playwright) |
| Load testing | **k6** (already in `load-tests/`) |

---

## 📋 How to Use These Plans

### When writing new tests:

1. **Find the relevant feature plan** in `components/Test Plan/Automation Test Plan/{Feature}-Test-Plan/`
2. **Look up the test case table** for the test level you're implementing (Unit / Integration / E2E)
3. **Use the test case ID** (e.g., `U-AUTH-01`) as the test description for traceability
4. **Follow the mocking strategy** section for external dependency handling
5. **Create test files** per the "Files to Create" section in each plan

### When adding a new feature:

1. Create a new folder: `components/Test Plan/Automation Test Plan/{Feature-Name}-Test-Plan/`
2. Create the test plan markdown following the same template:
   - Feature Summary
   - Unit Tests (table format with IDs)
   - Integration Tests
   - E2E Tests
   - Mocking Strategy
   - Files to Create
3. **Update this SKILL.md** to include the new feature in the directory layout above

### When modifying an existing feature:

1. Open the relevant feature test plan
2. Add new test cases with the next available ID number
3. Mark obsolete test cases with ~~strikethrough~~
4. Update the mocking strategy if new dependencies are introduced

---

## 🏗 Test File Structure (Target)

When tests are implemented, they should follow this structure:

```
tests/
├── unit/
│   ├── middleware/        ← Express middleware tests
│   ├── routes/            ← Express route handler tests
│   ├── services/          ← Backend service tests
│   ├── shared/            ← Shared package tests
│   │   ├── services/
│   │   └── store/
│   └── components/        ← React component tests
│       ├── home/
│       └── ...
├── integration/
│   ├── auth-routes.test.js
│   ├── api-crud.test.js
│   ├── api-security.test.js
│   └── ...
├── e2e/
│   ├── auth-flow.spec.ts
│   ├── builder-flow.spec.ts
│   ├── community-flow.spec.ts
│   ├── planning-flow.spec.ts
│   ├── profile-flow.spec.ts
│   ├── upgrade-flow.spec.ts
│   ├── accessibility.spec.ts
│   └── responsive.spec.ts
└── fixtures/              ← Shared test data
    ├── itinerary.json
    ├── user.json
    └── gemini-responses/
```

---

## 📊 Rollout Phases

| Phase | Focus | Status |
|---|---|---|
| **Phase 1** | Foundation: tooling setup, shared package unit tests, auth middleware | ⬜ Not Started |
| **Phase 2** | API Coverage: all 10 route modules + services | ⬜ Not Started |
| **Phase 3** | E2E Critical Paths: signup→build→save, community→remix, upgrade | ⬜ Not Started |
| **Phase 4** | Comprehensive: visual regression, a11y, CI/CD pipeline | ⬜ Not Started |

---

## 📝 Key References

- **Broad overview plan**: `components/Test Plan/Automation Test Plan/automation_test_plan_overview.md`
- **Existing load tests**: `load-tests/k6-load.js`, `load-tests/k6-smoke.js`
- **Backend entry point**: `server/index.js`
- **Frontend entry**: `packages/web-next/app/`
- **Shared package**: `packages/shared/src/`
