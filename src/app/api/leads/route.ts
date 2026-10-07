import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Lead from "@/models/Lead";

export async function GET(request: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const campaign = searchParams.get("campaign");
  const search = searchParams.get("search");
  const dueBefore = searchParams.get("dueBefore");
  const hasNextAction = searchParams.get("hasNextAction");
  const view = searchParams.get("view"); // mine | pool | all
  const assignedToParam = searchParams.get("assignedTo");

  const query: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];

  // --- Ownership scoping -------------------------------------------------
  // A caller may only ever see their own leads or the unassigned pool.
  // A manager sees everything, and can optionally filter by assignee.
  if (session.role === "manager") {
    if (view === "mine") query.assignedTo = session.userId;
    else if (view === "pool") query.assignedTo = null;
    else if (assignedToParam) {
      query.assignedTo = assignedToParam === "unassigned" ? null : assignedToParam;
    }
    // otherwise: all leads, no assignee restriction
  } else {
    if (view === "pool") query.assignedTo = null;
    else if (view === "all") and.push({ $or: [{ assignedTo: session.userId }, { assignedTo: null }] });
    else query.assignedTo = session.userId; // default: my leads
  }

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
    .populate("assignedTo", "name")
    .lean();

  return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const body = await request.json();

  if (!body.name || !body.phone) {
    return NextResponse.json({ error: "Name and phone are required." }, { status: 400 });
  }

  // Managers may assign on creation; callers always own the leads they add.
  let assignedTo: string | null;
  if (session.role === "manager") {
    assignedTo = body.assignedTo || null;
  } else {
    assignedTo = session.userId;
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
    assignedTo,
    notes: body.notes ?? "",
    additionalPhones: Array.isArray(body.additionalPhones) ? body.additionalPhones : [],
    customFields: Array.isArray(body.customFields) ? body.customFields : [],
  });

  return NextResponse.json({ lead });
}
