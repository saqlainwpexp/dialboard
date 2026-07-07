"use client";

import { AlertTriangle } from "lucide-react";
import { getLocalTimeString, isOutsideCallingHours } from "@/lib/timezones";

export function TimezoneWarning({ timezone }: { timezone: string }) {
  if (!timezone) return null;
  const timeStr = getLocalTimeString(timezone);
  if (!timeStr) return null;

  const outside = isOutsideCallingHours(timezone);
  if (!outside) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-orange bg-accent-orange-soft rounded-full px-2.5 py-1 w-fit">
      <AlertTriangle size={11} /> It&apos;s {timeStr} there
    </div>
  );
}
