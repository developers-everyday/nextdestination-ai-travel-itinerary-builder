# Agentic Itinerary Builder Architecture

## Goal
Transition the current monolithic `generateQuickItinerary` service into an **Agentic System** where a central **Orchestrator Agent** (Gemini) dynamically utilizes specialized **Tools** (Agents) to build a grounded, real-time, and comprehensive travel itinerary.

## Current vs. New Architecture

### Current (Monolithic)
- **Input**: Destination, Days, Interests.
- **Process**: Single LLM call with a massive prompt.
- **Data Source**: LLM's internal pre-trained knowledge (potentially outdated).
- **Output**: JSON Itinerary.

### Proposed (Agentic / Tool-Use)
- **Input**: Destination, Days, Interests.
- **Process**:
    1.  **Orchestrator**: Analyzes request and determines missing information (Weather, availability, specific attraction details).
    2.  **Tool Execution**: Calls specialized tools:
        -   `WeatherTool`: Fetches forecast for the travel dates.
        -   `HotelTool`: Searches for available hotels matching "Luxury" criteria.
        -   `AttractionTool`: Gets live/verified info on attractions (opening times, location).
    3.  **Synthesis**: Orchestrator combines tool outputs into the final JSON itinerary.
- **Output**: JSON Itinerary (enriched with real-time data).

## Core Components

### 1. The Orchestrator (Main Agent)
- **Role**: Planner and Editor.
- **Model**: `gemini-2.0-flash-exp` (High reasoning capability).
- **Responsibility**:
    -   Receives user intent.
    -   Decides which tools to call (e.g., "I need weather for Paris next week").
    -   Integrates tool outputs.
    -   Enforces the final JSON schema.

### 2. The Toolbox (Specialized Agents/Functions)

We will define these as **Function Declarations** in the Gemini Configuration.

#### A. Weather Specialist
- **Function Name**: `get_destination_weather`
- **Purpose**: Get climate context to plan activities (indoor vs. outdoor).
- **Parameters**: `location`, `dates`.
- **Mock Implementation**: Return "Sunny, 25°C" or fetch from OpenWeatherMap (if API key available).

#### B. Hotel Specialist
- **Function Name**: `search_hotels`
- **Purpose**: Find actual hotels that match the user's "Luxury" or "Budget" preference.
- **Parameters**: `location`, `price_tier`, `amenities`.
- **Mock Implementation**: Return list of 3-4 hotels with ratings and coordinates.

#### C. Attraction Expert
- **Function Name**: `get_attractions_info`
- **Purpose**: Get detailed info about specific interests.
- **Parameters**: `location`, `category` (e.g., "Museums", "Food").

## Scalability & Framework Strategy

To ensure the system scales with demand (more tools, more complex agents), we evaluated three approaches:

### Option 1: Native "ReAct" Loop (Recommended for Now)
- **Concept**: Build a lightweight `AgentExecutor` class around the Gemini SDK.
- **How it works**:
    1.  Agent receives task.
    2.  Agent decides to call a tool (Function Call).
    3.  System executes tool code.
    4.  System feeds tool output back to Agent.
    5.  Loop continues until Agent says "I'm done".
- **Pros**: Zero extra dependencies, full control, easy to debug, perfect for < 10 tools.
- **Cons**: You write the "loop" logic yourself.

### Option 2: LangGraph.js / LangChain
- **Concept**: Use an industry-standard framework to define "Graphs" of agents.
- **Pros**: Handles complex state (memory), cyclic dependencies (Agent A -> Agent B -> Agent A), and robust streaming.
- **Cons**: Learning curve, heavier bundle size, abstraction overhead.
- **Recommendation**: Switch to this ONLY when you need multi-agent collaboration (e.g., "The Hotel Agent negotiates with the Booking Agent").

### Option 3: Server-Side Agents (Backend-for-Frontend)
- **Concept**: Move the Agent logic to a Node.js/Python backend.
- **Pros**: Secure (API keys hidden), longer timeouts, access to private DBs.
- **Cons**: Requires deploying a backend (Vercel Functions / AWS Lambda).

### Option 4: Google ADK / Genkit (Future Backend State)
- **Concept**: Use Google's official Agent Development Kit (Server-side).
- **Pros**: Native integration with Vertex AI, sophisticated evaluation tools, unified API for "production" agents.
- **Cons**: Requires a dedicated backend runtime (Cloud Run/Functions).
- **Recommendation**: The ultimate target when we migrate to a full backend architecture.

### Decision
**We will proceed with Option 1 (Native ReAct Loop)** for this phase. It fits the current Client-Side architecture perfectly and utilizes the robust `@google/genai` SDK we already have. We will structure the code using a **Registry Pattern** so migrating to a backend or LangGraph later is easy (just move the registry).

## Implementation Strategy

### Step 1: Define Tools in `geminiConfig.ts`
We will expand the configuration to include a `tools` section.

```typescript
// services/geminiConfig.ts
export const GEMINI_TOOLS = [
  {
    name: "get_weather",
    description: "Get the weather forecast for a destination on specific dates.",
    parameters: { ... }
  },
  // ... other tools
];
```

### Step 2: Update Service to Support Function Calling
Refactor `geminiService.ts` to:
1.  Pass `tools` to the `generateContent` call.
2.  Check if `response.functionCall` is present.
3.  If yes, execute the corresponding TypeScript function.
4.  Feed the result back to Gemini.
5.  Repeat until a final text/JSON response is generated.

### Step 3: Tool Implementation (Mock vs Real)
Initially, we will implement **Mock Tools** to validate the flow.
- `services/tools/weatherTool.ts`
- `services/tools/hotelTool.ts`
- `services/tools/attractionTool.ts`

## Benefits
- **Accuracy**: Itinerary is based on "retrieved" data (weather, real hotels) rather than hallucinations.
- **Flexibility**: Easily swap the "Hotel Tool" from a mock to a real Booking.com API later.
- **Debuggability**: We can see exactly what data the agent used to make decisions.
