import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";

export async function GET(request: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const campaign = searchParams.get("campaign");
  const search = searchParams.get("search");
  const dueBefore = searchParams.get("dueBefore");
  const hasNextAction = searchParams.get("hasNextAction");

  const query: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];

  if (status) {
    const statuses = status.split(",").filter(Boolean);
    query.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }
  if (campaign) query.campaign = campaign;
  if (hasNextAction) query.nextActionAt = { $ne: null };
  if (dueBefore) {
    and.push({
      $or: [
        { nextActionAt: { $lte: new Date(dueBefore) } },
        { nextActionAt: null, status: { $in: ["new", "queued"] } },
      ],
    });
  }
  if (search) {
    and.push({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    });
  }
  if (and.length > 0) query.$and = and;

  const leads = await Lead.find(query)
    .sort(hasNextAction ? { nextActionAt: 1 } : { createdAt: -1 })
    .populate("campaign", "name color")
    .lean();

  return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  if (!body.name || !body.phone) {
    return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });
  }

  const lead = await Lead.create({
    name: body.name,
    company: body.company ?? "",
    title: body.title ?? "",
    phone: body.phone,
    email: body.email ?? "",
    source: body.source ?? "",
    industry: body.industry ?? "",
    timezone: body.timezone ?? "",
    priority: body.priority ?? "medium",
    campaign: body.campaign || null,
    notes: body.notes ?? "",
  });

  return NextResponse.json({ lead });
}
