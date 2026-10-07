import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Call from "@/models/Call";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await request.json();

  const existing = await Call.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (session.role !== "manager" && existing.calledBy?.toString() !== session.userId) {
    return NextResponse.json({ error: "You can only edit your own calls." }, { status: 403 });
  }

  existing.disposition = body.disposition;
  existing.script = body.scriptId || null;
  existing.durationSeconds = body.durationSeconds ?? 0;
  existing.objection = body.objection || null;
  existing.notes = body.notes ?? "";
  existing.nextActionAt = body.nextActionAt || null;
  await existing.save();

  return NextResponse.json({ call: existing });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const existing = await Call.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (session.role !== "manager" && existing.calledBy?.toString() !== session.userId) {
    return NextResponse.json({ error: "You can only delete your own calls." }, { status: 403 });
  }

  await existing.deleteOne();
  return NextResponse.json({ ok: true });
}
