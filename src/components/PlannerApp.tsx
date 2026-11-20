"use client";

import dynamic from "next/dynamic";
import { FormEvent, useMemo, useState } from "react";
import { PlaceInput } from "./PlaceInput";
import { ItineraryList } from "./ItineraryList";
import { StepDetails } from "./StepDetails";
import type { PlanResponse } from "@/lib/types";

const RouteMap = dynamic(
  () => import("./RouteMap").then((m) => m.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-ink-800 text-white/50">
        Loading map…
      </div>
    ),
  }
);

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PlannerApp() {
  const [fromQuery, setFromQuery] = useState("Union Station");
  const [toQuery, setToQuery] = useState("UCLA");
  const [departAt, setDepartAt] = useState(toLocalInputValue(new Date()));
  const [useNow, setUseNow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!result || !result.ok) return null;
    return (
      result.itineraries.find((i) => i.id === selectedId) ??
      result.itineraries[0] ??
      null
    );
  }, [result, selectedId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromQuery,
          toQuery,
          departAt: useNow ? new Date().toISOString() : new Date(departAt).toISOString(),
        }),
      });
      const data = (await res.json()) as PlanResponse;
      setResult(data);
      if (data.ok) setSelectedId(data.itineraries[0]?.id ?? null);
    } catch {
      setResult({
        ok: false,
        mode: "offline",
        code: "NO_ROUTE",
        message: "Could not reach the planner API.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,165,36,0.16),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(42,169,161,0.12),transparent_40%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl gap-0 lg:grid-cols-[minmax(340px,420px)_1fr]">
        <section className="relative z-10 flex flex-col border-r border-white/10 bg-ink-950/90 px-5 py-6 backdrop-blur-sm sm:px-7">
          <header className="animate-rise mb-8">
            <p className="font-display text-4xl font-bold tracking-tight text-signal sm:text-5xl">
              LA Hop
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
              Pick a time, a start, and a destination. Get ranked bus options
              across Los Angeles County.
            </p>
          </header>

          <form onSubmit={onSubmit} className="animate-rise-delay space-y-4">
            <PlaceInput
              id="from"
              label="Starting place"
              value={fromQuery}
              onChange={setFromQuery}
              placeholder="Union Station"
            />
            <PlaceInput
              id="to"
              label="Destination"
              value={toQuery}
              onChange={setToQuery}
              placeholder="UCLA"
            />

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-signal-soft/80">
                  Depart
                </span>
                <label className="flex items-center gap-2 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={useNow}
                    onChange={(e) => setUseNow(e.target.checked)}
                  />
                  Use current time
                </label>
              </div>
              <input
                type="datetime-local"
                disabled={useNow}
                value={departAt}
                onChange={(e) => setDepartAt(e.target.value)}
                className="w-full border border-white/15 bg-ink-900/80 px-3 py-3 text-base text-white outline-none focus:border-signal disabled:opacity-40"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-signal px-4 py-3 font-display text-base font-bold text-ink-950 transition hover:bg-signal-soft disabled:opacity-60"
            >
              {loading ? "Finding buses…" : "Find bus routes"}
            </button>
          </form>

          <div className="mt-6 flex-1 overflow-auto pb-8">
            {result && !result.ok && (
              <div className="border border-route-red/40 bg-route-red/10 px-3 py-3 text-sm text-white">
                <p className="font-semibold text-route-red">
                  {result.code === "OUTSIDE_LA_COUNTY"
                    ? "Not available outside LA County"
                    : "No routes"}
                </p>
                <p className="mt-1 text-white/75">{result.message}</p>
              </div>
            )}

            {result && result.ok && (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                  {result.itineraries.length} options · mode {result.mode}
                </p>
                <ItineraryList
                  itineraries={result.itineraries}
                  selectedId={selected?.id ?? null}
                  onSelect={setSelectedId}
                />
                {selected && <StepDetails itinerary={selected} />}
              </div>
            )}
          </div>
        </section>

        <section className="relative min-h-[50vh] lg:min-h-screen">
          <RouteMap
            itinerary={selected}
            from={result && result.ok ? result.from : undefined}
            to={result && result.ok ? result.to : undefined}
          />
          <div className="pointer-events-none absolute left-4 top-4 border border-white/10 bg-ink-950/80 px-3 py-2 text-xs text-white/70 backdrop-blur">
            LA County bus planner · offline fixtures by default
          </div>
        </section>
      </div>
    </main>
  );
}
