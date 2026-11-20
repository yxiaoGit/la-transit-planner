import type { LatLon } from "./types";
import polygon from "@/data/la-county-polygon.json";

const R = 6371000;

export function haversineMeters(a: LatLon, b: LatLon): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function walkMinutes(meters: number): number {
  // ~4.8 km/h walking
  return Math.max(1, Math.round(meters / 80));
}

/** Ray-casting point-in-polygon for LA County fixture polygon */
export function isInLaCounty(point: LatLon): boolean {
  const ring = polygon.coordinates[0] as [number, number][];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lon <
        ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
