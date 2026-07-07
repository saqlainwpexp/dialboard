export const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Phoenix", label: "Arizona (MST, no DST)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
  { value: "America/Toronto", label: "Eastern Canada" },
  { value: "America/Vancouver", label: "Pacific Canada" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "UK" },
  { value: "Europe/Paris", label: "Central Europe" },
  { value: "Asia/Kolkata", label: "India" },
  { value: "Asia/Dubai", label: "UAE" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney" },
] as const;

export function getLocalHour(ianaZone: string): number | null {
  if (!ianaZone) return null;
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    return null;
  }
}

export function getLocalTimeString(ianaZone: string): string | null {
  if (!ianaZone) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  } catch {
    return null;
  }
}

const CALLING_HOURS_START = 8;
const CALLING_HOURS_END = 20;

export function isOutsideCallingHours(ianaZone: string): boolean {
  const hour = getLocalHour(ianaZone);
  if (hour === null) return false;
  return hour < CALLING_HOURS_START || hour >= CALLING_HOURS_END;
}
