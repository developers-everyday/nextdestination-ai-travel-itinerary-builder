# Backend & Recommendation Engine Architecture

## 1. Overview
To evolve the **NextDestination** app from a client-side tool to a competitive platform, we are introducing a **Hybrid Architecture**.
- **Frontend**: Remains a fast, local-first Vite/React app for itinerary building.
- **Backend (New)**: A Node.js/Express server to handle heavy lifting: data persistence, graph algorithms, and global recommendations.
- **Auth (New)**: Supabase for secure user authentication (Sign Up, Sign In, OAuth).
- **Database (New)**: Neo4j (Graph Database) to model the complex relationships between Travelers, Places, and Interests.

## 2. Why Graph Database (Neo4j)?
Traditional SQL databases struggle with "friends of friends" or "places similar to places you like" queries. Neo4j allows us to naturally model travel data:
- **Nodes**: `User`, `City`, `Attraction`, `Interest` (e.g., "Hiking", "Vegan Food").
- **Relationships**: `(:User)-[:VISITED]->(:City)`, `(:Attraction)-[:HAS_TAG]->(:Interest)`.

This enables high-performance queries like: * "Find hidden gems in Paris that are loved by people who also like Hiking and hate Crowds."*

## 3. System Components

### A. The Application Server (Node.js + Express)
Located in `/server`.
- **API Gateway**: Exposes REST endpoints (e.g., `/api/recommend`).
- **Neo4j Driver**: Manages connection pool to the graph database.
- **Logic Layer**: Translates simple frontend requests (e.g., "I like Art") into complex Cypher queries.

### B. The Database (Neo4j)
- **Development**: Docker Container (`docker run neo4j`).
- **Production**: Neo4j Aura (Managed Cloud) or minimal VPS.

### C. Authentication (Supabase)
- **Role**: Handles User Sign Up, Login, and Session Management.
- **Integration**:
    1.  Frontend authenticates with Supabase -> gets JWT.
    2.  Frontend sends JWT to Backend API.
    3.  Backend verifies JWT -> gets `user_id`.
    4.  Backend queries Neo4j using `user_id`.

### D. The Frontend (Client)
- **Service Layer**: A new `RecommendationService` will talk to the Backend API.
- **UI**: Components will fetch data asynchronously (React Query/useEffect) and display it.

## 4. Data Model (Schema)

The strength of this system relies on the Graph Schema.

### Nodes (Entities)
1.  **`User`** (Synced with Supabase)
    *   `id`: string (The Supabase UUID)
    *   `email`: string
    *   `name`: string
2.  **`Destination`** (e.g., "Paris", "Kyoto")
    *   `name`: string
    *   `coordinates`: point
    *   `popularity`: float
2.  **`Place`** (Specific POI, e.g., "Louvre Museum")
    *   `name`: string
    *   `type`: "Museum" | "Park" | "Restaurant"
    *   `rating`: float
3.  **`Interest`** (Tags/Categories)
    *   `name`: "Art", "History", "Nightlife"
4.  **`Itinerary`** (User created)
    *   `id`: UUID
    *   `title`: string

### Relationships (Edges)
- `(:Place)-[:LOCATED_IN]->(:Destination)`
- `(:Place)-[:HAS_TAG]->(:Interest)`
- `(:Place)-[:NEAR]->(:Place)` (Spatial proximity)
- `(:User)-[:LIKES]->(:Interest)`
- `(:Itinerary)-[:INCLUDES]->(:Place)`

## 5. Recommendation Strategy (Algorithms)

We will start with **Content-Based Filtering** and move to **Collaborative Filtering**.

### Phase 1: "More Like This" (Content-Based)
*User Input*: "I am going to Tokyo and I like Anime and Temples."
*Query Logic*:
1.  Find all `Place` nodes in `Destination` "Tokyo".
2.  Filter `Place` nodes that have `[:HAS_TAG]` "Anime" OR "Temple".
3.  Rank by `rating` + `popularity`.

### Phase 2: "Traveler Twins" (Collaborative)
*Once we have user data*:
*Query Logic*:
1.  Find other `Users` who have similar `[:LIKES]` to the current user.
2.  See what `Places` those similar users rated highly.
3.  Recommend those places.

## 6. Deployment Strategy

### Development (Local)
Use **Docker Compose** to spin up the stack:
```yaml
services:
  app:
    build: ./server
    ports: ["3000:3000"]
  db:
    image: neo4j:latest
    ports: ["7474:7474", "7687:7687"]
    environment:
      - NEO4J_AUTH=neo4j/password
```

### Production
- **Frontend**: Vercel (Static/SPA).
- **Backend**: Render / Railway / AWS App Runner (Node.js container).
- **Database**: Neo4j Aura Free Tier (Managed).

## 7. Migration Steps
1.  [x] Define Architecture.
2.  [ ] Setup Docker & Node.js scaffolding.
3.  [ ] Seed DB with initial dataset (OpenStreetMap or Google Places API).
4.  [ ] Build `/recommend` API.
5.  [ ] Connect Frontend UI.
