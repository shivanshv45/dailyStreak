import { addDaysToKey, dateKeyOf, nextPeriodKey, periodKeyOf, type PeriodSpec } from "./date";

/**
 * The day a period's task becomes due. Daily and N-day rounds are due from the first day of the round;
 * weekly tasks on the weekday they were created, monthly ones on the day-of-month they were created
 * (clamped for shorter months).
 */
export function dueKeyFor(periodKey: string, spec: PeriodSpec): string {
  switch (spec.frequency) {
    case "DAILY":
    case "CUSTOM":
      return periodKey;
    case "WEEKLY": {
      const offset = (new Date(`${spec.anchorKey}T00:00:00.000Z`).getUTCDay() + 6) % 7;
      return addDaysToKey(periodKey, offset);
    }
    case "MONTHLY": {
      const [year, month] = periodKey.split("-").map(Number);
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const wanted = Number(spec.anchorKey.slice(8, 10));
      return `${periodKey.slice(0, 7)}-${String(Math.min(wanted, lastDay)).padStart(2, "0")}`;
    }
  }
}

export type BoardGroup = "todo" | "done" | "later";

export type BoardStatus = {
  group: BoardGroup;
  /** for "later": when the task is next due */
  dueKey: string | null;
  /** for "later": already finished this period, so it's waiting for the next one */
  doneThisPeriod: boolean;
};

/**
 * Where a task belongs on today's board.
 * todo  = due now and not finished this period
 * done  = finished today
 * later = not due yet, or finished earlier in the period and waiting for the next one
 */
export function boardStatus(checkInDates: Date[], spec: PeriodSpec, todayKey: string): BoardStatus {
  const keys = checkInDates.map(dateKeyOf);
  const period = periodKeyOf(todayKey, spec);

  if (keys.includes(todayKey)) return { group: "done", dueKey: null, doneThisPeriod: true };

  if (keys.some((k) => periodKeyOf(k, spec) === period)) {
    return { group: "later", dueKey: dueKeyFor(nextPeriodKey(period, spec), spec), doneThisPeriod: true };
  }

  const due = dueKeyFor(period, spec);
  if (todayKey >= due) return { group: "todo", dueKey: null, doneThisPeriod: false };
  return { group: "later", dueKey: due, doneThisPeriod: false };
}
