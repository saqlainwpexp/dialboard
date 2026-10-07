import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import Lead from "@/models/Lead";
import Call from "@/models/Call";
import User from "@/models/User";

export async function PATCH(request: NextRequest) {
  const guard = await requireManager();
  if (guard.error) return guard.error;

  await connectDB();
  const body = await request.json();
  const ids = body.ids as string[];

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No leads selected." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.status) update.status = body.status;
  if (body.priority) update.priority = body.priority;
  if (body.campaign !== undefined) update.campaign = body.campaign || null;
  // Assign / reassign / return-to-pool. "unassigned" (or empty) clears the owner.
  if (body.assignedTo !== undefined) {
    update.assignedTo = body.assignedTo && body.assignedTo !== "unassigned" ? body.assignedTo : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No changes specified." }, { status: 400 });
  }

  // Snapshot before the update so we can audit what actually changed.
  const before = await Lead.find({ _id: { $in: ids } }).select("name status assignedTo").lean();

  const result = await Lead.updateMany({ _id: { $in: ids } }, update);

  const actor = { actorId: guard.session.userId, actorName: guard.session.name };
  if (update.status) {
    for (const l of before) {
      if (l.status !== update.status) {
        await logActivity({
          type: "status_change",
          ...actor,
          leadId: l._id.toString(),
          leadName: l.name,
          from: l.status,
          to: update.status as string,
          meta: { via: "bulk" },
        });
      }
    }
  }
  if (body.assignedTo !== undefined) {
    const nextId = (update.assignedTo as string | null) ?? null;
    const assignee = nextId ? await User.findById(nextId).select("name").lean() : null;
    const nextName = assignee?.name ?? "Unassigned";
    for (const l of before) {
      if ((l.assignedTo?.toString() ?? null) !== nextId) {
        await logActivity({
          type: "assigned",
          ...actor,
          leadId: l._id.toString(),
          leadName: l.name,
          to: nextName,
          meta: { via: "bulk" },
        });
      }
    }
  }

  return NextResponse.json({ updated: result.modifiedCount });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireManager();
  if (guard.error) return guard.error;

  await connectDB();
  const body = await request.json();
  const ids = body.ids as string[];

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No leads selected." }, { status: 400 });
  }

  await Lead.deleteMany({ _id: { $in: ids } });
  await Call.deleteMany({ lead: { $in: ids } });

  return NextResponse.json({ deleted: ids.length });
}
