import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Campaign from "@/models/Campaign";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;
  const body = await request.json();

  const campaign = await Campaign.findByIdAndUpdate(id, body, { new: true });
  if (!campaign) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ campaign });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  await connectDB();
  const { id } = await params;

  await Campaign.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
