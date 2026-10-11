export function CloudEdge({ fill = "var(--canvas)" }: { fill?: string }) {
  return (
    <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-8 w-full md:h-12" aria-hidden>
      <path
        d="M0 60V38c60-22 130-26 200-4 50-28 140-32 210-2 70-30 170-30 240 2 60-26 150-28 220 0 70-30 160-26 220 4 50-18 90-20 110-14V60z"
        fill={fill}
      />
    </svg>
  );
}

export function ProgressRing({ done, total, complete = false, size = 132 }: { done: number; total: number; complete?: boolean; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(255,255,255,0.45)" stroke="rgba(255,255,255,0.6)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-extrabold leading-none">
          {done}
          <span className="text-ink/60">/{total}</span>
        </span>
        {complete ? (
          <span className="-mt-0.5 -rotate-3 font-hand text-[1.6rem] font-bold leading-none text-ink">all done!</span>
        ) : (
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink/80">done</span>
        )}
      </div>
    </div>
  );
}

const NOTE_BG = ["bg-note-sage", "bg-note-pink", "bg-note-blue", "bg-note-peach"];
const NOTE_TILT = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export function StickyNote({ children, index = 0, className = "" }: { children: React.ReactNode; index?: number; className?: string }) {
  return (
    <div
      className={`${NOTE_BG[index % 4]} ${NOTE_TILT[index % 4]} flex min-h-28 w-40 items-center justify-center p-3 text-center font-hand text-xl font-medium leading-tight text-ink/85 shadow-[0_6px_14px_rgba(20,20,20,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}
