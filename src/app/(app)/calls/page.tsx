"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { PhoneCall as PhoneCallIcon, Pencil, Trash2, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DispositionBadge } from "@/components/ui/DispositionBadge";
import { EditCallModal } from "@/components/EditCallModal";
import { OBJECTION_LABELS, DISPOSITION_LABELS } from "@/lib/labels";
import { downloadCsv } from "@/lib/csv";
import type { CallWithLead } from "@/types";

const DISPOSITION_FILTERS = [
  { value: "", label: "All dispositions" },
  { value: "no_answer", label: "No Answer" },
  { value: "voicemail", label: "Voicemail" },
  { value: "gatekeeper", label: "Gatekeeper" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "not_interested", label: "Not Interested" },
  { value: "callback_requested", label: "Callback Requested" },
  { value: "meeting_booked", label: "Meeting Booked" },
  { value: "dnc", label: "Do Not Call" },
];

export default function CallsPage() {
  const [calls, setCalls] = useState<CallWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [disposition, setDisposition] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editCall, setEditCall] = useState<CallWithLead | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (disposition) params.set("disposition", disposition);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    const res = await fetch(`/api/calls?${params.toString()}`);
    const data = await res.json();
    setCalls(data.calls ?? []);
    setLoading(false);
  }, [disposition, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this call log entry?")) return;
    await fetch(`/api/calls/${id}`, { method: "DELETE" });
    load();
  }

  function handleExport() {
    downloadCsv(
      `calls-${new Date().toISOString().slice(0, 10)}.csv`,
      calls.map((c) => ({
        date: format(new Date(c.calledAt), "yyyy-MM-dd HH:mm"),
        lead: c.lead?.name ?? "",
        phone: c.lead?.phone ?? "",
        disposition: DISPOSITION_LABELS[c.disposition] ?? c.disposition,
        script: c.script?.name ?? "",
        objection: c.objection ? OBJECTION_LABELS[c.objection] ?? c.objection : "",
        durationMinutes: c.durationSeconds ? Math.round(c.durationSeconds / 60) : 0,
        notes: c.notes,
      })),
      [
        { key: "date", header: "Date" },
        { key: "lead", header: "Lead" },
        { key: "phone", header: "Phone" },
        { key: "disposition", header: "Disposition" },
        { key: "script", header: "Script" },
        { key: "objection", header: "Objection" },
        { key: "durationMinutes", header: "Duration (min)" },
        { key: "notes", header: "Notes" },
      ]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Call History</h1>
          <p className="text-sm text-muted">{calls.length} calls logged</p>
        </div>
        <button
          onClick={handleExport}
          disabled={calls.length === 0}
          className="flex items-center gap-2 bg-surface card-shadow rounded-full px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-80 transition disabled:opacity-40"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      <Card className="p-4 flex flex-wrap items-center gap-3">
        <select
          value={disposition}
          onChange={(e) => setDisposition(e.target.value)}
          className="bg-background rounded-full px-4 py-2 text-sm outline-none text-foreground"
        >
          {DISPOSITION_FILTERS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-2">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-background rounded-full px-3 py-2 text-sm outline-none text-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-2">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-background rounded-full px-3 py-2 text-sm outline-none text-foreground"
          />
        </div>
        {(disposition || from || to) && (
          <button
            onClick={() => {
              setDisposition("");
              setFrom("");
              setTo("");
            }}
            className="text-xs text-muted-2 hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-2 text-xs uppercase tracking-wide border-b border-border">
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Lead</th>
              <th className="px-5 py-3 font-semibold">Disposition</th>
              <th className="px-5 py-3 font-semibold">Objection</th>
              <th className="px-5 py-3 font-semibold">Notes</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!loading && calls.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-2">
                  No calls match these filters.
                </td>
              </tr>
            )}
            {calls.map((call) => (
              <tr key={call._id} className="hover:bg-background/60 transition align-top">
                <td className="px-5 py-3 text-muted whitespace-nowrap">
                  {format(new Date(call.calledAt), "MMM d, h:mm a")}
                </td>
                <td className="px-5 py-3">
                  {call.lead ? (
                    <Link
                      href={`/leads/${call.lead._id}`}
                      className="font-semibold text-foreground hover:text-accent-blue hover:underline"
                    >
                      {call.lead.name}
                    </Link>
                  ) : (
                    <span className="text-muted-2">Deleted lead</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <DispositionBadge disposition={call.disposition} />
                </td>
                <td className="px-5 py-3 text-muted">
                  {call.objection ? OBJECTION_LABELS[call.objection] ?? call.objection : "—"}
                </td>
                <td className="px-5 py-3 text-muted max-w-xs truncate">{call.notes || "—"}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {call.lead && (
                      <a
                        href={`tel:${call.lead.phone}`}
                        className="w-8 h-8 rounded-full bg-accent-blue-soft text-accent-blue flex items-center justify-center hover:opacity-80 transition"
                      >
                        <PhoneCallIcon size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => setEditCall(call)}
                      className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-foreground transition"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(call._id)}
                      className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-red-500 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <EditCallModal open={!!editCall} onClose={() => setEditCall(null)} call={editCall} onSaved={load} />
    </div>
  );
}
