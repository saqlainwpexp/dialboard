import { connectDB } from "@/lib/db";
import User from "@/models/User";

/**
 * Guarantees the workspace has at least one manager. If none exists yet (for
 * example, data created before roles were introduced), the earliest-created
 * user is promoted. Safe to call on every login — it is a no-op once a manager
 * is present.
 */
export async function ensureManagerExists() {
  await connectDB();
  const managerCount = await User.countDocuments({ role: "manager" });
  if (managerCount > 0) return;

  const earliest = await User.findOne({}).sort({ createdAt: 1 });
  if (earliest) {
    earliest.role = "manager";
    await earliest.save();
  }
}
