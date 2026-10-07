import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import Lead from "@/models/Lead";

type Params = { params: Promise<{ id: string }> };

// POST /api/leads/:id/claim — a caller takes an unassigned lead from the pool.
// Uses a conditional update so two callers can't claim the same lead at once.
export async function POST(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const lead = await Lead.findById(id).lean();
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const owner = lead.assignedTo?.toString() ?? null;
  if (owner === session.userId) {
    return NextResponse.json({ ok: true, alreadyYours: true });
  }
  if (owner && owner !== session.userId) {
    return NextResponse.json(
      { error: "Someone already claimed this lead." },
      { status: 409 }
    );
  }

  // Only assigns if it is still unassigned at write time.
  const result = await Lead.updateOne({ _id: id, assignedTo: null }, { assignedTo: session.userId });
  if (result.modifiedCount === 0) {
    return NextResponse.json({ error: "Someone already claimed this lead." }, { status: 409 });
  }

  await logActivity({
    type: "claimed",
    actorId: session.userId,
    actorName: session.name,
    leadId: id,
    leadName: lead.name,
    to: session.name,
  });

  return NextResponse.json({ ok: true });
}
