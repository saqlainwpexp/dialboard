import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ActivityClient } from "@/components/activity/ActivityClient";

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "manager") redirect("/");

  return <ActivityClient />;
}
