/** Whole days from today (local) to a YYYY-MM-DD deadline; negative once it has passed. */
export function daysLeft(deadline: string | null, now = new Date()): number | null {
  if (!deadline) return null;
  const [y, m, d] = deadline.split("-").map(Number);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 864e5);
}
