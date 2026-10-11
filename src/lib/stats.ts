import { addDaysToKey, dateKeyOf, todayKeyFor } from "./date";
import { completionRate, currentStreak, longestStreak, type CheckInLike } from "./streaks";

export type TaskWithCheckIns = {
  id: string;
  title: string;
  mode: "NORMAL" | "PROOF";
  createdAt: Date;
  checkIns: CheckInLike[];
  verifyAttempts?: { verdict: "PASS" | "FAIL" }[];
};

export function overviewTiles(tasks: TaskWithCheckIns[], timezone: string) {
  const bestCurrentStreak = Math.max(0, ...tasks.map((t) => currentStreak(t.checkIns, timezone)));
  const longestEver = Math.max(0, ...tasks.map((t) => longestStreak(t.checkIns)));
  const avg30 =
    tasks.length === 0
      ? 0
      : Math.round(
          tasks.reduce((sum, t) => sum + completionRate(t.checkIns, timezone, t.createdAt, 30), 0) /
            tasks.length,
        );
  const totalCheckIns = tasks.reduce((sum, t) => sum + t.checkIns.length, 0);

  return { bestCurrentStreak, longestEver, avg30, totalCheckIns };
}

/** One entry per day for the last `days` days: { key, pct } where pct = % of tasks done that day. */
export function heatmapData(tasks: TaskWithCheckIns[], timezone: string, days: number) {
  const todayKey = todayKeyFor(timezone);
  const perTaskDoneDates = tasks.map((t) => new Set(t.checkIns.map((c) => dateKeyOf(c.date))));
  const perTaskCreatedKey = tasks.map((t) => todayKeyFor(timezone, t.createdAt));

  const result: { key: string; pct: number }[] = [];
  let cursor = todayKey;
  const buffer: { key: string; pct: number }[] = [];

  for (let i = 0; i < days; i++) {
    let eligible = 0;
    let done = 0;
    for (let t = 0; t < tasks.length; t++) {
      if (cursor < perTaskCreatedKey[t]) continue;
      eligible += 1;
      if (perTaskDoneDates[t].has(cursor)) done += 1;
    }
    buffer.push({ key: cursor, pct: eligible === 0 ? 0 : Math.round((done / eligible) * 100) });
    cursor = addDaysToKey(cursor, -1);
  }

  buffer.reverse();
  result.push(...buffer);
  return result;
}

/** Rolling 7-day completion % for each of the last `days` days. */
export function consistencyTrend(tasks: TaskWithCheckIns[], timezone: string, days: number) {
  const heat = heatmapData(tasks, timezone, days + 6);
  const pctByKey = new Map(heat.map((h) => [h.key, h.pct]));
  const keys = heat.map((h) => h.key);

  const trend: { key: string; rolling7: number }[] = [];
  for (let i = 6; i < keys.length; i++) {
    const window = keys.slice(i - 6, i + 1);
    const avg = Math.round(window.reduce((sum, k) => sum + (pctByKey.get(k) ?? 0), 0) / 7);
    trend.push({ key: keys[i], rolling7: avg });
  }
  return trend;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayPattern(tasks: TaskWithCheckIns[], timezone: string, days: number) {
  const heat = heatmapData(tasks, timezone, days);
  const sums = new Array(7).fill(0);
  const counts = new Array(7).fill(0);

  for (const { key, pct } of heat) {
    const weekday = new Date(`${key}T00:00:00.000Z`).getUTCDay();
    sums[weekday] += pct;
    counts[weekday] += 1;
  }

  return WEEKDAY_LABELS.map((label, i) => ({
    label,
    pct: counts[i] === 0 ? 0 : Math.round(sums[i] / counts[i]),
  }));
}

export function perTaskStats(tasks: TaskWithCheckIns[], timezone: string) {
  return tasks.map((t) => {
    const attempts = t.verifyAttempts ?? [];
    const passRate =
      attempts.length === 0 ? null : Math.round((attempts.filter((a) => a.verdict === "PASS").length / attempts.length) * 100);

    return {
      id: t.id,
      title: t.title,
      mode: t.mode,
      current: currentStreak(t.checkIns, timezone),
      longest: longestStreak(t.checkIns),
      completion30: completionRate(t.checkIns, timezone, t.createdAt, 30),
      sparkline: heatmapData([t], timezone, 30).map((d) => d.pct),
      passRate,
    };
  });
}

export function insights(tasks: TaskWithCheckIns[], timezone: string): string[] {
  const out: string[] = [];
  const per = perTaskStats(tasks, timezone);

  for (const t of per) {
    if (t.longest > 0 && t.current === t.longest && t.longest >= 3) {
      out.push(`${t.title} is at its longest streak ever: ${t.longest} days.`);
    }
  }

  const weakest = per
    .filter((t) => t.completion30 < 50)
    .sort((a, b) => a.completion30 - b.completion30)[0];
  if (weakest) {
    out.push(`${weakest.title} is at ${weakest.completion30}% over the last 30 days — your weakest task.`);
  }

  const weekdays = weekdayPattern(tasks, timezone, 60);
  const worstDay = [...weekdays].sort((a, b) => a.pct - b.pct)[0];
  if (worstDay && worstDay.pct < 60) {
    out.push(`${worstDay.label} is your weakest day (${worstDay.pct}% average completion).`);
  }

  return out.slice(0, 4);
}
