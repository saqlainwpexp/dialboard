"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/FormField";

type UserData = {
  name: string;
  email: string;
  role: string;
  dailyCallGoal: number;
};

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [dailyCallGoal, setDailyCallGoal] = useState("60");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        setName(d.user.name);
        setRole(d.user.role);
        setDailyCallGoal(String(d.user.dailyCallGoal));
      });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, dailyCallGoal: parseInt(dailyCallGoal, 10) }),
    });
    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setSavingPassword(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSavingPassword(false);
    if (!res.ok) {
      const data = await res.json();
      setPasswordError(data.error ?? "Something went wrong.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2500);
  }

  if (!user) return <div className="text-sm text-muted">Loading…</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <SettingsIcon size={20} className="text-accent-blue" /> Settings
      </h1>

      <Card className="p-6">
        <h2 className="font-bold text-foreground mb-1">Profile</h2>
        <p className="text-sm text-muted mb-4">{user.email}</p>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Role">
            <input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Daily call goal">
            <input
              type="number"
              min="1"
              value={dailyCallGoal}
              onChange={(e) => setDailyCallGoal(e.target.value)}
              className={inputClass}
            />
          </Field>
          {profileSaved && <p className="text-sm text-emerald-600">Saved.</p>}
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 px-6 hover:opacity-90 transition disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-foreground mb-1 flex items-center gap-2">
          <KeyRound size={16} className="text-muted-2" /> Change password
        </h2>
        <p className="text-sm text-muted mb-4">Update your login password.</p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Field label="Current password">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className={inputClass}
            />
          </Field>
          {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          {passwordSaved && <p className="text-sm text-emerald-600">Password updated.</p>}
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-xl bg-accent-blue text-white text-sm font-semibold py-2.5 px-6 hover:opacity-90 transition disabled:opacity-60"
          >
            {savingPassword ? "Saving…" : "Update password"}
          </button>
        </form>
      </Card>
    </div>
  );
}
