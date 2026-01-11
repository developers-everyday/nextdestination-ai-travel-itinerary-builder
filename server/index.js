import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

import recommendationRoutes from './routes/recommendations.js';

app.use(cors());
app.use(express.json());

app.use('/api/recommend', recommendationRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('NextDestination API is running');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
