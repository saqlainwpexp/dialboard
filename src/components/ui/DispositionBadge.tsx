import clsx from "clsx";
import { DISPOSITION_LABELS, DISPOSITION_STYLES } from "@/lib/labels";

export function DispositionBadge({ disposition }: { disposition: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
        DISPOSITION_STYLES[disposition] ?? "bg-zinc-100 text-zinc-500"
      )}
    >
      {DISPOSITION_LABELS[disposition] ?? disposition}
    </span>
  );
}
