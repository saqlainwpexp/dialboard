"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PhoneCall, ListChecks, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/Badge";
import { CallLogModal } from "@/components/CallLogModal";
import type { LeadRow } from "@/types";

const PRIORITY_WEIGHT: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function LoadBoardPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [callLead, setCallLead] = useState<LeadRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status: "new,queued,callback",
      dueBefore: new Date().toISOString(),
    });
    const res = await fetch(`/api/leads?${params.toString()}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...leads].sort((a, b) => {
        const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        if (pw !== 0) return pw;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }),
    [leads]
  );

  const upNext = sorted[0];
  const rest = sorted.slice(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ListChecks size={20} className="text-accent-blue" /> Load Board
        </h1>
        <p className="text-sm text-muted">
          {sorted.length} lead{sorted.length === 1 ? "" : "s"} ready to call — sorted by priority
        </p>
      </div>

      {!loading && !upNext && (
        <Card className="p-10 text-center">
          <p className="text-foreground font-semibold">Queue is clear.</p>
          <p className="text-sm text-muted mt-1">
            Add leads or wait for scheduled callbacks to land here.
          </p>
        </Card>
      )}

      {upNext && (
        <Card className="p-6 border-2 border-accent-blue/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wide text-accent-blue">Up next</span>
            <PriorityBadge priority={upNext.priority} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-extrabold text-foreground">{upNext.name}</div>
              <div className="text-sm text-muted">
                {upNext.company}
                {upNext.title ? ` · ${upNext.title}` : ""}
              </div>
              <div className="text-sm text-foreground font-semibold mt-2">{upNext.phone}</div>
              {upNext.nextActionAt && (
                <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <Clock size={12} /> Callback was due{" "}
                  {new Date(upNext.nextActionAt).toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${upNext.phone}`}
                className="flex items-center gap-2 bg-accent-blue text-white rounded-full px-5 py-3 text-sm font-semibold hover:opacity-90 transition"
              >
                <PhoneCall size={16} /> Call now
              </a>
              <button
                onClick={() => setCallLead(upNext)}
                className="bg-surface card-shadow rounded-full px-5 py-3 text-sm font-semibold text-foreground hover:opacity-80 transition"
              >
                Log call
              </button>
            </div>
          </div>
        </Card>
      )}

      {rest.length > 0 && (
        <Card className="divide-y divide-border">
          {rest.map((lead) => (
            <div key={lead._id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="font-semibold text-foreground text-sm">{lead.name}</div>
                <div className="text-xs text-muted">
                  {lead.company} · {lead.phone}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={lead.priority} />
                <button
                  onClick={() => setCallLead(lead)}
                  className="flex items-center gap-1.5 bg-accent-blue-soft text-accent-blue rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition"
                >
                  <PhoneCall size={12} /> Log call
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <CallLogModal open={!!callLead} onClose={() => setCallLead(null)} lead={callLead} onLogged={load} />
    </div>
  );
}
