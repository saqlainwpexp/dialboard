import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { createSession } from "@/lib/auth";
import { ensureManagerExists } from "@/lib/users";

export async function POST(request: NextRequest) {
  await connectDB();
  // Make sure a manager exists before anyone signs in (promotes a pre-roles
  // account on first login after upgrade).
  await ensureManagerExists();

  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.active === false) {
    return NextResponse.json(
      { error: "This account has been deactivated. Ask your manager to reactivate it." },
      { status: 403 }
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role === "manager" ? "manager" : "rep",
  });

  return NextResponse.json({ ok: true });
}
