import type { EntryMeta } from "./entry";
import { tagSlug } from "./tags";

/**
 * Finding an entry's neighbours.
 *
 * Two different questions, one module, because both are "which other entries
 * belong with this one": the parts of a series it is one of, and the entries a
 * reader is likely to want next. Pure, so the ordering rules are pinned by
 * tests rather than depending on what happens to be in content/.
 */

export interface SeriesPart {
  entry: EntryMeta;
  /** 1-based position within the series. */
  part: number;
  /** True for the entry the series was resolved for. */
  current: boolean;
}

/**
 * Every entry sharing a series name, in reading order.
 *
 * Ordered by `seriesPart` when given, then by date — so a writer can either
 * number the parts explicitly or simply publish them in order. Series names are
 * matched loosely, the same way tags are, so "Winter in Lisbon" and
 * "winter in lisbon" are one series.
 */
export function seriesParts(entries: readonly EntryMeta[], current: EntryMeta): SeriesPart[] {
  if (current.series === undefined) {
    return [];
  }
  const key = tagSlug(current.series);

  const members = entries
    .filter((entry) => entry.series !== undefined && tagSlug(entry.series) === key)
    .sort(
      (a, b) =>
        (a.seriesPart ?? Number.MAX_SAFE_INTEGER) - (b.seriesPart ?? Number.MAX_SAFE_INTEGER) ||
        a.date.localeCompare(b.date) ||
        a.slug.localeCompare(b.slug)
    );

  // A "series" of one is just a post; showing a one-item list adds nothing.
  if (members.length < 2) {
    return [];
  }

  return members.map((entry, index) => ({
    entry,
    part: index + 1,
    current: entry.slug === current.slug && entry.collection === current.collection
  }));
}

/**
 * Entries a reader of this one is most likely to want next, best first.
 *
 * Scored by how many tags they share, with the more recent winning a tie. Tags
 * are the only signal openblog has that two pieces are about the same thing —
 * an untagged blog gets nothing here rather than a list of arbitrary posts,
 * which would be worse than an empty section.
 */
export function relatedEntries(
  entries: readonly EntryMeta[],
  current: EntryMeta,
  limit = 3
): EntryMeta[] {
  const currentTags = new Set(current.tags.map(tagSlug));
  if (currentTags.size === 0 || limit <= 0) {
    return [];
  }

  return entries
    .filter((entry) => !(entry.slug === current.slug && entry.collection === current.collection))
    .map((entry) => ({
      entry,
      shared: entry.tags.filter((tag) => currentTags.has(tagSlug(tag))).length
    }))
    .filter((scored) => scored.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.entry.date.localeCompare(a.entry.date))
    .slice(0, limit)
    .map((scored) => scored.entry);
}
