/**
 * Haversine formula: calculates distance in miles between two lat/lng points.
 */
export function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Filter items by distance from a reference point.
 * Only filters items that have lat/lng; items without coordinates are excluded.
 */
export function filterByRadius<T extends { latitude?: number | null; longitude?: number | null }>(
    items: T[],
    userLat: number,
    userLng: number,
    radiusMiles: number
): T[] {
    return items.filter(item => {
        if (item.latitude == null || item.longitude == null) return false;
        const dist = haversineDistance(userLat, userLng, item.latitude, item.longitude);
        return dist <= radiusMiles;
    });
}
