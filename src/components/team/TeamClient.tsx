"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, KeyRound, Trash2, ShieldCheck, Phone, Ban, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/FormField";

const roleLabel = (role: string) => (role === "manager" ? "Manager" : "Caller");

type TeamMember = {
  _id: string;
  name: string;
  email: string;
  role: "manager" | "rep";
  active: boolean;
  dailyCallGoal: number;
  assignedLeads: number;
  callsToday: number;
};

export function TeamClient() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"manager" | "rep">("rep");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team");
    const data = await res.json();
    setTeam(data.team ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreated("");
    setBusy(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setCreated(`${name} can now log in with ${email.toLowerCase().trim()} and the password you set.`);
    setName("");
    setEmail("");
    setPassword("");
    setRole("rep");
    load();
  }

  async function patch(id: string, body: Record<string, unknown>, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    const res = await fetch(`/api/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Something went wrong.");
      return;
    }
    load();
  }

  async function resetPassword(id: string, memberName: string) {
    const pw = prompt(`Set a new password for ${memberName} (at least 8 characters):`);
    if (pw === null) return;
    if (pw.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    await patch(id, { password: pw });
    alert(`Password updated. Give ${memberName} the new password.`);
  }

  async function remove(id: string, memberName: string) {
    if (!confirm(`Delete ${memberName}? Their leads go back to the unassigned pool and their call history is kept.`)) {
      return;
    }
    const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Something went wrong.");
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Users size={20} className="text-accent-blue" /> Team
        </h1>
        <p className="text-sm text-muted">Add callers and manage who can log in.</p>
      </div>

      <Card className="p-6">
        <h2 className="font-bold text-foreground mb-1 flex items-center gap-2">
          <UserPlus size={16} className="text-accent-blue" /> Add a caller
        </h2>
        <p className="text-sm text-muted mb-4">
          You set their starting password, then share the email and password with them.
        </p>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Jordan Rivera" />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="jordan@agency.com" />
          </Field>
          <Field label="Starting password">
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={inputClass} placeholder="at least 8 characters" />
          </Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as "manager" | "rep")} className={inputClass}>
              <option value="rep">Caller — works assigned leads</option>
              <option value="manager">Manager — full access</option>
            </select>
          </Field>
          {error && <p className="text-sm text-red-500 sm:col-span-2">{error}</p>}
          {created && <p className="text-sm text-emerald-600 sm:col-span-2">{created}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className="rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 px-6 hover:opacity-90 transition disabled:opacity-60">
              {busy ? "Adding…" : "Add caller"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-foreground mb-4">Everyone</h2>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-2 text-xs uppercase tracking-wide border-b border-border">
                  <th className="py-2 pr-4 font-semibold">Name</th>
                  <th className="py-2 pr-4 font-semibold">Role</th>
                  <th className="py-2 pr-4 font-semibold">Assigned</th>
                  <th className="py-2 pr-4 font-semibold">Calls today</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {team.map((m) => (
                  <tr key={m._id} className={m.active === false ? "opacity-50" : ""}>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-foreground">{m.name}</div>
                      <div className="text-xs text-muted">{m.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1 text-foreground">
                        {m.role === "manager" ? <ShieldCheck size={13} className="text-accent-blue" /> : <Phone size={13} className="text-muted-2" />}
                        {roleLabel(m.role)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted">{m.assignedLeads}</td>
                    <td className="py-3 pr-4 text-muted">{m.callsToday}</td>
                    <td className="py-3 pr-4">
                      {m.active === false ? (
                        <span className="text-red-500 text-xs font-semibold">Deactivated</span>
                      ) : (
                        <span className="text-emerald-600 text-xs font-semibold">Active</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => resetPassword(m._id, m.name)}
                          title="Reset password"
                          className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted hover:text-foreground transition"
                        >
                          <KeyRound size={14} />
                        </button>
                        {m.role === "rep" ? (
                          <button
                            onClick={() => patch(m._id, { role: "manager" }, `Promote ${m.name} to manager? They'll get full access.`)}
                            title="Promote to manager"
                            className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted hover:text-accent-blue transition"
                          >
                            <ShieldCheck size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => patch(m._id, { role: "rep" }, `Make ${m.name} a caller? They'll only see leads assigned to them.`)}
                            title="Make caller"
                            className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted hover:text-foreground transition"
                          >
                            <Phone size={14} />
                          </button>
                        )}
                        {m.active === false ? (
                          <button
                            onClick={() => patch(m._id, { active: true })}
                            title="Reactivate"
                            className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted hover:text-emerald-600 transition"
                          >
                            <RotateCcw size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => patch(m._id, { active: false }, `Deactivate ${m.name}? They won't be able to log in.`)}
                            title="Deactivate"
                            className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted hover:text-red-500 transition"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => remove(m._id, m.name)}
                          title="Delete"
                          className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-muted hover:text-red-500 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
