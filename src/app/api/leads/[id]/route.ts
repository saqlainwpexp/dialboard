import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import Lead from "@/models/Lead";
import Call from "@/models/Call";
import User from "@/models/User";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const lead = await Lead.findById(id).populate("campaign", "name color").populate("assignedTo", "name").lean();
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // A caller may open only their own leads or ones in the unassigned pool.
  if (session.role !== "manager") {
    const owner = lead.assignedTo?._id?.toString() ?? null;
    if (owner && owner !== session.userId) {
      return NextResponse.json({ error: "This lead is assigned to someone else." }, { status: 403 });
    }
  }

  const calls = await Call.find({ lead: id })
    .sort({ calledAt: -1 })
    .populate("script", "name")
    .populate("calledBy", "name")
    .lean();

  return NextResponse.json({ lead, calls });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = { ...(await request.json()) };

  const lead = await Lead.findById(id);
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const owner = lead.assignedTo?.toString() ?? null;

  if (session.role !== "manager") {
    // Callers can only edit leads already assigned to them, and can never
    // change who a lead is assigned to.
    if (owner !== session.userId) {
      return NextResponse.json(
        { error: "You can only edit leads assigned to you. Claim it first." },
        { status: 403 }
      );
    }
    delete body.assignedTo;
  }

  const prevStatus = lead.status;
  const prevAssignee = lead.assignedTo?.toString() ?? null;

  const lead2 = await Lead.findByIdAndUpdate(id, body, { new: true });

  // Audit manual status changes and (re)assignments.
  if (typeof body.status === "string" && body.status !== prevStatus) {
    await logActivity({
      type: "status_change",
      actorId: session.userId,
      actorName: session.name,
      leadId: id,
      leadName: lead.name,
      from: prevStatus,
      to: body.status,
      meta: { via: "edit" },
    });
  }
  if (body.assignedTo !== undefined) {
    const nextAssignee = body.assignedTo || null;
    if (nextAssignee !== prevAssignee) {
      const assignee = nextAssignee ? await User.findById(nextAssignee).select("name").lean() : null;
      await logActivity({
        type: "assigned",
        actorId: session.userId,
        actorName: session.name,
        leadId: id,
        leadName: lead.name,
        to: assignee?.name ?? "Unassigned",
        meta: { via: "edit" },
      });
    }
  }

  return NextResponse.json({ lead: lead2 });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireUser();
  if (error) return error;
  if (session.role !== "manager") {
    return NextResponse.json({ error: "Only managers can delete leads." }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  await Lead.findByIdAndDelete(id);
  await Call.deleteMany({ lead: id });

  return NextResponse.json({ ok: true });
}
