import { auth } from "@/lib/auth/server";
import { signOut } from "@/app/auth/actions";
import { prisma } from "@/lib/db/prisma";
import { localDateFor, addDaysToKey, dateKeyOf } from "@/lib/date";
import { currentStreak } from "@/lib/streaks";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskModal } from "@/components/AddTaskModal";
import Link from "next/link";

export const instant = false;

export default async function HomePage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;
  const userId = session.user.id;

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  const timezone = profile.timezone;
  const today = localDateFor(timezone);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const tasks = await prisma.task.findMany({
    where: { userId, archivedAt: null },
    include: { checkIns: { where: { date: { gte: sevenDaysAgo } } } },
    orderBy: { createdAt: "asc" },
  });

  const todayKey = dateKeyOf(today);
  const last7Keys: string[] = [];
  let cursor = todayKey;
  for (let i = 0; i < 7; i++) {
    last7Keys.unshift(cursor);
    cursor = addDaysToKey(cursor, -1);
  }

  const cards = tasks.map((task) => {
    const doneDates = new Set(task.checkIns.map((c) => dateKeyOf(c.date)));
    return {
      id: task.id,
      title: task.title,
      emoji: task.emoji,
      color: task.color,
      mode: task.mode,
      streak: currentStreak(task.checkIns, timezone),
      doneToday: doneDates.has(todayKey),
      last7: last7Keys.map((k) => doneDates.has(k)),
    };
  });

  const doneCount = cards.filter((c) => c.doneToday).length;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">DailyStreak</h1>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/profile" className="text-neutral-400 hover:text-white">
              Profile
            </Link>
            <Link href="/settings" className="text-neutral-400 hover:text-white">
              Settings
            </Link>
            <form action={signOut}>
              <button className="text-neutral-400 hover:text-white">Sign out</button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-neutral-400">
          {doneCount} / {cards.length} done today
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards
            .sort((a, b) => Number(a.doneToday) - Number(b.doneToday))
            .map((card) => (
              <TaskCard key={card.id} {...card} />
            ))}
          <AddTaskModal />
        </div>
      </div>
    </main>
  );
}
