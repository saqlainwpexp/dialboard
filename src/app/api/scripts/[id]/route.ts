import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Script from "@/models/Script";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  const body = await request.json();

  const script = await Script.findByIdAndUpdate(id, body, { new: true });
  if (!script) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ script });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;

  await Script.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
