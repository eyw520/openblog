/**
 * Turning one Markdown file into one blog entry.
 *
 * This module is pure — it takes already-read frontmatter and body text rather
 * than a path — so the rules that govern every post on the site can be tested
 * without a filesystem, and so the same rules run in the build and in the gate.
 */

/** An entry's metadata, with every default already applied. */
export interface EntryMeta {
  /** Filename without the extension; the last segment of the entry's URL. */
  slug: string;
  /** The `name` of the collection this entry belongs to. */
  collection: string;
  /** Site-absolute path to the entry, e.g. "/writing/first-light". */
  href: string;
  title: string;
  /** ISO calendar date, "YYYY-MM-DD". */
  date: string;
  /** Optional revision date, shown as "updated" when present. */
  updated?: string;
  /** One-line summary for the index page, the feed, and search results. */
  description: string;
  /** Overrides the site author for this entry only. */
  author?: string;
  /** Drafts are visible with `npm run dev` and excluded from a build. */
  draft: boolean;
  /** Estimated reading time in whole minutes, never less than one. */
  readingMinutes: number;
  /** Tags as the writer typed them; addressed by their slug. Empty when none. */
  tags: string[];
}

/** An entry's metadata plus its Markdown body. */
export interface Entry extends EntryMeta {
  body: string;
}

export interface ParseEntryInput {
  collection: string;
  /** The collection's URL base, e.g. "/writing". */
  route: string;
  slug: string;
  /** Parsed YAML frontmatter. Unknown keys are ignored, not rejected. */
  data: Record<string, unknown>;
  /** Markdown body with the frontmatter block already removed. */
  body: string;
}

export type ParseEntryResult = { ok: true; entry: Entry } | { ok: false; errors: string[] };

/** Average adult reading speed for prose, in words per minute. */
const WORDS_PER_MINUTE = 200;

/**
 * Validates and normalizes one entry. Errors name the file and show the exact
 * line to write, because the person reading them is a writer, not a programmer.
 */
export function parseEntry(input: ParseEntryInput): ParseEntryResult {
  const { collection, route, slug, data, body } = input;
  const file = `content/${collection}/${slug}.md`;
  const errors: string[] = [];

  const title = readString(data.title);
  if (title === undefined) {
    errors.push(`${file} — "title" is missing. Add this as the first line inside the --- block: title: My Post`);
  }

  const date = readString(data.date) ?? readDate(data.date);
  if (date === undefined) {
    errors.push(`${file} — "date" is missing. Add a line inside the --- block: date: ${today()}`);
  } else if (!isCalendarDate(date)) {
    errors.push(`${file} — "date" reads "${date}" but must be written as year-month-day, like ${today()}.`);
  }

  const updated = readString(data.updated) ?? readDate(data.updated);
  if (updated !== undefined && !isCalendarDate(updated)) {
    errors.push(`${file} — "updated" reads "${updated}" but must be written as year-month-day, like ${today()}.`);
  }

  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    errors.push(`${file} — "draft" must be true or false, written without quotes.`);
  }

  const tags = readTags(data.tags);
  if (tags === null) {
    errors.push(
      `${file} — "tags" must be a list of words. Write it as: tags: [maps, travel]`
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    entry: {
      slug,
      collection,
      href: `${route}/${slug}`,
      // Both are proven present by the error checks above.
      title: title ?? "",
      date: date ?? "",
      ...(updated !== undefined ? { updated } : {}),
      description: readString(data.description) ?? "",
      ...(readString(data.author) !== undefined ? { author: readString(data.author) } : {}),
      draft: data.draft === true,
      readingMinutes: readingMinutes(body),
      tags: tags ?? [],
      body
    }
  };
}

/** Whole minutes to read the given Markdown, rounded up and floored at one. */
export function readingMinutes(body: string): number {
  const words = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`[\]()]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/**
 * Frontmatter tags, or null when the value is not a list of words. Absent tags
 * are an empty list, not an error — most posts have none.
 */
function readTags(value: unknown): string[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }
  const tags: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || item.trim().length === 0) {
      return null;
    }
    tags.push(item.trim());
  }
  return tags;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

/**
 * YAML parses an unquoted `date: 2026-07-25` into a Date. Both spellings are
 * natural to write, so both are accepted and normalized to the ISO form.
 */
function readDate(value: unknown): string | undefined {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? (value.toISOString().split("T")[0] ?? undefined) : undefined;
}

/** True for a "YYYY-MM-DD" string that names a real day. */
function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  // Round-tripping catches impossible days like 2026-02-31, which Date rolls
  // forward into March rather than rejecting.
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "2026-01-01";
}
