# NextDestination.ai — Monetization & Global Payments Plan

> **Created**: February 25, 2026
> **Last Updated**: February 28, 2026
> **Status**: Phase 1 — Foundation in progress
> **Priority**: High
> **Related Docs**: [Monetization Strategy](./monetization_strategy.md) | [Manual Tasks](./manual_tasks.md)

---

## Table of Contents

1. [Objective](#1-objective)
2. [Payment Gateway Options](#2-payment-gateway-options)
3. [Current Implementation Status](#3-current-implementation-status)
4. [Company Registration & Compliance](#4-company-registration--compliance)
5. [Pricing Model (Finalized)](#5-pricing-model-finalized)
6. [Affiliate Payout Details](#6-affiliate-payout-details--how-you-get-paid)
7. [Creator/Influencer Payouts](#7-creatorinfluencer-payouts)
8. [Phased Rollout Plan](#8-phased-rollout-plan)
9. [Refund & Cancellation Policy](#9-refund--cancellation-policy)
10. [Key Decisions](#10-key-decisions-status)
11. [Resources](#11-resources)

---

## 1. Objective

Enable NextDestination.ai to:
1. **Charge users** for premium plans (subscriptions) via Stripe
2. **Earn affiliate commissions** from 10+ travel partner programs
3. **Pay out creators/influencers** their share of affiliate revenue
4. **Accept payments globally** — starting from an Indian business entity, expanding internationally

---

## 2. Payment Gateway Options

### 2.1 Stripe (Primary — Already Integrated)

Stripe is available in India and supports both domestic and international payments.

| Feature | Details |
|---------|---------|
| Domestic payments (INR) | Supported |
| International payments (USD, EUR, etc.) | Supported (requires additional KYC) |
| Payouts | To Indian bank accounts in INR |
| Supported business types | Sole Prop, Partnership, LLP, Pvt Ltd |
| Currencies | 135+ |
| Fees (domestic) | ~2% + GST |
| Fees (international) | ~3% + currency conversion |
| Subscription billing | Supported (`mode: 'subscription'`) |
| Stripe Connect (for creator payouts) | Supported — enables marketplace payouts |
| Webhook support | Built — `checkout.session.completed` handler active |

> [!IMPORTANT]
> Stripe integration is already built into the codebase:
> - Checkout sessions: `server/routes/stripe.js:26`
> - Webhook handler: `server/routes/stripe.js:112`
> - Session status: `server/routes/stripe.js:187`
> - DB schema: `database/012_add_stripe_columns.sql`
>
> **Remaining:** Complete KYC at [dashboard.stripe.com](https://dashboard.stripe.com) and switch from `mode: 'payment'` to `mode: 'subscription'`.

### 2.2 Razorpay (Secondary — Indian Users Fallback)

| Feature | Details |
|---------|---------|
| Best for | Indian domestic payments (UPI, netbanking, wallets) |
| International support | 100+ currencies via Razorpay International |
| KYC | Easier for Indian businesses |
| Dashboard | INR-native, familiar UX |
| Fees (domestic) | ~2% |
| Fees (international) | ~3% + conversion |
| Subscription billing | Supported |
| When to add | Phase 3 — after validating Stripe works well |

**Why consider:** Many Indian users prefer UPI/netbanking. Razorpay handles these natively. Stripe's UPI support in India is limited.

### 2.3 PayPal (Alternative — International Users)

| Feature | Details |
|---------|---------|
| Best for | Users who prefer PayPal checkout |
| Global trust | Very high — 430M+ accounts worldwide |
| Fees | ~4.4% + fixed fee (international) |
| Subscription billing | Supported |
| Use case | Offer alongside Stripe as an alternative for international users |
| When to add | Phase 3 — for international expansion |

### 2.4 Paddle / Lemon Squeezy (Merchant of Record — Future Consideration)

| Feature | Details |
|---------|---------|
| Best for | Avoiding global tax compliance headaches |
| How it works | They act as the seller; you are the vendor |
| Tax handling | They collect & remit VAT, GST, sales tax globally |
| Payout | They pay you after deducting fees + taxes |
| Trade-off | Higher fees (~5-10%), less control over billing |
| When to consider | Phase 4 — when tax compliance across 100+ countries becomes a burden |

> [!TIP]
> Consider Paddle/Lemon Squeezy if handling VAT/GST compliance across 100+ countries feels overwhelming. They simplify everything at the cost of slightly higher fees (~5% vs Stripe's ~3%).

### 2.5 Gateway Comparison at a Glance

| Feature | Stripe | Razorpay | PayPal | Paddle |
|---|---|---|---|---|
| **Status** | Integrated | Planned | Planned | Evaluate later |
| **Domestic fees** | ~2% + GST | ~2% | N/A | ~5% |
| **International fees** | ~3% | ~3% | ~4.4% | ~5% (includes tax) |
| **UPI support** | Limited | Native | No | No |
| **Subscription billing** | Yes | Yes | Yes | Yes |
| **Creator payouts** | Stripe Connect | Razorpay Route | PayPal Payouts | No |
| **Tax compliance** | Self-managed | Self-managed | Self-managed | Fully handled |
| **Setup effort** | Done | Moderate | Low | Low |

---

## 3. Current Implementation Status

### What's Built

| Component | File Location | Status |
|---|---|---|
| Stripe Checkout (one-time payment) | `server/routes/stripe.js:26-105` | Built (needs subscription switch) |
| Stripe Webhook handler | `server/routes/stripe.js:112-181` | Built |
| Stripe Session status check | `server/routes/stripe.js:187-206` | Built |
| Plan config DB table | `database/011_create_user_profiles.sql` | Built |
| Stripe price ID column | `database/012_add_stripe_columns.sql` | Built |
| Quota middleware (generations) | `server/middleware/roleAuth.js` | Built |
| Quota middleware (saves) | `server/middleware/roleAuth.js` | Built |
| Plan-gated feature flags | `server/middleware/roleAuth.js` | Built |
| User profile with plan display | `packages/web-next/app/profile/page.tsx` | Built |
| Upgrade success page | `packages/web-next/app/upgrade/success/page.tsx` | Built |
| Stripe test suite | `server/tests/unit/routes/stripe.test.js` | Built (220 lines) |

### What Needs to Be Built

| Component | Priority | Effort | Details |
|---|---|---|---|
| Switch to `mode: 'subscription'` | P0 | 1 day | Change line 90 in `stripe.js`, add subscription webhook events (`customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) |
| Pricing page (`/pricing`) | P0 | 2 days | Feature comparison table, CTA buttons, Stripe checkout trigger |
| Subscription management (cancel/upgrade) | P1 | 2 days | Customer portal via `stripe.billingPortal.sessions.create()` |
| Invoice generation (GST) | P2 | 3 days | Generate PDF invoices with GSTIN, HSN codes |
| Razorpay integration | P3 | 3 days | Separate checkout flow for UPI/netbanking |
| Stripe Connect (creator payouts) | P3 | 5 days | Onboard creators, split payments, payout dashboard |

### Subscription Webhook Events to Handle

When switching to `mode: 'subscription'`, add handlers for these events in `stripe.js`:

| Event | Action |
|---|---|
| `checkout.session.completed` | Upgrade user plan (already handled) |
| `customer.subscription.updated` | Update plan if changed |
| `customer.subscription.deleted` | Downgrade to starter plan |
| `invoice.payment_failed` | Notify user, grace period before downgrade |
| `invoice.paid` | Reset monthly usage counters |
| `customer.subscription.trial_will_end` | Send reminder email (if trials added) |

---

## 4. Company Registration & Compliance

### 4.1 Business Entity Options

| Entity Type | Details | Timeline | Best For |
|------|---------|----------|----------|
| **Sole Proprietorship** | Easiest to start, just PAN + current account | 1–2 days | Getting started ASAP |
| **LLP Registration** | Better if co-founders exist; limited liability | 7–15 days | Starting with a partner |
| **Pvt Ltd** | Best for raising investment later | 15–30 days | When seeking investors |

> [!NOTE]
> **Recommended:** Start with **Sole Prop** to begin accepting payments immediately. Upgrade to **LLP** within 3 months, then **Pvt Ltd** when seeking investment. Each upgrade is straightforward.

### 4.2 Compliance Checklist

| Requirement | Domestic Payments | International Payments | Status |
|---|:---:|:---:|:---:|
| PAN Card | Required | Required | Have it |
| Business Registration | Required | Required (LLP/Pvt Ltd recommended) | Pending |
| GST Registration | If revenue > ₹20L/yr | Required | Pending |
| Current Bank Account | Recommended | Required | Pending |
| FEMA / RBI Compliance | Not needed | Required for forex | Phase 3 |
| IEC (Import Export Code) | Not needed | Required for receiving forex | Phase 3 |
| Stripe India KYC | Required | Required | Pending |

### 4.3 Tax Implications

| Revenue Source | Tax Treatment |
|---|---|
| **Subscription revenue (domestic)** | GST @ 18% (if registered). Income tax per slab. |
| **Subscription revenue (international)** | Export of services — GST exempt (with LUT). Income tax per slab. IEC required. |
| **Affiliate commissions (from foreign companies)** | Export of services. IEC required for forex receipt. Income tax applicable. |
| **Affiliate commissions (Amazon.in, Indian programs)** | TDS deducted by Amazon. GST if registered. |

> [!TIP]
> Most affiliate programs pay in USD/EUR. You'll need an **IEC** and a **current bank account** that can receive forex via SWIFT. Apply for IEC early — it's free and takes 7–15 days.

---

## 5. Pricing Model (Finalized)

### 5.1 Subscription Plans

| Plan | Monthly | Annual | Savings | Target Segment |
|------|---------|--------|---------|----------------|
| **Starter** (Free) | ₹0 | ₹0 | — | Try before you buy |
| **Explorer** | ₹299/mo | ₹2,499/yr | 30% | Regular travellers |
| **Custom** | ₹999/mo | ₹7,999/yr | 33% | Power users, creators |

### 5.2 Feature Comparison

| Feature | Starter | Explorer | Custom |
|---|:---:|:---:|:---:|
| AI Itinerary Generations | 3/month | 50/month | Unlimited |
| Saved Itineraries | 1 | 10 | Unlimited |
| Voice Agent | No | Yes | Yes |
| PDF Export | No | Yes | Yes |
| Affiliate Links in Itineraries | No | No | Yes (earn from your itineraries) |
| Sell Travel Packages | No | No | Yes |
| Creator Profile & Dashboard | No | No | Yes |
| Priority Support | No | No | Yes |

### 5.3 Unit Economics

| Metric | Starter | Explorer | Custom |
|---|---|---|---|
| Revenue/user/month | ₹0 | ₹299 | ₹999 |
| Avg API cost/user/month | ₹5–15 | ₹15–50 | ₹50–200 |
| Gross margin | N/A (loss leader) | **~90–95%** | **~80–90%** |

### 5.4 International Pricing (Phase 3)

| Region | Explorer | Custom | Currency |
|---|---|---|---|
| India | ₹299/mo | ₹999/mo | INR |
| USA/Europe | $4.99/mo | $14.99/mo | USD/EUR |
| SE Asia | $2.99/mo | $9.99/mo | USD |

> Use Stripe's **price localization** or **Purchasing Power Parity (PPP)** to auto-adjust pricing by region.

---

## 6. Affiliate Payout Details — How You Get Paid

This section covers how each affiliate program pays **you** (NextDestination.ai) for referrals.

### 6.1 Payout Summary by Affiliate Partner

| Partner | Commission | Payout Method | Payout Threshold | Payout Schedule | Cookie |
|---|---|---|---|---|---|
| **Booking.com** | 25–40% of their commission | Bank transfer | €100 | Monthly (after guest stays) | Session |
| **Skyscanner** | 20% of Skyscanner's income (~$0.40–1.00/click-out) | Bank transfer via Impact | $50 | Monthly (Net 30) | 30 days |
| **GetYourGuide** | 8% per sale | Bank transfer via CJ | $50 | Monthly | 30 days |
| **Viator** | 8% per completed experience | PayPal (weekly, no min) or Bank ($50 min, monthly) | $0 (PayPal) / $50 (bank) | Weekly or Monthly | 30 days |
| **Discover Cars** | 70% of their profit (~$20–50/sale) | Bank transfer | $100 | Monthly | 365 days |
| **Airalo** | 10%+ per sale | Bank transfer via Impact | Varies | Monthly | Via Impact |
| **SafetyWing** | 10% recurring | Bank transfer | $10 | Monthly | 30 days |
| **iVisa** | 10–20% on services; 35% on photos | Bank transfer via Awin | $50 | 15th of each month | 365 days |
| **Amazon Associates** | 3–4% (travel gear) | Bank transfer or gift card | ₹1,000 (India) / $10 (US) | Monthly (60-day delay) | 24 hours |
| **NordVPN** | 40% on 1-2yr plans; 30% recurring | PayPal ($100 min) or Wire ($1,000 min) | $100 | Monthly (before 15th) | 30 days |
| **Wise** | £10/personal user; £50/business user | Bank transfer | Varies | Monthly | No expiry |
| **Hostelworld** | 18–22% per booking | Bank transfer via CJ | $50 | Monthly | 30 days |
| **Klook** | 2–5% per booking | Bank transfer | No minimum | 90 days after validation | 30 days |
| **Agoda** | 4–7% (tiered by volume) | Bank transfer | $200 | Monthly | 30 days |
| **TripAdvisor** | 50% of their partner commission (CPC) | Bank transfer | $50 | Monthly | 14 days |

### 6.2 Affiliate Network Aggregators

Instead of managing 15+ individual affiliate accounts, use aggregator networks:

| Network | Brands Available | Payout Method | Threshold | Why Use It |
|---|---|---|---|---|
| **Travelpayouts** | 100+ brands (Booking.com, Kiwi, Viator, RentalCars, Airalo, etc.) | PayPal, Bank, Payoneer, ePayments | $50 | Single dashboard for everything. 100% free. Earn 60–70% of TP income. |
| **CJ Affiliate** | Booking.com, GetYourGuide, Hostelworld, many more | Bank, Check, Payoneer | $50 | Enterprise-grade. Reliable payouts. |
| **Awin** | Booking.com, iVisa, and others | Bank transfer | £20 | Strong European presence. |
| **Impact** | Skyscanner, Airalo | Bank, PayPal | $25 | Modern platform, great analytics. |

> [!TIP]
> **Recommended approach:**
> 1. Sign up for **Travelpayouts** first — instant access to 100+ travel brands from one dashboard
> 2. Sign up directly with **Booking.com** and **Skyscanner** for better rates as volume grows
> 3. Use **CJ Affiliate** for GetYourGuide and Hostelworld
> 4. Use **Impact** for Skyscanner and Airalo

### 6.3 Payout Flow — How Money Reaches You

```
User clicks affiliate link in itinerary
        │
        ▼
Books hotel / flight / activity / etc.
        │
        ▼
Affiliate partner tracks the conversion
        │
        ▼
Commission accrues in affiliate dashboard
(Booking.com, Travelpayouts, CJ, Impact, etc.)
        │
        ▼
Reaches payout threshold ($50–100 typically)
        │
        ▼
Payout to your bank account (monthly)
        │
        ▼
Revenue recorded as "Export of Services"
(IEC required for forex receipts)
```

### 6.4 Expected Monthly Affiliate Revenue (Conservative)

At **1,000 itineraries generated/month** with modest conversion:

| Category | Conv. Rate | Avg Commission | Monthly Revenue |
|---|---|---|---|
| Hotels (Booking.com) | 3% | ₹500 (~$6) | ₹15,000 |
| Flights (Skyscanner) | 5% | ₹50 (~$0.60 CPC) | ₹2,500 |
| Activities (GYG + Viator) | 2% | ₹400 (~$5) | ₹8,000 |
| Car Rental (Discover Cars) | 1% | ₹2,000 (~$25) | ₹20,000 |
| Insurance (SafetyWing) | 1% | ₹300 (~$3.50) | ₹3,000 |
| eSIM (Airalo) | 2% | ₹200 (~$2.50) | ₹4,000 |
| Amazon (gear) | 2% | ₹100 (~$1.20) | ₹2,000 |
| VPN (NordVPN) | 0.5% | ₹2,500 (~$30) | ₹12,500 |
| Visa (iVisa) | 1% | ₹400 (~$5) | ₹4,000 |
| **Total Affiliate Revenue** | | | **₹71,000/mo (~$850)** |

At **10,000 itineraries/month**, this scales to **₹7+ lakh/mo (~$8,500)**.

Combined with subscription revenue (50 subscribers x ₹299 = ₹14,950):
- **Total projected monthly revenue: ₹85,950+**

---

## 7. Creator/Influencer Payouts

### 7.1 Revenue Share Model

When creators share itineraries with affiliate links and generate bookings:

| Party | Revenue Share | Example (₹1,000 commission) |
|---|---|---|
| **Creator** | 70–80% | ₹700–800 |
| **Platform** (NextDestination.ai) | 20–30% | ₹200–300 |

### 7.2 Payout Infrastructure Options

| Option | How It Works | Effort | Best For |
|---|---|---|---|
| **Stripe Connect** (Recommended) | Creators onboard via Stripe. Automatic split payments. | 5 days dev | Scale — automated, compliant, handles tax forms |
| **Manual Bank Transfer** | Track earnings in dashboard, transfer manually monthly | 1 day dev | Early stage — first 10-20 creators |
| **Razorpay Route** | Similar to Stripe Connect but INR-native | 3 days dev | India-only creators |
| **PayPal Mass Pay** | Batch payouts via PayPal API | 2 days dev | International creators |

### 7.3 Creator Payout Flow

```
Creator shares itinerary with unique tracking links
        │
        ▼
User books via affiliate link
        │
        ▼
Commission tracked via sub-ID (creator_id + affiliate_partner)
        │
        ▼
Affiliate pays NextDestination.ai
        │
        ▼
Platform splits: 70–80% to creator, 20–30% retained
        │
        ▼
Creator sees earnings in dashboard
        │
        ▼
Monthly payout (minimum ₹500)
        │
        ▼
Payout via Stripe Connect / bank transfer
```

### 7.4 Creator Dashboard (To Build)

| Feature | Description |
|---|---|
| Earnings overview | Total earned, pending, paid out |
| Click tracking | Clicks per itinerary, per affiliate category |
| Conversion tracking | Bookings generated, commission earned |
| Payout history | All past payouts with dates and amounts |
| Payout settings | Bank account / UPI / PayPal details |
| Tax documents | TDS certificates, earnings statements |

### 7.5 Tax Implications for Creator Payouts

| Scenario | Tax Treatment |
|---|---|
| Creator is Indian resident | TDS @ 10% on commission > ₹30,000/yr (Section 194H). Issue TDS certificate. |
| Creator is international | No TDS. Creator handles their own tax. |
| Platform's obligation | Deduct TDS for Indian creators. Issue Form 16A. File TDS returns quarterly. |

---

## 8. Phased Rollout Plan

### Phase 1 — Foundation (Week 1–2)
- [ ] Register business entity (Sole Prop — fastest)
- [ ] Open a current bank account
- [ ] Apply for GST registration
- [ ] Complete Stripe India KYC with business documents
- [ ] Switch Stripe integration from test mode to live mode
- [ ] Switch `mode: 'payment'` → `mode: 'subscription'` in `stripe.js:90`
- [ ] Add webhook handlers for subscription lifecycle events

### Phase 2 — Go Live with Payments + First Affiliates (Week 3–4)
- [ ] Build and launch `/pricing` page
- [ ] Enable live Stripe Checkout for subscription plans
- [ ] Test end-to-end payment flow (subscribe → webhook → plan upgrade)
- [ ] Set up Stripe dashboard alerts & monitoring
- [ ] Add payment terms, refund policy, and privacy policy pages
- [ ] Sign up for **Booking.com Affiliate** (direct or via Travelpayouts)
- [ ] Sign up for **Skyscanner** (via Impact)
- [ ] Sign up for **GetYourGuide** (via CJ Affiliate)
- [ ] Integrate affiliate links into hotel, flight, and activity recommendations

### Phase 3 — Affiliate Expansion + International Payments (Month 2)
- [ ] Apply for IEC (Import Export Code) for receiving forex
- [ ] Enable Stripe international payments (multi-currency)
- [ ] Sign up for **Airalo, SafetyWing, iVisa, Amazon Associates**
- [ ] Integrate eSIM, insurance, visa, and gear affiliate links
- [ ] Sign up for **Discover Cars, NordVPN, Wise**
- [ ] Integrate car rental, VPN, and fintech affiliate links
- [ ] Evaluate adding Razorpay as UPI/netbanking fallback for Indian users
- [ ] Set up Travelpayouts for aggregated affiliate management
- [ ] Implement affiliate link tracking and analytics

### Phase 4 — Creator Payouts + Scale (Month 3–4)
- [ ] Build creator earnings dashboard
- [ ] Implement affiliate sub-ID tracking per creator
- [ ] Set up manual payout flow (bank transfer for first creators)
- [ ] Evaluate Stripe Connect for automated creator payouts
- [ ] Implement invoice generation (GST-compliant for Indian users)
- [ ] Add international pricing tiers (USD, EUR)
- [ ] Evaluate PayPal as alternative for international users

### Phase 5 — Tax Compliance & Optimization (Month 5+)
- [ ] Implement TDS deduction for Indian creator payouts
- [ ] Set up automated tax reporting (TDS returns)
- [ ] Evaluate Merchant of Record (Paddle/Lemon Squeezy) if multi-country tax burden grows
- [ ] Upgrade to Pvt Ltd if seeking investment
- [ ] Implement Purchasing Power Parity pricing
- [ ] A/B test pricing tiers for conversion optimization

---

## 9. Refund & Cancellation Policy

### Subscription Refunds

| Scenario | Policy |
|---|---|
| Cancel within 24 hours of purchase | Full refund |
| Cancel after 24 hours | No refund, access continues until period ends |
| Downgrade mid-cycle | No prorated refund, access continues until period ends |
| Upgrade mid-cycle | Prorated charge for remainder of billing period |
| Failed payment | 3-day grace period, then downgrade to Starter |

### Implementation

```
User requests cancellation
        │
        ▼
Stripe Billing Portal (cancel at period end)
        │
        ▼
`customer.subscription.updated` webhook fires
        │
        ▼
Set `cancel_at_period_end = true` in DB
        │
        ▼
User retains access until period ends
        │
        ▼
`customer.subscription.deleted` webhook fires
        │
        ▼
Downgrade user to Starter plan
```

---

## 10. Key Decisions — Status

| Decision | Options | Status | Chosen |
|---|---|---|---|
| Business entity type | Sole Prop / LLP / Pvt Ltd | Decided | Start with Sole Prop, upgrade to LLP in 3 months |
| Primary gateway | Stripe only or Stripe + Razorpay | Decided | Stripe first, Razorpay in Phase 3 |
| Tax compliance approach | Self-managed or Merchant of Record | Decided | Self-managed initially, evaluate MoR at scale |
| Subscription pricing | Various price points | Decided | Explorer ₹299/mo, Custom ₹999/mo |
| Affiliate approach | Individual signups vs aggregator | Decided | Travelpayouts for quick start + direct for high-value partners |
| Creator payout method | Stripe Connect / Manual / Razorpay Route | Decided | Manual first, Stripe Connect at scale |
| Refund policy | Various | Decided | 24-hour full refund, cancel-at-period-end after |
| Free tier limits | 3 or 5 generations | Pending | Leaning toward 3 generations, 1 save |

---

## 11. Resources

### Payment Gateways
- [Stripe India Docs](https://stripe.com/in)
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe Billing Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Razorpay Docs](https://razorpay.com/docs/)
- [Razorpay Route (Payouts)](https://razorpay.com/docs/payments/route/)
- [Lemon Squeezy](https://lemonsqueezy.com)
- [Paddle](https://paddle.com)

### Affiliate Networks
- [Travelpayouts](https://www.travelpayouts.com) — 100+ travel brands, single dashboard
- [CJ Affiliate](https://www.cj.com) — GetYourGuide, Booking.com, Hostelworld
- [Awin](https://www.awin.com) — Booking.com, iVisa
- [Impact](https://impact.com) — Skyscanner, Airalo

### Affiliate Programs (Direct)
- [Booking.com Affiliate](https://www.booking.com/affiliate-program/v2/index.html)
- [Skyscanner Partners](https://www.partners.skyscanner.net)
- [GetYourGuide Partner](https://partner.getyourguide.com)
- [Viator Partner](https://partnerresources.viator.com)
- [Discover Cars Affiliate](https://www.discovercars.com/affiliate)
- [Airalo Partners](https://partners.airalo.com/solutions/affiliates)
- [SafetyWing](https://safetywing.com)
- [iVisa Affiliates](https://ivisatravel.com/affiliates)
- [Amazon Associates India](https://affiliate-program.amazon.in)
- [NordVPN Affiliate](https://nordvpn.com/affiliate/)
- [Wise Affiliate](https://wise.com/us/blog/become-a-wise-affiliate-partner)

### Compliance
- [FEMA Guidelines for Software Exports](https://rbi.org.in)
- [IEC Registration (DGFT)](https://dgft.gov.in)
- [GST Registration Portal](https://gst.gov.in)
- [TDS on Commission — Section 194H](https://www.incometax.gov.in)
