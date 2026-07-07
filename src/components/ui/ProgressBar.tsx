import { ArrowDown, ArrowUp } from "lucide-react";

export function ProgressBar({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend?: "up" | "down";
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-foreground w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-blue"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-foreground w-10 text-right">{value}%</span>
      {trend && (
        <div
          className={
            trend === "up"
              ? "w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"
              : "w-6 h-6 rounded-full bg-accent-orange-soft text-accent-orange flex items-center justify-center"
          }
        >
          {trend === "up" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
        </div>
      )}
    </div>
  );
}
