// Google Maps API Helper Functions

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface Location {
    lat: number;
    lng: number;
    address: string;
}

interface RouteStop {
    location: Location;
    booking_id: string;
    estimated_duration: number;
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Radius of Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/**
 * Get optimized route using Google Maps Directions API
 */
export async function getOptimizedRoute(stops: RouteStop[]) {
    if (!GOOGLE_MAPS_API_KEY) {
        // Fallback to simple optimization
        return optimizeRouteSimple(stops);
    }

    try {
        const origin = stops[0].location;
        const destination = stops[stops.length - 1].location;
        const waypoints = stops.slice(1, -1).map(stop =>
            `${stop.location.lat},${stop.location.lng}`
        ).join('|');

        const url = `https://maps.googleapis.com/maps/api/directions/json?` +
            `origin=${origin.lat},${origin.lng}&` +
            `destination=${destination.lat},${destination.lng}&` +
            `waypoints=optimize:true|${waypoints}&` +
            `key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            throw new Error(data.error_message || 'Failed to get route');
        }

        const route = data.routes[0];
        const optimizedOrder = route.waypoint_order || [];

        return {
            optimized_stops: reorderStops(stops, optimizedOrder),
            total_distance_km: route.legs.reduce((sum: number, leg: any) =>
                sum + leg.distance.value / 1000, 0
            ),
            total_duration_minutes: route.legs.reduce((sum: number, leg: any) =>
                sum + leg.duration.value / 60, 0
            ),
            polyline: route.overview_polyline.points,
            route_data: route,
        };
    } catch (error) {
        console.error('Google Maps API error:', error);
        // Fallback to simple optimization
        return optimizeRouteSimple(stops);
    }
}

/**
 * Simple route optimization using nearest neighbor algorithm
 */
function optimizeRouteSimple(stops: RouteStop[]) {
    if (stops.length <= 2) {
        return {
            optimized_stops: stops,
            total_distance_km: stops.length > 1 ?
                calculateDistance(
                    stops[0].location.lat,
                    stops[0].location.lng,
                    stops[1].location.lat,
                    stops[1].location.lng
                ) : 0,
            total_duration_minutes: stops.reduce((sum, stop) =>
                sum + stop.estimated_duration, 0
            ),
        };
    }

    const visited = new Set<number>();
    const ordered: RouteStop[] = [stops[0]];
    visited.add(0);
    let totalDistance = 0;

    let currentIndex = 0;
    while (visited.size < stops.length) {
        let nearestIndex = -1;
        let nearestDistance = Infinity;

        for (let i = 0; i < stops.length; i++) {
            if (visited.has(i)) continue;

            const distance = calculateDistance(
                stops[currentIndex].location.lat,
                stops[currentIndex].location.lng,
                stops[i].location.lat,
                stops[i].location.lng
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        if (nearestIndex !== -1) {
            ordered.push(stops[nearestIndex]);
            visited.add(nearestIndex);
            totalDistance += nearestDistance;
            currentIndex = nearestIndex;
        }
    }

    return {
        optimized_stops: ordered,
        total_distance_km: totalDistance,
        total_duration_minutes: ordered.reduce((sum, stop) =>
            sum + stop.estimated_duration, 0
        ),
    };
}

/**
 * Reorder stops based on optimized waypoint order
 */
function reorderStops(stops: RouteStop[], waypointOrder: number[]): RouteStop[] {
    const result = [stops[0]]; // First stop (origin)

    // Reorder middle stops
    for (const index of waypointOrder) {
        result.push(stops[index + 1]); // +1 because waypoint_order excludes origin
    }

    if (stops.length > 1) {
        result.push(stops[stops.length - 1]); // Last stop (destination)
    }

    return result;
}

/**
 * Calculate ETA for a specific stop
 */
export function calculateETA(
    currentLocation: Location,
    targetLocation: Location,
    averageSpeed: number = 30 // km/h default
): Date {
    const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        targetLocation.lat,
        targetLocation.lng
    );

    const durationMinutes = (distance / averageSpeed) * 60;
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + durationMinutes);

    return eta;
}

/**
 * Geocode address to coordinates
 */
export async function geocodeAddress(address: string): Promise<Location | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        return null;
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
            `address=${encodeURIComponent(address)}&` +
            `key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.results[0]) {
            return null;
        }

        const result = data.results[0];
        return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            address: result.formatted_address,
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        return null;
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
            `latlng=${lat},${lng}&` +
            `key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.results[0]) {
            return null;
        }

        return data.results[0].formatted_address;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}
