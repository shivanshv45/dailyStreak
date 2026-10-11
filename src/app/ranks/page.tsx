import Link from "next/link";
import { requireAppContext, getShellTasks } from "@/lib/session";
import { getRank } from "@/lib/rank-data";
import { TIERS } from "@/lib/ranks";
import { AppShell } from "@/components/shell/AppShell";
import { TierName } from "@/components/RankBits";

export const instant = false;

export default async function RanksPage() {
  const { user, timezone } = await requireAppContext();
  const [rank, shellTasks] = await Promise.all([getRank(user.id, timezone), getShellTasks(user.id, timezone)]);

  return (
    <AppShell active="stats" user={user} tasks={shellTasks} timezone={timezone}>
      <div className="mx-auto max-w-3xl px-4 pt-5 md:px-10 md:pt-7">
        <p className="text-xs text-muted">
          Profile <span className="mx-1 text-faint">/</span>{" "}
          <Link href="/profile" className="underline decoration-pink decoration-2 underline-offset-2 hover:text-ink">
            Stats
          </Link>{" "}
          <span className="mx-1 text-faint">/</span> <span className="text-ink">Ranks</span>
        </p>

        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Tier list</h1>
        <p className="mt-2 text-sm text-ink/80">
          Check-ins are all-time. Consistency is how much of your active tasks you finished over the last 30 days.
        </p>

        <div className="mt-7 flex items-center gap-4 rounded-2xl border-2 border-ink bg-surface p-4">
          <div className="min-w-0 flex-1">
            <p className="field-label">You</p>
            <TierName tier={rank.tier} className="mt-1 text-2xl" />
          </div>
          <p className="text-right text-sm font-semibold tabular-nums">
            {rank.totalCheckIns} check-ins
            <br />
            {rank.consistency}% consistent
          </p>
        </div>

        <ol className="mt-6 space-y-2.5 pb-4">
          {[...TIERS].reverse().map((t) => {
            const current = t.slug === rank.tier.slug;
            return (
              <li
                key={t.slug}
                className={`flex items-stretch overflow-hidden rounded-xl bg-surface ${current ? "border-2 border-ink shadow-[0_10px_24px_-12px_rgba(70,30,55,0.45)]" : "border border-line"}`}
              >
                <div
                  className="flex w-32 shrink-0 items-center justify-center px-3 py-4 text-center font-display text-lg font-extrabold leading-tight text-white md:w-44 md:text-xl"
                  style={{ background: t.bg }}
                >
                  {t.name}
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.tagline}</p>
                    {current && (
                      <span className="tag mt-1.5" style={{ backgroundColor: "var(--ink)" }}>
                        You are here
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-semibold tabular-nums">
                    <span className="rounded-full bg-canvas px-2.5 py-1">{t.minCheckIns === 0 ? "start" : `${t.minCheckIns} check-ins`}</span>
                    {t.minConsistency > 0 && <span className="rounded-full bg-canvas px-2.5 py-1">{t.minConsistency}% consistent</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </AppShell>
  );
}
