"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "@/components/ui/FormField";
import { COMMON_TIMEZONES } from "@/lib/timezones";
import type { LeadRow, AdditionalPhone, CustomField } from "@/types";

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
  const [additionalPhones, setAdditionalPhones] = useState<AdditionalPhone[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
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
      setAdditionalPhones(lead?.additionalPhones ?? []);
      setCustomFields(lead?.customFields ?? []);
      setError("");
    }
  }, [open, lead]);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updatePhoneRow(index: number, key: keyof AdditionalPhone, value: string) {
    setAdditionalPhones((rows) => rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function updateFieldRow(index: number, key: keyof CustomField, value: string) {
    setCustomFields((rows) => rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch(isEdit ? `/api/leads/${lead!._id}` : "/api/leads", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        additionalPhones: additionalPhones.filter((p) => p.number.trim()),
        customFields: customFields.filter((f) => f.key.trim()),
      }),
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-2">Additional phone numbers</label>
            <button
              type="button"
              onClick={() => setAdditionalPhones((rows) => [...rows, { label: "", number: "" }])}
              className="text-xs font-semibold text-accent-blue hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {additionalPhones.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={row.label}
                  onChange={(e) => updatePhoneRow(i, "label", e.target.value)}
                  placeholder="Mobile, Office…"
                  className={`${inputClass} w-32 shrink-0`}
                />
                <input
                  value={row.number}
                  onChange={(e) => updatePhoneRow(i, "number", e.target.value)}
                  placeholder="+1 555 123 4567"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setAdditionalPhones((rows) => rows.filter((_, idx) => idx !== i))}
                  className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-red-500 transition shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
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
            <select
              value={form.timezone}
              onChange={(e) => update("timezone", e.target.value)}
              className={inputClass}
            >
              <option value="">Unknown</option>
              {form.timezone && !COMMON_TIMEZONES.some((tz) => tz.value === form.timezone) && (
                <option value={form.timezone}>{form.timezone}</option>
              )}
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-2">Custom fields</label>
            <button
              type="button"
              onClick={() => setCustomFields((rows) => [...rows, { key: "", value: "" }])}
              className="text-xs font-semibold text-accent-blue hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {customFields.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={row.key}
                  onChange={(e) => updateFieldRow(i, "key", e.target.value)}
                  placeholder="LinkedIn URL, Company size…"
                  className={`${inputClass} w-40 shrink-0`}
                />
                <input
                  value={row.value}
                  onChange={(e) => updateFieldRow(i, "value", e.target.value)}
                  placeholder="Value"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setCustomFields((rows) => rows.filter((_, idx) => idx !== i))}
                  className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-red-500 transition shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
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
