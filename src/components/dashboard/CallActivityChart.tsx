"use client";

import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export function CallActivityChart({
  data,
}: {
  data: { date: string; calls: number; connects: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-2)" }}
          interval={2}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            fontSize: 13,
          }}
        />
        <Line
          type="monotone"
          dataKey="calls"
          stroke="var(--grad-warm-3)"
          strokeWidth={2.5}
          dot={false}
          name="Calls made"
        />
        <Line
          type="monotone"
          dataKey="connects"
          stroke="var(--accent-blue)"
          strokeWidth={2.5}
          dot={false}
          name="Connects"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
