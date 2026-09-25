/** Whole days from today (local) to a YYYY-MM-DD deadline; negative once it has passed. */
export function daysLeft(deadline: string | null, now = new Date()): number | null {
  if (!deadline) return null;
  const [y, m, d] = deadline.split("-").map(Number);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 864e5);
}

/** "2026-10-05" → "5 October 2026" / "5 اکتوبر 2026". Parsed as a calendar date, so no timezone shift. */
export function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(y, m - 1, d));
}
