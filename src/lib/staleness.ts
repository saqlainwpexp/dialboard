const STALE_DAYS = 14;
const ACTIVE_STATUSES = new Set(["new", "queued", "contacted", "callback"]);

export function isStale(lead: {
  status: string;
  lastCalledAt: string | null;
  createdAt: string;
}): boolean {
  if (!ACTIVE_STATUSES.has(lead.status)) return false;

  const referenceDate = lead.lastCalledAt ?? lead.createdAt;
  const ageMs = Date.now() - new Date(referenceDate).getTime();
  return ageMs > STALE_DAYS * 24 * 60 * 60 * 1000;
}
