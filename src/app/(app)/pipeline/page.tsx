"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Workflow } from "lucide-react";
import { PriorityBadge } from "@/components/ui/Badge";
import { StaleBadge } from "@/components/ui/StaleBadge";
import type { LeadRow } from "@/types";

const COLUMNS = [
  { status: "new", label: "New" },
  { status: "queued", label: "Queued" },
  { status: "contacted", label: "Contacted" },
  { status: "callback", label: "Callback" },
  { status: "meeting_booked", label: "Meeting Booked" },
  { status: "not_interested", label: "Not Interested" },
  { status: "dnc", label: "DNC" },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDrop(status: string, e: React.DragEvent) {
    e.preventDefault();
    setDragOverStatus(null);
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    setLeads((prev) => prev.map((l) => (l._id === leadId ? { ...l, status } : l)));
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Workflow size={20} className="text-accent-blue" /> Pipeline
        </h1>
        <p className="text-sm text-muted">Drag leads between stages to update their status</p>
      </div>

      {!loading && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.status);
            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStatus(col.status);
                }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(e) => handleDrop(col.status, e)}
                className={`w-72 shrink-0 rounded-3xl p-3 transition ${
                  dragOverStatus === col.status ? "bg-accent-blue-soft" : "bg-surface"
                } card-shadow`}
              >
                <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                  <span className="text-sm font-bold text-foreground">{col.label}</span>
                  <span className="text-xs font-semibold text-muted-2 bg-background rounded-full px-2 py-0.5">
                    {colLeads.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {colLeads.map((lead) => (
                    <div
                      key={lead._id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", lead._id)}
                      className="bg-background rounded-2xl p-3 cursor-grab active:cursor-grabbing hover:opacity-90 transition"
                    >
                      <Link
                        href={`/leads/${lead._id}`}
                        className="text-sm font-semibold text-foreground hover:text-accent-blue hover:underline"
                      >
                        {lead.name}
                      </Link>
                      <div className="text-xs text-muted truncate">{lead.company}</div>
                      <div className="text-xs text-muted-2 mt-1">{lead.phone}</div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <PriorityBadge priority={lead.priority} />
                        <StaleBadge lead={lead} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
