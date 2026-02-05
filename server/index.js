import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env vars
dotenv.config(); // current dir
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

import recommendationRoutes from './routes/recommendations.js';
import itineraryRoutes from './routes/itineraries.js';
import suggestionRoutes from './routes/suggestions.js';
import activityRoutes from './routes/activities.js';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/recommend', recommendationRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/activities', activityRoutes);

import wishlistRoutes from './routes/wishlist.js';
app.use('/api/wishlist', wishlistRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('NextDestination API is running');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
