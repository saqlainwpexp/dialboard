import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Lead from "@/models/Lead";
import Call from "@/models/Call";
import Campaign from "@/models/Campaign";
import Script from "@/models/Script";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await connectDB();

  const [leads, calls, campaigns, scripts] = await Promise.all([
    Lead.find({}).lean(),
    Call.find({}).lean(),
    Campaign.find({}).lean(),
    Script.find({}).lean(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    leads,
    calls,
    campaigns,
    scripts,
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="dialboard-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
