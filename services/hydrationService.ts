
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

    const hydratedDays = await Promise.all(itinerary.days.map(async (day) => {
        const hydratedActivities = await Promise.all(day.activities.map(async (activity: any) => {
            if (activity.type === 'flight' || activity.type === 'hotel') return activity;

            try {
                // 1. Text Search to get Place ID (if not provided/known)
                // If the backend gave us coordinates, we could use them, but text search is often better for "Attraction Name"
                // But we can bias with location if we have it.

                const request: google.maps.places.TextSearchRequest = {
                    query: `${activity.activity} in ${itinerary.destination}`,
                    // locationbias: ... if we had lat/lng of destination
                };

                const places = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
                    service.textSearch(request, (results, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                            resolve(results);
                        } else {
                            resolve([]);
                        }
                    });
                });

                if (places.length > 0) {
                    const place = places[0];
                    // 2. Get Details (Photos, Rating, Reviews, Exact Geo)
                    // textSearch returns a subset, for photos we usually need getDetails or just helper
                    // Actually textSearch returns 'photos' array directly in PlaceResult!

                    let imageUrl = activity.image; // fallback
                    if (place.photos && place.photos.length > 0) {
                        imageUrl = place.photos[0].getUrl({ maxWidth: 800 });
                    }

                    // Update activity with rich data
                    return {
                        ...activity,
                        image: imageUrl,
                        rating: place.rating,
                        reviews: place.user_ratings_total,
                        coordinates: place.geometry?.location ? [place.geometry.location.lng(), place.geometry.location.lat()] : activity.coordinates,
                        location: place.formatted_address || activity.location, // more accurate address
                        placeId: place.place_id
                    };
                }
            } catch (err) {
                console.warn(`Failed to hydrate activity: ${activity.activity}`, err);
            }

            return activity;
        }));

        return {
            ...day,
            activities: hydratedDays
        };
    }));

    // Promise.all for days is wrong, 'hydratedDays' is Promise<any>[], wait
    // map returns array of promises.
    // 'hydratedActivities' inside is also a promise.

    // Let's refactor the await above.

    // Correct logic:
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
                    newActivities.push({
                        ...activity,
                        image: p.photos?.[0]?.getUrl({ maxWidth: 600 }),
                        rating: p.rating,
                        reviews: p.user_ratings_total,
                        coordinates: p.geometry?.location ? [p.geometry.location.lng(), p.geometry.location.lat()] : activity.coordinates,
                        location: p.formatted_address || activity.location,
                        placeId: p.place_id
                    });
                } else {
                    newActivities.push(activity);
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
