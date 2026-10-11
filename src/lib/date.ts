/** Returns the user's current local calendar date as a UTC-midnight Date, matching Prisma's @db.Date storage. */
export function localDateFor(timezone: string, at: Date = new Date()): Date {
  const key = todayKeyFor(timezone, at);
  return new Date(`${key}T00:00:00.000Z`);
}

/** Returns the user's current local calendar date as "YYYY-MM-DD". */
export function todayKeyFor(timezone: string, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function dateKeyOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysToKey(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
