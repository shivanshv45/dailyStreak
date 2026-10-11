import { cadenceDays, type Cadence, type Frequency } from "./frequency";

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

/** How a task repeats. Custom N-day rounds are counted from `anchorKey` (the task's creation day). */
export type PeriodSpec = Cadence & { anchorKey: string };

export function specFor(task: { frequency: Frequency; intervalDays: number | null; createdAt: Date }, timezone: string): PeriodSpec {
  return { frequency: task.frequency, intervalDays: task.intervalDays, anchorKey: todayKeyFor(timezone, task.createdAt) };
}

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((Date.parse(`${toKey}T00:00:00.000Z`) - Date.parse(`${fromKey}T00:00:00.000Z`)) / 86_400_000);
}

/** First day of the period (day, Monday-based week, calendar month, or N-day round) that contains the given day. */
export function periodKeyOf(dayKey: string, spec: PeriodSpec): string {
  switch (spec.frequency) {
    case "DAILY":
      return dayKey;
    case "MONTHLY":
      return `${dayKey.slice(0, 7)}-01`;
    case "WEEKLY":
      return addDaysToKey(dayKey, -((new Date(`${dayKey}T00:00:00.000Z`).getUTCDay() + 6) % 7));
    case "CUSTOM": {
      const n = cadenceDays(spec);
      return addDaysToKey(spec.anchorKey, Math.floor(daysBetween(spec.anchorKey, dayKey) / n) * n);
    }
  }
}

export function previousPeriodKey(periodKey: string, spec: PeriodSpec): string {
  switch (spec.frequency) {
    case "DAILY":
      return addDaysToKey(periodKey, -1);
    case "WEEKLY":
      return addDaysToKey(periodKey, -7);
    case "CUSTOM":
      return addDaysToKey(periodKey, -cadenceDays(spec));
    case "MONTHLY": {
      const d = new Date(`${periodKey}T00:00:00.000Z`);
      d.setUTCMonth(d.getUTCMonth() - 1);
      return d.toISOString().slice(0, 10);
    }
  }
}

export function nextPeriodKey(periodKey: string, spec: PeriodSpec): string {
  switch (spec.frequency) {
    case "DAILY":
      return addDaysToKey(periodKey, 1);
    case "WEEKLY":
      return addDaysToKey(periodKey, 7);
    case "CUSTOM":
      return addDaysToKey(periodKey, cadenceDays(spec));
    case "MONTHLY": {
      const d = new Date(`${periodKey}T00:00:00.000Z`);
      d.setUTCMonth(d.getUTCMonth() + 1);
      return d.toISOString().slice(0, 10);
    }
  }
}

/** Start of the current period for the user's timezone, as a UTC-midnight Date. */
export function periodStartDate(timezone: string, spec: PeriodSpec): Date {
  return new Date(`${periodKeyOf(todayKeyFor(timezone), spec)}T00:00:00.000Z`);
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
