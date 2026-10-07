"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, ListChecks, Users, Megaphone, FileText, LogOut, PhoneCall, History, CalendarClock, Settings, BarChart3, Workflow, UsersRound, Activity } from "lucide-react";
import clsx from "clsx";
import { HeaderSearch } from "@/components/HeaderSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FollowUpBadge } from "@/components/FollowUpBadge";

type NavItem = { href: string; label: string; icon: typeof LayoutGrid; managerOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/load-board", label: "Load Board", icon: ListChecks },
  { href: "/pipeline", label: "Pipeline", icon: Workflow },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/calls", label: "Calls", icon: History },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/activity", label: "Activity", icon: Activity, managerOnly: true },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/scripts", label: "Scripts", icon: FileText },
  { href: "/team", label: "Team", icon: UsersRound, managerOnly: true },
];

export function AppShell({
  children,
  userName,
  role,
}: {
  children: React.ReactNode;
  userName: string;
  role: "manager" | "rep";
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl grad-warm flex items-center justify-center text-white shrink-0">
              <PhoneCall size={16} />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-foreground leading-tight">
                Welcome, {userName}
              </h1>
              <p className="text-xs text-muted">Your cold calling command center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HeaderSearch />
            <a
              href="https://phone.zoom.us"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Zoom Phone in a new tab"
              className="flex items-center gap-1.5 bg-surface card-shadow rounded-lg px-3 py-2 text-[13px] font-semibold text-foreground hover:bg-background transition"
            >
              <PhoneCall size={14} /> Zoom Phone
            </a>
            <Link
              href="/settings"
              title="Settings"
              className="w-9 h-9 rounded-lg bg-surface card-shadow flex items-center justify-center text-muted hover:text-foreground transition"
            >
              <Settings size={15} />
            </Link>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              title="Log out"
              className="w-9 h-9 rounded-lg bg-surface card-shadow flex items-center justify-center text-muted hover:text-foreground transition"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <nav className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-0.5">
          {NAV.filter((item) => !item.managerOnly || role === "manager").map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition",
                  active
                    ? "bg-accent-blue text-white"
                    : "bg-surface text-muted hover:text-foreground card-shadow"
                )}
              >
                <Icon size={14} />
                {item.label}
                {item.href === "/follow-ups" && <FollowUpBadge />}
              </Link>
            );
          })}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
