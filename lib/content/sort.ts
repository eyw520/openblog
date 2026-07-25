import type { SortOrder } from "@/lib/config/define";

import type { EntryMeta } from "./entry";

/**
 * Orders a collection's entries. Pure and stable: entries that compare equal
 * keep their original relative order, so two posts sharing a date never shuffle
 * between builds and produce a spurious diff in the deployed site.
 */
export function sortEntries<T extends EntryMeta>(entries: readonly T[], order: SortOrder): T[] {
  const compare = COMPARATORS[order];
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => compare(a.entry, b.entry) || a.index - b.index)
    .map(({ entry }) => entry);
}

const COMPARATORS: Record<SortOrder, (a: EntryMeta, b: EntryMeta) => number> = {
  "date-desc": (a, b) => b.date.localeCompare(a.date),
  "date-asc": (a, b) => a.date.localeCompare(b.date),
  // Locale-aware so accented titles sort where a reader expects them.
  title: (a, b) => a.title.localeCompare(b.title)
};

/**
 * Groups entries by calendar year, preserving the order they arrive in. The
 * archive uses this to set each year once in the margin instead of repeating a
 * date on every line.
 */
export function groupByYear<T extends EntryMeta>(entries: readonly T[]): { year: string; entries: T[] }[] {
  const groups: { year: string; entries: T[] }[] = [];

  for (const entry of entries) {
    const year = entry.date.slice(0, 4);
    const current = groups.at(-1);
    if (current?.year === year) {
      current.entries.push(entry);
    } else {
      groups.push({ year, entries: [entry] });
    }
  }

  return groups;
}
