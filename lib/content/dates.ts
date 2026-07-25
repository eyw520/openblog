/**
 * Reading calendar dates out of frontmatter.
 *
 * YAML turns an unquoted `date: 2026-07-25` into a Date and leaves a quoted one
 * as a string. Both spellings are natural to write, so both are accepted and
 * normalized to the ISO form everything downstream expects.
 */

/** A "YYYY-MM-DD" string from either spelling, or null if it is neither. */
export function toCalendarDate(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return isCalendarDate(trimmed) ? trimmed : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0] ?? null;
  }
  return null;
}

/** True for a "YYYY-MM-DD" string that names a real day. */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  // Round-tripping catches impossible days like 2026-02-31, which Date rolls
  // forward into March rather than rejecting.
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/** Today, for use in error messages that show the expected shape. */
export function todayIso(): string {
  return new Date().toISOString().split("T")[0] ?? "2026-01-01";
}
