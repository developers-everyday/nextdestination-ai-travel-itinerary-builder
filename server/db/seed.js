import { getSession, closeDriver } from './neo4j.js';

const seedData = async () => {
    const session = getSession();

    try {
        console.log('Cleaning up existing data...');
        await session.run('MATCH (n) DETACH DELETE n');

        console.log('Seeding data...');

        // Create Interests
        const interests = ['History', 'Art', 'Food', 'Nature', 'Adventure', 'Relaxation', 'Nightlife', 'Shopping'];
        for (const interest of interests) {
            await session.run('CREATE (:Interest {name: $name})', { name: interest });
        }

        // Create Destinations and Places
        const destinations = [
            {
                name: 'Paris',
                places: [
                    { name: 'Eiffel Tower', type: 'Landmark', rating: 4.8, tags: ['History', 'Romance', 'Architecture'] },
                    { name: 'Louvre Museum', type: 'Museum', rating: 4.7, tags: ['Art', 'History'] },
                    { name: 'Montmartre', type: 'Neighborhood', rating: 4.6, tags: ['Art', 'Romance', 'Walking'] },
                    { name: 'Le Marais', type: 'Neighborhood', rating: 4.5, tags: ['Food', 'Shopping', 'History'] }
                ]
            },
            {
                name: 'Tokyo',
                places: [
                    { name: 'Senso-ji Temple', type: 'Temple', rating: 4.8, tags: ['History', 'Culture'] },
                    { name: 'Akihabara', type: 'District', rating: 4.5, tags: ['Technology', 'Anime', 'Shopping'] },
                    { name: 'Shibuya Crossing', type: 'Landmark', rating: 4.6, tags: ['City', 'Nightlife'] },
                    { name: 'Tsukiji Outer Market', type: 'Market', rating: 4.7, tags: ['Food'] }
                ]
            },
            {
                name: 'New York City',
                places: [
                    { name: 'Central Park', type: 'Park', rating: 4.9, tags: ['Nature', 'Relaxation'] },
                    { name: 'Metropolitan Museum of Art', type: 'Museum', rating: 4.8, tags: ['Art', 'History'] },
                    { name: 'Empire State Building', type: 'Landmark', rating: 4.6, tags: ['Architecture', 'City'] },
                    { name: 'Times Square', type: 'Plaza', rating: 4.4, tags: ['City', 'Nightlife', 'Shopping'] }
                ]
            }
        ];

        for (const dest of destinations) {
            await session.run('CREATE (d:Destination {name: $name})', { name: dest.name });

            for (const place of dest.places) {
                // Create Place node
                await session.run(
                    `MATCH (d:Destination {name: $destName})
           CREATE (p:Place {name: $name, type: $type, rating: $rating})
           MERGE (p)-[:LOCATED_IN]->(d)
           WITH p
           UNWIND $tags as tag
           MATCH (i:Interest {name: tag})
           MERGE (p)-[:HAS_TAG]->(i)`,
                    {
                        destName: dest.name,
                        name: place.name,
                        type: place.type,
                        rating: place.rating,
                        tags: place.tags
                    }
                );
            }
        }

        console.log('Seeding complete!');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await session.close();
        await closeDriver();
    }
};

seedData();
