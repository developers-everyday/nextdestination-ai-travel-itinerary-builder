
interface Itinerary {
    destination: string;
    days: any[];
    id?: string;
}

// ────────────────────────────────────────────────────────
// Concurrency-controlled batch execution
// ────────────────────────────────────────────────────────
const BATCH_SIZE = 3; // Max concurrent Places API calls

async function processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = BATCH_SIZE
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch.map(processor));

        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                // On failure, push null placeholder — caller handles it
                results.push(null as any);
            }
        }
    }

    return results;
}

// ────────────────────────────────────────────────────────
// Single activity hydration
// ────────────────────────────────────────────────────────
const hydrateActivity = async (
    activity: any,
    destination: string,
    service: google.maps.places.PlacesService
): Promise<any> => {
    if (activity.type === 'flight' || activity.type === 'hotel') {
        return activity;
    }

    try {
        const query = `${activity.activity} in ${destination}`;
        const places = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
            service.textSearch({ query }, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) resolve(results);
                else resolve([]);
            });
        });

        if (places.length > 0) {
            const p = places[0];
            let coords = activity.coordinates;

            if (p.geometry?.location) {
                const lat = p.geometry.location.lat();
                const lng = p.geometry.location.lng();
                if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                    coords = [lng, lat];
                }
            }

            return {
                ...activity,
                image: p.photos?.[0]?.getUrl({ maxWidth: 600 }),
                rating: p.rating,
                reviews: p.user_ratings_total,
                coordinates: coords,
                location: p.formatted_address || activity.location,
                placeId: p.place_id
            };
        }

        // Validate existing coordinates
        let validCoords = activity.coordinates;
        if (!Array.isArray(validCoords) || validCoords.length !== 2 ||
            typeof validCoords[0] !== 'number' || typeof validCoords[1] !== 'number' ||
            isNaN(validCoords[0]) || isNaN(validCoords[1])) {
            validCoords = null;
        }
        return { ...activity, coordinates: validCoords };

    } catch {
        return activity;
    }
};

// ────────────────────────────────────────────────────────
// Full itinerary hydration (batched, parallel)
// ────────────────────────────────────────────────────────
export const hydrateItinerary = async (itinerary: Itinerary, mapInstance?: google.maps.Map): Promise<Itinerary> => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.warn("Google Maps API not loaded, returning raw itinerary");
        return itinerary;
    }

    const dummyElement = document.createElement('div');
    const service = new window.google.maps.places.PlacesService(mapInstance || dummyElement);

    const t0 = performance.now();

    const finalDays = [];
    for (const day of itinerary.days) {
        // Batch all activities in a day with concurrency limit
        const hydratedActivities = await processBatch(
            day.activities,
            (activity: any) => hydrateActivity(activity, itinerary.destination, service),
            BATCH_SIZE
        );

        // Replace nulls (failed) with originals
        const safeActivities = hydratedActivities.map((a, i) => a || day.activities[i]);
        finalDays.push({ ...day, activities: safeActivities });
    }

    const elapsed = performance.now() - t0;
    console.log(`[Hydration] Completed in ${elapsed.toFixed(0)}ms (${itinerary.days.reduce((s, d) => s + d.activities.length, 0)} activities)`);

    return {
        ...itinerary,
        days: finalDays
    };
};

// ────────────────────────────────────────────────────────
// Single-day hydration (for progressive loading)
// ────────────────────────────────────────────────────────
export const hydrateDay = async (
    day: any,
    destination: string,
    mapInstance?: google.maps.Map
): Promise<any> => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
        return day;
    }

    const dummyElement = document.createElement('div');
    const service = new window.google.maps.places.PlacesService(mapInstance || dummyElement);

    const hydratedActivities = await processBatch(
        day.activities,
        (activity: any) => hydrateActivity(activity, destination, service),
        BATCH_SIZE
    );

    const safeActivities = hydratedActivities.map((a, i) => a || day.activities[i]);
    return { ...day, activities: safeActivities };
};
