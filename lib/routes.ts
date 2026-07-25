import type { ResolvedCollection } from "@/lib/config";

/**
 * Mapping a URL onto a collection.
 *
 * openblog has no per-collection route files. A single catch-all route asks this
 * module what a path means, which is why declaring a collection in site.config.ts
 * is all it takes to publish one. Pure, so the URL rules are tested directly.
 */

export type RouteTarget =
  | { kind: "index"; collection: ResolvedCollection }
  | { kind: "entry"; collection: ResolvedCollection; slug: string };

/**
 * Resolves URL segments to a collection index or one of its entries, or null
 * when nothing matches and the page should 404.
 *
 * Longer routes are tried first so a collection at "/notes/daily" wins over one
 * at "/notes" — otherwise the shorter route would claim the path and treat
 * "daily" as an entry slug.
 */
export function resolveRoute(
  collections: readonly ResolvedCollection[],
  segments: readonly string[]
): RouteTarget | null {
  const path = `/${segments.join("/")}`;
  const byLongestRoute = [...collections].sort((a, b) => b.route.length - a.route.length);

  for (const collection of byLongestRoute) {
    if (path === collection.route) {
      return { kind: "index", collection };
    }

    const prefix = `${collection.route}/`;
    if (path.startsWith(prefix)) {
      const slug = path.slice(prefix.length);
      // Entries live directly under their collection; a deeper path is not one.
      if (slug.length > 0 && !slug.includes("/")) {
        return { kind: "entry", collection, slug };
      }
    }
  }

  return null;
}

/** The URL segments for a collection's index page, e.g. "/writing" -> ["writing"]. */
export function indexSegments(collection: ResolvedCollection): string[] {
  return collection.route.split("/").filter((segment) => segment.length > 0);
}

/** The URL segments for one entry, e.g. ["writing", "first-light"]. */
export function entrySegments(collection: ResolvedCollection, slug: string): string[] {
  return [...indexSegments(collection), slug];
}
