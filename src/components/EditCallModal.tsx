"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "@/components/ui/FormField";
import type { CallWithLead } from "@/types";

const DISPOSITIONS = [
  { value: "no_answer", label: "No Answer" },
  { value: "voicemail", label: "Voicemail" },
  { value: "gatekeeper", label: "Gatekeeper" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "not_interested", label: "Not Interested" },
  { value: "callback_requested", label: "Callback Requested" },
  { value: "meeting_booked", label: "Meeting Booked" },
  { value: "dnc", label: "Do Not Call" },
];

const OBJECTIONS = [
  { value: "", label: "None" },
  { value: "price", label: "Price" },
  { value: "timing", label: "Timing" },
  { value: "no_budget", label: "No Budget" },
  { value: "already_have_vendor", label: "Already Have Vendor" },
  { value: "not_decision_maker", label: "Not Decision Maker" },
  { value: "no_need", label: "No Need" },
  { value: "other", label: "Other" },
];

type ScriptOption = { _id: string; name: string };

export function EditCallModal({
  open,
  onClose,
  call,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  call: CallWithLead | null;
  onSaved: () => void;
}) {
  const [scripts, setScripts] = useState<ScriptOption[]>([]);
  const [disposition, setDisposition] = useState("no_answer");
  const [scriptId, setScriptId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [objection, setObjection] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && call) {
      fetch("/api/scripts")
        .then((r) => r.json())
        .then((d) => setScripts(d.scripts ?? []));
      setDisposition(call.disposition);
      setScriptId(call.script?._id ?? "");
      setDurationMinutes(call.durationSeconds ? String(call.durationSeconds / 60) : "");
      setObjection(call.objection ?? "");
      setNotes(call.notes ?? "");
    }
  }, [open, call]);

  if (!call) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch(`/api/calls/${call!._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disposition,
        scriptId: scriptId || null,
        durationSeconds: durationMinutes ? Math.round(parseFloat(durationMinutes) * 60) : 0,
        objection: objection || null,
        notes,
      }),
    });
    setSubmitting(false);
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit call — ${call.lead?.name ?? "Unknown lead"}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Disposition">
          <select
            value={disposition}
            onChange={(e) => setDisposition(e.target.value)}
            className={inputClass}
          >
            {DISPOSITIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Script used">
            <select value={scriptId} onChange={(e) => setScriptId(e.target.value)} className={inputClass}>
              <option value="">None</option>
              {scripts.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration (min)">
            <input
              type="number"
              min="0"
              step="0.5"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Objection raised">
          <select value={objection} onChange={(e) => setObjection(e.target.value)} className={inputClass}>
            {OBJECTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save changes"}
        </button>
      </form>
    </Modal>
  );
}
