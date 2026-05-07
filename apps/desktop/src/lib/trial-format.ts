/**
 * Format a UTC ms timestamp as a human-readable date in the user's
 * local TZ. Mirrors the server-side formatTrialEndDate so the customer
 * sees the same "Thu, May 8" string in the trial banner, the subscribe
 * modal, and the confirmation email.
 */
export function formatTrialEndDate(
  endsAtMs: number | null,
  tzOffsetMinutes: number | null,
): string {
  if (!endsAtMs) return "";
  const offsetMin = tzOffsetMinutes ?? new Date().getTimezoneOffset();
  const localMs = endsAtMs - offsetMin * 60 * 1000;
  const d = new Date(localMs);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][d.getUTCMonth()];
  return `${weekday}, ${month} ${d.getUTCDate()}`;
}
