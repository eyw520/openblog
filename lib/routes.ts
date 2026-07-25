import type { ResolvedCollection } from "@/lib/config";

/**
 * Mapping a URL onto the thing it names.
 *
 * openblog has no per-collection, per-page, or per-tag route files. A single
 * catch-all route asks this module what a path means, which is why declaring a
 * collection in site.config.ts, or dropping a file in content/pages/, is all it
 * takes to publish one. Pure, so the URL rules are tested directly.
 */

export type RouteTarget =
  | { kind: "index"; collection: ResolvedCollection }
  | { kind: "entry"; collection: ResolvedCollection; slug: string }
  | { kind: "page"; slug: string }
  | { kind: "tagIndex" }
  | { kind: "tag"; slug: string };

/** Everything the resolver needs to know about what this blog publishes. */
export interface RouteContext {
  collections: readonly ResolvedCollection[];
  /** Slugs of the standalone pages in content/pages/. */
  pageSlugs: readonly string[];
  /** Tag browsing, or null when the blog has no tagged entries. */
  tags: { route: string; slugs: readonly string[] } | null;
}

/**
 * Resolves URL segments to a collection index, an entry, a standalone page, or
 * a tag page — or null when nothing matches and the request should 404.
 *
 * Order matters and is deliberate:
 *
 *   1. Collections, longest route first, so a collection at "/notes/daily"
 *      wins over one at "/notes" rather than being read as its entry.
 *   2. Tags, which own a route of their own.
 *   3. Pages, which sit at the root and would otherwise shadow anything.
 *
 * Collisions between these are reported by the content gate, not resolved
 * silently here — a page that is quietly unreachable is worse than a build
 * that refuses and says why.
 */
export function resolveRoute(context: RouteContext, segments: readonly string[]): RouteTarget | null {
  const path = `/${segments.join("/")}`;
  const byLongestRoute = [...context.collections].sort((a, b) => b.route.length - a.route.length);

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

  const tags = context.tags;
  if (tags) {
    if (path === tags.route) {
      return { kind: "tagIndex" };
    }
    const prefix = `${tags.route}/`;
    if (path.startsWith(prefix)) {
      const slug = path.slice(prefix.length);
      if (slug.length > 0 && !slug.includes("/") && tags.slugs.includes(slug)) {
        return { kind: "tag", slug };
      }
    }
  }

  // Pages live at the root: content/pages/about.md is served at /about.
  const [first] = segments;
  if (segments.length === 1 && first !== undefined && context.pageSlugs.includes(first)) {
    return { kind: "page", slug: first };
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

/** The URL segments for a route given as a path, e.g. "/tags" -> ["tags"]. */
export function pathSegments(path: string): string[] {
  return path.split("/").filter((segment) => segment.length > 0);
}
