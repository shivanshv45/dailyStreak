import { specFor } from "./date";
import { completionDetail } from "./streaks";
import type { TaskWithCheckIns } from "./stats";

export type Tier = {
  slug: string;
  name: string;
  level: number;
  /** all-time check-ins needed */
  minCheckIns: number;
  /** last-30-day consistency (%) needed */
  minConsistency: number;
  tagline: string;
  bg: string;
};

export const TIERS: Tier[] = [
  { slug: "noob", name: "Noob", level: 1, minCheckIns: 0, minConsistency: 0, tagline: "Everyone starts here", bg: "#8a8580" },
  { slug: "rookie", name: "Rookie", level: 2, minCheckIns: 3, minConsistency: 30, tagline: "Actually showing up", bg: "#6f8f4e" },
  { slug: "grinder", name: "Grinder", level: 3, minCheckIns: 10, minConsistency: 45, tagline: "The habit is forming", bg: "#3d7fd6" },
  { slug: "pro", name: "Pro", level: 4, minCheckIns: 30, minConsistency: 55, tagline: "It's a routine now", bg: "#9b5bd4" },
  { slug: "veteran", name: "Veteran", level: 5, minCheckIns: 75, minConsistency: 65, tagline: "Seen a few seasons", bg: "#ff7a2f" },
  { slug: "master", name: "Master", level: 6, minCheckIns: 150, minConsistency: 75, tagline: "Hard to knock off course", bg: "#ff6fb1" },
  { slug: "grandmaster", name: "Grandmaster", level: 7, minCheckIns: 300, minConsistency: 85, tagline: "Barely ever misses", bg: "#e8a723" },
  { slug: "legendary", name: "Legendary", level: 8, minCheckIns: 500, minConsistency: 90, tagline: "People tell stories", bg: "linear-gradient(135deg, #ff6fb1, #e8a723)" },
  { slug: "mythic", name: "Mythic", level: 9, minCheckIns: 1000, minConsistency: 95, tagline: "Basically a law of nature", bg: "linear-gradient(135deg, #9b5bd4, #3d7fd6 50%, #ff6fb1)" },
];

export type Rank = {
  tier: Tier;
  next: Tier | null;
  totalCheckIns: number;
  consistency: number;
  /** how many more check-ins the next tier needs (0 when already enough) */
  checkInsToGo: number;
};

/**
 * Rank = highest tier whose check-in count AND last-30-day consistency are both met.
 * Consistency averages the 30-day completion of the user's active tasks (archived ones only if nothing is active),
 * skipping tasks that don't have a finished period yet so a brand-new task can't drag it down.
 */
export function computeRank(tasks: TaskWithCheckIns[], timezone: string, totalCheckIns?: number): Rank {
  const total = totalCheckIns ?? tasks.reduce((sum, t) => sum + t.checkIns.length, 0);

  const active = tasks.filter((t) => !t.archivedAt);
  const pool = active.length > 0 ? active : tasks;
  const scores = pool
    .map((t) => completionDetail(t.checkIns, timezone, t.createdAt, 30, specFor(t, timezone), t.archivedAt ?? new Date()))
    .filter((d) => d.eligible > 0)
    .map((d) => d.pct);
  const consistency = scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let index = 0;
  TIERS.forEach((tier, i) => {
    if (total >= tier.minCheckIns && consistency >= tier.minConsistency) index = i;
  });

  const next = TIERS[index + 1] ?? null;
  return {
    tier: TIERS[index],
    next,
    totalCheckIns: total,
    consistency,
    checkInsToGo: next ? Math.max(0, next.minCheckIns - total) : 0,
  };
}
