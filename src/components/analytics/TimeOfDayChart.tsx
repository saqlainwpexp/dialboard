"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function TimeOfDayChart({
  data,
}: {
  data: { label: string; connectRate: number; total: number }[];
}) {
  const best = Math.max(0, ...data.map((d) => d.connectRate));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-2)" }}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}
          formatter={(value, _name, item) => [
            `${value}% (${(item?.payload as { total: number } | undefined)?.total ?? 0} calls)`,
            "Connect rate",
          ]}
        />
        <Bar dataKey="connectRate" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.connectRate === best && best > 0 ? "var(--accent-blue)" : "var(--border)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
