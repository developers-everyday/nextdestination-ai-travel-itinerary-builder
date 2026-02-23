# Backend Services — Test Plan

> **Feature Owner:** Backend Service Layer  
> **Source Files:** `server/services/gemini.js` (25KB), `server/services/googleMaps.js`, `server/services/imageGenerationService.js`, `server/services/templateService.js`, `server/services/vectorService.js`

---

## 1. Feature Summary

The backend services layer encapsulates all external API integrations and business logic. The **Gemini service** (25KB, largest file) handles AI prompt construction, response parsing, and retry logic. Other services handle Google Maps geocoding/place details, AI image generation with duplicate prevention, itinerary template rendering, and vector search for semantic queries.

---

## 2. Unit Tests

### 2.1 `gemini.js` — AI Service (25KB)

| # | Test Case | Expected |
|---|---|---|
| U-SVC-01 | Itinerary generation prompt includes all params | Destination, days, interests, traveller type in prompt |
| U-SVC-02 | Prompt sanitises user input | Special characters escaped, injection prevented |
| U-SVC-03 | Response JSON extraction from markdown fence | `\`\`\`json ... \`\`\`` wrapper stripped, JSON parsed |
| U-SVC-04 | Response with no JSON fence | Raw text parsed as JSON |
| U-SVC-05 | Malformed JSON response | Returns error, no crash |
| U-SVC-06 | Response schema validation | Missing required fields → error |
| U-SVC-07 | Retry on transient error (429, 503) | Retries up to max, then fails |
| U-SVC-08 | No retry on non-transient error (400) | Fails immediately |
| U-SVC-09 | General info prompt construction | Includes destination, covers weather/currency/tips |
| U-SVC-10 | Attraction generation prompt | Includes destination, interests |
| U-SVC-11 | Activity search prompt | Includes destination, day, preferences |

### 2.2 `googleMaps.js`

| # | Test Case | Expected |
|---|---|---|
| U-SVC-12 | Geocode address → coordinates | Returns `{ lat, lng }` |
| U-SVC-13 | Geocode unknown address | Returns null or error |
| U-SVC-14 | Place details by place ID | Returns name, rating, photos, address |
| U-SVC-15 | API key included in requests | API key param present in URL |

### 2.3 `imageGenerationService.js`

| # | Test Case | Expected |
|---|---|---|
| U-SVC-16 | Image generation prompt construction | Includes itinerary title, destination, style keywords |
| U-SVC-17 | Duplicate detection (same content → skip) | If content hash matches, no new generation |
| U-SVC-18 | Upload to Supabase Storage | File uploaded, public URL returned |
| U-SVC-19 | Generation failure handling | Error logged, returns null (not crash) |
| U-SVC-20 | 3:4 aspect ratio configured | Request params include correct aspect ratio |

### 2.4 `templateService.js`

| # | Test Case | Expected |
|---|---|---|
| U-SVC-21 | Template renders with complete data | All fields populated in output |
| U-SVC-22 | Template handles missing optional fields | Defaults used, no template error |
| U-SVC-23 | Data transformation for template | Dates formatted, durations calculated |
| U-SVC-24 | Template output matches expected format | HTML/text structure matches schema |

### 2.5 `vectorService.js`

| # | Test Case | Expected |
|---|---|---|
| U-SVC-25 | Vector search query construction | Query embedding generated, similarity search executed |
| U-SVC-26 | Empty result set handling | Returns empty array, no crash |
| U-SVC-27 | Result ranking by similarity score | Results ordered by descending similarity |

---

## 3. Integration Tests

| # | Test Case | Expected |
|---|---|---|
| I-SVC-01 | Gemini service → route integration | Route calls Gemini → response flows to client |
| I-SVC-02 | Image generation → Supabase Storage | Image generated → uploaded → URL in DB |
| I-SVC-03 | Google Maps → activity enrichment | Geocoded coords added to activity data |
| I-SVC-04 | Vector search → recommendation route | Search results returned via `/api/recommend` |

---

## 4. Mocking Strategy

| Dependency | Mock Approach |
|---|---|
| `@google/genai` (Gemini) | Mock `generateContent` method, return fixture responses |
| Google Maps Platform API | MSW handler or mock HTTP client |
| Supabase Storage | Mock `storage.from().upload()` |
| Vector DB (Supabase pgvector) | Mock RPC call or use test DB |

---

## 5. Files to Create

```
tests/
└── unit/
    └── services/
        ├── gemini.test.js
        ├── googleMaps.test.js
        ├── imageGenerationService.test.js
        ├── templateService.test.js
        └── vectorService.test.js
```
