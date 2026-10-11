import { prisma } from "@/lib/db/prisma";
import { requireAppContext, getShellTasks } from "@/lib/session";
import { overviewTiles, heatmapData, consistencyTrend, weekdayPattern, perTaskStats, insights } from "@/lib/stats";
import { AppShell } from "@/components/shell/AppShell";
import { Heatmap } from "@/components/Heatmap";
import { Sparkline } from "@/components/Sparkline";
import { TrendChart, WeekdayChart } from "@/components/StatCharts";
import { StickyNote } from "@/components/Decor";
import { Art } from "@/components/Art";
import { Card, Field, StatTile } from "@/components/StatsBits";
import { RankCard } from "@/components/RankBits";
import { getRank } from "@/lib/rank-data";
import { cadenceLabel, cadenceNoun } from "@/lib/frequency";
import Link from "next/link";

export const instant = false;

export default async function ProfilePage() {
  const { user, timezone } = await requireAppContext();

  const yearAgo = new Date();
  yearAgo.setUTCDate(yearAgo.getUTCDate() - 372);

  const [rank, tasksRaw, shellTasks] = await Promise.all([
    getRank(user.id, timezone),
    prisma.task.findMany({
      where: { userId: user.id },
      include: {
        checkIns: { where: { date: { gte: yearAgo } }, select: { date: true } },
        verifyAttempts: { select: { verdict: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    getShellTasks(user.id, timezone),
  ]);

  const tasks = tasksRaw.map((t) => ({
    id: t.id,
    title: t.title,
    mode: t.mode,
    frequency: t.frequency,
    intervalDays: t.intervalDays,
    createdAt: t.createdAt,
    archivedAt: t.archivedAt,
    checkIns: t.checkIns,
    verifyAttempts: t.verifyAttempts,
  }));
  const meta = new Map(tasksRaw.map((t) => [t.id, t]));

  const tiles = overviewTiles(tasks, timezone);
  const heat = heatmapData(tasks, timezone, 365);
  const trend = consistencyTrend(tasks, timezone, 60);
  const weekday = weekdayPattern(tasks, timezone, 90);
  const perTask = perTaskStats(tasks, timezone);
  const notes = insights(tasks, timezone);
  const weakestDay = weekday.filter((d) => d.samples >= 3).sort((a, b) => a.pct - b.pct)[0];

  return (
    <AppShell active="stats" user={user} tasks={shellTasks} timezone={timezone}>
      <div className="mx-auto max-w-5xl px-4 pt-5 md:px-10 md:pt-7">
        <p className="text-xs text-muted">
          Profile <span className="mx-1 text-faint">/</span> <span className="text-ink">Stats</span>
        </p>

        <header className="mt-4 min-w-0">
          <h1 className="truncate font-display text-3xl font-extrabold tracking-tight md:text-4xl">{user.name || "Your stats"}</h1>
          <p className="truncate text-sm text-muted">{user.email}</p>
        </header>

        <RankCard rank={rank} />

        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile art="tile-now" chip="Right now" value={tiles.bestCurrent.value} unit={cadenceNoun(tiles.bestCurrent.unit, tiles.bestCurrent.value)} footer="Best active streak" />
          <StatTile art="tile-best" chip="All time" value={tiles.longestEver.value} unit={cadenceNoun(tiles.longestEver.unit, tiles.longestEver.value)} footer="Longest streak" />
          <StatTile art="tile-rate" chip="Recent" value={tiles.avg} unit="%" footer="Completion" />
          <StatTile art="tile-total" chip="Total" value={tiles.totalCheckIns} footer="Check-ins" />
        </div>

        {notes.length > 0 && (
          <section className="mt-10">
            <span className="field-label">Notes</span>
            <div className="mt-4 flex flex-wrap gap-5">
              {notes.map((n, i) => (
                <StickyNote key={i} index={i} className="w-44 text-lg">
                  {n}
                </StickyNote>
              ))}
            </div>
          </section>
        )}

        <Card label="Last 12 months" className="mt-10">
          <Heatmap data={heat} />
        </Card>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Card label="Consistency · rolling 7 days">
            <TrendChart data={trend} />
          </Card>
          <Card label="By weekday" aside={weakestDay ? <span className="font-semibold text-pink">weakest: {weakestDay.name}</span> : null}>
            <WeekdayChart data={weekday} />
          </Card>
        </div>

        <section className="mt-10">
          <span className="field-label">Tasks</span>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {perTask.map((t) => {
              const m = meta.get(t.id)!;
              return (
                <Link key={t.id} href={`/profile/${t.id}`} className="card-lift group block rounded-2xl bg-surface p-5">
                  <div className="flex items-center gap-1.5">
                    <span className="tag" style={{ backgroundColor: "var(--tag-normal)" }}>
                      {cadenceLabel(t.cadence)}
                    </span>
                    {t.mode === "PROOF" && (
                      <span className="tag" style={{ backgroundColor: "var(--tag-proof)" }}>
                        Proof
                      </span>
                    )}
                    {m.archivedAt && <span className="tag bg-faint">Archived</span>}
                  </div>
                  <h3 className="mt-2 flex items-center gap-2 text-[15px] font-semibold">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: m.color }} />
                    <span className="truncate decoration-pink decoration-2 underline-offset-4 group-hover:underline">{m.emoji ? `${m.emoji} ` : ""}{t.title}</span>
                  </h3>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
                    <Field label={t.archived ? "At archive" : "Current"}>
                      <Art src="/icons/streak.png" size={14} />
                      {t.current}
                    </Field>
                    <Field label="Longest">{t.longest}</Field>
                    <Field label={`Last ${t.windowLabel}`}>{t.completion}%</Field>
                    {t.passRate !== null && <Field label="Proof pass">{t.passRate}%</Field>}
                  </dl>
                  <div className="mt-3">
                    <Sparkline values={t.sparkline} color={m.color} />
                  </div>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-ink/70">Open details</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
