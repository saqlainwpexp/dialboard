"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  PhoneCall,
  Mail,
  Building2,
  Briefcase,
  Tag,
  Globe,
  Pencil,
  Trash2,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { DispositionBadge } from "@/components/ui/DispositionBadge";
import { AddLeadModal } from "@/components/AddLeadModal";
import { CallLogModal } from "@/components/CallLogModal";
import { OBJECTION_LABELS } from "@/lib/labels";
import type { LeadRow, CallRow } from "@/types";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<LeadRow | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/leads/${params.id}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setLead(data.lead);
    setCalls(data.calls ?? []);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!lead) return;
    if (!confirm(`Delete ${lead.name} and all their call history?`)) return;
    await fetch(`/api/leads/${lead._id}`, { method: "DELETE" });
    router.push("/leads");
  }

  async function handleDeleteCall(callId: string) {
    if (!confirm("Delete this call log entry?")) return;
    await fetch(`/api/calls/${callId}`, { method: "DELETE" });
    load();
  }

  if (loading) {
    return <div className="text-sm text-muted">Loading…</div>;
  }

  if (notFound || !lead) {
    return (
      <Card className="p-10 text-center">
        <p className="text-foreground font-semibold">Lead not found.</p>
        <Link href="/leads" className="text-sm text-accent-blue hover:underline mt-2 inline-block">
          Back to Leads
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/leads" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground w-fit">
        <ArrowLeft size={14} /> Back to Leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-foreground">{lead.name}</h1>
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </div>
          <p className="text-sm text-muted mt-1">
            {lead.title}
            {lead.title && lead.company ? " at " : ""}
            {lead.company}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCallOpen(true)}
            className="flex items-center gap-2 bg-accent-blue text-white rounded-full px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
          >
            <PhoneCall size={15} /> Log call
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 bg-surface card-shadow rounded-full px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-80 transition"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="w-10 h-10 rounded-full bg-surface card-shadow flex items-center justify-center text-muted hover:text-red-500 transition"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-foreground">Details</h2>

          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-2.5 text-sm text-foreground hover:text-accent-blue"
          >
            <PhoneCall size={15} className="text-muted-2" /> {lead.phone}
          </a>
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-2.5 text-sm text-foreground hover:text-accent-blue"
            >
              <Mail size={15} className="text-muted-2" /> {lead.email}
            </a>
          )}
          {lead.company && (
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Building2 size={15} className="text-muted-2" /> {lead.company}
            </div>
          )}
          {lead.industry && (
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Briefcase size={15} className="text-muted-2" /> {lead.industry}
            </div>
          )}
          {lead.source && (
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Tag size={15} className="text-muted-2" /> {lead.source}
            </div>
          )}
          {lead.timezone && (
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Globe size={15} className="text-muted-2" /> {lead.timezone}
            </div>
          )}
          <div className="text-sm text-foreground">
            Campaign: <span className="text-muted">{lead.campaign?.name ?? "—"}</span>
          </div>
          {lead.nextActionAt && (
            <div className="flex items-center gap-2.5 text-sm text-amber-600">
              <Clock size={15} /> Next action: {format(new Date(lead.nextActionAt), "EEE, MMM d, h:mm a")}
            </div>
          )}
          {lead.notes && (
            <div className="pt-3 border-t border-border">
              <div className="text-xs font-semibold text-muted-2 mb-1">Notes</div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-bold text-foreground mb-4">Call history</h2>
          {calls.length === 0 && (
            <p className="text-sm text-muted-2">No calls logged yet for this lead.</p>
          )}
          <div className="space-y-4 divide-y divide-border">
            {calls.map((call) => (
              <div key={call._id} className="pt-4 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DispositionBadge disposition={call.disposition} />
                    {call.script && (
                      <span className="text-xs text-muted-2">via {call.script.name}</span>
                    )}
                    {call.objection && (
                      <span className="text-xs text-muted-2">
                        · Objection: {OBJECTION_LABELS[call.objection] ?? call.objection}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-2">
                      {format(new Date(call.calledAt), "MMM d, h:mm a")}
                    </span>
                    <button
                      onClick={() => handleDeleteCall(call._id)}
                      className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-muted-2 hover:text-red-500 transition"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                {call.notes && <p className="text-sm text-foreground mt-1.5">{call.notes}</p>}
                {call.durationSeconds > 0 && (
                  <p className="text-xs text-muted-2 mt-1">
                    Duration: {Math.round(call.durationSeconds / 60)} min
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AddLeadModal open={editOpen} onClose={() => setEditOpen(false)} onAdded={load} lead={lead} />
      <CallLogModal open={callOpen} onClose={() => setCallOpen(false)} lead={lead} onLogged={load} />
    </div>
  );
}
