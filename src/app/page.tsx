import { prisma } from "@/lib/db/prisma";
import { dateKeyOf, periodKeyOf, previousPeriodKey, specFor, todayKeyFor } from "@/lib/date";
import { currentStreak } from "@/lib/streaks";
import { requireAppContext } from "@/lib/session";
import { boardStatus, type BoardGroup } from "@/lib/schedule";
import { AppShell } from "@/components/shell/AppShell";
import { NewTaskButton } from "@/components/shell/NewTaskContext";
import { TaskCard, type TaskCardProps } from "@/components/TaskCard";
import { CloudEdge, ProgressRing, StickyNote } from "@/components/Decor";
import { Art } from "@/components/Art";
import { getRank } from "@/lib/rank-data";
import Link from "next/link";

export const instant = false;

export default async function BoardPage() {
  const { user, timezone } = await requireAppContext();

  const [rank, tasks] = await Promise.all([
    getRank(user.id, timezone),
    prisma.task.findMany({
      where: { userId: user.id, archivedAt: null },
      include: { checkIns: { select: { date: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const todayKey = todayKeyFor(timezone);

  const dueFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const groups: Record<string, BoardGroup> = {};

  const cards: TaskCardProps[] = tasks.map((task) => {
    const spec = specFor(task, timezone);
    const status = boardStatus(task.checkIns.map((c) => c.date), spec, todayKey);
    groups[task.id] = status.group;
    const note =
      status.group === "later" && status.dueKey
        ? `${status.doneThisPeriod ? "Done · next" : "Due"} ${dueFmt.format(new Date(`${status.dueKey}T00:00:00.000Z`))}`
        : null;
    const donePeriods = new Set(task.checkIns.map((c) => periodKeyOf(dateKeyOf(c.date), spec)));
    const currentPeriod = periodKeyOf(todayKey, spec);

    const last7: boolean[] = [];
    let cursor = currentPeriod;
    for (let i = 0; i < 7; i++) {
      last7.unshift(donePeriods.has(cursor));
      cursor = previousPeriodKey(cursor, spec);
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      emoji: task.emoji,
      color: task.color,
      mode: task.mode,
      cadence: { frequency: task.frequency, intervalDays: task.intervalDays },
      streak: currentStreak(task.checkIns, timezone, spec),
      doneToday: donePeriods.has(currentPeriod),
      last7,
      checkInCount: task.checkIns.length,
      note,
    };
  });

  const todo = cards.filter((c) => groups[c.id] === "todo");
  const done = cards.filter((c) => groups[c.id] === "done");
  const later = cards.filter((c) => groups[c.id] === "later");
  const dailyStreaks = cards.filter((c) => c.cadence.frequency === "DAILY").map((c) => c.streak);
  const bestStreak = Math.max(0, ...dailyStreaks);
  const allDone = todo.length === 0 && done.length > 0;

  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone }).format(new Date());
  const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: timezone }).format(new Date());

  return (
    <AppShell
      active="board"
      user={user}
      timezone={timezone}
      tasks={cards.map((c) => ({ id: c.id, title: c.title, emoji: c.emoji, color: c.color, doneToday: c.doneToday }))}
    >
      <div className="mx-auto max-w-5xl px-4 pt-5 md:px-10 md:pt-7">
        <p className="text-xs text-muted">
          Board <span className="mx-1 text-faint">/</span> <span className="text-ink">Today</span>
        </p>

        <section className="grad-hero grain relative mt-3 overflow-hidden rounded-3xl px-6 pb-14 pt-8 md:px-10 md:pb-20 md:pt-10">
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">{weekday}</p>
              <h1 className="mt-1 font-display text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">{dayMonth}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-ink/80">
                <span>
                  <b className="font-semibold text-ink">{todo.length}</b> to go
                </span>
                {dailyStreaks.length > 0 && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-ink/40" />
                    <span>
                      best daily streak <b className="font-semibold text-ink">{bestStreak}</b>
                    </span>
                  </>
                )}
                <span className="h-1 w-1 rounded-full bg-ink/40" />
                <Link href="/ranks" className="underline decoration-ink/40 decoration-2 underline-offset-4 hover:decoration-ink">
                  rank <b className="font-semibold text-ink">{rank.tier.name}</b>
                </Link>
              </div>
              <NewTaskButton className="btn-ink mt-6 px-6 py-3 text-[15px]">
                New task
              </NewTaskButton>
            </div>

            <div className="relative self-start md:self-auto">
              <ProgressRing done={done.length} total={todo.length + done.length} complete={allDone} />
            </div>
          </div>
          <CloudEdge />
        </section>

        {cards.length === 0 ? (
          <EmptyBoard />
        ) : (
          <div className="dot-grid -mx-4 mt-6 space-y-10 px-4 py-8 md:mx-0 md:rounded-3xl md:border md:border-line md:px-7">
            {todo.length > 0 && (
              <Group label="To do" count={todo.length} tone="var(--tag-normal)">
                {todo.map((c) => (
                  <TaskCard key={c.id} {...c} />
                ))}
              </Group>
            )}
            {done.length > 0 && (
              <Group label="Done" count={done.length} tone="var(--pink)">
                {done.map((c) => (
                  <TaskCard key={c.id} {...c} />
                ))}
              </Group>
            )}
            {later.length > 0 && (
              <Group label="Later" count={later.length} tone="var(--purple)">
                {later.map((c) => (
                  <TaskCard key={c.id} {...c} />
                ))}
              </Group>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Group({ label, count, tone, children }: { label: string; count: number; tone: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="tag" style={{ backgroundColor: tone }}>
          {label}
        </span>
        <span className="text-xs font-semibold text-muted">{count}</span>
      </div>
      <div className="grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function EmptyBoard() {
  return (
    <div className="dot-grid relative mt-8 flex min-h-72 flex-col items-center justify-center gap-6 rounded-3xl border border-line py-10 sm:flex-row">
      <Art src="/illustrations/empty-board.png" size={200} />
      <StickyNote index={0} className="w-48 text-2xl">
        add your first streak
      </StickyNote>
      <svg viewBox="0 0 120 140" className="absolute bottom-2 left-1/2 ml-20 hidden h-28 w-24 text-faint md:block" fill="none" aria-hidden>
        <path d="M10 10 C 80 20, 100 70, 60 128" stroke="currentColor" strokeWidth="1.6" strokeDasharray="5 5" />
        <path d="M52 118 L60 130 L70 120" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </div>
  );
}
