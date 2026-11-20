"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import type { Itinerary, LatLon } from "@/lib/types";
import "leaflet/dist/leaflet.css";

function FitBounds({ points }: { points: LatLon[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
      ],
      { padding: [36, 36] }
    );
  }, [map, points]);
  return null;
}

type Props = {
  itinerary: Itinerary | null;
  from?: LatLon;
  to?: LatLon;
};

export function RouteMap({ itinerary, from, to }: Props) {
  const fallback: LatLon = { lat: 34.05, lon: -118.25 };
  const points = itinerary?.geometry?.length
    ? itinerary.geometry
    : [from ?? fallback, to ?? fallback];
  const center = points[0] ?? fallback;

  // Offline-friendly: if tiles fail (no internet), map still shows vectors on dark bg.
  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {itinerary && (
        <Polyline
          positions={itinerary.geometry.map((p) => [p.lat, p.lon] as [number, number])}
          pathOptions={{ color: "#f5a524", weight: 5, opacity: 0.9 }}
        />
      )}
      {from && (
        <CircleMarker
          center={[from.lat, from.lon]}
          radius={8}
          pathOptions={{ color: "#2aa9a1", fillColor: "#2aa9a1", fillOpacity: 1 }}
        >
          <Popup>Start</Popup>
        </CircleMarker>
      )}
      {to && (
        <CircleMarker
          center={[to.lat, to.lon]}
          radius={8}
          pathOptions={{ color: "#e23d28", fillColor: "#e23d28", fillOpacity: 1 }}
        >
          <Popup>Destination</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
