type HeatmapProps = {
  data: { key: string; pct: number }[];
};

const SCALE = ["var(--line)", "#ffd6e8", "#ffa6cf", "#ff6fb1", "#9b5bd4"];

function level(pct: number): number {
  if (pct <= 0) return 0;
  if (pct < 34) return 1;
  if (pct < 67) return 2;
  if (pct < 100) return 3;
  return 4;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Heatmap({ data }: HeatmapProps) {
  type Cell = { key: string; pct: number } | null;
  const weeks: Cell[][] = [];
  let week: Cell[] = [];

  data.forEach((d, i) => {
    const weekday = new Date(`${d.key}T00:00:00.000Z`).getUTCDay();
    if (i === 0) week = Array(weekday).fill(null);
    week.push(d);
    if (weekday === 6) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) weeks.push(week);

  const monthLabels = weeks.map((w, i) => {
    const first = w.find((c) => c && c.key.endsWith("-01")) ?? (i === 0 ? w.find(Boolean) : null);
    return first ? MONTHS[Number(first.key.slice(5, 7)) - 1] : "";
  });

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1.5">
          <div className="flex gap-[3px] text-[10px] text-faint">
            {monthLabels.map((m, i) => (
              <span key={i} className="w-[11px] overflow-visible whitespace-nowrap">
                {m}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((w, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {w.map((d, di) => (
                  <span
                    key={di}
                    title={d ? `${d.key} · ${d.pct}%` : undefined}
                    className="h-[11px] w-[11px] rounded-[2px]"
                    style={{ backgroundColor: d ? SCALE[level(d.pct)] : "transparent" }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-faint">
        less
        {SCALE.map((c) => (
          <span key={c} className="h-[10px] w-[10px] rounded-[2px]" style={{ backgroundColor: c }} />
        ))}
        more
      </div>
    </div>
  );
}
