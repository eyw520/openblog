import { isCalendarDate, toCalendarDate, todayIso } from "./dates";
import { parseFields, type FieldSchema, type FieldValue } from "./fields";

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
  /**
   * A cover image for the entry, e.g. "/harbour.jpg". Grid archives and link
   * previews both need one, which is why it is built in rather than a field a
   * collection has to declare.
   */
  image?: string;
  /** What the cover image shows, for readers who cannot see it. */
  imageAlt: string;
  /**
   * The collection's own declared fields, already validated. Empty for a
   * collection that declares none — which is every collection by default.
   */
  fields: Record<string, FieldValue>;
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
  /** The collection's declared field schema, if it has one. */
  fields?: FieldSchema;
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

  const date = readString(data.date) ?? toCalendarDate(data.date) ?? undefined;
  if (date === undefined) {
    errors.push(`${file} — "date" is missing. Add a line inside the --- block: date: ${todayIso()}`);
  } else if (!isCalendarDate(date)) {
    errors.push(`${file} — "date" reads "${date}" but must be written as year-month-day, like ${todayIso()}.`);
  }

  const updated = readString(data.updated) ?? toCalendarDate(data.updated) ?? undefined;
  if (updated !== undefined && !isCalendarDate(updated)) {
    errors.push(`${file} — "updated" reads "${updated}" but must be written as year-month-day, like ${todayIso()}.`);
  }

  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    errors.push(`${file} — "draft" must be true or false, written without quotes.`);
  }

  const image = readString(data.image);
  const imageAlt = readString(data.imageAlt);
  if (image !== undefined && !image.startsWith("/") && !/^https?:\/\//.test(image)) {
    errors.push(
      `${file} — "image" reads "${image}" but must start with "/" — put the file in public/ ` +
        `and write it as image: /${image.replace(/^\.?\//, "")}`
    );
  }
  if (image !== undefined && imageAlt === undefined) {
    errors.push(
      `${file} — "imageAlt" is missing. Describe what the picture shows, so readers using a ` +
        `screen reader are not left with silence: imageAlt: A bowl of red lentil soup`
    );
  }

  const parsedFields = parseFields(file, input.fields ?? {}, data);
  if (!parsedFields.ok) {
    errors.push(...parsedFields.errors);
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
      ...(image !== undefined ? { image } : {}),
      imageAlt: imageAlt ?? "",
      fields: parsedFields.ok ? parsedFields.fields : {},
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

