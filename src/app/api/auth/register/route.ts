import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await connectDB();

  const existingCount = await User.countDocuments();
  if (existingCount > 0) {
    return NextResponse.json(
      { error: "An account already exists. Please log in instead." },
      { status: 403 }
    );
  }

  const { name, email, password } = await request.json();

  if (!name || !email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Name, email, and a password of at least 8 characters are required." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase().trim(), passwordHash });

  await createSession({ userId: user._id.toString(), email: user.email, name: user.name });

  return NextResponse.json({ ok: true });
}
