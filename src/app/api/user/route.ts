import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import User from "@/models/User";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.userId).select("-passwordHash").lean();
  if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await connectDB();
  const body = await request.json();

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.role === "string") update.role = body.role.trim();
  if (typeof body.dailyCallGoal === "number" && body.dailyCallGoal > 0) {
    update.dailyCallGoal = body.dailyCallGoal;
  }

  const user = await User.findByIdAndUpdate(session.userId, update, { new: true }).select(
    "-passwordHash"
  );

  return NextResponse.json({ user });
}
