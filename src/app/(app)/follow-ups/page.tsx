"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarClock, PhoneCall, Check, CalendarPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/Badge";
import { CallLogModal } from "@/components/CallLogModal";
import type { LeadRow } from "@/types";

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [callLead, setCallLead] = useState<LeadRow | null>(null);
  const [rescheduleLead, setRescheduleLead] = useState<LeadRow | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/leads?hasNextAction=1");
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { overdue, upcoming } = useMemo(() => {
    const now = new Date();
    const overdue: LeadRow[] = [];
    const upcoming: LeadRow[] = [];
    for (const lead of leads) {
      if (lead.nextActionAt && new Date(lead.nextActionAt) < now) overdue.push(lead);
      else upcoming.push(lead);
    }
    return { overdue, upcoming };
  }, [leads]);

  async function markDone(id: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextActionAt: null }),
    });
    load();
  }

  function openReschedule(lead: LeadRow) {
    setRescheduleLead(lead);
    setRescheduleValue(
      lead.nextActionAt ? format(new Date(lead.nextActionAt), "yyyy-MM-dd'T'HH:mm") : ""
    );
  }

  async function saveReschedule() {
    if (!rescheduleLead) return;
    await fetch(`/api/leads/${rescheduleLead._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextActionAt: rescheduleValue || null }),
    });
    setRescheduleLead(null);
    load();
  }

  function Row({ lead, overdue }: { lead: LeadRow; overdue: boolean }) {
    return (
      <div className="flex items-center justify-between px-5 py-3 gap-3">
        <div className="min-w-0">
          <div className={overdue ? "text-xs font-semibold text-red-500" : "text-xs font-semibold text-muted-2"}>
            {lead.nextActionAt ? format(new Date(lead.nextActionAt), "EEE, MMM d, h:mm a") : ""}
          </div>
          <Link href={`/leads/${lead._id}`} className="text-sm font-semibold text-foreground hover:text-accent-blue hover:underline">
            {lead.name}
          </Link>
          <div className="text-xs text-muted truncate">
            {lead.company}
            {lead.company ? " · " : ""}
            <a href={`tel:${lead.phone}`} className="hover:text-accent-blue hover:underline">
              {lead.phone}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PriorityBadge priority={lead.priority} />
          <button
            onClick={() => setCallLead(lead)}
            title="Log call"
            className="w-8 h-8 rounded-full bg-accent-blue-soft text-accent-blue flex items-center justify-center hover:opacity-80 transition"
          >
            <PhoneCall size={13} />
          </button>
          <button
            onClick={() => openReschedule(lead)}
            title="Reschedule"
            className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-foreground transition"
          >
            <CalendarPlus size={13} />
          </button>
          <button
            onClick={() => markDone(lead._id)}
            title="Mark done"
            className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-emerald-600 transition"
          >
            <Check size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <CalendarClock size={20} className="text-accent-blue" /> Follow-ups
        </h1>
        <p className="text-sm text-muted">
          {overdue.length} overdue · {upcoming.length} upcoming
        </p>
      </div>

      {!loading && leads.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-foreground font-semibold">No follow-ups scheduled.</p>
          <p className="text-sm text-muted mt-1">
            Callbacks and meetings you set while logging calls will show up here.
          </p>
        </Card>
      )}

      {overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-red-500 mb-2">Overdue</h2>
          <Card className="divide-y divide-border">
            {overdue.map((lead) => (
              <Row key={lead._id} lead={lead} overdue />
            ))}
          </Card>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-2">Upcoming</h2>
          <Card className="divide-y divide-border">
            {upcoming.map((lead) => (
              <Row key={lead._id} lead={lead} overdue={false} />
            ))}
          </Card>
        </div>
      )}

      <CallLogModal open={!!callLead} onClose={() => setCallLead(null)} lead={callLead} onLogged={load} />

      {rescheduleLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setRescheduleLead(null)} />
          <div className="relative bg-surface rounded-3xl card-shadow p-6 w-full max-w-sm">
            <h2 className="font-bold text-foreground text-lg mb-4">
              Reschedule — {rescheduleLead.name}
            </h2>
            <input
              type="datetime-local"
              value={rescheduleValue}
              onChange={(e) => setRescheduleValue(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent-blue/40 mb-4"
            />
            <button
              onClick={saveReschedule}
              className="w-full rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 hover:opacity-90 transition"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
