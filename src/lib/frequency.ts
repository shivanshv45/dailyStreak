export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";

export type Cadence = { frequency: Frequency; intervalDays: number | null };

export const MIN_INTERVAL = 2;
export const MAX_INTERVAL = 365;

const FIXED = {
  DAILY: { label: "Daily", noun: "day", scope: "Today", days: 1 },
  WEEKLY: { label: "Weekly", noun: "week", scope: "This week", days: 7 },
  MONTHLY: { label: "Monthly", noun: "month", scope: "This month", days: 30 },
} as const;

function interval(c: Cadence): number {
  return c.intervalDays ?? MIN_INTERVAL;
}

export function cadenceLabel(c: Cadence): string {
  return c.frequency === "CUSTOM" ? `Every ${interval(c)} days` : FIXED[c.frequency].label;
}

export function cadenceScope(c: Cadence): string {
  return c.frequency === "CUSTOM" ? "This round" : FIXED[c.frequency].scope;
}

export function cadenceNoun(c: Cadence, n: number): string {
  const noun = c.frequency === "CUSTOM" ? "round" : FIXED[c.frequency].noun;
  return n === 1 ? noun : `${noun}s`;
}

export function cadenceDays(c: Cadence): number {
  return c.frequency === "CUSTOM" ? interval(c) : FIXED[c.frequency].days;
}
