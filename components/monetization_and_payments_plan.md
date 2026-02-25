# NextDestination.ai — Monetization & Global Payments Plan

> **Date**: February 25, 2026  
> **Status**: Planning  
> **Priority**: High

---

## 1. Objective

Enable NextDestination.ai to charge users and partners globally for travel itinerary services, starting from an Indian business entity.

---

## 2. Payment Gateway Options

### 2.1 Stripe (Recommended — Primary Gateway)

Stripe is available in India and supports both domestic and international payments.

| Feature | Details |
|---------|---------|
| Domestic payments (INR) | ✅ Supported |
| International payments (USD, EUR, etc.) | ✅ Supported (requires additional KYC) |
| Payouts | To Indian bank accounts in INR |
| Supported business types | Sole Prop, Partnership, LLP, Pvt Ltd |
| Currencies | 135+ |
| Fees (domestic) | ~2% + GST |
| Fees (international) | ~3% + currency conversion |

> [!IMPORTANT]
> Stripe integration is already built into the codebase (checkout sessions, webhooks, plan upgrades). Transitioning to live mode requires completing KYC on [dashboard.stripe.com](https://dashboard.stripe.com).

### 2.2 Razorpay (Secondary / Fallback for Indian Users)

| Feature | Details |
|---------|---------|
| Best for | Indian domestic payments |
| International support | 100+ currencies via Razorpay International |
| KYC | Easier for Indian businesses |
| Dashboard | INR-native, familiar UX |
| Fees (domestic) | ~2% |
| Fees (international) | ~3% + conversion |

### 2.3 PayPal (Alternative for International Users)

| Feature | Details |
|---------|---------|
| Best for | Users who prefer PayPal checkout |
| Global trust | Very high |
| Fees | ~4.4% + fixed fee (international) |
| Use case | Offer alongside Stripe as an alternative option |

### 2.4 Paddle / Lemon Squeezy (Merchant of Record — Simplest Global Compliance)

| Feature | Details |
|---------|---------|
| Best for | Avoiding global tax compliance headaches |
| How it works | They act as the seller; you are the vendor |
| Tax handling | They collect & remit VAT, GST, sales tax globally |
| Payout | They pay you after deducting fees + taxes |
| Trade-off | Higher fees, less control over billing |

> [!TIP]
> Consider Paddle/Lemon Squeezy if handling VAT/GST compliance across 100+ countries feels overwhelming. They simplify everything at the cost of slightly higher fees.

---

## 3. Company Registration Requirements

### 3.1 Minimum Viable Registration

| Step | Details | Timeline |
|------|---------|----------|
| **Sole Proprietorship** | Easiest to start, just PAN + current account | 1–2 days |
| **LLP Registration** | Better if co-founders exist; limited liability | 7–15 days |
| **Pvt Ltd** | Best for raising investment later | 15–30 days |

> [!NOTE]
> Start with **Sole Prop or LLP** to begin accepting payments quickly. Upgrade to Pvt Ltd when seeking investment.

### 3.2 Compliance Checklist

| Requirement | Domestic Payments | International Payments |
|---|:---:|:---:|
| PAN Card | ✅ | ✅ |
| Business Registration (Sole Prop / LLP / Pvt Ltd) | ✅ | ✅ (LLP or Pvt Ltd recommended) |
| GST Registration | Required if revenue > ₹20L/year | ✅ Required |
| Current Bank Account | ✅ Recommended | ✅ Required |
| FEMA / RBI Compliance | ❌ | ✅ Required for forex |
| IEC (Import Export Code) | ❌ | ✅ Required for receiving forex |

---

## 4. Recommended Phased Rollout

### Phase 1 — Foundation (Week 1–2)
- [ ] Register business entity (Sole Prop or LLP)
- [ ] Open a current bank account
- [ ] Apply for GST registration
- [ ] Complete Stripe India KYC with business documents
- [ ] Switch existing Stripe integration from test mode to live mode

### Phase 2 — Go Live with Payments (Week 3–4)
- [ ] Enable live Stripe Checkout for subscription plans
- [ ] Test end-to-end payment flow (subscribe → webhook → plan upgrade)
- [ ] Set up Stripe dashboard alerts & monitoring
- [ ] Add payment terms, refund policy, and privacy policy pages

### Phase 3 — International Expansion (Month 2)
- [ ] Apply for IEC (Import Export Code) for receiving foreign currency
- [ ] Enable Stripe international payments (multi-currency)
- [ ] Evaluate adding Razorpay as a fallback for Indian users
- [ ] Evaluate adding PayPal as an alternative for international users

### Phase 4 — Tax Compliance & Scale (Month 3+)
- [ ] Implement invoice generation (GST-compliant for Indian users)
- [ ] Evaluate Merchant of Record (Paddle/Lemon Squeezy) if tax burden grows
- [ ] Set up automated tax reporting
- [ ] Upgrade to Pvt Ltd if seeking investment

---

## 5. Pricing Model (Current)

| Plan | Price | Features |
|------|-------|----------|
| **Free** | ₹0 | Basic itinerary generation, limited saves |
| **Pro** | TBD | Unlimited itineraries, AI enhancements, premium templates |
| **Business / Partner** | TBD | API access, white-label, partner dashboard |

> [!NOTE]
> Pricing tiers and exact amounts to be finalized based on market research and user feedback.

---

## 6. Key Decisions to Make

1. **Business entity type** — Sole Prop vs LLP vs Pvt Ltd?
2. **Primary gateway** — Stripe only, or Stripe + Razorpay from day one?
3. **Tax compliance approach** — Self-managed or Merchant of Record (Paddle/Lemon Squeezy)?
4. **Pricing** — Finalize Pro and Business plan pricing
5. **Refund policy** — Define terms before going live

---

## 7. Resources

- [Stripe India Docs](https://stripe.com/in)
- [Razorpay Docs](https://razorpay.com/docs/)
- [FEMA Guidelines for Software Exports](https://rbi.org.in)
- [IEC Registration (DGFT)](https://dgft.gov.in)
- [GST Registration Portal](https://gst.gov.in)
- [Lemon Squeezy](https://lemonsqueezy.com)
- [Paddle](https://paddle.com)
