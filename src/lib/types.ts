export type LatLon = { lat: number; lon: number };

export type Place = {
  id: string;
  name: string;
  aliases: string[];
  lat: number;
  lon: number;
  city: string;
};

export type PlanMode = "offline" | "otp";

export type PlanStep =
  | {
      type: "walk";
      instruction: string;
      durationMinutes: number;
      distanceMeters: number;
      from: LatLon & { name: string };
      to: LatLon & { name: string };
    }
  | {
      type: "bus";
      instruction: string;
      routeId: string;
      routeName: string;
      routeColor: string;
      headsign: string;
      durationMinutes: number;
      from: LatLon & { name: string };
      to: LatLon & { name: string };
      departAt: string;
      arriveAt: string;
      stops: string[];
    };

export type Itinerary = {
  id: string;
  summary: string;
  durationMinutes: number;
  walkMinutes: number;
  transfers: number;
  departAt: string;
  arriveAt: string;
  fareEstimateUsd: number;
  steps: PlanStep[];
  geometry: LatLon[];
};

export type PlanRequest = {
  fromQuery: string;
  toQuery: string;
  departAt?: string; // ISO local-ish string or empty for now
};

export type PlanResponse =
  | {
      ok: true;
      mode: PlanMode;
      from: Place;
      to: Place;
      itineraries: Itinerary[];
    }
  | {
      ok: false;
      code: "OUTSIDE_LA_COUNTY" | "PLACE_NOT_FOUND" | "NO_ROUTE" | "OTP_ERROR";
      message: string;
      mode: PlanMode;
    };
