export function parseDepartAt(value?: string): Date {
  if (!value) return new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

/** "HH:MM" -> minutes from midnight */
export function clockToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function dateToMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function minutesToDateOn(day: Date, minutes: number): Date {
  const out = new Date(day);
  out.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return out;
}

export function nextDeparture(
  day: Date,
  firstTrip: string,
  lastTrip: string,
  frequencyMinutes: number,
  notBefore: Date
): Date | null {
  const first = clockToMinutes(firstTrip);
  const last = clockToMinutes(lastTrip);
  let t = first;
  const need = dateToMinutes(notBefore);
  while (t <= last) {
    if (t >= need) return minutesToDateOn(day, t);
    t += frequencyMinutes;
  }
  // next day first trip
  const tomorrow = new Date(day);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return minutesToDateOn(tomorrow, first);
}
