import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { periodStartDate, specFor } from "@/lib/date";
import type { ShellTask } from "@/components/shell/AppShell";

export async function requireAppContext() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });

  return {
    user: { id: session.user.id, name: session.user.name ?? "", email: session.user.email ?? "" },
    timezone: profile.timezone,
  };
}

export async function getShellTasks(userId: string, timezone: string): Promise<ShellTask[]> {
  const tasks = await prisma.task.findMany({
    where: { userId, archivedAt: null },
    select: {
      id: true,
      title: true,
      emoji: true,
      color: true,
      frequency: true,
      intervalDays: true,
      createdAt: true,
      checkIns: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return tasks.map((t) => {
    const start = periodStartDate(timezone, specFor(t, timezone));
    const latest = t.checkIns[0]?.date;
    return { id: t.id, title: t.title, emoji: t.emoji, color: t.color, doneToday: !!latest && latest >= start };
  });
}
