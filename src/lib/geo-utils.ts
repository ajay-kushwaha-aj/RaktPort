// src/lib/geo-utils.ts
/**
 * Calculates the Haversine distance between two sets of coordinates in kilometers.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Returns a 10km geographical bounding box given a center latitude and longitude.
 * Useful for fast filtering before precise Haversine checks if needed, but 
 * typically Haversine on a smaller dataset is fast enough.
 */
export function getBoundingBox(lat: number, lon: number, radiusKm: number = 10) {
  const latDelta = radiusKm / 111.32; // 1 degree of latitude is ~111.32km
  const lonDelta = radiusKm / (111.32 * Math.cos(lat * (Math.PI / 180)));
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta
  };
}
