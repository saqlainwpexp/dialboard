import { type ReactNode } from "react";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent-blue/40";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-2 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

export { inputClass };
