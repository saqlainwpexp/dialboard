"use client";

import { useEffect, useState } from "react";
import { PhoneCall } from "lucide-react";
import clsx from "clsx";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "@/components/ui/FormField";
import { TimezoneWarning } from "@/components/ui/TimezoneWarning";

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

export function CallLogModal({
  open,
  onClose,
  lead,
  onLogged,
}: {
  open: boolean;
  onClose: () => void;
  lead: { _id: string; name: string; phone: string; timezone?: string } | null;
  onLogged: () => void;
}) {
  const [scripts, setScripts] = useState<ScriptOption[]>([]);
  const [disposition, setDisposition] = useState("no_answer");
  const [scriptId, setScriptId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [objection, setObjection] = useState("");
  const [notes, setNotes] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/scripts")
        .then((r) => r.json())
        .then((d) => setScripts(d.scripts ?? []));
      setDisposition("no_answer");
      setScriptId("");
      setDurationMinutes("");
      setObjection("");
      setNotes("");
      setNextActionAt("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const index = parseInt(e.key, 10) - 1;
      if (index >= 0 && index < DISPOSITIONS.length) {
        setDisposition(DISPOSITIONS[index].value);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!lead) return null;

  const needsFollowUp = disposition === "callback_requested" || disposition === "meeting_booked";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: lead!._id,
        disposition,
        scriptId: scriptId || null,
        durationSeconds: durationMinutes ? Math.round(parseFloat(durationMinutes) * 60) : 0,
        objection: objection || null,
        notes,
        nextActionAt: nextActionAt || null,
      }),
    });
    setSubmitting(false);
    onLogged();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Log call — ${lead.name}`}>
      <div className="flex items-center gap-3 -mt-2 mb-4 flex-wrap">
        <a
          href={`tel:${lead.phone}`}
          className="text-sm text-accent-blue font-medium inline-flex items-center gap-1.5 hover:underline"
        >
          <PhoneCall size={13} /> {lead.phone}
        </a>
        {lead.timezone && <TimezoneWarning timezone={lead.timezone} />}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Disposition">
          <div className="grid grid-cols-2 gap-2">
            {DISPOSITIONS.map((d, i) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDisposition(d.value)}
                className={clsx(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition text-left",
                  disposition === d.value
                    ? "bg-accent-blue text-white"
                    : "bg-background text-foreground hover:bg-border/60"
                )}
              >
                <span
                  className={clsx(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    disposition === d.value ? "bg-white/25" : "bg-border text-muted-2"
                  )}
                >
                  {i + 1}
                </span>
                {d.label}
              </button>
            ))}
          </div>
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
              placeholder="0"
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

        {needsFollowUp && (
          <Field label={disposition === "meeting_booked" ? "Meeting date/time" : "Callback date/time"}>
            <input
              type="datetime-local"
              value={nextActionAt}
              onChange={(e) => setNextActionAt(e.target.value)}
              className={inputClass}
            />
          </Field>
        )}

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="What came up on the call…"
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save call log"}
        </button>
      </form>
    </Modal>
  );
}
