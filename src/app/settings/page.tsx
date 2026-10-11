import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { updateTimezone } from "./actions";

export const instant = false;

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default async function SettingsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });

  const options = COMMON_TIMEZONES.includes(profile.timezone)
    ? COMMON_TIMEZONES
    : [profile.timezone, ...COMMON_TIMEZONES];

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Settings</h1>
          <Link href="/" className="text-sm text-neutral-400 hover:text-white">
            Board
          </Link>
        </div>

        <form action={updateTimezone} className="mt-6 space-y-3">
          <label className="block text-sm text-neutral-400">Timezone</label>
          <select
            name="timezone"
            defaultValue={profile.timezone}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-indigo-500"
          >
            {options.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            Save
          </button>
        </form>
      </div>
    </main>
  );
}
