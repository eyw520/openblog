import type { ImportContract, SourcePost } from "./contract";
import { normalizeWords } from "./text";

/**
 * Pairing a source post with the entry that was written for it.
 *
 * Every gate needs this pairing, and getting it wrong is the worst failure the
 * loop can have: a mismatched pair reports a faithful import as broken, or
 * worse, reports a missing post as present because some other post happened to
 * match. Pure, and tested, for that reason.
 */

export interface EntryLike {
  slug: string;
  title: string;
  date: string;
  body: string;
}

export interface Pairing {
  post: SourcePost;
  entry?: EntryLike;
  /** How the pair was found, for the report. */
  by?: "mapping" | "slug" | "title";
}

/**
 * The slug a source URL implies: its last path segment.
 * "https://example.com/2026/03/first-light/" -> "first-light".
 */
export function slugFromUrl(url: string): string {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    path = url;
  }
  const segments = path.split("/").filter((segment) => segment.length > 0);
  const last = segments.at(-1) ?? "";
  return last
    .replace(/\.(html?|php|aspx?)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Pairs each source post with an entry, in the order a reader would expect it
 * to be tried: what the contract says, then the address, then the title.
 *
 * Title matching is last and deliberately exact-after-normalizing. A fuzzy
 * match here would pair two different posts and produce a fidelity failure that
 * looks like bad writing rather than bad matching.
 */
export function pairPosts(
  contract: ImportContract,
  posts: readonly SourcePost[],
  entries: readonly EntryLike[]
): Pairing[] {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const byTitle = new Map(entries.map((entry) => [titleKey(entry.title), entry]));
  const claimed = new Set<string>();

  return posts.map((post) => {
    const mapped = contract.mapping?.[post.url];
    const candidates: [string | undefined, Pairing["by"]][] = [
      [mapped, "mapping"],
      [slugFromUrl(post.url), "slug"]
    ];

    for (const [slug, by] of candidates) {
      if (slug === undefined) {
        continue;
      }
      const entry = bySlug.get(slug);
      if (entry && !claimed.has(entry.slug)) {
        claimed.add(entry.slug);
        return { post, entry, by };
      }
    }

    const byTitleMatch = byTitle.get(titleKey(post.title));
    if (byTitleMatch && !claimed.has(byTitleMatch.slug)) {
      claimed.add(byTitleMatch.slug);
      return { post, entry: byTitleMatch, by: "title" };
    }

    return { post };
  });
}

/** Entries no source post claimed — additions, or a pairing that went wrong. */
export function unpaired(entries: readonly EntryLike[], pairings: readonly Pairing[]): EntryLike[] {
  const paired = new Set(pairings.map((pairing) => pairing.entry?.slug).filter(Boolean));
  return entries.filter((entry) => !paired.has(entry.slug));
}

function titleKey(title: string): string {
  return normalizeWords(title).join(" ");
}
