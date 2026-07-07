"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Upload, Download, Search, PhoneCall, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { AddLeadModal } from "@/components/AddLeadModal";
import { ImportCsvModal } from "@/components/ImportCsvModal";
import { CallLogModal } from "@/components/CallLogModal";
import { downloadCsv } from "@/lib/csv";
import type { LeadRow } from "@/types";

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "queued", label: "Queued" },
  { value: "contacted", label: "Contacted" },
  { value: "callback", label: "Callback" },
  { value: "meeting_booked", label: "Meeting Booked" },
  { value: "not_interested", label: "Not Interested" },
  { value: "dnc", label: "DNC" },
];

type CampaignOption = { _id: string; name: string };

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [callLead, setCallLead] = useState<LeadRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkCampaign, setBulkCampaign] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await fetch(`/api/leads?${params.toString()}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []));
  }, []);

  useEffect(() => {
    setSelected(new Set());
  }, [leads]);

  const allSelected = leads.length > 0 && selected.size === leads.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(leads.map((l) => l._id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this lead and its call history?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    load();
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} lead(s) and their call history?`)) return;
    setBulkBusy(true);
    await fetch("/api/leads/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setBulkBusy(false);
    load();
  }

  async function handleBulkStatus() {
    if (!bulkStatus) return;
    setBulkBusy(true);
    await fetch("/api/leads/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
    });
    setBulkBusy(false);
    setBulkStatus("");
    load();
  }

  async function handleBulkCampaign() {
    setBulkBusy(true);
    await fetch("/api/leads/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: Array.from(selected),
        campaign: bulkCampaign === "none" ? "" : bulkCampaign,
      }),
    });
    setBulkBusy(false);
    setBulkCampaign("");
    load();
  }

  function handleExport() {
    const rows = selected.size > 0 ? leads.filter((l) => selected.has(l._id)) : leads;
    downloadCsv(
      `leads-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((l) => ({ ...l, campaign: l.campaign?.name ?? "" })),
      [
        { key: "name", header: "Name" },
        { key: "phone", header: "Phone" },
        { key: "company", header: "Company" },
        { key: "title", header: "Title" },
        { key: "email", header: "Email" },
        { key: "source", header: "Source" },
        { key: "industry", header: "Industry" },
        { key: "status", header: "Status" },
        { key: "priority", header: "Priority" },
        { key: "campaign", header: "Campaign" },
        { key: "notes", header: "Notes" },
      ]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted">{leads.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={leads.length === 0}
            className="flex items-center gap-2 bg-surface card-shadow rounded-full px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-80 transition disabled:opacity-40"
          >
            <Download size={15} /> {selected.size > 0 ? `Export ${selected.size}` : "Export CSV"}
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 bg-surface card-shadow rounded-full px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-80 transition"
          >
            <Upload size={15} /> Import CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-accent-blue text-white rounded-full px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
          >
            <Plus size={15} /> Add lead
          </button>
        </div>
      </div>

      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-background rounded-full px-4 py-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-muted-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, phone…"
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-2"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-background rounded-full px-4 py-2 text-sm outline-none text-foreground"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Card>

      {selected.size > 0 && (
        <Card className="p-4 flex flex-wrap items-center gap-3 border-2 border-accent-blue/20">
          <span className="text-sm font-semibold text-foreground">{selected.size} selected</span>

          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="bg-background rounded-full px-4 py-2 text-sm outline-none text-foreground"
          >
            <option value="">Change status to…</option>
            {STATUS_FILTERS.filter((s) => s.value).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkStatus}
            disabled={!bulkStatus || bulkBusy}
            className="text-xs font-semibold text-accent-blue hover:underline disabled:opacity-40"
          >
            Apply
          </button>

          <select
            value={bulkCampaign}
            onChange={(e) => setBulkCampaign(e.target.value)}
            className="bg-background rounded-full px-4 py-2 text-sm outline-none text-foreground"
          >
            <option value="">Assign campaign…</option>
            <option value="none">None</option>
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkCampaign}
            disabled={!bulkCampaign || bulkBusy}
            className="text-xs font-semibold text-accent-blue hover:underline disabled:opacity-40"
          >
            Apply
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={bulkBusy}
            className="flex items-center gap-1.5 bg-red-50 text-red-500 rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition ml-auto"
          >
            <Trash2 size={12} /> Delete selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-muted hover:text-foreground transition"
          >
            <X size={13} />
          </button>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-2 text-xs uppercase tracking-wide border-b border-border">
              <th className="px-5 py-3 font-semibold w-8">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
              </th>
              <th className="px-5 py-3 font-semibold">Lead</th>
              <th className="px-5 py-3 font-semibold">Phone</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Priority</th>
              <th className="px-5 py-3 font-semibold">Campaign</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!loading && leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted-2">
                  No leads yet. Add one or import a CSV to get started.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-background/60 transition">
                <td className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(lead._id)}
                    onChange={() => toggleOne(lead._id)}
                    className="rounded"
                  />
                </td>
                <td className="px-5 py-3">
                  <Link href={`/leads/${lead._id}`} className="font-semibold text-foreground hover:text-accent-blue hover:underline">
                    {lead.name}
                  </Link>
                  <div className="text-xs text-muted">
                    {lead.company}
                    {lead.title ? ` · ${lead.title}` : ""}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-foreground font-medium hover:text-accent-blue hover:underline"
                  >
                    {lead.phone}
                  </a>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-5 py-3">
                  <PriorityBadge priority={lead.priority} />
                </td>
                <td className="px-5 py-3 text-muted">{lead.campaign?.name ?? "—"}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setCallLead(lead)}
                      className="flex items-center gap-1.5 bg-accent-blue-soft text-accent-blue rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition"
                    >
                      <PhoneCall size={12} /> Log call
                    </button>
                    <button
                      onClick={() => handleDelete(lead._id)}
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

      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={load} />
      <ImportCsvModal open={importOpen} onClose={() => setImportOpen(false)} onImported={load} />
      <CallLogModal open={!!callLead} onClose={() => setCallLead(null)} lead={callLead} onLogged={load} />
    </div>
  );
}
