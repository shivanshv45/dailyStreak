import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireAppContext, getShellTasks } from "@/lib/session";
import { consistencyTrend, heatmapData, periodHistory, perTaskStats, weekdayPattern, type TaskWithCheckIns } from "@/lib/stats";
import { AppShell } from "@/components/shell/AppShell";
import { Heatmap } from "@/components/Heatmap";
import { TrendChart, WeekdayChart } from "@/components/StatCharts";
import { StickyNote } from "@/components/Decor";
import { Card, StatTile } from "@/components/StatsBits";
import { cadenceLabel, cadenceNoun } from "@/lib/frequency";
import { TaskActions } from "./TaskActions";

export const instant = false;

export default async function TaskStatsPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const { user, timezone } = await requireAppContext();

  const [task, shellTasks] = await Promise.all([
    prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
      include: {
        checkIns: { orderBy: { date: "desc" } },
        verifyAttempts: { orderBy: { createdAt: "desc" } },
      },
    }),
    getShellTasks(user.id, timezone),
  ]);
  if (!task) notFound();

  const t: TaskWithCheckIns = {
    id: task.id,
    title: task.title,
    mode: task.mode,
    frequency: task.frequency,
    intervalDays: task.intervalDays,
    createdAt: task.createdAt,
    archivedAt: task.archivedAt,
    checkIns: task.checkIns,
    verifyAttempts: task.verifyAttempts,
  };

  const [s] = perTaskStats([t], timezone);
  const isDaily = task.frequency === "DAILY";
  const heat = heatmapData([t], timezone, 365);
  const trend = isDaily ? consistencyTrend([t], timezone, 60) : [];
  const weekday = isDaily ? weekdayPattern([t], timezone, 90) : [];
  const weakestDay = weekday.filter((d) => d.samples >= 3).sort((a, b) => a.pct - b.pct)[0];
  const history = isDaily ? [] : periodHistory(t, timezone, 12);
  const isProof = task.mode === "PROOF";

  const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const shortFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
  const timeFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: timezone });
  const periodCaption = (key: string) => (task.frequency === "MONTHLY" ? monthFmt : shortFmt).format(new Date(`${key}T00:00:00.000Z`));

  const cadence = s.cadence;
  const recent = task.checkIns.slice(0, 20);
  const attempts = task.verifyAttempts.slice(0, 10);

  return (
    <AppShell active="stats" user={user} tasks={shellTasks} timezone={timezone}>
      <div className="mx-auto max-w-5xl px-4 pt-5 md:px-10 md:pt-7">
        <p className="text-xs text-muted">
          Profile <span className="mx-1 text-faint">/</span>{" "}
          <Link href="/profile" className="underline decoration-pink decoration-2 underline-offset-2 hover:text-ink">
            Stats
          </Link>{" "}
          <span className="mx-1 text-faint">/</span> <span className="text-ink">{task.title}</span>
        </p>

        <header className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <span className="tag" style={{ backgroundColor: "var(--tag-normal)" }}>
                {cadenceLabel(cadence)}
              </span>
              {isProof && (
                <span className="tag" style={{ backgroundColor: "var(--tag-proof)" }}>
                  Proof
                </span>
              )}
              {task.archivedAt && <span className="tag bg-faint">Archived</span>}
            </div>
            <h1 className="mt-3 break-words font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              {task.emoji ? `${task.emoji} ` : ""}
              {task.title}
            </h1>
            {task.description && <p className="mt-1.5 text-[15px] text-ink/80">{task.description}</p>}
            <p className="mt-2 text-sm text-muted">
              Started {dayFmt.format(new Date(`${task.createdAt.toISOString().slice(0, 10)}T00:00:00.000Z`))}
              {task.archivedAt && <> · archived {dayFmt.format(new Date(`${task.archivedAt.toISOString().slice(0, 10)}T00:00:00.000Z`))}, stats frozen</>}
            </p>
            <div className="mt-3">
              <TaskActions taskId={task.id} title={task.title} checkInCount={task.checkIns.length} archived={!!task.archivedAt} />
            </div>
          </div>

          {isProof && task.doneCriteria && (
            <StickyNote index={1} className="w-52 shrink-0 text-lg md:mt-2">
              done means: {task.doneCriteria}
            </StickyNote>
          )}
        </header>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            art="tile-now"
            chip={task.archivedAt ? "At archive" : "Right now"}
            value={s.current}
            unit={cadenceNoun(cadence, s.current)}
            footer="Current streak"
          />
          <StatTile art="tile-best" chip="All time" value={s.longest} unit={cadenceNoun(cadence, s.longest)} footer="Longest streak" />
          <StatTile art="tile-rate" chip={`Last ${s.windowLabel}`} value={s.completion} unit="%" footer="Completion" />
          <StatTile art="tile-total" chip="Total" value={task.checkIns.length} footer="Check-ins" />
        </div>

        <Card label="Activity · last 12 months" className="mt-8">
          <Heatmap data={heat} />
        </Card>

        {isDaily ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Card label="Consistency · rolling 7 days">
              <TrendChart data={trend} />
            </Card>
            <Card label="By weekday" aside={weakestDay ? <span className="font-semibold text-pink">weakest: {weakestDay.name}</span> : null}>
              <WeekdayChart data={weekday} />
            </Card>
          </div>
        ) : (
          <Card label={`Last 12 ${cadenceNoun(cadence, 12)}`} className="mt-3">
            <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6 md:grid-cols-12">
              {history.map((p) => (
                <div key={p.key} className="flex flex-col items-center gap-1.5">
                  <span
                    title={`${periodCaption(p.key)} · ${p.done ? "done" : p.current ? "in progress" : p.beforeStart ? "before this task" : "missed"}`}
                    className="h-8 w-8 rounded-md border-[1.5px] border-ink/70"
                    style={{
                      backgroundColor: p.done ? task.color : "rgba(255,255,255,0.8)",
                      borderStyle: p.current && !p.done ? "dashed" : "solid",
                      opacity: p.beforeStart ? 0.3 : 1,
                    }}
                  />
                  <span className="text-[11px] font-semibold text-ink/70">{periodCaption(p.key)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className={`mt-3 grid gap-3 ${isProof ? "lg:grid-cols-2" : ""}`}>
          <Card label="Recent check-ins" aside={task.checkIns.length > recent.length ? <span className="text-muted">latest {recent.length} of {task.checkIns.length}</span> : null}>
            {recent.length === 0 ? (
              <p className="text-sm text-muted">No check-ins yet</p>
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm font-medium">{dayFmt.format(c.date)}</span>
                    <span className="tag" style={{ backgroundColor: c.status === "VERIFIED" ? "var(--tag-proof)" : "var(--tag-normal)" }}>
                      {c.status === "VERIFIED" ? "Verified" : "Done"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {isProof && (
            <Card
              label="AI proof checks"
              aside={s.passRate !== null ? <span className="font-semibold text-ink">{s.passRate}% passed · {task.verifyAttempts.length} tries</span> : null}
            >
              {attempts.length === 0 ? (
                <p className="text-sm text-muted">No screenshots checked yet</p>
              ) : (
                <ul className="divide-y divide-line">
                  {attempts.map((a) => (
                    <li key={a.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{timeFmt.format(a.createdAt)}</span>
                        <span className="tag" style={{ backgroundColor: a.verdict === "PASS" ? "var(--tag-normal)" : "#dc2626" }}>
                          {a.verdict === "PASS" ? "Passed" : "Rejected"}
                        </span>
                      </div>
                      {a.reason && <p className="mt-1 text-sm text-ink/80">{a.reason}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
