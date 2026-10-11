"use server";

import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { localDateFor, periodStartDate, specFor } from "@/lib/date";
import { MAX_INTERVAL, MIN_INTERVAL, type Frequency } from "@/lib/frequency";
import { revalidatePath } from "next/cache";
import { TASK_COLORS } from "@/lib/colors";

function safeColor(value: FormDataEntryValue | null, fallback: string): string {
  const s = String(value ?? "");
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}

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
  const rawFrequency = formData.get("frequency");
  let frequency: Frequency = rawFrequency === "WEEKLY" || rawFrequency === "MONTHLY" || rawFrequency === "CUSTOM" ? rawFrequency : "DAILY";
  let intervalDays: number | null = null;
  if (frequency === "CUSTOM") {
    const n = Number(formData.get("intervalDays"));
    if (!Number.isInteger(n) || n < 1 || n > MAX_INTERVAL) throw new Error(`Repeat must be every ${MIN_INTERVAL}–${MAX_INTERVAL} days`);
    if (n === 1) frequency = "DAILY";
    else intervalDays = n;
  }
  const color = safeColor(formData.get("color"), TASK_COLORS[0]);
  const emoji = String(formData.get("emoji") ?? "").trim().slice(0, 8) || null;

  if (!title) throw new Error("Title is required");

  await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await prisma.task.create({
    data: { userId, title, description, doneCriteria, mode, frequency, intervalDays, color, emoji },
  });

  revalidatePath("/");
}

export async function updateTask(taskId: string, formData: FormData) {
  const userId = await requireUserId();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) throw new Error("Not found");

  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  const description = String(formData.get("description") ?? "").trim().slice(0, 120) || null;
  const color = safeColor(formData.get("color"), task.color);
  const emoji = String(formData.get("emoji") ?? "").trim().slice(0, 8) || null;

  await prisma.task.update({
    where: { id: taskId },
    data: { title: title || task.title, description, color, emoji },
  });

  revalidatePath("/");
}

function revalidateEverywhere() {
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/settings");
}

async function requireOwnedTask(taskId: string) {
  const userId = await requireUserId();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) throw new Error("Not found");
  return task;
}

/** Hides the task from the board but keeps every check-in. */
export async function archiveTask(taskId: string) {
  const task = await requireOwnedTask(taskId);
  if (!task.archivedAt) await prisma.task.update({ where: { id: taskId }, data: { archivedAt: new Date() } });
  revalidateEverywhere();
}

export async function restoreTask(taskId: string) {
  const task = await requireOwnedTask(taskId);
  if (task.archivedAt) await prisma.task.update({ where: { id: taskId }, data: { archivedAt: null } });
  revalidateEverywhere();
}

/** Removes the task together with all of its check-ins and proof attempts (cascade). */
export async function deleteTask(taskId: string) {
  await requireOwnedTask(taskId);
  await prisma.task.delete({ where: { id: taskId } });
  revalidateEverywhere();
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

  const inPeriod = await prisma.checkIn.findMany({
    where: { taskId, date: { gte: periodStartDate(timezone, specFor(task, timezone)) } },
    select: { id: true },
  });

  if (inPeriod.length > 0) {
    await prisma.checkIn.deleteMany({ where: { id: { in: inPeriod.map((c) => c.id) } } });
  } else {
    await prisma.checkIn.create({
      data: { taskId, userId, date: today, status: "DONE" },
    });
  }

  revalidatePath("/");
}
