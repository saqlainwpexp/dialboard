import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    const count = await User.countDocuments();
    return NextResponse.json({ hasUser: count > 0 });
  } catch (err) {
    return NextResponse.json(
      { error: "Database connection failed.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
