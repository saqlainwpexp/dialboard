"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, ListChecks, Users, Megaphone, FileText, LogOut, PhoneCall, History, CalendarClock, Settings, BarChart3, Workflow } from "lucide-react";
import clsx from "clsx";
import { HeaderSearch } from "@/components/HeaderSearch";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/load-board", label: "Load Board", icon: ListChecks },
  { href: "/pipeline", label: "Pipeline", icon: Workflow },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/calls", label: "Calls", icon: History },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/scripts", label: "Scripts", icon: FileText },
];

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
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
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full grad-warm flex items-center justify-center text-white shrink-0">
              <PhoneCall size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                Welcome, {userName}
              </h1>
              <p className="text-sm text-muted">Your cold calling command center</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <HeaderSearch />
            <a
              href="https://phone.zoom.us"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Zoom Phone in a new tab"
              className="flex items-center gap-2 bg-surface card-shadow rounded-full px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-80 transition"
            >
              <PhoneCall size={15} /> Zoom Phone
            </a>
            <Link
              href="/settings"
              title="Settings"
              className="w-10 h-10 rounded-full bg-surface card-shadow flex items-center justify-center text-muted hover:text-foreground transition"
            >
              <Settings size={16} />
            </Link>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              title="Log out"
              className="w-10 h-10 rounded-full bg-surface card-shadow flex items-center justify-center text-muted hover:text-foreground transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <nav className="flex items-center gap-2 mb-8 overflow-x-auto">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition",
                  active
                    ? "bg-accent-blue text-white"
                    : "bg-surface text-muted hover:text-foreground card-shadow"
                )}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
