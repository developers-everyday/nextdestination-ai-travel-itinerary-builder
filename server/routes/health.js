import express from 'express';
import { supabase } from '../db/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store');

    const start = Date.now();
    let dbStatus = 'healthy';
    let dbLatency = null;

    try {
        const dbStart = Date.now();
        const { error } = await supabase
            .from('destinations')
            .select('name')
            .limit(1);
        dbLatency = Date.now() - dbStart;

        if (error) {
            dbStatus = 'unhealthy';
        }
    } catch {
        dbStatus = 'unhealthy';
    }

    const status = dbStatus === 'healthy' ? 'healthy' : 'degraded';
    const statusCode = status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: Date.now() - start,
        dependencies: {
            database: {
                status: dbStatus,
                latency: dbLatency,
            },
        },
    });
});

export default router;
