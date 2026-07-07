"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Users2, PhoneCall, Trophy, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "@/components/ui/FormField";

type CampaignWithStats = {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  stats: { leadCount: number; totalCalls: number; meetings: number; meetingRate: number };
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setSubmitting(false);
    setName("");
    setDescription("");
    setOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign? Leads will be unassigned, not deleted.")) return;
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted">Group your leads into lists and compare performance</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-accent-blue text-white rounded-full px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={15} /> New campaign
        </button>
      </div>

      {!loading && campaigns.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-foreground font-semibold">No campaigns yet.</p>
          <p className="text-sm text-muted mt-1">Create one to start grouping your lead lists.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((c) => (
          <Card key={c._id} className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-accent-blue-soft text-accent-blue flex items-center justify-center font-bold">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => handleDelete(c._id)}
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-red-500 transition"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="font-bold text-foreground">{c.name}</div>
            {c.description && <p className="text-sm text-muted mt-0.5">{c.description}</p>}

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center bg-background rounded-2xl py-2.5">
                <Users2 size={14} className="mx-auto text-muted-2 mb-1" />
                <div className="text-sm font-bold text-foreground">{c.stats.leadCount}</div>
                <div className="text-[10px] text-muted-2">Leads</div>
              </div>
              <div className="text-center bg-background rounded-2xl py-2.5">
                <PhoneCall size={14} className="mx-auto text-muted-2 mb-1" />
                <div className="text-sm font-bold text-foreground">{c.stats.totalCalls}</div>
                <div className="text-[10px] text-muted-2">Calls</div>
              </div>
              <div className="text-center bg-background rounded-2xl py-2.5">
                <Trophy size={14} className="mx-auto text-muted-2 mb-1" />
                <div className="text-sm font-bold text-foreground">{c.stats.meetingRate}%</div>
                <div className="text-[10px] text-muted-2">Booked</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New campaign">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Name *">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="e.g. SaaS Founders — July batch"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Create campaign"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
