
interface Itinerary {
    destination: string;
    days: any[];
    id?: string;
}

export const hydrateItinerary = async (itinerary: Itinerary, mapInstance?: google.maps.Map): Promise<Itinerary> => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.warn("Google Maps API not loaded, returning raw itinerary");
        return itinerary;
    }

    // We need a dummy element or a map instance for PlacesService
    const dummyElement = document.createElement('div');
    const service = new window.google.maps.places.PlacesService(mapInstance || dummyElement);


    // Use sequential processing (or limited concurrency) to avoid hitting Rate Limits on Places API
    // and to ensure we can handle the logic simply without circular dependencies.

    const finalDays = [];
    for (const day of itinerary.days) {
        const newActivities = [];
        for (const activity of day.activities) {
            if (activity.type === 'flight' || activity.type === 'hotel') {
                newActivities.push(activity);
                continue;
            }

            try {
                const query = `${activity.activity} in ${itinerary.destination}`;
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

                    newActivities.push({
                        ...activity,
                        image: p.photos?.[0]?.getUrl({ maxWidth: 600 }),
                        rating: p.rating,
                        reviews: p.user_ratings_total,
                        coordinates: coords,
                        location: p.formatted_address || activity.location,
                        placeId: p.place_id
                    });
                } else {
                    // Check if existing coordinates are valid
                    let validCoords = activity.coordinates;
                    if (!Array.isArray(validCoords) || validCoords.length !== 2 || typeof validCoords[0] !== 'number' || typeof validCoords[1] !== 'number' || isNaN(validCoords[0]) || isNaN(validCoords[1])) {
                        // Fallback to null if invalid, preventing Mapbox crash
                        validCoords = null;
                    }
                    newActivities.push({ ...activity, coordinates: validCoords });
                }
            } catch (e) {
                newActivities.push(activity);
            }
        }
        finalDays.push({ ...day, activities: newActivities });
    }

    return {
        ...itinerary,
        days: finalDays
    };
};
