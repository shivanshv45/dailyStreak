import { addDaysToKey, dateKeyOf, periodKeyOf, previousPeriodKey, specFor, todayKeyFor } from "./date";
import { cadenceDays, cadenceNoun, type Cadence, type Frequency } from "./frequency";
import { completionDetail, completionRate, currentStreak, longestStreak, periodSeries, windowPeriods, type CheckInLike } from "./streaks";

export type TaskWithCheckIns = {
  id: string;
  title: string;
  mode: "NORMAL" | "PROOF";
  frequency: Frequency;
  intervalDays: number | null;
  createdAt: Date;
  archivedAt: Date | null;
  checkIns: CheckInLike[];
  verifyAttempts?: { verdict: "PASS" | "FAIL" }[];
};

type Best = { value: number; unit: Cadence };

function bestOf(entries: Best[]): Best {
  return entries.reduce<Best>(
    (best, e) => (e.value * cadenceDays(e.unit) > best.value * cadenceDays(best.unit) ? e : best),
    { value: 0, unit: { frequency: "DAILY", intervalDays: null } },
  );
}

export function overviewTiles(tasks: TaskWithCheckIns[], timezone: string) {
  // "current" and recent-completion only describe tasks still on the board; archived ones keep contributing to all-time numbers
  const active = tasks.filter((t) => !t.archivedAt);
  const activeSpecs = active.map((t) => specFor(t, timezone));
  const bestCurrent = bestOf(active.map((t, i) => ({ value: currentStreak(t.checkIns, timezone, activeSpecs[i]), unit: activeSpecs[i] })));
  const longestEver = bestOf(tasks.map((t) => ({ value: longestStreak(t.checkIns, specFor(t, timezone)), unit: specFor(t, timezone) })));
  const avg =
    active.length === 0
      ? 0
      : Math.round(active.reduce((sum, t, i) => sum + completionRate(t.checkIns, timezone, t.createdAt, 30, activeSpecs[i]), 0) / active.length);
  const totalCheckIns = tasks.reduce((sum, t) => sum + t.checkIns.length, 0);

  return { bestCurrent, longestEver, avg, totalCheckIns };
}

/**
 * One entry per day: % of what was due that day that got done.
 * Daily tasks are due every day; a weekly/monthly check-in counts as due-and-done on the day it happened.
 */
export function heatmapData(tasks: TaskWithCheckIns[], timezone: string, days: number) {
  const todayKey = todayKeyFor(timezone);
  const doneDays = tasks.map((t) => new Set(t.checkIns.map((c) => dateKeyOf(c.date))));
  const createdKeys = tasks.map((t) => todayKeyFor(timezone, t.createdAt));
  const archivedKeys = tasks.map((t) => (t.archivedAt ? todayKeyFor(timezone, t.archivedAt) : null));

  const out: { key: string; pct: number; due: number }[] = [];
  let cursor = todayKey;

  for (let i = 0; i < days; i++) {
    let eligible = 0;
    let done = 0;
    for (let t = 0; t < tasks.length; t++) {
      const checked = doneDays[t].has(cursor);
      if (tasks[t].frequency === "DAILY") {
        if (cursor < createdKeys[t]) continue;
        if (archivedKeys[t] && cursor >= archivedKeys[t]! && !checked) continue;
        eligible += 1;
        if (checked) done += 1;
      } else if (checked) {
        eligible += 1;
        done += 1;
      }
    }
    out.push({ key: cursor, pct: eligible === 0 ? 0 : Math.round((done / eligible) * 100), due: eligible });
    cursor = addDaysToKey(cursor, -1);
  }

  return out.reverse();
}

/** Rolling 7-day completion % for each of the last `days` days. */
export function consistencyTrend(tasks: TaskWithCheckIns[], timezone: string, days: number) {
  const heat = heatmapData(tasks, timezone, days + 6);

  const trend: { key: string; rolling7: number }[] = [];
  for (let i = 6; i < heat.length; i++) {
    const window = heat.slice(i - 6, i + 1);
    trend.push({ key: heat[i].key, rolling7: Math.round(window.reduce((sum, h) => sum + h.pct, 0) / 7) });
  }
  return trend;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Average completion per weekday, counting only days on which something was actually due. */
export function weekdayPattern(tasks: TaskWithCheckIns[], timezone: string, days: number) {
  const heat = heatmapData(tasks, timezone, days);
  const sums = new Array(7).fill(0);
  const counts = new Array(7).fill(0);

  for (const { key, pct, due } of heat) {
    if (due === 0) continue;
    const weekday = new Date(`${key}T00:00:00.000Z`).getUTCDay();
    sums[weekday] += pct;
    counts[weekday] += 1;
  }

  return WEEKDAY_LABELS.map((label, i) => ({
    label,
    name: WEEKDAY_NAMES[i],
    samples: counts[i],
    pct: counts[i] === 0 ? 0 : Math.round(sums[i] / counts[i]),
  }));
}

export function perTaskStats(tasks: TaskWithCheckIns[], timezone: string) {
  return tasks.map((t) => {
    const attempts = t.verifyAttempts ?? [];
    const passRate =
      attempts.length === 0 ? null : Math.round((attempts.filter((a) => a.verdict === "PASS").length / attempts.length) * 100);
    const spec = specFor(t, timezone);
    const periods = windowPeriods(30, spec);
    const at = t.archivedAt ?? new Date();
    const completion = completionDetail(t.checkIns, timezone, t.createdAt, 30, spec, at);

    return {
      id: t.id,
      title: t.title,
      mode: t.mode,
      archived: !!t.archivedAt,
      cadence: { frequency: t.frequency, intervalDays: t.intervalDays } as Cadence,
      current: currentStreak(t.checkIns, timezone, spec, at),
      longest: longestStreak(t.checkIns, spec),
      completion: completion.pct,
      completionPeriods: completion.eligible,
      windowLabel: `${periods} ${cadenceNoun(spec, periods)}`,
      sparkline: periodSeries(t.checkIns, timezone, spec, t.frequency === "DAILY" ? 30 : 12, at),
      passRate,
    };
  });
}

/** One entry per period (day/week/month/round) for the last `count` periods, oldest first. */
export function periodHistory(task: TaskWithCheckIns, timezone: string, count: number) {
  const spec = specFor(task, timezone);
  const at = task.archivedAt ?? new Date();
  const done = new Set(task.checkIns.map((c) => periodKeyOf(dateKeyOf(c.date), spec)));
  const createdKey = periodKeyOf(todayKeyFor(timezone, task.createdAt), spec);

  const currentKey = periodKeyOf(todayKeyFor(timezone, at), spec);
  const out: { key: string; done: boolean; current: boolean; beforeStart: boolean }[] = [];
  let cursor = currentKey;
  for (let i = 0; i < count; i++) {
    out.unshift({ key: cursor, done: done.has(cursor), current: i === 0, beforeStart: cursor < createdKey });
    cursor = previousPeriodKey(cursor, spec);
  }
  return out;
}

export function insights(tasks: TaskWithCheckIns[], timezone: string): string[] {
  const out: string[] = [];
  const per = perTaskStats(tasks, timezone).filter((t) => !t.archived);

  for (const t of per) {
    if (t.longest >= 3 && t.current === t.longest) {
      out.push(`${t.title}: best run ever, ${t.longest} ${cadenceNoun(t.cadence, t.longest)}`);
    }
  }

  // "slipping" only means something once there are a few finished periods to judge
  const weakest = per.filter((t) => t.completionPeriods >= 3 && t.completion < 50).sort((a, b) => a.completion - b.completion)[0];
  if (weakest) {
    out.push(`${weakest.title} is slipping: ${weakest.completion}% recently`);
  }

  if (tasks.some((t) => t.frequency === "DAILY" && !t.archivedAt)) {
    // needs at least 3 observed days of that weekday, otherwise it's noise
    const worstDay = weekdayPattern(tasks, timezone, 60)
      .filter((d) => d.samples >= 3)
      .sort((a, b) => a.pct - b.pct)[0];
    if (worstDay && worstDay.pct < 60) {
      out.push(`You finish least on ${worstDay.name}s (${worstDay.pct}%)`);
    }
  }

  return out.slice(0, 4);
}
