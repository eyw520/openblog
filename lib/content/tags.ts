import type { EntryMeta } from "./entry";

/**
 * Tags.
 *
 * A writer types tags the way they say them — "Web Design", "web design",
 * "web-design" are all the same idea — so a tag has two forms: the label it is
 * displayed with, and the slug it is addressed by. Everything here is pure, so
 * the normalization rules are pinned by tests rather than discovered in a URL.
 */

export interface TagSummary {
  /** URL-safe form, used in /tags/<slug>. */
  slug: string;
  /** The tag as written, used in the interface. */
  label: string;
  /** How many entries carry it. */
  count: number;
}

/** "Web Design" -> "web-design". Returns "" for a tag with nothing usable in it. */
export function tagSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Every distinct tag across the given entries, most used first, then
 * alphabetically so equally-used tags do not reorder between builds.
 *
 * Tags differing only in case or spacing collapse into one; the first spelling
 * encountered wins as the label, which makes the result depend on entry order
 * and therefore on the collection's own sort — deterministic either way.
 */
export function collectTags(entries: readonly EntryMeta[]): TagSummary[] {
  const bySlug = new Map<string, TagSummary>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      const slug = tagSlug(tag);
      if (slug === "") {
        continue;
      }
      const existing = bySlug.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(slug, { slug, label: tag, count: 1 });
      }
    }
  }

  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** The entries carrying a tag, in the order they were given. */
export function entriesWithTag<T extends EntryMeta>(entries: readonly T[], slug: string): T[] {
  return entries.filter((entry) => entry.tags.some((tag) => tagSlug(tag) === slug));
}
