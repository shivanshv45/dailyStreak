type HeatmapProps = {
  data: { key: string; pct: number }[];
};

function colorFor(pct: number): string {
  if (pct === 0) return "rgba(255,255,255,0.06)";
  if (pct < 25) return "#312e81";
  if (pct < 50) return "#4338ca";
  if (pct < 75) return "#6366f1";
  return "#818cf8";
}

export function Heatmap({ data }: HeatmapProps) {
  const weeks: { key: string; pct: number }[][] = [];
  let currentWeek: { key: string; pct: number }[] = [];

  for (const d of data) {
    const weekday = new Date(`${d.key}T00:00:00.000Z`).getUTCDay();
    if (currentWeek.length === 0 && weekday !== 0) {
      for (let i = 0; i < weekday; i++) currentWeek.push({ key: `pad-${i}`, pct: -1 });
    }
    currentWeek.push(d);
    if (weekday === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((d, di) => (
            <div
              key={di}
              title={d.pct >= 0 ? `${d.key}: ${d.pct}%` : undefined}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: d.pct < 0 ? "transparent" : colorFor(d.pct) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
