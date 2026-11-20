import network from "@/data/network.json";
import { haversineMeters, isInLaCounty, walkMinutes } from "./geo";
import { findPlace } from "./places";
import {
  addMinutes,
  formatClock,
  nextDeparture,
  parseDepartAt,
} from "./time";
import type { Itinerary, LatLon, Place, PlanResponse, PlanStep } from "./types";

type BusStep = Extract<PlanStep, { type: "bus" }>;
type WalkStep = Extract<PlanStep, { type: "walk" }>;

type Stop = { name: string; lat: number; lon: number };
type Route = {
  id: string;
  name: string;
  color: string;
  headsign: string;
  stopIds: string[];
  legMinutes: number[];
  frequencyMinutes: number;
  firstTrip: string;
  lastTrip: string;
};

const stops = network.stops as Record<string, Stop>;
const routes = network.routes as Route[];

function stopPoint(id: string): LatLon & { name: string } {
  const s = stops[id];
  return { name: s.name, lat: s.lat, lon: s.lon };
}

function nearestStop(place: Place): { id: string; meters: number } {
  let best = { id: "", meters: Infinity };
  for (const [id, s] of Object.entries(stops)) {
    const meters = haversineMeters(place, s);
    if (meters < best.meters) best = { id, meters };
  }
  return best;
}

function segmentMinutes(route: Route, fromIdx: number, toIdx: number): number {
  let total = 0;
  const start = Math.min(fromIdx, toIdx);
  const end = Math.max(fromIdx, toIdx);
  for (let i = start; i < end; i++) total += route.legMinutes[i];
  return total;
}

function buildBusStep(
  route: Route,
  fromIdx: number,
  toIdx: number,
  departAt: Date
): BusStep {
  const duration = segmentMinutes(route, fromIdx, toIdx);
  const arriveAt = addMinutes(departAt, duration);
  const fromId = route.stopIds[fromIdx];
  const toId = route.stopIds[toIdx];
  const via = route.stopIds.slice(
    Math.min(fromIdx, toIdx),
    Math.max(fromIdx, toIdx) + 1
  );
  return {
    type: "bus",
    instruction: `Take ${route.name} toward ${route.headsign}`,
    routeId: route.id,
    routeName: route.name,
    routeColor: route.color,
    headsign: route.headsign,
    durationMinutes: duration,
    from: stopPoint(fromId),
    to: stopPoint(toId),
    departAt: departAt.toISOString(),
    arriveAt: arriveAt.toISOString(),
    stops: via.map((id) => stops[id].name),
  };
}

function walkStep(
  from: LatLon & { name: string },
  to: LatLon & { name: string }
): WalkStep {
  const meters = Math.round(haversineMeters(from, to));
  return {
    type: "walk",
    instruction: `Walk to ${to.name}`,
    durationMinutes: walkMinutes(meters),
    distanceMeters: meters,
    from,
    to,
  };
}

function geometryFromSteps(steps: PlanStep[]): LatLon[] {
  const pts: LatLon[] = [];
  for (const step of steps) {
    pts.push({ lat: step.from.lat, lon: step.from.lon });
    pts.push({ lat: step.to.lat, lon: step.to.lon });
  }
  return pts;
}

function scoreItinerary(it: Itinerary): number {
  return it.durationMinutes + it.transfers * 8 + it.walkMinutes * 0.4;
}

function directOptions(
  fromPlace: Place,
  toPlace: Place,
  depart: Date
): Itinerary[] {
  const fromNear = nearestStop(fromPlace);
  const toNear = nearestStop(toPlace);
  const out: Itinerary[] = [];

  for (const route of routes) {
    const fromIdx = route.stopIds.indexOf(fromNear.id);
    const toIdx = route.stopIds.indexOf(toNear.id);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) continue;

    // Allow either direction by walking time along legs (undirected duration)
    const boardWalk = walkStep(
      { name: fromPlace.name, lat: fromPlace.lat, lon: fromPlace.lon },
      stopPoint(fromNear.id)
    );
    const readyAt = addMinutes(depart, boardWalk.durationMinutes);
    const busDepart = nextDeparture(
      readyAt,
      route.firstTrip,
      route.lastTrip,
      route.frequencyMinutes,
      readyAt
    );
    if (!busDepart) continue;

    const bus = buildBusStep(route, fromIdx, toIdx, busDepart);
    const alightWalk = walkStep(bus.to, {
      name: toPlace.name,
      lat: toPlace.lat,
      lon: toPlace.lon,
    });
    const steps = [boardWalk, bus, alightWalk];
    const arrive = addMinutes(
      new Date(bus.arriveAt),
      alightWalk.durationMinutes
    );
    const walkMinutesTotal = boardWalk.durationMinutes + alightWalk.durationMinutes;
    const durationMinutes = Math.round(
      (arrive.getTime() - depart.getTime()) / 60_000
    );
    out.push({
      id: `direct-${route.id}-${fromNear.id}-${toNear.id}`,
      summary: `${route.name} · ${formatClock(busDepart)} → ${formatClock(arrive)}`,
      durationMinutes,
      walkMinutes: walkMinutesTotal,
      transfers: 0,
      departAt: depart.toISOString(),
      arriveAt: arrive.toISOString(),
      fareEstimateUsd: 1.75,
      steps,
      geometry: geometryFromSteps(steps),
    });
  }
  return out;
}

function transferOptions(
  fromPlace: Place,
  toPlace: Place,
  depart: Date
): Itinerary[] {
  const fromNear = nearestStop(fromPlace);
  const toNear = nearestStop(toPlace);
  const out: Itinerary[] = [];
  const hubs = ["union-station", "koreatown", "hollywood", "usc", "culver-city"];

  for (const hub of hubs) {
    if (hub === fromNear.id || hub === toNear.id) continue;
    const firstLegRoutes = routes.filter(
      (r) => r.stopIds.includes(fromNear.id) && r.stopIds.includes(hub)
    );
    const secondLegRoutes = routes.filter(
      (r) => r.stopIds.includes(hub) && r.stopIds.includes(toNear.id)
    );
    for (const r1 of firstLegRoutes) {
      for (const r2 of secondLegRoutes) {
        if (r1.id === r2.id) continue;
        const boardWalk = walkStep(
          { name: fromPlace.name, lat: fromPlace.lat, lon: fromPlace.lon },
          stopPoint(fromNear.id)
        );
        const ready1 = addMinutes(depart, boardWalk.durationMinutes);
        const d1 = nextDeparture(
          ready1,
          r1.firstTrip,
          r1.lastTrip,
          r1.frequencyMinutes,
          ready1
        );
        if (!d1) continue;
        const bus1 = buildBusStep(
          r1,
          r1.stopIds.indexOf(fromNear.id),
          r1.stopIds.indexOf(hub),
          d1
        );
        const ready2 = addMinutes(new Date(bus1.arriveAt), 4);
        const d2 = nextDeparture(
          ready2,
          r2.firstTrip,
          r2.lastTrip,
          r2.frequencyMinutes,
          ready2
        );
        if (!d2) continue;
        const bus2 = buildBusStep(
          r2,
          r2.stopIds.indexOf(hub),
          r2.stopIds.indexOf(toNear.id),
          d2
        );
        const alightWalk = walkStep(bus2.to, {
          name: toPlace.name,
          lat: toPlace.lat,
          lon: toPlace.lon,
        });
        const steps = [boardWalk, bus1, bus2, alightWalk];
        const arrive = addMinutes(
          new Date(bus2.arriveAt),
          alightWalk.durationMinutes
        );
        const walkMinutesTotal =
          boardWalk.durationMinutes + alightWalk.durationMinutes;
        const durationMinutes = Math.round(
          (arrive.getTime() - depart.getTime()) / 60_000
        );
        out.push({
          id: `xfer-${r1.id}-${hub}-${r2.id}`,
          summary: `${r1.name} → ${r2.name} via ${stops[hub].name}`,
          durationMinutes,
          walkMinutes: walkMinutesTotal,
          transfers: 1,
          departAt: depart.toISOString(),
          arriveAt: arrive.toISOString(),
          fareEstimateUsd: 1.75,
          steps,
          geometry: geometryFromSteps(steps),
        });
      }
    }
  }
  return out;
}

export function planOffline(input: {
  fromQuery: string;
  toQuery: string;
  departAt?: string;
}): PlanResponse {
  const from = findPlace(input.fromQuery);
  const to = findPlace(input.toQuery);

  if (!from || !to) {
    return {
      ok: false,
      mode: "offline",
      code: "PLACE_NOT_FOUND",
      message:
        "Place not found in the local LA directory. Try places like UCLA, Union Station, LAX, or Santa Monica Pier.",
    };
  }

  if (!isInLaCounty(from) || !isInLaCounty(to)) {
    return {
      ok: false,
      mode: "offline",
      code: "OUTSIDE_LA_COUNTY",
      message: "Not available — service is limited to Los Angeles County.",
    };
  }

  if (from.id === to.id) {
    return {
      ok: false,
      mode: "offline",
      code: "NO_ROUTE",
      message: "Start and destination are the same place.",
    };
  }

  const depart = parseDepartAt(input.departAt);
  const candidates = [
    ...directOptions(from, to, depart),
    ...transferOptions(from, to, depart),
  ]
    .sort((a, b) => scoreItinerary(a) - scoreItinerary(b))
    .slice(0, 5);

  if (candidates.length === 0) {
    return {
      ok: false,
      mode: "offline",
      code: "NO_ROUTE",
      message:
        "No bus itinerary found in the offline fixture network for that pair. Try UCLA ↔ Union Station or LAX ↔ USC.",
    };
  }

  return { ok: true, mode: "offline", from, to, itineraries: candidates };
}
