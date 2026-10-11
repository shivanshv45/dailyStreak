"use server";

import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { isValidTimezone } from "@/lib/date";

export async function signOut() {
  await auth.signOut();
  redirect("/auth/sign-in");
}

export async function saveTimezoneForCurrentUser(timezone: string) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return;
  if (!isValidTimezone(timezone)) return;

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: { timezone },
    create: { userId: session.user.id, timezone },
  });
}
