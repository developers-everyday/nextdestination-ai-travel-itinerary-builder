# Admin Dashboard & Enrichment — Roadmap

## Current State (Completed)

- Admin dashboard at `/admin` with role-based access (`requireRole('admin')`)
- Destination management: list, add, enrich (single + bulk via SSE), delete
- Itinerary management: list, view, edit metadata, AI regeneration, embedding/image generation (single + bulk via SSE), privacy toggle, delete
- 50 seasonal destinations (March–June 2026) seeded with AI-generated `general_info` and `attractions`
- Health check endpoint (`GET /api/health`) with Supabase ping and structured status response
- Postbuild verification script that blocks deploys when critical pages are missing

---

## Roadmap

### 1. Destination Image Generation

**Problem**: Destinations only have text data (`general_info` + `attractions`). No visual cover images for destination pages or SEO.

**Approach**:
- Add a `POST /api/admin/destinations/:id/image` endpoint that generates a cover image via the existing image generation service
- Add a `POST /api/admin/destinations/bulk-images` SSE endpoint for batch image generation
- Store images in Supabase storage (`destination-images` bucket) and save the URL in a new `image_url` column on the `destinations` table
- Update the `DestinationsTable` component to show image status and add "Generate Image" action
- Update destination pages to use the generated cover image with `next/image`

**Database change**: `ALTER TABLE destinations ADD COLUMN image_url TEXT;`

---

### 2. Itinerary Enrichment at Scale

**Problem**: Bulk operations work but lack resilience for large-scale runs (100+ itineraries).

**Improvements needed**:

#### 2a. Exponential Backoff
- Replace hardcoded 2-second delays with exponential backoff on Gemini API failures
- Start at 2s, double on each consecutive failure, cap at 60s, reset on success
- Apply to both embedding and image generation bulk flows

#### 2b. Concurrency Guard
- Prevent running duplicate bulk operations simultaneously (e.g., two "Generate Missing Embeddings" triggered at once)
- Add a simple in-memory lock per operation type (`bulkEmbeddings`, `bulkImages`, `bulkEnrich`)
- Return `409 Conflict` if a bulk job is already running
- Clear lock on completion or error

#### 2c. Request Validation
- Validate `names` array in `enrich-bulk` (max length, string type, trim whitespace)
- Validate itinerary IDs exist before starting bulk operations
- Return structured validation errors

---

### 3. Admin Analytics & Audit Logging

**Problem**: No visibility into who made changes, when, or how the enrichment pipeline is performing.

#### 3a. Audit Log
- Create an `admin_audit_log` table: `id, admin_user_id, action, target_type, target_id, details (JSONB), created_at`
- Log all admin mutations: enrich, delete, edit, toggle privacy, regenerate, etc.
- Add a `/admin/audit-log` page showing recent activity with filters by action type and admin user

#### 3b. Enrichment Analytics
- Track enrichment success/failure rates over time
- Dashboard widgets: enrichment coverage (% destinations with full data), embedding coverage, image coverage
- Optional: track Gemini API latency trends to detect degradation early

---

### 4. Data Quality Checks

**Problem**: After bulk enrichment, there's no way to verify the quality of AI-generated content.

**Checks to add**:
- **Completeness**: Flag destinations where `general_info` or `attractions` is empty/null despite enrichment
- **Freshness**: Highlight destinations not updated in 90+ days (stale data)
- **Content length**: Flag suspiciously short descriptions (likely failed/truncated generations)
- **Duplicate detection**: Find destinations with similar names that may be duplicates (e.g., "Bali" vs "Bali, Indonesia")
- Add a "Data Health" section to the admin dashboard showing these metrics

---

### 5. Destination Metadata Expansion

**Problem**: Destinations only store `general_info` and `attractions`. Richer metadata improves SEO and user experience.

**Additional fields to consider**:
- `weather_data`: Average temperatures and rainfall by month
- `best_months`: Array of recommended travel months
- `budget_level`: Budget/mid-range/luxury classification
- `travel_tags`: Beach, mountains, cultural, adventure, pilgrimage, etc.
- `nearby_destinations`: Related destinations for cross-linking

**Implementation**: Add columns to `destinations` table, extend the enrichment prompts in Gemini service, update destination pages to render new data.

---

## Priority Order

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P1 | Concurrency guard for bulk ops | Small | Prevents data corruption |
| P1 | Request validation | Small | Prevents bad data entry |
| P2 | Exponential backoff | Small | Reliability at scale |
| P2 | Destination image generation | Medium | SEO + visual appeal |
| P2 | Data quality checks | Medium | Content reliability |
| P3 | Audit logging | Medium | Operational visibility |
| P3 | Destination metadata expansion | Large | SEO + UX enrichment |
| P3 | Enrichment analytics dashboard | Medium | Monitoring |
