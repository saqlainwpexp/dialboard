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
        "rounded-3xl p-6 flex flex-col justify-between min-h-[220px] text-white",
        variant === "warm" ? "grad-warm" : "grad-cool"
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[15px] font-semibold leading-snug max-w-[8rem]">{label}</span>
        <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-4xl font-extrabold tracking-tight">{value}</div>
        <div className="text-sm font-medium text-white/80 mt-1">{caption}</div>
      </div>
    </div>
  );
}
