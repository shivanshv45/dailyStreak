import { Art } from "@/components/Art";

export function StatTile({ chip, value, unit, footer, art }: { chip: string; value: number; unit?: string; footer: string; art: string }) {
  return (
    <div className="card-lift flex flex-col overflow-hidden rounded-2xl bg-surface text-center">
      <div className="flex flex-1 flex-col items-center px-3 pb-4 pt-5">
        <div className="mb-2 flex h-11 w-11 items-center justify-center">
          <Art src={`/icons/${art}.png`} size={44} />
        </div>
        <span className="rounded-md bg-purple px-2 py-0.5 text-xs font-bold text-white">{chip}</span>
        <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          {value}
          {unit && <span className="ml-1 text-lg text-muted">{unit}</span>}
        </p>
      </div>
      <div className="bg-pink py-2.5 text-[13px] font-semibold text-white">{footer}</div>
    </div>
  );
}

export function Card({ label, aside, className = "", children }: { label: string; aside?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={`card-soft rounded-2xl bg-surface p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between text-xs">
        <span className="field-label">{label}</span>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="field-label">{label}</dt>
      <dd className="mt-1 inline-flex items-center gap-1 rounded-md bg-canvas px-1.5 py-0.5 text-sm font-semibold tabular-nums">{children}</dd>
    </div>
  );
}
