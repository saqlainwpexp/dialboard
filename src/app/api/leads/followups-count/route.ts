import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Lead from "@/models/Lead";

export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();

  // Callers only count their own follow-ups; managers count the whole book.
  const scope = session.role === "manager" ? {} : { assignedTo: session.userId };

  const [overdue, upcoming] = await Promise.all([
    Lead.countDocuments({ ...scope, nextActionAt: { $ne: null, $lte: new Date() } }),
    Lead.countDocuments({ ...scope, nextActionAt: { $gt: new Date() } }),
  ]);

  return NextResponse.json({ overdue, upcoming });
}
