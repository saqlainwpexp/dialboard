"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "@/components/ui/FormField";
import { ProgressBar } from "@/components/ui/ProgressBar";

type ScriptWithStats = {
  _id: string;
  name: string;
  version: string;
  body: string;
  createdAt: string;
  stats: { totalCalls: number; meetings: number; meetingRate: number };
};

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<ScriptWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("v1");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/scripts?stats=1");
    const data = await res.json();
    setScripts(data.scripts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, version, body }),
    });
    setSubmitting(false);
    setName("");
    setVersion("v1");
    setBody("");
    setOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this script?")) return;
    await fetch(`/api/scripts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Scripts</h1>
          <p className="text-sm text-muted">Track which pitch actually books meetings</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-accent-blue text-white rounded-full px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={15} /> New script
        </button>
      </div>

      {!loading && scripts.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-foreground font-semibold">No scripts yet.</p>
          <p className="text-sm text-muted mt-1">Add your opener/pitch to start tracking what converts.</p>
        </Card>
      )}

      <div className="space-y-4">
        {scripts.map((s) => (
          <Card key={s._id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-accent-orange-soft text-accent-orange flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-foreground">
                    {s.name} <span className="text-muted font-normal text-sm">· {s.version}</span>
                  </div>
                  {s.body && (
                    <p className="text-sm text-muted mt-1 line-clamp-2 whitespace-pre-wrap">{s.body}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(s._id)}
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-red-500 transition shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="mt-4 max-w-sm">
              <ProgressBar
                label={`${s.stats.totalCalls} calls`}
                value={s.stats.meetingRate}
                trend={s.stats.meetingRate >= 15 ? "up" : "down"}
              />
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New script">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name *">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Cold open — pain first"
              />
            </Field>
            <Field label="Version">
              <input value={version} onChange={(e) => setVersion(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Script body">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className={inputClass}
              placeholder="Hi [Name], this is..."
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Create script"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
