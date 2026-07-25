import type { Author, CollectionConfig, NavLink, SiteConfig, SortOrder } from "./define";

/** A collection with every optional field filled in. */
export interface ResolvedCollection {
  name: string;
  label: string;
  route: string;
  description: string;
  sort: SortOrder;
  nav: boolean;
  feed: boolean;
}

export interface ResolvedHome {
  latest: number;
  /** Collection names, already checked against what is declared. */
  collections: string[];
}

/** The site config the rest of the codebase reads: no optionals, no guessing. */
export interface ResolvedSite {
  title: string;
  description: string;
  author: Author;
  locale: string;
  /** Full canonical URL, no trailing slash: "https://you.github.io/blog". */
  url: string;
  /** Scheme and host only: "https://you.github.io". */
  origin: string;
  /**
   * The subdirectory the site is served from, without a trailing slash — "" for
   * a domain root, "/blog" for a GitHub Pages project site. Next needs this to
   * prefix every asset URL, which is why it is derived rather than asked for.
   */
  basePath: string;
  collections: ResolvedCollection[];
  home: ResolvedHome;
  nav: NavLink[];
  /**
   * True when site.config.ts listed `nav` by hand. The navigation builder uses
   * it to decide whether pages may append themselves: an owner who wrote the
   * menu out asked for exactly that menu, and a new file should not edit it.
   */
  navExplicit: boolean;
}

/**
 * Fills in defaults and derives everything that can be derived. Pure: the same
 * config always resolves to the same result, which is what makes it testable
 * without a filesystem or a build.
 */
export function resolveConfig(config: SiteConfig): ResolvedSite {
  const { origin, basePath } = splitUrl(config.url);
  const collections = config.collections.map(resolveCollection);

  return {
    title: config.title,
    description: config.description,
    author: config.author,
    locale: config.locale ?? "en",
    url: basePath === "" ? origin : `${origin}${basePath}`,
    origin,
    basePath,
    collections,
    home: {
      latest: config.home?.latest ?? 5,
      collections: config.home?.collections ?? collections.map((collection) => collection.name)
    },
    nav: config.nav ?? defaultNav(collections),
    navExplicit: config.nav !== undefined
  };
}

function resolveCollection(collection: CollectionConfig): ResolvedCollection {
  return {
    name: collection.name,
    label: collection.label,
    route: stripTrailingSlash(collection.route ?? `/${collection.name}`),
    description: collection.description ?? "",
    sort: collection.sort ?? "date-desc",
    nav: collection.nav ?? true,
    feed: collection.feed ?? true
  };
}

/** Nav defaults to the collections that asked to be in it, in declared order. */
function defaultNav(collections: ResolvedCollection[]): NavLink[] {
  return collections
    .filter((collection) => collection.nav)
    .map(({ label, route }) => ({ label, href: route }));
}

/**
 * Splits a site URL into its origin and its base path. An unparseable URL is
 * reported by `validateConfig`, so this falls back rather than throwing twice.
 */
function splitUrl(url: string): { origin: string; basePath: string } {
  try {
    const parsed = new URL(url);
    return { origin: parsed.origin, basePath: stripTrailingSlash(parsed.pathname) };
  } catch {
    return { origin: "", basePath: "" };
  }
}

/** "/blog/" -> "/blog"; "/" -> "". */
function stripTrailingSlash(value: string): string {
  const trimmed = value.replace(/\/+$/, "");
  return trimmed === "/" ? "" : trimmed;
}
