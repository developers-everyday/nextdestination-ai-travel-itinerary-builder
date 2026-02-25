# 📋 NextDestination.ai — Manual Tasks & Action Items

> **Created**: February 25, 2026  
> **Owner**: Rajat Singh  
> **Purpose**: Non-code tasks that require manual effort — business registration, marketing, outreach, content creation, and payment setup.

---

## 🔴 Priority 1 — Business Registration & Payments (Week 1–2)

These are **blockers** for revenue. Do these first.

### Business Entity
- [ ] Decide on entity type: **Sole Proprietorship** (fastest, 1–2 days) vs **LLP** (7–15 days, better liability protection)
- [ ] Register the business entity
- [ ] Open a **current bank account** under the business name
- [ ] Apply for **GST registration** (required for international payments, or if revenue > ₹20L/year)
- [ ] Apply for **PAN** for the business (if LLP/Pvt Ltd — sole prop uses personal PAN)

### Stripe Live Mode
- [ ] Complete **Stripe India KYC** at [dashboard.stripe.com](https://dashboard.stripe.com) with business documents
- [ ] Switch Stripe integration from **test mode → live mode**
- [ ] Test end-to-end payment flow: subscribe → webhook → plan upgrade
- [ ] Set up Stripe dashboard **alerts & monitoring**

### Legal Pages
- [ ] Add/update **Refund Policy** page
- [ ] Review **Terms of Service** and **Privacy Policy** for payment-related clauses

---

## 🟠 Priority 2 — Social Media & Content Channels (Week 2–4)

### Pinterest (High Priority — Travel is #1 category on Pinterest)
- [ ] Create a **Pinterest Business account** for NextDestination.ai
- [ ] Set up boards: "AI Travel Itineraries", "Best Destinations 2026", "{City} Travel Guides"
- [ ] Pin **5–10 itinerary infographic images** (use the generated 3:4 AI images)
- [ ] Add website link and verify domain on Pinterest
- [ ] Enable **Rich Pins** (Article / Product) for auto-pulling metadata from your pages
- [ ] Set a schedule: pin 3–5 itineraries per week

### Reddit (Community Engagement)
- [ ] Identify target subreddits: r/travel, r/solotravel, r/backpacking, r/digitalnomad, r/TravelHacks
- [ ] Create/post **3 itinerary write-ups** as genuine value posts (not promotional)
  - Example: "I built a 5-day Paris itinerary using AI — here's what it made" with link to `/share/:id`
- [ ] Engage in comments answering travel questions organically
- [ ] ⚠️ **Do NOT spam links** — Reddit will ban you. Provide value first.

### Instagram
- [ ] Create an **Instagram business account** for NextDestination.ai
- [ ] Post 5 itinerary infographic images (3:4 format — you already generate these)
- [ ] Write captions with destination keywords + CTA to the website
- [ ] Use hashtags: #AITravel #TravelPlanner #ItineraryIdeas #TravelTech

### Twitter/X
- [ ] Create a **Twitter/X account** for NextDestination.ai
- [ ] Post itinerary previews with Open Graph cards (link to `/share/:id` pages)
- [ ] Engage with travel creator accounts

---

## 🟡 Priority 3 — Influencer & Blogger Outreach (Week 4–8)

### Travel Blogger Outreach
- [ ] Research and list **20 mid-tier travel bloggers** (10K–100K followers)
- [ ] Prepare an **outreach email template**: offer free premium access in exchange for a review/blog post
- [ ] Send initial batch of **10 outreach emails**
- [ ] Follow up after 5 days if no response
- [ ] Track responses in a spreadsheet (Name, Platform, Status, Link)

### Travel Influencer Partnerships
- [ ] Identify **5–10 travel influencers** on Instagram/TikTok who do "trip planning" content
- [ ] DM or email with partnership proposal: free premium + featured creator profile
- [ ] Offer **co-created itineraries** (their expertise + your AI tool)
- [ ] Track engagement from each partnership

### Guest Posting
- [ ] Identify **5 travel blogs** that accept guest posts
- [ ] Pitch articles linking back to destination pages or the planner tool
- [ ] Write and submit **2 guest posts** in the first month

---

## 🟢 Priority 4 — Product Launch & PR (Month 2)

### Product Hunt Launch
- [ ] Prepare **Product Hunt listing**: tagline, description, screenshots, video demo
- [ ] Create a **launch day checklist**: social posts, email to early users, upvote strategy
- [ ] Schedule launch for a **Tuesday** (best PH engagement day)
- [ ] Announce on Twitter, Reddit, LinkedIn before launch

### Other Directories & Listings
- [ ] Submit to **AlternativeTo** (listed under Wanderlog, TripIt alternatives)
- [ ] Submit to **G2** or **Capterra** (if going B2B later)
- [ ] Submit to **"AI Tools" directories**: FutureTools, There's An AI For That, AI Valley
- [ ] Get listed in **"Best Travel Apps 2026"** listicles via outreach

---

## 🔵 Priority 5 — International Payments & Compliance (Month 2–3)

### Forex & International Payments
- [ ] Apply for **IEC (Import Export Code)** at [dgft.gov.in](https://dgft.gov.in)
- [ ] Enable **Stripe international payments** (multi-currency)
- [ ] Ensure **FEMA/RBI compliance** for receiving forex payments

### Additional Payment Gateways
- [ ] Evaluate adding **Razorpay** as a fallback for Indian users (UPI, netbanking)
- [ ] Evaluate adding **PayPal** as an alternative for international users
- [ ] Evaluate **Paddle / Lemon Squeezy** as Merchant of Record to handle global tax compliance

### Tax & Invoicing
- [ ] Implement **GST-compliant invoice generation** for Indian users
- [ ] Set up automated tax reporting
- [ ] Decide if **Merchant of Record** model is worth the higher fees vs self-managed compliance

---

## 🟣 Priority 6 — Ongoing Marketing Cadence

### Weekly Recurring Tasks
- [ ] Pin 3–5 itineraries on Pinterest
- [ ] Post 2–3 Instagram stories/posts
- [ ] Engage in 2–3 Reddit threads
- [ ] Share 1 itinerary on Twitter with OG preview

### Monthly Recurring Tasks
- [ ] Publish 2–4 blog articles targeting SEO keywords (see [SEO strategy](file:///Users/Rajat.Singh/Downloads/nextdestination.ai---travel-itinerary-builder/components/seo_strategy.md))
- [ ] Review **Google Search Console** — indexed pages, search queries, impressions
- [ ] Review **Stripe dashboard** — revenue, churn, failed payments
- [ ] Send **1 outreach batch** to new bloggers/influencers
- [ ] Review and refresh top-performing itinerary images

---

## Quick Reference Links

| Resource | URL |
|----------|-----|
| Stripe Dashboard | [dashboard.stripe.com](https://dashboard.stripe.com) |
| GST Registration | [gst.gov.in](https://gst.gov.in) |
| IEC Registration | [dgft.gov.in](https://dgft.gov.in) |
| Pinterest Business | [business.pinterest.com](https://business.pinterest.com) |
| Product Hunt | [producthunt.com](https://producthunt.com) |
| Google Search Console | [search.google.com/search-console](https://search.google.com/search-console) |
| SEO Strategy Doc | [seo_strategy.md](file:///Users/Rajat.Singh/Downloads/nextdestination.ai---travel-itinerary-builder/components/seo_strategy.md) |
| Payments Plan | [monetization_and_payments_plan.md](file:///Users/Rajat.Singh/Downloads/nextdestination.ai---travel-itinerary-builder/components/monetization_and_payments_plan.md) |
