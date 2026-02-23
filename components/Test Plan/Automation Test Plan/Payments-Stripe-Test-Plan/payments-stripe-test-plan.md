# Payments (Stripe) — Test Plan

> **Feature Owner:** Monetisation  
> **Source Files:** `packages/web-next/app/upgrade/`, `server/routes/stripe.js`, `database/012_add_stripe_columns.sql`

---

## 1. Feature Summary

NextDestination.ai uses **Stripe Checkout** in test mode for plan upgrades. The flow is: user clicks Upgrade → backend creates a Stripe Checkout Session → user completes payment on Stripe-hosted page → Stripe webhook fires → backend updates user plan in Supabase. The Stripe webhook route uses `express.raw()` for signature verification.

---

## 2. Unit Tests

### 2.1 Frontend — Upgrade Page

| # | Test Case | Expected |
|---|---|---|
| U-PAY-01 | Upgrade page renders plan cards | Free vs Premium plan details displayed |
| U-PAY-02 | Current plan highlighted | User's active plan has "Current Plan" badge |
| U-PAY-03 | Upgrade CTA button visible for free users | "Upgrade Now" button present |
| U-PAY-04 | Already premium — no upgrade CTA | "Current Plan" shown, no upgrade button |

### 2.2 Backend — `stripe.js` Route

| # | Test Case | Input | Expected |
|---|---|---|---|
| U-PAY-05 | Create checkout session — valid request | Authenticated user, plan ID | 200 + Stripe session URL |
| U-PAY-06 | Create checkout session — unauthenticated | No auth token | 401 |
| U-PAY-07 | Webhook — valid signature | Valid Stripe signature | 200, user plan updated |
| U-PAY-08 | Webhook — invalid signature | Tampered signature | 400 |
| U-PAY-09 | Webhook — checkout.session.completed event | Event type: `checkout.session.completed` | User's `plan` column updated to `premium` |
| U-PAY-10 | Webhook — unhandled event type | Unknown event type | 200 (acknowledged, no action) |
| U-PAY-11 | Webhook body parsing (raw) | Raw body buffer | Signature verification succeeds |

---

## 3. Integration Tests

| # | Test Case | Expected |
|---|---|---|
| I-PAY-01 | `POST /api/stripe/create-checkout-session` | 200 + session object with URL |
| I-PAY-02 | Webhook processes payment and updates DB | After webhook, user plan is `premium` in DB |
| I-PAY-03 | Plan-gated feature blocked for free user | Access premium endpoint → 403 |
| I-PAY-04 | Plan-gated feature allowed for premium user | Access premium endpoint → 200 |
| I-PAY-05 | Double payment idempotency | Same webhook event sent twice → user plan unchanged |

---

## 4. E2E Tests

| # | Test Case | Steps | Expected |
|---|---|---|---|
| E-PAY-01 | Navigate to upgrade page | Click "Upgrade" in navbar | Upgrade page loads with plan details |
| E-PAY-02 | Click upgrade initiates checkout | Click "Upgrade Now" | Redirected to Stripe Checkout (test mode) |
| E-PAY-03 | Post-upgrade plan reflected | After successful test payment | Profile shows "Premium" plan |
| E-PAY-04 | Premium feature unlocked | After upgrade → access premium feature | Feature accessible |

> [!NOTE]
> E2E Stripe tests should use **Stripe test mode** with test card numbers (`4242 4242 4242 4242`). Full Stripe Checkout UI testing may require browser automation with longer timeouts.

---

## 5. Mocking Strategy

| Dependency | Mock Approach |
|---|---|
| Stripe SDK | Mock `stripe` package for unit tests; use test mode for integration |
| Stripe webhooks | Use `stripe trigger` CLI for local webhook testing |
| Supabase (plan column) | Real test DB or mocked Supabase client |

---

## 6. Files to Create

```
tests/
├── unit/
│   └── routes/
│       └── stripe.test.js
├── integration/
│   └── stripe-api.test.js
└── e2e/
    └── upgrade-flow.spec.ts
```
