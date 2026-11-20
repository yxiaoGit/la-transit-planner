"use client";

import { useEffect, useState } from "react";
import type { Place } from "@/lib/types";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function PlaceInput({ id, label, value, onChange, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setSuggestions(data.results ?? []);
    }, 120);
    return () => clearTimeout(handle);
  }, [value]);

  return (
    <label className="relative block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-signal-soft/80">
        {label}
      </span>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-none border border-white/15 bg-ink-900/80 px-3 py-3 text-base text-white outline-none ring-signal/0 transition focus:border-signal focus:ring-2 focus:ring-signal/40"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto border border-white/10 bg-ink-900 shadow-xl">
          {suggestions.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-signal/15"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(p.name);
                  setOpen(false);
                }}
              >
                <span className="font-medium text-white">{p.name}</span>
                <span className="text-xs text-white/50">{p.city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
