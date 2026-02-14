import express from 'express';
import { generateTransportOptions, generateGeneralInfo, estimateFlightDuration, generateAttractions } from '../services/gemini.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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

// Generate General Info (VISA, Safety, Scam) - Now with Caching
router.post('/general-info', async (req, res) => {
    try {
        const { destination } = req.body;

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        console.log(`[GeneralInfo] Checking cache for: ${destination}`);

        // 1. Check DB for existing info
        const { data: cachedData, error: dbError } = await supabase
            .from('destinations')
            .select('general_info')
            .ilike('name', destination)
            .single();

        if (cachedData && cachedData.general_info) {
            console.log(`[GeneralInfo] Cache HIT for: ${destination}`);
            return res.json({ info: cachedData.general_info });
        }

        if (dbError && dbError.code !== 'PGRST116') {
            console.error('[GeneralInfo] DB error (proceeding with AI):', dbError);
        }

        console.log(`[GeneralInfo] Cache MISS, calling AI for: ${destination}`);

        // 2. Not found, call AI
        const info = await generateGeneralInfo(destination);

        // 3. Save to DB asynchronously (don't block response)
        if (info && Object.keys(info).length > 0) {
            supabase
                .from('destinations')
                .upsert({
                    name: destination,
                    general_info: info,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'name' })
                .then(({ error: saveError }) => {
                    if (saveError) {
                        console.error(`[GeneralInfo] Failed to cache info for ${destination}:`, saveError);
                    } else {
                        console.log(`[GeneralInfo] Cache UPDATED for: ${destination}`);
                    }
                })
                .catch(err => console.error(`[GeneralInfo] Async save error for ${destination}:`, err));
        }

        res.json({ info });
    } catch (error) {
        console.error('Error generating general info:', error);
        res.status(500).json({ error: 'Failed to generate general info' });
    }
});

// Attractions - DB-Cached with AI Fallback
router.post('/attractions', async (req, res) => {
    try {
        const { destination } = req.body;

        if (!destination) {
            return res.status(400).json({ error: 'Destination is required' });
        }

        console.log(`[Attractions] Checking cache for: ${destination}`);

        // 1. Check DB for cached attractions
        const { data: cachedData, error: dbError } = await supabase
            .from('destinations')
            .select('attractions')
            .ilike('name', destination)
            .single();

        if (cachedData && cachedData.attractions && Array.isArray(cachedData.attractions) && cachedData.attractions.length > 0) {
            console.log(`[Attractions] Cache HIT for: ${destination} (${cachedData.attractions.length} items)`);
            return res.json({ attractions: cachedData.attractions });
        }

        if (dbError && dbError.code !== 'PGRST116') {
            console.error('[Attractions] DB error (proceeding with AI):', dbError);
        }

        console.log(`[Attractions] Cache MISS, calling AI for: ${destination}`);

        // 2. Call AI
        const attractions = await generateAttractions(destination);

        // 3. Save to DB asynchronously (don't block response)
        if (attractions && attractions.length > 0) {
            supabase
                .from('destinations')
                .upsert({
                    name: destination,
                    attractions: attractions,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'name' })
                .then(({ error: saveError }) => {
                    if (saveError) {
                        console.error(`[Attractions] Failed to cache for ${destination}:`, saveError);
                    } else {
                        console.log(`[Attractions] Cache UPDATED for: ${destination}`);
                    }
                })
                .catch(err => console.error(`[Attractions] Async save error for ${destination}:`, err));
        }

        res.json({ attractions });
    } catch (error) {
        console.error('Error generating attractions:', error);
        res.status(500).json({ error: 'Failed to generate attractions' });
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
