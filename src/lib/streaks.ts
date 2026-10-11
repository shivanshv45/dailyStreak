import { addDaysToKey, dateKeyOf, todayKeyFor } from "./date";

export type CheckInLike = { date: Date };

/** Current consecutive-day streak. An unfinished today doesn't break it. */
export function currentStreak(checkIns: CheckInLike[], timezone: string): number {
  const doneDates = new Set(checkIns.map((c) => dateKeyOf(c.date)));
  const todayKey = todayKeyFor(timezone);

  let cursor = doneDates.has(todayKey) ? todayKey : addDaysToKey(todayKey, -1);
  let streak = 0;

  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = addDaysToKey(cursor, -1);
  }

  return streak;
}

/** Longest consecutive-day streak across all history. */
export function longestStreak(checkIns: CheckInLike[]): number {
  const dateKeys = checkIns.map((c) => dateKeyOf(c.date)).sort();
  if (dateKeys.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < dateKeys.length; i++) {
    if (dateKeys[i] === dateKeys[i - 1]) continue;
    if (addDaysToKey(dateKeys[i - 1], 1) === dateKeys[i]) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }

  return longest;
}

/** Completion % over the last N days, counting only days on/after task creation. */
export function completionRate(
  checkIns: CheckInLike[],
  timezone: string,
  createdAt: Date,
  days: number,
): number {
  const doneDates = new Set(checkIns.map((c) => dateKeyOf(c.date)));
  const todayKey = todayKeyFor(timezone);
  const createdKey = todayKeyFor(timezone, createdAt);

  let eligible = 0;
  let done = 0;
  let cursor = todayKey;

  for (let i = 0; i < days; i++) {
    if (cursor < createdKey) break;
    eligible += 1;
    if (doneDates.has(cursor)) done += 1;
    cursor = addDaysToKey(cursor, -1);
  }

  return eligible === 0 ? 0 : Math.round((done / eligible) * 100);
}
