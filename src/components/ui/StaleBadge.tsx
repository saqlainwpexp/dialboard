import { Hourglass } from "lucide-react";
import { isStale } from "@/lib/staleness";

export function StaleBadge({
  lead,
}: {
  lead: { status: string; lastCalledAt: string | null; createdAt: string };
}) {
  if (!isStale(lead)) return null;

  return (
    <span
      title="No activity in 14+ days"
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-orange-soft text-accent-orange whitespace-nowrap"
    >
      <Hourglass size={11} /> Stale
    </span>
  );
}
