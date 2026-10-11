"use server";

import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { localDateFor } from "@/lib/date";
import { revalidatePath } from "next/cache";

async function requireUserId(): Promise<string> {
  const { data: session } = await auth.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createTask(formData: FormData) {
  const userId = await requireUserId();

  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  const description = String(formData.get("description") ?? "").trim().slice(0, 120) || null;
  const doneCriteria = String(formData.get("doneCriteria") ?? "").trim().slice(0, 200) || null;
  const mode = formData.get("mode") === "PROOF" ? "PROOF" : "NORMAL";
  const color = String(formData.get("color") ?? "#6366f1");
  const emoji = String(formData.get("emoji") ?? "").trim().slice(0, 8) || null;

  if (!title) throw new Error("Title is required");

  await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await prisma.task.create({
    data: { userId, title, description, doneCriteria, mode, color, emoji },
  });

  revalidatePath("/");
}

export async function updateTask(taskId: string, formData: FormData) {
  const userId = await requireUserId();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) throw new Error("Not found");

  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  const description = String(formData.get("description") ?? "").trim().slice(0, 120) || null;
  const color = String(formData.get("color") ?? task.color);
  const emoji = String(formData.get("emoji") ?? "").trim().slice(0, 8) || null;

  await prisma.task.update({
    where: { id: taskId },
    data: { title: title || task.title, description, color, emoji },
  });

  revalidatePath("/");
}

export async function archiveTask(taskId: string) {
  const userId = await requireUserId();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) throw new Error("Not found");

  await prisma.task.update({
    where: { id: taskId },
    data: { archivedAt: task.archivedAt ? null : new Date() },
  });

  revalidatePath("/");
}

export async function deleteTask(taskId: string) {
  const userId = await requireUserId();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) throw new Error("Not found");

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath("/");
}

export async function toggleCheckIn(taskId: string) {
  const userId = await requireUserId();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) throw new Error("Not found");
  if (task.mode !== "NORMAL") throw new Error("Proof-mode tasks must be verified, not toggled");
  if (task.archivedAt) throw new Error("Task is archived");

  const profile = await prisma.profile.findUnique({ where: { userId } });
  const timezone = profile?.timezone ?? "UTC";
  const today = localDateFor(timezone);

  const existing = await prisma.checkIn.findUnique({
    where: { taskId_date: { taskId, date: today } },
  });

  if (existing) {
    await prisma.checkIn.delete({ where: { id: existing.id } });
  } else {
    await prisma.checkIn.create({
      data: { taskId, userId, date: today, status: "DONE" },
    });
  }

  revalidatePath("/");
}
