<div align="center">
<img width="1200" height="475" alt="NextDestination Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NextDestination.ai - AI-Powered Travel Itinerary Builder 🌍✈️

**NextDestination.ai** is a cutting-edge travel planning application that leverages the power of Artificial Intelligence to create personalized, detailed, and optimized travel itineraries. Whether you're planning a weekend getaway or a month-long adventure, our intelligent system serves as your personal travel agent, handling everything from destination discovery to daily activity scheduling.

## 🚀 Key Features

*   **AI-Generated Itineraries**:  Powered by **Google Gemini**, generate complete, day-by-day itineraries tailored to your interests (Adventure, Food, Culture, etc.) in seconds.
*   **Interactive Planning Board**: A Trello-like drag-and-drop interface (using `@dnd-kit`) allows you to easily reorder days, move activities, and customize your schedule.
*   **Smart Mapping**: Integrated **Google Maps** visualization puts your entire trip on an interactive map, helping you understand distances and logistics.
*   **Voice Assistant**: A built-in **Voice Agent** (powered by **ElevenLabs**) that you can converse with to refine your plans, ask about destinations, or get real-time suggestions.
*   **Real-Time Collaboration**: Share your itinerary with friends and family for collaborative planning.
*   **Community & Social**: Discover trending trips from other travelers, "remix" existing itineraries, and share your own adventures.
*   **Intelligent Suggestions**: Get context-aware recommendations for hotels, flights, and activities based on your current itinerary location and schedule.
*   **Comprehensive Logistics**:  Automatic flight duration estimates, transport options (Train, Bus, Rental), and destination insights (Weather, Scams, Currency).

## 🛠 Tech Stack

### Frontend
*   **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/) for lightning-fast development and build performance.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) for robust, type-safe code.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a modern, responsive, and beautiful UI.
*   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) for simple and scalable state management.
*   **Routing**: [React Router v7](https://reactrouter.com/) for seamless navigation.
*   **Drag & Drop**: [@dnd-kit](https://dndkit.com/) for the itinerary builder interface.
*   **Maps**: [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/) for Google Maps integration.

### Backend & Services
*   **Server**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) API server.
*   **Database**:
    *   **Neo4j**: Graph database for handling complex relationships between locations, activities, and routes.
    *   **Supabase (PostgreSQL)**: Relational data, user authentication, and profile management.
*   **AI Models**:
    *   **Google Gemini (via @google/genai)**: Drives the core recommendation engine, itinerary generation, and search capabilities.
    *   **ElevenLabs**: Powers the conversational voice agent.
*   **Containerization**: [Docker](https://www.docker.com/) for easily running the local Neo4j instance.

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

1.  **Node.js** (v18+ recommended)
2.  **Docker Desktop** (required for the local Neo4j database)
3.  **Git**

## ⚙️ Environment Setup

You will need API keys for the external services.

1.  **Frontend (`.env.local`)**:
    Create a `.env.local` file in the root directory:
    ```env
    VITE_API_URL=http://localhost:3001
    VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
    GEMINI_API_KEY=your_google_gemini_key
    ```

2.  **Backend (`server/.env`)**:
    Create a `.env` file in the `server` directory:
    ```env
    PORT=3001
    NEO4J_URI=bolt://localhost:7687
    NEO4J_USER=neo4j
    NEO4J_PASSWORD=password
    SUPABASE_URL=auto-generated-from-supabase
    SUPABASE_ANON_KEY=auto-generated-from-supabase
    GEMINI_API_KEY=your_google_gemini_key
    ```
    *Note: The Neo4j credentials here should match what is defined in your `docker-compose.yml`.*

## 🏃‍♂️ Running Locally

1.  **Install Dependencies**:
    Install packages for both the frontend and backend.
    ```bash
    # Install root/frontend dependencies
    npm install

    # Install backend dependencies
    cd server && npm install && cd ..
    ```

2.  **Start the Database**:
    Spin up the Neo4j database using Docker.
    ```bash
    docker-compose up -d
    ```

3.  **Run the Application**:
    Start both the frontend and backend servers concurrently with a single command:
    ```bash
    npm run dev:all
    ```
    *   Frontend will launch at: `http://localhost:5173`
    *   Backend API will run at: `http://localhost:3001`

## 🐳 Docker

The project uses Docker Compose predominantly for managing the Neo4j database.
*   **`docker-compose.yml`**: Configures the Neo4j service, exposing ports `7474` (HTTP) and `7687` (Bolt). Data is persisted in the `./neo4j` directory.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the ISC License.
