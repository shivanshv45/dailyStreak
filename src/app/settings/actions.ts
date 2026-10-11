"use server";

import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { isValidTimezone } from "@/lib/date";

export async function updateTimezone(formData: FormData) {
  const { data: session } = await auth.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const timezone = String(formData.get("timezone") ?? "UTC");
  if (!isValidTimezone(timezone)) throw new Error("Invalid timezone");

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: { timezone },
    create: { userId: session.user.id, timezone },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/profile");
}
