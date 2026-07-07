import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Call from "@/models/Call";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;

  const lead = await Lead.findById(id).populate("campaign", "name color").lean();
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const calls = await Call.find({ lead: id })
    .sort({ calledAt: -1 })
    .populate("script", "name")
    .lean();

  return NextResponse.json({ lead, calls });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  const body = await request.json();

  const lead = await Lead.findByIdAndUpdate(id, body, { new: true });
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ lead });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;

  await Lead.findByIdAndDelete(id);
  await Call.deleteMany({ lead: id });

  return NextResponse.json({ ok: true });
}
