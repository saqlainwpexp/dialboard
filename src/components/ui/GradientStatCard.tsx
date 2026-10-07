import { type ReactNode } from "react";
import clsx from "clsx";

export function GradientStatCard({
  label,
  value,
  caption,
  icon,
  variant,
}: {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
  variant: "warm" | "cool";
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl p-5 flex flex-col justify-between min-h-[136px] text-white",
        variant === "warm" ? "grad-warm" : "grad-cool"
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-semibold leading-snug max-w-[8rem]">{label}</span>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-[28px] font-bold tracking-tight leading-none">{value}</div>
        <div className="text-xs font-medium text-white/80 mt-1.5">{caption}</div>
      </div>
    </div>
  );
}
