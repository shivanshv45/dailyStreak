"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

function getTimezoneFromForm(formData: FormData): string {
  const tz = formData.get("timezone");
  return typeof tz === "string" && tz.length > 0 ? tz : "UTC";
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const timezone = getTimezoneFromForm(formData);

  const { data, error } = await auth.signUp.email({ name, email, password });
  if (error) return { error: error.message };

  if (data?.user?.id) {
    await prisma.profile.upsert({
      where: { userId: data.user.id },
      update: {},
      create: { userId: data.user.id, timezone },
    });
  }

  redirect("/");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await auth.signIn.email({ email, password });
  if (error) return { error: error.message };

  redirect("/");
}

export async function signOut() {
  await auth.signOut();
  redirect("/auth/sign-in");
}
