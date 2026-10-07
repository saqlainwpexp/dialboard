import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TeamClient } from "@/components/team/TeamClient";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "manager") redirect("/");

  return <TeamClient />;
}
