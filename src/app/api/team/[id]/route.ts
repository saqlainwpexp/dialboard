import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import User, { USER_ROLES } from "@/models/User";
import Lead from "@/models/Lead";

type Params = { params: Promise<{ id: string }> };

/**
 * Blocks an action that would leave the workspace with no active manager
 * (demoting or deactivating the last one). Returns an error response or null.
 */
async function wouldStrandWorkspace(
  targetId: string,
  nextRole: string,
  nextActive: boolean
): Promise<NextResponse | null> {
  const stillManager = nextRole === "manager" && nextActive;
  if (stillManager) return null;
  const otherActiveManagers = await User.countDocuments({
    _id: { $ne: targetId },
    role: "manager",
    active: { $ne: false },
  });
  if (otherActiveManagers === 0) {
    return NextResponse.json(
      { error: "You can't remove the last active manager. Promote someone else first." },
      { status: 400 }
    );
  }
  return null;
}

// PATCH /api/team/:id — manager only. Update name, role, active, goal, or reset password.
export async function PATCH(request: NextRequest, { params }: Params) {
  const guard = await requireManager();
  if (guard.error) return guard.error;

  await connectDB();
  const { id } = await params;
  const body = await request.json();

  const target = await User.findById(id);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const nextRole =
    typeof body.role === "string" && USER_ROLES.includes(body.role) ? body.role : target.role;
  const nextActive = typeof body.active === "boolean" ? body.active : target.active !== false;

  // Guard against stranding the workspace when this change touches a manager.
  if (target.role === "manager" && (nextRole !== "manager" || !nextActive)) {
    const stranded = await wouldStrandWorkspace(id, nextRole, nextActive);
    if (stranded) return stranded;
  }

  if (typeof body.name === "string" && body.name.trim()) target.name = body.name.trim();
  if (typeof body.role === "string" && USER_ROLES.includes(body.role)) target.role = body.role;
  if (typeof body.active === "boolean") target.active = body.active;
  if (typeof body.dailyCallGoal === "number" && body.dailyCallGoal > 0) {
    target.dailyCallGoal = body.dailyCallGoal;
  }
  if (typeof body.password === "string") {
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }
    target.passwordHash = await bcrypt.hash(body.password, 10);
  }

  await target.save();
  const { passwordHash: _ph, ...safe } = target.toObject();
  void _ph;
  return NextResponse.json({ user: safe });
}

// DELETE /api/team/:id — manager only. Returns the user's leads to the pool.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const guard = await requireManager();
  if (guard.error) return guard.error;

  await connectDB();
  const { id } = await params;

  if (guard.session.userId === id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  const target = await User.findById(id);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (target.role === "manager") {
    const stranded = await wouldStrandWorkspace(id, "rep", false);
    if (stranded) return stranded;
  }

  // Return their leads to the unassigned pool; keep their call history intact.
  await Lead.updateMany({ assignedTo: id }, { assignedTo: null });
  await User.findByIdAndDelete(id);

  return NextResponse.json({ ok: true });
}
