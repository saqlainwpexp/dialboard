import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";

export async function GET() {
  await connectDB();

  const [overdue, upcoming] = await Promise.all([
    Lead.countDocuments({ nextActionAt: { $ne: null, $lte: new Date() } }),
    Lead.countDocuments({ nextActionAt: { $gt: new Date() } }),
  ]);

  return NextResponse.json({ overdue, upcoming });
}
