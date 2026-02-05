import { supabase } from '../db/supabase.js';
import crypto from 'crypto';

const communityItineraries = [
    {
        name: 'Hidden Gems of Positano',
        location: 'Amalfi Coast, Italy',
        destination: 'Positano, Italy',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=1200',
        creator: {
            id: 'marco',
            name: 'Marco G.',
            avatar: 'https://i.pravatar.cc/150?u=marco',
            verified: true
        },
        saveCount: 1240,
        duration: 5,
        tags: ['Coastal', 'Photography', 'Food & Wine', 'Romantic'],
        category: 'Romantic',
        trending: true,
        days: [
            {
                day: 1,
                theme: 'Arrival & Coastal Exploration',
                hasHotel: true,
                activities: [
                    { time: '14:00', activity: 'Check-in at Le Sirenuse', location: 'Via Cristoforo Colombo, 30', description: 'Luxury hotel', type: 'hotel' },
                    { time: '16:30', activity: 'Sunset at Spiaggia Grande', location: 'Main Beach', description: 'Relax on the iconic pebble beach', type: 'activity' }
                ]
            }
        ]
    },
    {
        name: 'Cyberpunk Tokyo Nightlife',
        location: 'Shibuya, Japan',
        destination: 'Tokyo, Japan',
        image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=1200',
        creator: {
            id: 'sarah',
            name: 'Sarah K.',
            avatar: 'https://i.pravatar.cc/150?u=sarah',
            verified: true
        },
        saveCount: 890,
        duration: 4,
        tags: ['Urban', 'Nightlife', 'Technology'],
        category: 'Adventure',
        trending: true,
        days: [{ day: 1, theme: 'Neon Dreams', activities: [] }]
    },
    {
        name: 'Luxury Retreat in Bali',
        location: 'Ubud, Indonesia',
        destination: 'Ubud, Bali',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1200',
        creator: { id: 'julian', name: 'Julian P.', avatar: 'https://i.pravatar.cc/150?u=julian', verified: true },
        saveCount: 2105,
        duration: 7,
        tags: ['Wellness', 'Spa', 'Nature'],
        category: 'Luxury',
        trending: true,
        days: [{ day: 1, theme: 'Arrival', activities: [] }]
    },
    {
        name: 'Safari Adventure in Serengeti',
        location: 'Tanzania',
        destination: 'Serengeti National Park',
        image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=1200',
        creator: { id: 'david', name: 'David M.', avatar: 'https://i.pravatar.cc/150?u=david', verified: true },
        saveCount: 1567,
        duration: 6,
        tags: ['Wildlife', 'Safari'],
        category: 'Adventure',
        trending: true,
        days: [{ day: 1, theme: 'Big Five Safari', activities: [] }]
    },
    {
        name: 'Northern Lights in Iceland',
        location: 'Reykjavik, Iceland',
        destination: 'Iceland',
        image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&q=80&w=1200',
        creator: { id: 'emma', name: 'Emma L.', avatar: 'https://i.pravatar.cc/150?u=emma' },
        saveCount: 3421,
        duration: 5,
        tags: ['Northern Lights', 'Nature'],
        category: 'Adventure',
        trending: true,
        days: [{ day: 1, theme: 'Aurora Hunt', activities: [] }]
    },
    {
        name: 'Parisian Romance',
        location: 'Paris, France',
        destination: 'Paris',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200',
        creator: { id: 'sophie', name: 'Sophie D.', avatar: 'https://i.pravatar.cc/150?u=sophie', verified: true },
        saveCount: 2890,
        duration: 4,
        tags: ['Romance', 'Art'],
        category: 'Romantic',
        trending: true,
        days: [{ day: 1, theme: 'Classic Parisian Charm', activities: [] }]
    },
    {
        name: 'Santorini Sunset Dreams',
        location: 'Santorini, Greece',
        destination: 'Santorini',
        image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=1200',
        creator: { id: 'maria', name: 'Maria K.', avatar: 'https://i.pravatar.cc/150?u=maria', verified: true },
        saveCount: 5234,
        duration: 5,
        tags: ['Sunsets', 'Wine'],
        category: 'Romantic',
        trending: true,
        days: [{ day: 1, theme: 'Oia Sunset', activities: [] }]
    }
];

const seed = async () => {
    console.log('Seeding itineraries...');

    let insertedCount = 0;

    for (const item of communityItineraries) {
        // Check if exists by name (simplified check)
        // Note: In jsonb metadata column, proper query is tricky without an index or specific key
        // We'll rely on fetching all and checking locally or just skipping duplicate checks for this simple script
        // Actually, let's just insert unique ID content.

        const id = crypto.randomUUID();
        const metadata = { ...item };

        // Remove helper fields if needed, but keeping them in metadata is fine
        // Note: ItineraryGrid expects `metadata.destination`, `metadata.saveCount`, etc.

        const { error } = await supabase
            .from('itineraries')
            .insert({
                id,
                content: `Trip to ${item.destination} - ${item.tags.join(', ')}`,
                metadata,
                embedding: null // Skip embedding for seed
            });

        if (error) {
            console.error(`Error inserting ${item.name}:`, error.message);
        } else {
            console.log(`Inserted: ${item.name} (${id})`);
            insertedCount++;
        }
    }

    console.log(`Seeding complete. Inserted ${insertedCount} itineraries.`);
    process.exit(0);
};

seed().catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
});
