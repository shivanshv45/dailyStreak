"use client";

import { AreaChart, Area, BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const TICK = { fontSize: 12, fill: "#4f4a46" };
const TOOLTIP = {
  contentStyle: { background: "white", border: "1px solid #ece6e0", borderRadius: 10, fontSize: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" },
  labelStyle: { color: "#4f4a46" },
  cursor: { stroke: "#ece6e0" },
};

export function TrendChart({ data }: { data: { key: string; rolling7: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6fb1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ff6fb1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="key" tick={TICK} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5).replace("-", "/")} minTickGap={28} />
        <YAxis tick={TICK} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 50, 100]} width={40} />
        <Tooltip {...TOOLTIP} formatter={(v) => [`${v}%`, "7-day avg"]} />
        <Area type="monotone" dataKey="rolling7" stroke="#ff6fb1" strokeWidth={2.2} fill="url(#trendFill)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeekdayChart({ data }: { data: { label: string; pct: number; samples?: number }[] }) {
  const observed = data.filter((d) => (d.samples ?? 3) >= 3).map((d) => d.pct);
  const min = observed.length ? Math.min(...observed) : -1;
  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
        <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} />
        <YAxis tick={TICK} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 50, 100]} width={40} />
        <Tooltip {...TOOLTIP} cursor={{ fill: "#faf8f5" }} formatter={(v) => [`${v}%`, "completion"]} />
        <Bar dataKey="pct" radius={[5, 5, 2, 2]} maxBarSize={28}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.pct === min ? "#ff6fb1" : "#9b5bd4"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
