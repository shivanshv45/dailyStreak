import { prisma } from "@/lib/db/prisma";
import { computeRank } from "@/lib/ranks";

export async function getRank(userId: string, timezone: string) {
  const tasks = await prisma.task.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      mode: true,
      frequency: true,
      intervalDays: true,
      createdAt: true,
      archivedAt: true,
      checkIns: { select: { date: true } },
    },
  });
  return computeRank(tasks, timezone);
}
