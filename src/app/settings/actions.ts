"use server";

import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function updateTimezone(formData: FormData) {
  const { data: session } = await auth.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const timezone = String(formData.get("timezone") ?? "UTC");

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: { timezone },
    create: { userId: session.user.id, timezone },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/profile");
}
