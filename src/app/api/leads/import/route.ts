import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const rows = body.rows as Record<string, string>[];
  const campaign = body.campaign || null;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }

  const docs = rows
    .filter((r) => r.name && r.phone)
    .map((r) => ({
      name: r.name,
      company: r.company ?? "",
      title: r.title ?? "",
      phone: r.phone,
      email: r.email ?? "",
      source: r.source ?? "CSV import",
      industry: r.industry ?? "",
      timezone: r.timezone ?? "",
      campaign,
    }));

  if (docs.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found. Each row needs at least name and phone." },
      { status: 400 }
    );
  }

  const inserted = await Lead.insertMany(docs, { ordered: false });

  return NextResponse.json({ imported: inserted.length, skipped: rows.length - docs.length });
}
