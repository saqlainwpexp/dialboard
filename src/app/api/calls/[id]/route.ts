import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Call from "@/models/Call";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  const body = await request.json();

  const call = await Call.findByIdAndUpdate(
    id,
    {
      disposition: body.disposition,
      script: body.scriptId || null,
      durationSeconds: body.durationSeconds ?? 0,
      objection: body.objection || null,
      notes: body.notes ?? "",
      nextActionAt: body.nextActionAt || null,
    },
    { new: true }
  );
  if (!call) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ call });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;

  await Call.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
