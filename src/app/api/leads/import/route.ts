import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/models/Lead";
import { normalizePhone } from "@/lib/phone";

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const rows = body.rows as Record<string, string>[];
  const campaign = body.campaign || null;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }

  const validRows = rows.filter((r) => r.name && r.phone);
  const skippedMissingFields = rows.length - validRows.length;

  if (validRows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found. Each row needs at least name and phone." },
      { status: 400 }
    );
  }

  const existingLeads = await Lead.find({}).select("phone email").lean();
  const existingPhones = new Set(existingLeads.map((l) => normalizePhone(l.phone)));
  const existingEmails = new Set(
    existingLeads.filter((l) => l.email).map((l) => l.email.toLowerCase().trim())
  );

  const seenInBatch = new Set<string>();
  let skippedDuplicates = 0;

  const docs: Record<string, unknown>[] = [];
  for (const r of validRows) {
    const normalizedPhone = normalizePhone(r.phone);
    const normalizedEmail = r.email ? r.email.toLowerCase().trim() : "";

    const isDuplicate =
      existingPhones.has(normalizedPhone) ||
      (normalizedEmail && existingEmails.has(normalizedEmail)) ||
      seenInBatch.has(normalizedPhone);

    if (isDuplicate) {
      skippedDuplicates += 1;
      continue;
    }

    seenInBatch.add(normalizedPhone);
    docs.push({
      name: r.name,
      company: r.company ?? "",
      title: r.title ?? "",
      phone: r.phone,
      email: r.email ?? "",
      source: r.source ?? "CSV import",
      industry: r.industry ?? "",
      timezone: r.timezone ?? "",
      campaign,
    });
  }

  const inserted = docs.length > 0 ? await Lead.insertMany(docs, { ordered: false }) : [];

  return NextResponse.json({
    imported: inserted.length,
    skippedMissingFields,
    skippedDuplicates,
  });
}
