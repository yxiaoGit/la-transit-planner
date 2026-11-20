import placesData from "@/data/places.json";
import type { Place } from "./types";

const places = placesData as Place[];

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");
}

export function listPlaces(): Place[] {
  return places;
}

export function findPlace(query: string): Place | null {
  const q = normalize(query);
  if (!q) return null;

  const exact = places.find(
    (p) =>
      normalize(p.name) === q ||
      normalize(p.id) === q ||
      p.aliases.some((a) => normalize(a) === q)
  );
  if (exact) return exact;

  const partial = places.find(
    (p) =>
      normalize(p.name).includes(q) ||
      q.includes(normalize(p.name)) ||
      p.aliases.some((a) => normalize(a).includes(q) || q.includes(normalize(a)))
  );
  return partial ?? null;
}

export function searchPlaces(query: string, limit = 8): Place[] {
  const q = normalize(query);
  if (!q) return places.slice(0, limit);
  return places
    .filter(
      (p) =>
        normalize(p.name).includes(q) ||
        p.aliases.some((a) => normalize(a).includes(q)) ||
        normalize(p.city).includes(q)
    )
    .slice(0, limit);
}
