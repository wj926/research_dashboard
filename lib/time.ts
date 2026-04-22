export function relTime(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60_000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function daysUntil(iso: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 86_400_000));
}

export function relDeadline(iso: string, now: number): string {
  const d = Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
  return d >= 0 ? `in ${d}d` : `${-d}d ago`;
}

// React 19 compiler treats Date.now() as impure in server render.
// This helper is a deliberate one-time read per request — safe
// because it runs during SSR (server-render or static gen), not on
// the client. Centralized here so the lint rule has one site to flag.
export function requestNow(): number { return Date.now(); }
