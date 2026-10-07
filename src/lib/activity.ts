import Activity, { type ActivityType } from "@/models/Activity";

type LogInput = {
  type: ActivityType;
  actorId?: string | null;
  actorName?: string;
  leadId?: string | null;
  leadName?: string;
  from?: string;
  to?: string;
  meta?: Record<string, unknown>;
};

/**
 * Appends one audit record. Never throws — an audit failure must not break the
 * user action that triggered it. Assumes the DB connection is already open.
 */
export async function logActivity(input: LogInput) {
  try {
    await Activity.create({
      type: input.type,
      actor: input.actorId ?? null,
      actorName: input.actorName ?? "",
      lead: input.leadId ?? null,
      leadName: input.leadName ?? "",
      from: input.from ?? "",
      to: input.to ?? "",
      meta: input.meta ?? {},
    });
  } catch {
    // swallow — auditing is best-effort
  }
}
