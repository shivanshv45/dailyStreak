import { dateKeyOf, periodKeyOf, previousPeriodKey, todayKeyFor, type PeriodSpec } from "./date";
import { cadenceDays } from "./frequency";

export type CheckInLike = { date: Date };

function donePeriods(checkIns: CheckInLike[], spec: PeriodSpec): Set<string> {
  return new Set(checkIns.map((c) => periodKeyOf(dateKeyOf(c.date), spec)));
}

/** Consecutive periods done, counting back from now. An unfinished current period doesn't break it. */
export function currentStreak(checkIns: CheckInLike[], timezone: string, spec: PeriodSpec, at: Date = new Date()): number {
  const done = donePeriods(checkIns, spec);
  const current = periodKeyOf(todayKeyFor(timezone, at), spec);

  let cursor = done.has(current) ? current : previousPeriodKey(current, spec);
  let streak = 0;
  while (done.has(cursor)) {
    streak += 1;
    cursor = previousPeriodKey(cursor, spec);
  }
  return streak;
}

export function longestStreak(checkIns: CheckInLike[], spec: PeriodSpec): number {
  const keys = [...donePeriods(checkIns, spec)].sort();
  if (keys.length === 0) return 0;

  let longest = 1;
  let run = 1;
  for (let i = 1; i < keys.length; i++) {
    run = previousPeriodKey(keys[i], spec) === keys[i - 1] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

export function windowPeriods(days: number, spec: PeriodSpec): number {
  if (spec.frequency === "DAILY") return days;
  return Math.max(spec.frequency === "WEEKLY" ? 1 : 3, Math.ceil(days / cadenceDays(spec)));
}

/** Completion % over a recent window. Periods before the task existed are skipped; the current period only counts once it's done. */
export function completionRate(
  checkIns: CheckInLike[],
  timezone: string,
  createdAt: Date,
  days: number,
  spec: PeriodSpec,
  at: Date = new Date(),
): number {
  return completionDetail(checkIns, timezone, createdAt, days, spec, at).pct;
}

/** Same as completionRate, plus how many periods it was based on, so callers can tell "0%" from "no history yet". */
export function completionDetail(
  checkIns: CheckInLike[],
  timezone: string,
  createdAt: Date,
  days: number,
  spec: PeriodSpec,
  at: Date = new Date(),
): { pct: number; eligible: number } {
  const done = donePeriods(checkIns, spec);
  const createdKey = periodKeyOf(todayKeyFor(timezone, createdAt), spec);

  let cursor = periodKeyOf(todayKeyFor(timezone, at), spec);
  let eligible = 0;
  let hit = 0;

  for (let i = 0; i < windowPeriods(days, spec); i++) {
    if (cursor < createdKey) break;
    const isDone = done.has(cursor);
    if (i > 0 || isDone) {
      eligible += 1;
      if (isDone) hit += 1;
    }
    cursor = previousPeriodKey(cursor, spec);
  }

  return { pct: eligible === 0 ? 0 : Math.round((hit / eligible) * 100), eligible };
}

/** 0/100 per period for the last `count` periods, oldest first. */
export function periodSeries(checkIns: CheckInLike[], timezone: string, spec: PeriodSpec, count: number, at: Date = new Date()): number[] {
  const done = donePeriods(checkIns, spec);
  let cursor = periodKeyOf(todayKeyFor(timezone, at), spec);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.unshift(done.has(cursor) ? 100 : 0);
    cursor = previousPeriodKey(cursor, spec);
  }
  return out;
}
