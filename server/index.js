import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

import recommendationRoutes from './routes/recommendations.js';
import itineraryRoutes from './routes/itineraries.js';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/recommend', recommendationRoutes);
app.use('/api/itineraries', itineraryRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('NextDestination API is running');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
