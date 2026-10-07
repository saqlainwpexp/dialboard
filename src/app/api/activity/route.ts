import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import Activity from "@/models/Activity";

// GET /api/activity — manager only. Recent audit events, newest first.
// Filters: ?actor=<userId> ?type=<activityType> ?limit=<n>
export async function GET(request: NextRequest) {
  const guard = await requireManager();
  if (guard.error) return guard.error;

  await connectDB();
  const { searchParams } = new URL(request.url);
  const actor = searchParams.get("actor");
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);

  const query: Record<string, unknown> = {};
  if (actor) query.actor = actor;
  if (type) query.type = type;

  const activity = await Activity.find(query).sort({ createdAt: -1 }).limit(limit).lean();

  return NextResponse.json({ activity });
}
