import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Campaign from "@/models/Campaign";
import Lead from "@/models/Lead";
import Call from "@/models/Call";

export async function GET() {
  await connectDB();
  const campaigns = await Campaign.find({}).sort({ createdAt: -1 }).lean();

  const withStats = await Promise.all(
    campaigns.map(async (c) => {
      const [leadCount, totalCalls, meetings] = await Promise.all([
        Lead.countDocuments({ campaign: c._id }),
        Call.countDocuments({ campaign: c._id }),
        Call.countDocuments({ campaign: c._id, disposition: "meeting_booked" }),
      ]);
      return {
        ...c,
        stats: {
          leadCount,
          totalCalls,
          meetings,
          meetingRate: totalCalls > 0 ? Math.round((meetings / totalCalls) * 100) : 0,
        },
      };
    })
  );

  return NextResponse.json({ campaigns: withStats });
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  if (!body.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const campaign = await Campaign.create({
    name: body.name,
    description: body.description ?? "",
    color: body.color ?? "blue",
  });

  return NextResponse.json({ campaign });
}
