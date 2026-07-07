"use client";

import { useEffect, useState } from "react";

const NOTIFIED_KEY = "dialboard-followup-notified-date";

export function FollowUpBadge() {
  const [overdue, setOverdue] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/leads/followups-count");
        const data = await res.json();
        if (cancelled) return;
        setOverdue(data.overdue ?? 0);
        maybeNotify(data.overdue ?? 0);
      } catch {
        // ignore transient failures
      }
    }

    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function maybeNotify(count: number) {
    if (count === 0) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const today = new Date().toDateString();
    const lastNotified = localStorage.getItem(NOTIFIED_KEY);
    if (lastNotified === today) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") fireNotification(count, today);
      });
    } else if (Notification.permission === "granted") {
      fireNotification(count, today);
    }
  }

  function fireNotification(count: number, today: string) {
    new Notification("DialBoard follow-ups due", {
      body: `You have ${count} overdue follow-up${count === 1 ? "" : "s"} waiting.`,
      icon: "/favicon.ico",
    });
    localStorage.setItem(NOTIFIED_KEY, today);
  }

  if (overdue === 0) return null;

  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
      {overdue}
    </span>
  );
}
