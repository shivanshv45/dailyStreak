import Link from "next/link";
import type { Rank, Tier } from "@/lib/ranks";

export function TierName({ tier, className = "text-3xl" }: { tier: Tier; className?: string }) {
  return (
    <span className={`inline-block rounded-lg px-4 py-1.5 font-display font-extrabold leading-tight text-white ${className}`} style={{ background: tier.bg }}>
      {tier.name}
    </span>
  );
}

function Progress({ label, value, target, suffix = "", color }: { label: string; value: number; target: number; suffix?: string; color: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(target, 1)) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-ink/80">
          {value}
          {suffix} / {target}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border-[1.5px] border-ink/70 bg-white">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function RankCard({ rank }: { rank: Rank }) {
  const { tier, next } = rank;
  return (
    <section className="card-soft mt-7 flex flex-col gap-6 rounded-2xl bg-surface p-6 md:flex-row md:items-center">
      <div className="min-w-0 md:w-[22rem]">
        <p className="field-label">Your rank</p>
        <h2 className="mt-1.5">
          <TierName tier={tier} className="text-4xl" />
        </h2>
        <p className="mt-2 text-sm text-ink/80">{tier.tagline}</p>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        {next ? (
          <>
            <p className="text-sm font-semibold">
              Next: <span className="underline decoration-2 underline-offset-4" style={{ textDecorationColor: next.bg.startsWith("#") ? next.bg : "#ff6fb1" }}>{next.name}</span>
            </p>
            <Progress label="Check-ins" value={rank.totalCheckIns} target={next.minCheckIns} color={next.bg} />
            <Progress label="Consistency" value={rank.consistency} target={next.minConsistency} suffix="%" color={next.bg} />
          </>
        ) : (
          <p className="text-sm font-semibold">You’re at the top of the ladder.</p>
        )}
      </div>

      <Link href="/ranks" className="self-start rounded-full border-2 border-ink bg-white/85 px-4 py-2 text-sm font-semibold hover:bg-white md:self-center">
        All ranks
      </Link>
    </section>
  );
}
