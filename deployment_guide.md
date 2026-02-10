# Deployment Guide for NextDestination.ai

This guide outlines the steps to deploy the NextDestination.ai travel itinerary builder. The application consists of a **Vite/React Frontend**, a **Node.js/Express Backend**, and utilizes **Supabase** for authentication and **Neo4j** for the graph database.

## Prerequisites

Ensure you have the following environment variables ready for production:

### Frontend Variables
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL of your deployed backend (e.g., `https://your-api.onrender.com`) |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API Key |
| `VITE_GEMINI_API_KEY` | Gemini API Key |

### Backend Variables
| Variable | Description |
|----------|-------------|
| `PORT` | Port number (usually auto-set by host, defaulting to 3001) |
| `GEMINI_API_KEY` | Gemini API Key for server-side operations |
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_KEY` | Your Supabase Service Role Key (for backend verification) |

---

## 1. Database Setup (Supabase)

You are already using Supabase. Ensure your Supabase project is ready for production.

## 2. Backend Deployment (Render / Railway)

We recommend **Render** or **Railway** for easy Node.js hosting.

### Using Render:
1.  Connect your GitHub repository to Render.
2.  Create a new **Web Service**.
3.  **Root Directory**: `server` (Important: The backend code is in the `server` folder).
4.  **Build Command**: `npm install`
5.  **Start Command**: `node index.js`
6.  **Environment Variables**: Add all variables listed in the "Backend Variables" section above.
7.  Deploy. Render will provide you with a URL (e.g., `https://your-api.onrender.com`).

## 3. Frontend Deployment (Vercel)

We recommend **Vercel** for the frontend.

1.  Connect your GitHub repository to Vercel.
2.  Import the project.
3.  **Framework Preset**: Vite.
4.  **Root Directory**: `./` (Root).
5.  **Environment Variables**: Add all variables listed in the "Frontend Variables" section above.
    *   **Crucial**: Set `VITE_API_URL` to the URL provided by Render in the previous step (e.g., `https://your-api.onrender.com`).
6.  Deploy.

## 4. Verification

1.  Open your Vercel deployment URL.
2.  Try to log in (Supabase auth should work if allow-lists are configured or set to allow all).
3.  Try to generate an itinerary. This verifies:
    *   Frontend -> Backend connection (VITE_API_URL).
    *   Backend -> Gemini API connection.
    *   Backend -> Supabase connection.

## Troubleshooting

*   **CORS Issues**: If the frontend cannot talk to the backend, check `server/index.js`. Ensure `cors()` is enabled and potentially configured to allow your Vercel domain.
    ```javascript
    app.use(cors({
        origin: process.env.FRONTEND_URL || '*' // Update this in production for security
    }));
    ```
*   **Database Connection**: Check the backend logs on Render to see if Supabase connected successfully.
