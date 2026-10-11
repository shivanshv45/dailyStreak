export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 200;
  const h = 36;
  const pts = values.map((v, i) => [(i / Math.max(values.length - 1, 1)) * w, h - 2 - (v / 100) * (h - 4)]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-9 w-full" aria-hidden>
      <polygon points={area} fill={color} opacity={0.12} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
