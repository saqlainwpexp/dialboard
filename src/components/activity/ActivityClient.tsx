"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Activity as ActivityIcon, ArrowRight, Hand, UserPlus, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

type ActivityRow = {
  _id: string;
  type: "status_change" | "assigned" | "claimed" | "lead_created";
  actorName: string;
  leadName: string;
  lead: string | null;
  from: string;
  to: string;
  meta?: { via?: string };
  createdAt: string;
};

type Member = { _id: string; name: string };

const TYPE_FILTERS = [
  { value: "", label: "All activity" },
  { value: "status_change", label: "Status changes" },
  { value: "assigned", label: "Assignments" },
  { value: "claimed", label: "Claims" },
];

function TypeIcon({ type }: { type: ActivityRow["type"] }) {
  if (type === "claimed") return <Hand size={14} className="text-accent-orange" />;
  if (type === "assigned") return <UserPlus size={14} className="text-accent-blue" />;
  return <RefreshCw size={14} className="text-muted-2" />;
}

export function ActivityClient() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [actor, setActor] = useState("");
  const [type, setType] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actor) params.set("actor", actor);
    if (type) params.set("type", type);
    const res = await fetch(`/api/activity?${params.toString()}`);
    const data = await res.json();
    setRows(data.activity ?? []);
    setLoading(false);
  }, [actor, type]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => setMembers((d.team ?? []).map((m: Member) => ({ _id: m._id, name: m.name }))))
      .catch(() => {});
  }, []);

  const selectClass =
    "bg-surface card-shadow rounded-lg px-3 py-1.5 text-[13px] outline-none text-foreground";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ActivityIcon size={18} className="text-accent-blue" /> Activity
          </h1>
          <p className="text-[13px] text-muted">Every status change, claim, and assignment across your team.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={actor} onChange={(e) => setActor(e.target.value)} className={selectClass}>
            <option value="">Everyone</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            {TYPE_FILTERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="divide-y divide-border">
        {loading && <p className="text-[13px] text-muted px-5 py-4">Loading…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-[13px] text-muted-2 px-5 py-10 text-center">
            No activity yet. It appears here as your team works leads.
          </p>
        )}
        {rows.map((r) => (
          <div key={r._id} className="flex items-center gap-3 px-5 py-3">
            <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center shrink-0">
              <TypeIcon type={r.type} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-foreground flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold">{r.actorName || "Someone"}</span>
                {r.type === "status_change" && (
                  <>
                    <span className="text-muted">moved</span>
                    <LeadName id={r.lead} name={r.leadName} />
                    {r.from && <StatusBadge status={r.from} />}
                    <ArrowRight size={12} className="text-muted-2" />
                    <StatusBadge status={r.to} />
                  </>
                )}
                {r.type === "assigned" && (
                  <>
                    <span className="text-muted">assigned</span>
                    <LeadName id={r.lead} name={r.leadName} />
                    <span className="text-muted">to</span>
                    <span className="font-semibold">{r.to}</span>
                  </>
                )}
                {r.type === "claimed" && (
                  <>
                    <span className="text-muted">claimed</span>
                    <LeadName id={r.lead} name={r.leadName} />
                    <span className="text-muted">from the pool</span>
                  </>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-2 shrink-0 whitespace-nowrap">
              {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function LeadName({ id, name }: { id: string | null; name: string }) {
  if (!id) return <span className="font-semibold">{name || "a lead"}</span>;
  return (
    <Link href={`/leads/${id}`} className="font-semibold text-foreground hover:text-accent-blue hover:underline">
      {name || "a lead"}
    </Link>
  );
}
