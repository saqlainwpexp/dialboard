"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "@/components/ui/FormField";
import type { LeadRow } from "@/types";

type CampaignOption = { _id: string; name: string };

const EMPTY_FORM = {
  name: "",
  company: "",
  title: "",
  phone: "",
  email: "",
  source: "",
  industry: "",
  timezone: "",
  priority: "medium",
  campaign: "",
  notes: "",
};

export function AddLeadModal({
  open,
  onClose,
  onAdded,
  lead,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  lead?: LeadRow | null;
}) {
  const isEdit = !!lead;
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/campaigns")
        .then((r) => r.json())
        .then((d) => setCampaigns(d.campaigns ?? []));
      setForm(
        lead
          ? {
              name: lead.name,
              company: lead.company,
              title: lead.title,
              phone: lead.phone,
              email: lead.email,
              source: lead.source,
              industry: lead.industry,
              timezone: lead.timezone,
              priority: lead.priority,
              campaign: lead.campaign?._id ?? "",
              notes: lead.notes,
            }
          : EMPTY_FORM
      );
      setError("");
    }
  }, [open, lead]);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch(isEdit ? `/api/leads/${lead!._id}` : "/api/leads", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }
    onAdded();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit lead" : "Add lead"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name *">
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone *">
            <input
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
              placeholder="+1 555 123 4567"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company">
            <input
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Source">
            <input
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
              className={inputClass}
              placeholder="e.g. Apollo, referral"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Industry">
            <input
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Timezone">
            <input
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
              className={inputClass}
              placeholder="e.g. ET, PT"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
              className={inputClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Campaign">
            <select
              value={form.campaign}
              onChange={(e) => update("campaign", e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {campaigns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            className={inputClass}
          />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-60"
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Add lead"}
        </button>
      </form>
    </Modal>
  );
}
