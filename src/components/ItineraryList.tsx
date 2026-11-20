"use client";

import type { Itinerary } from "@/lib/types";
import { formatClock } from "@/lib/time";

type Props = {
  itineraries: Itinerary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ItineraryList({ itineraries, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      {itineraries.map((it, idx) => {
        const selected = it.id === selectedId;
        const transferLabel =
          it.transfers === 0 ? "Direct" : `${it.transfers} transfer`;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect(it.id)}
            className={`w-full border px-3 py-3 text-left transition ${
              selected
                ? "border-signal bg-signal/15"
                : "border-white/10 bg-ink-900/60 hover:border-white/25"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-lg font-semibold text-white">
                Option {idx + 1}
                <span className="ml-2 text-sm font-normal text-white/55">
                  {transferLabel}
                </span>
              </p>
              <p className="font-display text-xl text-signal">
                {it.durationMinutes} min
              </p>
            </div>
            <p className="mt-1 text-sm text-white/70">{it.summary}</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-white/45">
              Walk {it.walkMinutes} min · Fare ~${it.fareEstimateUsd.toFixed(2)} ·{" "}
              {formatClock(new Date(it.departAt))} →{" "}
              {formatClock(new Date(it.arriveAt))}
            </p>
          </button>
        );
      })}
    </div>
  );
}
