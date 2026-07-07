import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import Call from "@/models/Call";

export async function PATCH(request: NextRequest) {
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

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No changes specified." }, { status: 400 });
  }

  const result = await Lead.updateMany({ _id: { $in: ids } }, update);
  return NextResponse.json({ updated: result.modifiedCount });
}

export async function DELETE(request: NextRequest) {
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
