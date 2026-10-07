import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import Campaign from "@/models/Campaign";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await requireManager();
  if (guard.error) return guard.error;

  await connectDB();
  const { id } = await params;
  const body = await request.json();

  const campaign = await Campaign.findByIdAndUpdate(id, body, { new: true });
  if (!campaign) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ campaign });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const guard = await requireManager();
  if (guard.error) return guard.error;

  await connectDB();
  const { id } = await params;

  await Campaign.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
