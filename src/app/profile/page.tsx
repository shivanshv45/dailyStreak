import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { overviewTiles, heatmapData, consistencyTrend, weekdayPattern, perTaskStats, insights } from "@/lib/stats";
import { Heatmap } from "@/components/Heatmap";
import { Sparkline } from "@/components/Sparkline";
import { TrendChart, WeekdayChart } from "@/components/StatCharts";

export const instant = false;

export default async function ProfilePage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;
  const userId = session.user.id;

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  const timezone = profile.timezone;

  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 365);

  const tasksRaw = await prisma.task.findMany({
    where: { userId },
    include: {
      checkIns: { where: { date: { gte: yearAgo } } },
      verifyAttempts: { select: { verdict: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const tasks = tasksRaw.map((t) => ({
    id: t.id,
    title: t.title,
    mode: t.mode,
    createdAt: t.createdAt,
    checkIns: t.checkIns,
    verifyAttempts: t.verifyAttempts,
  }));

  const tiles = overviewTiles(tasks, timezone);
  const heat = heatmapData(tasks, timezone, 365);
  const trend = consistencyTrend(tasks, timezone, 60);
  const weekday = weekdayPattern(tasks, timezone, 90);
  const perTask = perTaskStats(tasks, timezone);
  const notes = insights(tasks, timezone);

  const colorById = new Map(tasksRaw.map((t) => [t.id, t.color]));

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Profile</h1>
          <Link href="/" className="text-sm text-neutral-400 hover:text-white">
            Board
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Best streak" value={tiles.bestCurrentStreak} />
          <Tile label="Longest ever" value={tiles.longestEver} />
          <Tile label="30-day avg" value={`${tiles.avg30}%`} />
          <Tile label="Total check-ins" value={tiles.totalCheckIns} />
        </div>

        {notes.length > 0 && (
          <div className="mt-6 space-y-1.5 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            {notes.map((n, i) => (
              <p key={i} className="text-sm text-neutral-300">
                {n}
              </p>
            ))}
          </div>
        )}

        <Section title="Year">
          <Heatmap data={heat} />
        </Section>

        <Section title="Consistency (rolling 7-day %)">
          <TrendChart data={trend} />
        </Section>

        <Section title="Weekday pattern">
          <WeekdayChart data={weekday} />
        </Section>

        <Section title="Tasks">
          <div className="space-y-3">
            {perTask.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-neutral-500">
                    🔥 {t.current} current · {t.longest} longest · {t.completion30}% (30d)
                    {t.passRate !== null && ` · ${t.passRate}% verified`}
                  </p>
                </div>
                <Sparkline values={t.sparkline} color={colorById.get(t.id) ?? "#6366f1"} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-medium text-neutral-400">{title}</h2>
      {children}
    </div>
  );
}
