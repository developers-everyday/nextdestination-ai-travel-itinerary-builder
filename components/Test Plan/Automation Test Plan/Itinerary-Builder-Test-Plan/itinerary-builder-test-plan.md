# Itinerary Builder — Test Plan

> **Feature Owner:** Core Builder  
> **Source Files:** `packages/web-next/app/builder/`, `packages/web-next/components/ItineraryDisplay.tsx` (58KB), `packages/web-next/components/ActivitySearchPanel.tsx`, `packages/web-next/components/HotelDetailsPanel.tsx`, `packages/web-next/components/MapComponent.tsx`, `packages/web-next/components/TransportInfoPanel.tsx`, `packages/web-next/components/VoiceAgent.tsx`, `packages/shared/src/services/itineraryService.ts`, `packages/shared/src/services/hydrationService.ts`, `packages/shared/src/store/`

---

## 1. Feature Summary

The Itinerary Builder is the **core feature** of the application — a Trello-like drag-and-drop interface where users view, edit, and customise their generated itineraries. It includes day-by-day activity views, drag-and-drop reordering (via DnD-kit), activity/hotel search panels, Google Maps integration, transport info, a voice agent, and save/share/privacy controls. `ItineraryDisplay.tsx` at 58KB is the largest and most complex component.

---

## 2. Unit Tests

### 2.1 Zustand Store (Itinerary State)

| # | Test Case | Expected |
|---|---|---|
| U-BUILD-01 | Initialize store with itinerary data | All days and activities present in state |
| U-BUILD-02 | Add activity to a day | Activity appended to correct day's list |
| U-BUILD-03 | Remove activity from a day | Activity removed, others remain |
| U-BUILD-04 | Reorder activities within same day | Activity order updated correctly |
| U-BUILD-05 | Move activity between days | Source day loses activity, target day gains it |
| U-BUILD-06 | Update activity details | Activity's name/description/time updated |
| U-BUILD-07 | Toggle day expand/collapse | Day visibility toggled |
| U-BUILD-08 | Set active day | Active day index updates |
| U-BUILD-09 | Set privacy toggle | `isPublic` flag flips |

### 2.2 Hydration Service

| # | Test Case | Expected |
|---|---|---|
| U-BUILD-10 | Hydrate itinerary from raw API response | All fields mapped correctly, defaults applied |
| U-BUILD-11 | Handle missing optional fields | Defaults used, no crash |
| U-BUILD-12 | Handle empty days array | Empty itinerary state created |

### 2.3 Itinerary Service

| # | Test Case | Expected |
|---|---|---|
| U-BUILD-13 | Save itinerary API call format | Correct URL, method, body, auth header |
| U-BUILD-14 | Update existing itinerary | PUT with itinerary ID |
| U-BUILD-15 | Remix creates new copy | POST without original ID |

### 2.4 Component Rendering

| # | Test Case | Component | Expected |
|---|---|---|---|
| U-BUILD-16 | Activity card renders all fields | `ItineraryDisplay` (activity section) | Name, time, duration, description shown |
| U-BUILD-17 | Day header shows date and count | Day header | Date label + "N activities" |
| U-BUILD-18 | Empty day shows add prompt | Empty day | "Add activities" CTA shown |

---

## 3. Integration Tests

### 3.1 Drag & Drop

| # | Test Case | Expected |
|---|---|---|
| I-BUILD-01 | Drag activity within same day | Activity reordered in state + UI |
| I-BUILD-02 | Drag activity to different day | Activity moved between days |
| I-BUILD-03 | Drop on invalid target | Activity returns to original position |

### 3.2 Search Panels

| # | Test Case | Expected |
|---|---|---|
| I-BUILD-04 | Activity search returns results | Mock API → results rendered in panel |
| I-BUILD-05 | Activity search debounce | Typing fast → only last request sent |
| I-BUILD-06 | Add activity from search | Click add → activity appears in current day |
| I-BUILD-07 | Hotel search returns results | Mock API → hotel cards rendered |
| I-BUILD-08 | Hotel search handles no results | Empty state message shown |

### 3.3 Map Integration

| # | Test Case | Expected |
|---|---|---|
| I-BUILD-09 | Map shows markers for all activities | Each activity with coords → marker on map |
| I-BUILD-10 | Clicking activity highlights marker | Selected activity → map pans and highlights |
| I-BUILD-11 | Map zoom to fit all markers | On load → map bounds fit all markers |

### 3.4 Save Flow

| # | Test Case | Expected |
|---|---|---|
| I-BUILD-12 | Save new itinerary (authenticated) | POST `/api/itineraries` → 201 + ID |
| I-BUILD-13 | Update owned itinerary | PUT `/api/itineraries/:id` → 200 |
| I-BUILD-14 | Remix community itinerary | POST creates new copy, original unchanged |
| I-BUILD-15 | Save without login (anonymous) | Prompt to login or save locally |

---

## 4. E2E Tests

| # | Test Case | Steps | Expected |
|---|---|---|---|
| E-BUILD-01 | View generated itinerary | Generate itinerary → builder opens | All days, activities, map visible |
| E-BUILD-02 | Drag-and-drop reorder | Drag activity #2 above activity #1 | Order updated, persists after save |
| E-BUILD-03 | Search and add activity | Open search → type "museum" → add result | Activity added to current day |
| E-BUILD-04 | Search hotel | Open hotel panel → search "Hilton" | Hotel results displayed |
| E-BUILD-05 | Remove activity | Click delete on an activity | Activity removed from day |
| E-BUILD-06 | Save itinerary | Click save (logged in) | Success toast, itinerary in profile |
| E-BUILD-07 | Share itinerary | Click share → copy link | Link copied, shared page works |
| E-BUILD-08 | Privacy toggle | Toggle private → save → check community | Itinerary not visible in community |
| E-BUILD-09 | View transport info | Click transport tab | Transport options displayed |
| E-BUILD-10 | Voice agent interaction | Enable voice → say command | Agent responds and executes action |
| E-BUILD-11 | Responsive builder layout | Test at 375px, 768px, 1440px | Layout adapts correctly |

---

## 5. Mocking Strategy

| Dependency | Mock Approach |
|---|---|
| `@dnd-kit` | Use `@dnd-kit` test utilities or simulate pointer events |
| Google Maps | Mock `@vis.gl/react-google-maps` with stub component |
| Itinerary API | MSW handlers for save/load endpoints |
| Activity search API | MSW handler for `/api/activities` |
| ElevenLabs voice | Mock entirely (skip real voice in automated tests) |

---

## 6. Files to Create

```
tests/
├── unit/
│   ├── store/
│   │   └── itineraryStore.test.ts
│   ├── services/
│   │   ├── hydrationService.test.ts
│   │   └── itineraryService.test.ts
│   └── components/
│       └── ItineraryDisplay.test.tsx
├── integration/
│   ├── builder-dnd.test.tsx
│   ├── activity-search.test.tsx
│   └── save-flow.test.ts
└── e2e/
    └── builder-flow.spec.ts
```
