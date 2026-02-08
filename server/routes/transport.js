import express from 'express';
import { generateTransportOptions, generateGeneralInfo, estimateFlightDuration } from '../services/gemini.js';

const router = express.Router();

// Generate Transport Options
router.post('/options', async (req, res) => {
    try {
        const { destination, dayActivities, userLocation } = req.body;

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        const options = await generateTransportOptions(destination, dayActivities, userLocation);
        res.json({ options });
    } catch (error) {
        console.error('Error generating transport options:', error);
        res.status(500).json({ error: 'Failed to generate transport options' });
    }
});

// Generate General Info (VISA, Safety, Scam)
router.post('/general-info', async (req, res) => {
    try {
        const { destination } = req.body;

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        const info = await generateGeneralInfo(destination);
        res.json({ info });
    } catch (error) {
        console.error('Error generating general info:', error);
        res.status(500).json({ error: 'Failed to generate general info' });
    }
});

// Get Flight Estimates (Morning, Afternoon, Evening slots)
router.post('/flight-estimates', async (req, res) => {
    try {
        const { from, to, date } = req.body;

        if (!from || !to) {
            return res.status(400).json({ error: 'Origin (from) and Destination (to) are required' });
        }

        // We can use AI or simple math to estimate duration
        const duration = await estimateFlightDuration(from, to);

        // Generate generic slots based on duration
        // For a full product, we might use a real API, but for planning we give slots
        const slots = [
            {
                id: 'morning-flight',
                airline: 'Morning Flight',
                flightNumber: 'EST-M',
                departure: '06:00',
                arrival: addDurationToTime('06:00', duration),
                duration: duration,
                price: 'Check Online',
                type: 'flight'
            },
            {
                id: 'afternoon-flight',
                airline: 'Afternoon Flight',
                flightNumber: 'EST-A',
                departure: '12:00',
                arrival: addDurationToTime('12:00', duration),
                duration: duration,
                price: 'Check Online',
                type: 'flight'
            },
            {
                id: 'evening-flight',
                airline: 'Evening Flight',
                flightNumber: 'EST-E',
                departure: '18:00',
                arrival: addDurationToTime('18:00', duration),
                duration: duration,
                price: 'Check Online',
                type: 'flight'
            }
        ];

        res.json({ results: slots });
    } catch (error) {
        console.error('Error getting flight estimates:', error);
        res.status(500).json({ error: 'Failed to get flight estimates' });
    }
});

// Helper to add duration (e.g., "2h 30m") to a time string ("06:00")
function addDurationToTime(startTime, durationStr) {
    try {
        const [hoursStr, minsStr] = startTime.split(':');
        let hours = parseInt(hoursStr);
        let mins = parseInt(minsStr);

        // Parse duration string like "2h 30m" or "5h"
        const durHoursMatch = durationStr.match(/(\d+)h/);
        const durMinsMatch = durationStr.match(/(\d+)m/);

        const durHours = durHoursMatch ? parseInt(durHoursMatch[1]) : 0;
        const durMins = durMinsMatch ? parseInt(durMinsMatch[1]) : 0;

        mins += durMins;
        hours += durHours + Math.floor(mins / 60);
        mins = mins % 60;
        hours = hours % 24;

        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    } catch (e) {
        return startTime; // Fallback
    }
}

export default router;
