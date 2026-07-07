import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
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
  await connectDB();
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const disposition = searchParams.get("disposition");
  const campaign = searchParams.get("campaign");
  const script = searchParams.get("script");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const query: Record<string, unknown> = {};
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
    .lean();

  return NextResponse.json({ calls });
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  if (!body.leadId || !body.disposition) {
    return NextResponse.json({ error: "leadId and disposition are required." }, { status: 400 });
  }

  const lead = await Lead.findById(body.leadId);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const call = await Call.create({
    lead: body.leadId,
    campaign: lead.campaign ?? null,
    script: body.scriptId || null,
    disposition: body.disposition,
    durationSeconds: body.durationSeconds ?? 0,
    objection: body.objection || null,
    notes: body.notes ?? "",
    nextActionAt: body.nextActionAt || null,
  });

  lead.status = DISPOSITION_TO_STATUS[body.disposition] ?? lead.status;
  lead.lastCalledAt = new Date();
  lead.nextActionAt = body.nextActionAt || null;
  await lead.save();

  return NextResponse.json({ call });
}
