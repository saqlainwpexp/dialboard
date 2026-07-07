import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-accent-blue-soft text-accent-blue",
  queued: "bg-accent-blue-soft text-accent-blue",
  contacted: "bg-amber-50 text-amber-600",
  callback: "bg-amber-50 text-amber-600",
  meeting_booked: "bg-emerald-50 text-emerald-600",
  not_interested: "bg-zinc-100 text-zinc-500",
  dnc: "bg-red-50 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  queued: "Queued",
  contacted: "Contacted",
  callback: "Callback",
  meeting_booked: "Meeting Booked",
  not_interested: "Not Interested",
  dnc: "DNC",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-500"
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-accent-orange-soft text-accent-orange",
  medium: "bg-accent-blue-soft text-accent-blue",
  low: "bg-zinc-100 text-zinc-500",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
        PRIORITY_STYLES[priority] ?? "bg-zinc-100 text-zinc-500"
      )}
    >
      {priority}
    </span>
  );
}
