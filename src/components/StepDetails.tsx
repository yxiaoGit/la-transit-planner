"use client";

import type { Itinerary } from "@/lib/types";
import { formatClock } from "@/lib/time";

export function StepDetails({ itinerary }: { itinerary: Itinerary }) {
  return (
    <ol className="space-y-3 border-t border-white/10 pt-4">
      {itinerary.steps.map((step, i) => (
        <li key={`${itinerary.id}-${i}`} className="flex gap-3">
          <div className="mt-1 h-8 w-8 shrink-0 border border-white/15 bg-ink-800 text-center text-xs leading-8 text-signal">
            {i + 1}
          </div>
          <div>
            {step.type === "bus" ? (
              <>
                <p className="font-medium text-white">
                  <span
                    className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: step.routeColor }}
                  />
                  {step.instruction}
                </p>
                <p className="text-sm text-white/60">
                  {formatClock(new Date(step.departAt))} →{" "}
                  {formatClock(new Date(step.arriveAt))} · {step.durationMinutes}{" "}
                  min · {step.from.name} to {step.to.name}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-white">{step.instruction}</p>
                <p className="text-sm text-white/60">
                  {step.durationMinutes} min · ~{step.distanceMeters} m
                </p>
              </>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
