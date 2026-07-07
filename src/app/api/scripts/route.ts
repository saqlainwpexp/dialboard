import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Script from "@/models/Script";
import Call from "@/models/Call";

export async function GET(request: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const withStats = searchParams.get("stats") === "1";

  const scripts = await Script.find({}).sort({ createdAt: -1 }).lean();

  if (!withStats) {
    return NextResponse.json({ scripts });
  }

  const scriptsWithStats = await Promise.all(
    scripts.map(async (s) => {
      const [totalCalls, meetings] = await Promise.all([
        Call.countDocuments({ script: s._id }),
        Call.countDocuments({ script: s._id, disposition: "meeting_booked" }),
      ]);
      return {
        ...s,
        stats: {
          totalCalls,
          meetings,
          meetingRate: totalCalls > 0 ? Math.round((meetings / totalCalls) * 100) : 0,
        },
      };
    })
  );

  return NextResponse.json({ scripts: scriptsWithStats });
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  if (!body.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const script = await Script.create({
    name: body.name,
    version: body.version ?? "v1",
    body: body.body ?? "",
  });

  return NextResponse.json({ script });
}
