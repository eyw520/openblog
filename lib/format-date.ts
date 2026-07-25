/**
 * Dates are authored as plain calendar days ("2026-03-01") and must render as
 * that same day everywhere. Formatting is pinned to UTC for exactly this reason:
 * `new Date("2026-03-01")` is midnight UTC, which a reader west of Greenwich
 * would otherwise see rendered as February 28.
 */

/** "2026-03-01" -> "March 1, 2026". Returns the input unchanged if unparseable. */
export function formatDate(date: string, locale = "en"): string {
  const parsed = toUtcDate(date);
  if (!parsed) {
    return date;
  }
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(parsed);
}

/** "2026-03-01" -> "Mar 1". Used where the year is already established. */
export function formatDateShort(date: string, locale = "en"): string {
  const parsed = toUtcDate(date);
  if (!parsed) {
    return date;
  }
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(parsed);
}

/** RFC 822 form, which is what the RSS spec requires for pubDate. */
export function formatRfc822(date: string): string {
  return toUtcDate(date)?.toUTCString() ?? date;
}

function toUtcDate(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
