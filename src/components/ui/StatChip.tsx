import { type ReactNode } from "react";

export function StatChip({ icon, value }: { icon: ReactNode; value: string | number }) {
  return (
    <div className="flex items-center gap-1.5 bg-background rounded-full px-3 py-1.5">
      <span className="text-accent-orange">{icon}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
