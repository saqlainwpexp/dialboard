import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import Call from "@/models/Call";
import Lead from "@/models/Lead";

const DISPOSITION_TO_STATUS: Record<string, string> = {
  no_answer: "contacted",
  voicemail: "contacted",
  gatekeeper: "contacted",
  wrong_number: "not_interested",
  not_interested: "not_interested",
  callback_requested: "callback",
  meeting_booked: "meeting_booked",
  dnc: "dnc",
};

export async function GET(request: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const disposition = searchParams.get("disposition");
  const campaign = searchParams.get("campaign");
  const script = searchParams.get("script");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const rep = searchParams.get("rep");

  const query: Record<string, unknown> = {};
  // A caller only ever sees their own calls. A manager sees everyone's and may
  // filter to one caller with ?rep=.
  if (session.role !== "manager") query.calledBy = session.userId;
  else if (rep) query.calledBy = rep;
  if (leadId) query.lead = leadId;
  if (disposition) query.disposition = disposition;
  if (campaign) query.campaign = campaign;
  if (script) query.script = script;
  if (from || to) {
    const calledAt: Record<string, Date> = {};
    if (from) calledAt.$gte = new Date(from);
    if (to) calledAt.$lte = new Date(to);
    query.calledAt = calledAt;
  }

  const calls = await Call.find(query)
    .sort({ calledAt: -1 })
    .populate("script", "name")
    .populate("lead", "name phone company")
    .populate("calledBy", "name")
    .lean();

  return NextResponse.json({ calls });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const body = await request.json();

  if (!body.leadId || !body.disposition) {
    return NextResponse.json({ error: "leadId and disposition are required." }, { status: 400 });
  }

  const lead = await Lead.findById(body.leadId);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  // Access + auto-claim: a caller can log a call on their own lead, or on a
  // pool lead (which then becomes theirs). They can't touch someone else's.
  if (session.role !== "manager") {
    const owner = lead.assignedTo?.toString() ?? null;
    if (owner && owner !== session.userId) {
      return NextResponse.json(
        { error: "This lead is assigned to someone else." },
        { status: 403 }
      );
    }
    if (!owner) lead.assignedTo = session.userId as unknown as typeof lead.assignedTo;
  }

  const call = await Call.create({
    lead: body.leadId,
    calledBy: session.userId,
    campaign: lead.campaign ?? null,
    script: body.scriptId || null,
    disposition: body.disposition,
    durationSeconds: body.durationSeconds ?? 0,
    objection: body.objection || null,
    notes: body.notes ?? "",
    nextActionAt: body.nextActionAt || null,
  });

  const previousStatus = lead.status;
  lead.status = DISPOSITION_TO_STATUS[body.disposition] ?? lead.status;
  lead.lastCalledAt = new Date();
  lead.nextActionAt = body.nextActionAt || null;
  await lead.save();

  // Audit: record a status change so the manager can see who moved a lead and
  // how (e.g. a caller moving someone from Contacted to Not Interested).
  if (lead.status !== previousStatus) {
    await logActivity({
      type: "status_change",
      actorId: session.userId,
      actorName: session.name,
      leadId: lead._id.toString(),
      leadName: lead.name,
      from: previousStatus,
      to: lead.status,
      meta: { via: "call", disposition: body.disposition },
    });
  }

  return NextResponse.json({ call });
}
