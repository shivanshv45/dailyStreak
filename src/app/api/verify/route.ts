import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { verifyProof } from "@/lib/verify";
import { localDateFor, periodStartDate, specFor, todayKeyFor } from "@/lib/date";
import { cadenceScope } from "@/lib/frequency";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_ATTEMPTS_PER_DAY = 10;

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const formData = await request.formData();
  const taskId = String(formData.get("taskId") ?? "");
  const file = formData.get("image");

  if (!taskId || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing taskId or image" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image too large (max 4MB)" }, { status: 413 });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (task.mode !== "PROOF") {
    return NextResponse.json({ error: "Task is not proof mode" }, { status: 400 });
  }
  if (task.archivedAt) {
    return NextResponse.json({ error: "Task is archived" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  const timezone = profile?.timezone ?? "UTC";
  const today = localDateFor(timezone);
  const todayKey = todayKeyFor(timezone);

  const existingCheckIn = await prisma.checkIn.findFirst({
    where: { taskId, date: { gte: periodStartDate(timezone, specFor(task, timezone)) } },
  });
  if (existingCheckIn) {
    return NextResponse.json({ error: `Already done ${cadenceScope(task).toLowerCase()}` }, { status: 400 });
  }

  const attemptsToday = await prisma.verifyAttempt.count({
    where: { taskId, date: today },
  });
  if (attemptsToday >= MAX_ATTEMPTS_PER_DAY) {
    return NextResponse.json(
      { error: `Max ${MAX_ATTEMPTS_PER_DAY} attempts reached for today (${todayKey})` },
      { status: 429 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const imageBase64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "image/jpeg";

  let verdict;
  try {
    verdict = await verifyProof(imageBase64, mimeType, {
      title: task.title,
      description: task.description,
      doneCriteria: task.doneCriteria,
    });
  } catch {
    return NextResponse.json({ error: "Verification service unavailable, try again" }, { status: 502 });
  }

  await prisma.verifyAttempt.create({
    data: {
      taskId,
      userId,
      date: today,
      verdict: verdict.verdict === "pass" ? "PASS" : "FAIL",
      confidence: verdict.confidence,
      reason: verdict.reason,
      provider: verdict.provider,
    },
  });

  if (verdict.verdict !== "pass") {
    return NextResponse.json({ verdict: "fail", reason: verdict.reason });
  }

  await prisma.checkIn.create({
    data: { taskId, userId, date: today, status: "VERIFIED" },
  });

  return NextResponse.json({ verdict: "pass", reason: verdict.reason });
}
