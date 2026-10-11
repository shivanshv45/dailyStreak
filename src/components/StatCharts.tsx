"use client";

import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const AXIS_COLOR = "#737373";
const GRID_TEXT_STYLE = { fontSize: 12, fill: AXIS_COLOR };

export function TrendChart({ data }: { data: { key: string; rolling7: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <XAxis dataKey="key" tick={GRID_TEXT_STYLE} tickFormatter={(v) => v.slice(5)} minTickGap={24} />
        <YAxis tick={GRID_TEXT_STYLE} domain={[0, 100]} width={40} />
        <Tooltip
          contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8 }}
          labelStyle={{ color: "#e5e5e5" }}
        />
        <Line type="monotone" dataKey="rolling7" stroke="#818cf8" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WeekdayChart({ data }: { data: { label: string; pct: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <XAxis dataKey="label" tick={GRID_TEXT_STYLE} />
        <YAxis tick={GRID_TEXT_STYLE} domain={[0, 100]} width={40} />
        <Tooltip
          contentStyle={{ background: "#171717", border: "1px solid #404040", borderRadius: 8 }}
          labelStyle={{ color: "#e5e5e5" }}
        />
        <Bar dataKey="pct" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
