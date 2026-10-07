import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { ensureManagerExists } from "@/lib/users";
import User, { USER_ROLES } from "@/models/User";
import Lead from "@/models/Lead";
import Call from "@/models/Call";
import { startOfDay } from "date-fns";

// GET /api/team — manager only. Lists all users with lightweight stats.
export async function GET() {
  const guard = await requireManager();
  if (guard.error) return guard.error;

  await connectDB();
  await ensureManagerExists();

  const users = await User.find({}).select("-passwordHash").sort({ createdAt: 1 }).lean();
  const todayStart = startOfDay(new Date());

  const team = await Promise.all(
    users.map(async (u) => {
      const [assignedLeads, callsToday] = await Promise.all([
        Lead.countDocuments({ assignedTo: u._id }),
        Call.countDocuments({ calledBy: u._id, calledAt: { $gte: todayStart } }),
      ]);
      return { ...u, assignedLeads, callsToday };
    })
  );

  return NextResponse.json({ team });
}

// POST /api/team — manager only. Creates a caller (or another manager).
export async function POST(request: NextRequest) {
  const guard = await requireManager();
  if (guard.error) return guard.error;

  await connectDB();
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = USER_ROLES.includes(body.role) ? body.role : "rep";

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: "Name, email, and a password of at least 8 characters are required." },
      { status: 400 }
    );
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role });

  const { passwordHash: _ph, ...safe } = user.toObject();
  void _ph;
  return NextResponse.json({ user: safe });
}
